import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import type { Response } from 'express';

@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authenticationService.signUp(signUpDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.ACCEPTED)
  async signIn(@Res() response: Response, @Body() signInDto: SignInDto) {
    // return this.authenticationService.signIn(signInDto);
    const accessToken = await this.authenticationService.signIn(signInDto);
    console.log(accessToken);
    return response.cookie('access_token', accessToken, { httpOnly: true });
  }
}
