import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'superadmin@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'superadmin123' })
  @IsString()
  @MinLength(6)
  password: string;
}
