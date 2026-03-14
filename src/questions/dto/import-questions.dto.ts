import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ImportQuestionsDto {
  @ApiProperty({ example: 'uuid-string', description: 'Subject ID' })
  @IsUUID()
  subjectId: string;
}
