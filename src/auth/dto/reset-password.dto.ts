import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'eskilParol123' })
  @IsString()
  oldPassword: string;

  @ApiProperty({ example: 'yangiParol123', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword: string;

  @ApiPropertyOptional({
    description: 'Target user ID (faqat super_admin uchun)',
  })
  @IsUUID()
  @IsOptional()
  targetUserId?: string;
}
