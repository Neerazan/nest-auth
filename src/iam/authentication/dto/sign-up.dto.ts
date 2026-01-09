import { IsString, IsEmail, Length } from 'class-validator';

export class SignUpDto {
  @IsString({
    message: 'Name must be a string',
  })
  @Length(2, 100, {
    message: 'Name must be a string and length between 2 and 100 characters',
  })
  readonly name: string;

  @IsEmail()
  readonly email: string;

  @IsString()
  readonly password: string;
}
