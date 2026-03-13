import { ApiProperty } from '@nestjs/swagger';

export class StudentEntity {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Ali Valiyev' })
  fullName: string;

  @ApiProperty({ example: '+998901234567' })
  phone: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;
}
