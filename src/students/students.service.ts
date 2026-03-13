import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { CheckPhoneDto } from './dto/check-phone.dto';

const studentSelect = {
  id: true,
  fullName: true,
  phone: true,
  isActive: true,
  createdAt: true,
};

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  // Telefon raqamini tekshirish — keyingi safar formani to'ldirish uchun
  async checkPhone(dto: CheckPhoneDto) {
    const student = await this.prisma.student.findUnique({
      where: { phone: dto.phone },
      select: studentSelect,
    });

    if (!student) return { exists: false };

    return {
      exists: true,
      student: {
        id: student.id,
        fullName: student.fullName,
        phone: student.phone,
      },
    };
  }

  // Yangi student yaratish (test boshlashdan oldin)
  async create(dto: CreateStudentDto) {
    const existing = await this.prisma.student.findUnique({
      where: { phone: dto.phone },
    });

    // Allaqachon mavjud bo'lsa qaytaramiz (qayta ro'yxatdan o'tmasin)
    if (existing) {
      if (!existing.isActive) {
        throw new ConflictException('Bu telefon raqam bloklangan');
      }
      return existing;
    }

    return this.prisma.student.create({
      data: dto,
      select: studentSelect,
    });
  }

  // Barcha studentlar — faqat admin va super_admin
  async findAll() {
    return this.prisma.student.findMany({
      select: {
        ...studentSelect,
        testSessions: {
          select: {
            id: true,
            score: true,
            percentage: true,
            finishedAt: true,
            subject: { select: { name: true } },
          },
          orderBy: { startedAt: 'desc' },
          take: 5, // oxirgi 5 ta session
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Bitta student — faqat admin va super_admin
  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      select: {
        ...studentSelect,
        testSessions: {
          select: {
            id: true,
            score: true,
            percentage: true,
            actualCount: true,
            finishedAt: true,
            subject: { select: { name: true } },
          },
          orderBy: { startedAt: 'desc' },
        },
      },
    });
    if (!student) throw new NotFoundException("O'quvchi topilmadi");
    return student;
  }

  // Student o'z natijalarini ko'radi (telefon orqali)
  async getMyResults(phone: string) {
    const student = await this.prisma.student.findUnique({
      where: { phone },
      select: {
        id: true,
        fullName: true,
        phone: true,
        isActive: true,
        testSessions: {
          select: {
            id: true,
            score: true,
            percentage: true,
            actualCount: true,
            requestedCount: true,
            startedAt: true,
            finishedAt: true,
            durationSec: true,
            subject: { select: { name: true } },
          },
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!student) throw new NotFoundException("O'quvchi topilmadi");
    if (!student.isActive) throw new ForbiddenException('Akkaunt bloklangan');
    return student;
  }

  // Inactive qilish — faqat admin va super_admin
  async toggleActive(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      select: studentSelect,
    });
    if (!student) throw new NotFoundException("O'quvchi topilmadi");

    return this.prisma.student.update({
      where: { id },
      data: { isActive: !student.isActive },
      select: studentSelect,
    });
  }
}
