import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/types';

export class UserEntity {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 'Ali Valiyev' })
  fullName: string;

  @ApiProperty({ example: 'ali@gmail.com' })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.ADMIN })
  role: UserRole;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date;
}
