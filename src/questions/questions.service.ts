import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { AiService } from '../ai/ai.service';
import { FileParserService } from '../file-parser/file-parser.service';
import { buildImportPrompt } from './prompts/import.prompt';
import { StorageService } from '../storage/storage.service';

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly fileParserService: FileParserService,
    private readonly storageService: StorageService,
  ) {}

  // ============================================
  // Qo'lda savol yaratish
  // ============================================
  async create(dto: CreateQuestionDto, createdById: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: dto.subjectId },
    });
    if (!subject) throw new NotFoundException('Kategoriya topilmadi');
    if (!subject.isActive)
      throw new BadRequestException('Kategoriya aktiv emas');

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

  // ============================================
  // Barcha savollar
  // ============================================
  async findAllFull(subjectId?: string) {
    return this.prisma.question.findMany({
      where: {
        ...(subjectId && { subjectId }), // subjectId berilsa filter qiladi
      },
      select: questionSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================
  // Barcha active savollar
  // ============================================
  async findAll(subjectId?: string) {
    return this.prisma.question.findMany({
      where: {
        isActive: true,
        ...(subjectId && { subjectId }),
      },
      select: questionSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================
  // Kategoriya bo'yicha savollar
  // ============================================
  async findBySubject(subjectId: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
    });
    if (!subject) throw new NotFoundException('Kategoriya topilmadi');

    return this.prisma.question.findMany({
      where: {
        subjectId,
        isActive: true,
      },
      select: questionSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================
  // Bitta savol
  // ============================================
  async findOne(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      select: questionSelect,
    });
    if (!question) throw new NotFoundException('Savol topilmadi');
    return question;
  }

  // ============================================
  // Savolni yangilash
  // ============================================
  async update(id: string, dto: UpdateQuestionDto) {
    await this.findOne(id);

    const { answerOptions, ...questionData } = dto;

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
            deleteMany: {},
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

  // ============================================
  // Savolni inactive qilish
  // ============================================
  async toggleActive(id: string) {
    const question = await this.findOne(id);

    return this.prisma.question.update({
      where: { id },
      data: { isActive: !question.isActive },
      select: {
        id: true,
        questionText: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  // ============================================
  // Savolni o'chirish
  // ============================================
  async remove(id: string) {
    const question = await this.findOne(id);
    // Rasmni storage dan o'chirish
    if (question.imageUrl) {
      try {
        await this.storageService.deleteImage(question.imageUrl);
      } catch {
        console.warn(`Rasm storage dan o'chirilmadi: ${question.imageUrl}`);
      }
    }
    await this.prisma.question.delete({ where: { id } });
    return {
      status: 'success',
      message: "Muvaffaqiyatli o'chirildi",
      id,
    };
  }

  // ============================================
  // Fayldan import qilish
  // ============================================
  async importFromFile(
    file: Express.Multer.File,
    subjectId: string,
    createdById: string,
  ) {
    // 1. Subject tekshiruvi
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
    });
    if (!subject) throw new NotFoundException('Kategoriya topilmadi');
    if (!subject.isActive)
      throw new BadRequestException('Kategoriya aktiv emas');

    // 2. Faylni parse qilish — matn, rasmlar, formulalar ajratiladi
    const parsed = await this.fileParserService.parseFile(
      file.buffer,
      file.mimetype,
      file.originalname,
    );

    // 3. AI ga yuborish
    const prompt = buildImportPrompt(
      parsed.text,
      parsed.imageUrls,
      parsed.formulas,
    );
    const aiResponse = await this.aiService.analyzeText(prompt);

    // 4. JSON parse qilish
    const questions = this.parseAiResponse(aiResponse);
    if (questions.length === 0) {
      throw new BadRequestException('Fayldan savollar aniqlanmadi');
    }

    // 5. DBga batch saqlash
    const saved = await this.bulkCreate(questions, subjectId, createdById);

    return {
      message: `${saved} ta yangi savol saqlandi`,
      total: questions.length, // AI topgan savollar soni
      saved, // Haqiqatda saqlangan yangi savollar
      skipped: questions.length - saved, // Duplicate bo'lib o'tkazilgan
      imageCount: parsed.imageUrls.length,
      formulaCount: parsed.formulas.length,
    };
  }

  // ============================================
  // AI javobini JSON ga o'girish
  // ============================================
  private parseAiResponse(response: string): any[] {
    try {
      const clean = response
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const parsed = JSON.parse(clean);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      throw new BadRequestException(
        "AI javobini o'qib bo'lmadi, qaytadan urinib ko'ring",
      );
    }
  }

  // ============================================
  // Batch DB saqlash
  // ============================================
  private async bulkCreate(
    questions: any[],
    subjectId: string,
    createdById: string,
  ): Promise<number> {
    const BATCH_SIZE = 100;
    let savedCount = 0;

    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < questions.length; i += BATCH_SIZE) {
        const batch = questions.slice(i, i + BATCH_SIZE);

        // Mavjud savollarni tekshirish
        const existingQuestions = await tx.question.findMany({
          where: { subjectId },
          select: { questionText: true },
        });

        // Normalize qilib Set ga solish
        const existingNormalized = new Set(
          existingQuestions.map((q) => this.normalizeText(q.questionText)),
        );

        // Faqat yangi savollarni olish (normalize qilib taqqoslash)
        const newQuestions = batch.filter(
          (q) => !existingNormalized.has(this.normalizeText(q.questionText)),
        );

        if (newQuestions.length === 0) continue;

        // Yangi savollarni kiritish
        await tx.question.createMany({
          data: newQuestions.map((q) => ({
            questionText: q.questionText,
            questionType: q.questionType ?? 'single',
            subjectId,
            createdById,
            source: 'file_import',
            imageUrl: q.imageUrl ?? null,
          })),
        });

        // Yaratilgan savollarni topish
        const created = await tx.question.findMany({
          where: {
            questionText: { in: newQuestions.map((q) => q.questionText) },
            subjectId,
          },
          select: { id: true, questionText: true },
        });

        // Javob variantlarini kiritish
        const allOptions = created.flatMap((q) => {
          const original = newQuestions.find(
            (b) => b.questionText === q.questionText,
          );
          return (
            original?.answerOptions.map((opt: any, idx: number) => ({
              questionId: q.id,
              optionLabel: opt.optionLabel,
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
              displayOrder: idx,
            })) ?? []
          );
        });

        if (allOptions.length > 0) {
          await tx.answerOption.createMany({ data: allOptions });
        }

        savedCount += created.length;
      }
    });

    return savedCount;
  }

  private normalizeText(text: string): string {
    return text.toLowerCase().replace(/\s+/g, ' ').trim();
  }
}
