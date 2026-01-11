import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import type { CookieOptions, Response } from 'express';
import { AuthenticationService } from './authentication.service';
import { Auth } from './decorators/auth.decorator';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { AuthType } from './enums/auth-type.enum';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Auth(AuthType.None)
@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) { }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authenticationService.signUp(signUpDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Res({ passthrough: true }) response: Response,
    @Body() signInDto: SignInDto,
  ) {
    const tokens = await this.authenticationService.signIn(signInDto);

    const options: CookieOptions = {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
    };

    response.cookie('access_token', tokens.accessToken, options);
    response.cookie('refresh_token', tokens.refreshToken, options);

    return {
      status: 'success',
      message: 'User logged in successfully.',
      data: {
        ...tokens,
      },
    }
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return {
      status: 'success',
      message: 'access token generated successfully.',
      data: await this.authenticationService.refreshToken(refreshTokenDto),
    }
  }
}
