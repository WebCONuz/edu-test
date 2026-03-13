import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsUUID, Max, Min } from 'class-validator';

export class StartSessionDto {
  @ApiProperty({ example: 'uuid-string', description: 'Student ID' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ example: 'uuid-string', description: 'Subject ID' })
  @IsUUID()
  subjectId: string;

  @ApiProperty({ example: 20, minimum: 1, maximum: 50 })
  @IsInt()
  @Min(1)
  @Max(50)
  requestedCount: number;
}
