import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartSessionDto } from './dto/start-session.dto';
import { SubmitSessionDto } from './dto/submit-session.dto';
import { ResultQuestion } from '../common/types';

@Injectable()
export class TestSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async startSession(dto: StartSessionDto) {
    // 1. Student tekshiruvi
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
    });
    if (!student) throw new NotFoundException("O'quvchi topilmadi");
    if (!student.isActive) throw new ForbiddenException('Akkaunt bloklangan');

    // 2. Subject tekshiruvi
    const subject = await this.prisma.subject.findUnique({
      where: { id: dto.subjectId },
    });
    if (!subject) throw new NotFoundException('Fan topilmadi');
    if (!subject.isActive) throw new BadRequestException('Fan aktiv emas');

    // 3. O'sha fandan active savollarni olish
    const allQuestions = await this.prisma.question.findMany({
      where: { subjectId: dto.subjectId, isActive: true },
      select: {
        id: true,
        questionText: true,
        questionType: true,
        imageUrl: true,
        answerOptions: {
          select: {
            id: true,
            optionLabel: true,
            optionText: true,
            displayOrder: true,
            // isCorrect YO'Q — student ko'rmasin!
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (allQuestions.length === 0) {
      throw new BadRequestException('Bu fanda hozircha savollar mavjud emas');
    }

    // 4. Random savollar tanlash
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, dto.requestedCount);
    const actualCount = selected.length;

    // 5. Sessiya yaratish
    const session = await this.prisma.testSession.create({
      data: {
        studentId: dto.studentId,
        subjectId: dto.subjectId,
        requestedCount: dto.requestedCount,
        actualCount,
        sessionQuestions: {
          create: selected.map((q, index) => ({
            questionId: q.id,
            displayOrder: index,
          })),
        },
      },
    });

    // 6. Savollarni to'g'ri javobsiz qaytarish
    return {
      sessionId: session.id,
      totalQuestions: actualCount,
      subject: subject.name,
      questions: selected.map((q, index) => ({
        order: index + 1,
        questionId: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        imageUrl: q.imageUrl,
        answerOptions: q.answerOptions,
      })),
    };
  }

  async submitSession(sessionId: string, dto: SubmitSessionDto) {
    // 1. Sessiyani tekshirish
    const session = await this.prisma.testSession.findUnique({
      where: { id: sessionId },
      include: {
        sessionQuestions: {
          include: {
            question: {
              include: {
                answerOptions: true,
              },
            },
          },
        },
      },
    });

    if (!session) throw new NotFoundException('Sessiya topilmadi');

    if (session.finishedAt) {
      throw new BadRequestException('Bu sessiya allaqachon yakunlangan');
    }

    // 2. Har bir javobni tekshirish va session_questions ni yangilash
    let score = 0;
    const resultQuestions: ResultQuestion[] = [];

    for (const sessionQuestion of session.sessionQuestions) {
      const answer = dto.answers.find(
        (a) => a.questionId === sessionQuestion.questionId,
      );

      const selectedOptionId = answer?.selectedOptionId ?? null;

      // To'g'ri javobni topish
      const correctOption = sessionQuestion.question.answerOptions.find(
        (o) => o.isCorrect,
      );

      // Javob to'g'rimi?
      const isCorrect = selectedOptionId
        ? selectedOptionId === correctOption?.id
        : false;

      if (isCorrect) score++;

      // Tanlangan variant ma'lumotlari
      const selectedOption = selectedOptionId
        ? sessionQuestion.question.answerOptions.find(
            (o) => o.id === selectedOptionId,
          )
        : null;

      // session_questions ni yangilash
      await this.prisma.sessionQuestion.update({
        where: { id: sessionQuestion.id },
        data: {
          selectedOptionId,
          isCorrect,
          answeredAt: new Date(),
        },
      });

      resultQuestions.push({
        order: sessionQuestion.displayOrder + 1,
        questionText: sessionQuestion.question.questionText,
        selectedOption: selectedOption
          ? `${selectedOption.optionLabel}) ${selectedOption.optionText}`
          : 'Javob berilmadi',
        correctOption: correctOption
          ? `${correctOption.optionLabel}) ${correctOption.optionText}`
          : '-',
        isCorrect,
      });
    }

    // 3. Natijalarni hisoblash
    const percentage = parseFloat(
      ((score / session.actualCount) * 100).toFixed(2),
    );
    const finishedAt = new Date();
    const durationSec = Math.floor(
      (finishedAt.getTime() - session.startedAt.getTime()) / 1000,
    );

    // 4. Sessiyani yakunlash
    await this.prisma.testSession.update({
      where: { id: sessionId },
      data: { score, percentage, finishedAt, durationSec },
    });

    // 5. Natijani qaytarish
    return {
      sessionId,
      score,
      totalQuestions: session.actualCount,
      percentage,
      durationSec,
      subject: session.subjectId,
      questions: resultQuestions.sort((a, b) => a.order - b.order),
    };
  }

  // Admin uchun barcha sessiyalar
  async findAll(studentId?: string, subjectId?: string) {
    return this.prisma.testSession.findMany({
      where: {
        ...(studentId && { studentId }),
        ...(subjectId && { subjectId }),
      },
      select: {
        id: true,
        requestedCount: true,
        actualCount: true,
        score: true,
        percentage: true,
        startedAt: true,
        finishedAt: true,
        durationSec: true,
        student: { select: { id: true, fullName: true, phone: true } },
        subject: { select: { id: true, name: true } },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  // Bitta sessiya natijasi
  async findOne(sessionId: string) {
    const session = await this.prisma.testSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        requestedCount: true,
        actualCount: true,
        score: true,
        percentage: true,
        startedAt: true,
        finishedAt: true,
        durationSec: true,
        student: { select: { id: true, fullName: true, phone: true } },
        subject: { select: { id: true, name: true } },
        sessionQuestions: {
          select: {
            displayOrder: true,
            isCorrect: true,
            answeredAt: true,
            question: { select: { questionText: true } },
            selectedOption: {
              select: { optionLabel: true, optionText: true },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!session) throw new NotFoundException('Sessiya topilmadi');
    return session;
  }
}
