import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsUUID, ValidateNested } from 'class-validator';

export class AnswerDto {
  @ApiProperty({ example: 'uuid-string', description: 'Question ID' })
  @IsUUID()
  questionId: string;

  @ApiPropertyOptional({
    example: 'uuid-string',
    description: 'Tanlangan variant ID (null = javob berilmadi)',
  })
  @IsUUID()
  @IsOptional()
  selectedOptionId?: string;
}

export class SubmitSessionDto {
  @ApiProperty({ type: [AnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
