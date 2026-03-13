import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnswerOptionEntity {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'A' })
  optionLabel: string;

  @ApiProperty({ example: '12' })
  optionText: string;

  @ApiProperty({ example: true })
  isCorrect: boolean;

  @ApiProperty({ example: 0 })
  displayOrder: number;
}

export class QuestionEntity {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: '2 + 2 = ?' })
  questionText: string;

  @ApiProperty({ example: 'single' })
  questionType: string;

  @ApiPropertyOptional()
  imageUrl: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 'manual' })
  source: string;

  @ApiProperty({ type: [AnswerOptionEntity] })
  answerOptions: AnswerOptionEntity[];

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
