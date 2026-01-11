import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import jwtConfig from 'src/config/jwt.config';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { HashingService } from '../hashing/hashing.service';
import { ActiveUserData } from '../interfaces/active-user-data.interface';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,

    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) { }

  async signUp(signUpDto: SignUpDto) {
    try {
      const { email, name, password } = signUpDto;
      const hashedPassword = await this.hashingService.hash(password);
      const user = this.userRepository.create({
        name,
        email,
        password: hashedPassword,
      });
      return this.userRepository.save(user);
    } catch (error) {
      const pgUniqueVioletionKey = '23505';
      if (error.code === pgUniqueVioletionKey) {
        throw new ConflictException('User with email already exist.');
      }
    }
  }

  async signIn(signInDto: SignInDto) {
    const { email, password } = signInDto;
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(`User does not exist.`);
    }

    const isEqual = await this.hashingService.compare(password, user.password);

    if (!isEqual) {
      throw new UnauthorizedException(`Password is not correct.`);
    }

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
    };
  };

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const { sub } = await this.jwtService.verifyAsync<Pick<ActiveUserData, 'sub'>>(
        refreshTokenDto.refreshToken,
        {
          audience: this.jwtConfiguration.audience,
          issuer: this.jwtConfiguration.issuer,
          secret: this.jwtConfiguration.secret,
        }
      );

      const user = await this.userRepository.findOne({ where: { id: sub } });
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token.');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token.');
    }
  }

  async generateTokens(user: User) {
    const [accessToken, refreshToken] = await Promise.all(
      [
        this.signToken<Partial<ActiveUserData>>(
          user.id,
          this.jwtConfiguration.access_token_ttl,
          { email: user.email },
        ),

        this.signToken(
          user.id,
          this.jwtConfiguration.refresh_token_ttl,
        ),
      ],
    )

    return {
      accessToken,
      refreshToken,
    };
  }

  private async signToken<T>(userId: string, expiresIn: number, payload?: T) {
    return this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
        expiresIn,
      }
    )
  }
}
