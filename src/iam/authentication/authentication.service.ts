import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { HashingService } from '../hashing/hashing.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly hashingService: HashingService,
  ) {}

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

    return true;
  }
}
