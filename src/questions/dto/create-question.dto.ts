import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAnswerOptionDto {
  @ApiProperty({ example: 'A' })
  @IsString()
  @IsNotEmpty()
  optionLabel: string;

  @ApiProperty({ example: '12' })
  @IsString()
  @IsNotEmpty()
  optionText: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isCorrect: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  displayOrder?: number;
}

export enum QuestionType {
  SINGLE = 'single',
  MULTIPLE = 'multiple',
}

export class CreateQuestionDto {
  @ApiProperty({ example: 'uuid-string', description: 'Subject ID' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ example: '2 + 2 = ?' })
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @ApiPropertyOptional({ enum: QuestionType, example: QuestionType.SINGLE })
  @IsEnum(QuestionType)
  @IsOptional()
  questionType?: QuestionType;

  @ApiPropertyOptional({ example: 'https://example.com/image.png' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ type: [CreateAnswerOptionDto] })
  @IsArray()
  @ArrayMinSize(2, { message: "Kamida 2 ta javob varianti bo'lishi kerak" })
  @ArrayMaxSize(6, {
    message: "Ko'pi bilan 6 ta javob varianti bo'lishi mumkin",
  })
  @ValidateNested({ each: true })
  @Type(() => CreateAnswerOptionDto)
  answerOptions: CreateAnswerOptionDto[];
}
