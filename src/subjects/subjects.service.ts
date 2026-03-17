import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSubjectDto, createdById: string) {
    const existing = await this.prisma.subject.findUnique({
      where: { name: dto.name },
    });
    if (existing) throw new ConflictException('Bu nom allaqachon mavjud');

    return this.prisma.subject.create({
      data: {
        ...dto,
        createdById,
      },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: { id: true, fullName: true },
        },
      },
    });
  }

  async findAllFull() {
    return this.prisma.subject.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findAll() {
    return this.prisma.subject.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: { id: true, fullName: true }, // ← qo'shildi
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: { id: true, fullName: true },
        },
      },
    });
    if (!subject) throw new NotFoundException('Kategoriya topilmadi');
    return subject;
  }

  async update(id: string, dto: UpdateSubjectDto, currentUser?: any) {
    const subject = await this.findOne(id);

    // teacher bo'lsa faqat o'zinikini upadate qiladi
    if (
      currentUser?.role === 'teacher' &&
      subject.createdBy?.id !== currentUser.id
    ) {
      throw new ForbiddenException(
        "Siz faqat o'z kategoriyalaringizni yangilay olasiz",
      );
    }

    if (dto.name) {
      const existing = await this.prisma.subject.findUnique({
        where: { name: dto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Bu nom allaqachon mavjud');
      }
    }

    return this.prisma.subject.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async toggleActive(id: string, currentUser?: any) {
    const subject = await this.findOne(id);
    if (!subject) throw new NotFoundException('Kategoriya topilmadi');

    // teacher bo'lsa faqat o'zinikini delete qiladi
    if (
      currentUser?.role === 'teacher' &&
      subject.createdBy?.id !== currentUser.id
    ) {
      throw new ForbiddenException(
        "Siz faqat o'z kategoriyalaringizni inactive qila olasiz",
      );
    }

    await this.prisma.subject.update({
      where: { id },
      data: { isActive: subject.isActive },
    });

    return {
      status: 'success',
      message: "Kategoriya o'chirildi",
      id: subject.id,
    };
  }
}
