import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';

export class ResetPasswordByTokenDto {
  @ApiProperty({ example: '5ac82b82-0ca9-42b7-97a1-7c02a4931534' })
  @IsUUID()
  token: string;

  @ApiProperty({ example: 'yangiParol123', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
