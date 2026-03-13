import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

const questionSelect = {
  id: true,
  questionText: true,
  questionType: true,
  imageUrl: true,
  isActive: true,
  source: true,
  createdAt: true,
  updatedAt: true,
  subject: {
    select: { id: true, name: true },
  },
  createdBy: {
    select: { id: true, fullName: true },
  },
  answerOptions: {
    select: {
      id: true,
      optionLabel: true,
      optionText: true,
      isCorrect: true,
      displayOrder: true,
    },
    orderBy: { displayOrder: 'asc' as const },
  },
};

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateQuestionDto, createdById: string) {
    // Subject mavjudligini tekshir
    const subject = await this.prisma.subject.findUnique({
      where: { id: dto.subjectId },
    });
    if (!subject) throw new NotFoundException('Kategoriya topilmadi');
    if (!subject.isActive)
      throw new BadRequestException('Kategoriya aktiv emas');

    // Kamida bitta to'g'ri javob borligini tekshir
    const hasCorrect = dto.answerOptions.some((o) => o.isCorrect);
    if (!hasCorrect) {
      throw new BadRequestException(
        "Kamida bitta to'g'ri javob bo'lishi kerak",
      );
    }

    return this.prisma.question.create({
      data: {
        subjectId: dto.subjectId,
        questionText: dto.questionText,
        questionType: dto.questionType ?? 'single',
        imageUrl: dto.imageUrl,
        createdById,
        answerOptions: {
          create: dto.answerOptions.map((option, index) => ({
            optionLabel: option.optionLabel,
            optionText: option.optionText,
            isCorrect: option.isCorrect,
            displayOrder: option.displayOrder ?? index,
          })),
        },
      },
      select: questionSelect,
    });
  }

  async findAllFull(subjectId?: string) {
    return this.prisma.question.findMany({
      where: {
        ...(subjectId && { subjectId }), // subjectId berilsa filter qiladi
      },
      select: questionSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(subjectId?: string) {
    return this.prisma.question.findMany({
      where: {
        isActive: true,
        ...(subjectId && { subjectId }), // subjectId berilsa filter qiladi
      },
      select: questionSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      select: questionSelect,
    });
    if (!question) throw new NotFoundException('Savol topilmadi');
    return question;
  }

  async update(id: string, dto: UpdateQuestionDto) {
    await this.findOne(id);

    const { answerOptions, ...questionData } = dto;

    // answerOptions berilgan bo'lsa tekshir
    if (answerOptions) {
      const hasCorrect = answerOptions.some((o) => o.isCorrect);
      if (!hasCorrect) {
        throw new BadRequestException(
          "Kamida bitta to'g'ri javob bo'lishi kerak",
        );
      }
    }

    return this.prisma.question.update({
      where: { id },
      data: {
        ...questionData,
        ...(answerOptions && {
          answerOptions: {
            deleteMany: {}, // eskilerini o'chir
            create: answerOptions.map((option, index) => ({
              optionLabel: option.optionLabel,
              optionText: option.optionText,
              isCorrect: option.isCorrect,
              displayOrder: option.displayOrder ?? index,
            })),
          },
        }),
      },
      select: questionSelect,
    });
  }

  async toggleActive(id: string) {
    const question = await this.findOne(id);

    const q = await this.prisma.question.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        questionText: true,
        isActive: true,
        updatedAt: true,
      },
    });

    console.log(q);

    return {
      status: 'success',
      message: "Savol o'chirildi",
      id: question.id,
    };
  }
}
