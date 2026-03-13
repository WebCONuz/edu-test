import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubjectEntity {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'Matematika' })
  name: string;

  @ApiPropertyOptional({ example: 'Algebra, geometriya va boshqalar' })
  description: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
