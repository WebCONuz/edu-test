import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { MailService } from '../mail/mail.service';
import { randomUUID } from 'crypto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResetPasswordByTokenDto } from './dto/reset-password-by-token.dto';
import { UserRole } from '../common/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private mailService: MailService,
  ) {}

  // Tokenlar generatsiya qilish
  private async generateTokens(userId: string, role: string) {
    const payload = { id: userId, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.ACCESS_TOKEN_KEY!,
        expiresIn: '1h',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.REFRESH_TOKEN_KEY!,
        expiresIn: '1d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  // Refresh tokenni DBga saqlash
  private async saveRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });
  }

  // Refresh tokenni cookiega yozish
  private setTokensToCookie(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: Number(process.env.ACCESS_COOKIE_TIME),
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true, // JS orqali o'qib bo'lmaydi
      secure: process.env.NODE_ENV === 'production',
      maxAge: Number(process.env.REFRESH_COOKIE_TIME),
    });
  }

  // Teacher uchun register qilish
  async register(registerDto: RegisterDto, res: Response) {
    const existing = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });
    if (existing) throw new ConflictException('Bu email allaqachon mavjud');

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        fullName: registerDto.fullName,
        email: registerDto.email,
        password: hashedPassword,
        role: 'teacher', // har doim teacher bo'ladi
      },
    });

    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.role,
    );
    await this.saveRefreshToken(user.id, refreshToken);
    this.setTokensToCookie(res, accessToken, refreshToken);

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };
  }

  // super_admin, admin va teacher uchun
  async login(loginDto: LoginDto, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) throw new UnauthorizedException("Email yoki parol noto'g'ri");
    if (!user.isActive) throw new UnauthorizedException('Akkaunt bloklangan');

    const passwordMatch = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!passwordMatch)
      throw new UnauthorizedException("Email yoki parol noto'g'ri");

    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.role,
    );
    await this.saveRefreshToken(user.id, refreshToken);
    this.setTokensToCookie(res, accessToken, refreshToken);

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };
  }

  async refresh(userId: string, res: Response) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshToken) throw new UnauthorizedException();

    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.role,
    );
    await this.saveRefreshToken(user.id, refreshToken);
    this.setTokensToCookie(res, accessToken, refreshToken);

    return { status: 'success', message: 'refresh qilindi' };
  }

  async logout(userId: string, res: Response) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    return { message: 'Tizimdan chiqildi' };
  }

  // Parol esdan chiqqanda Emailga xabar yuborish
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // email topilmasa ham xuddi shu xabarni qaytaramiz (security uchun)
    if (!user) return { message: "Agar email mavjud bo'lsa, xat yuborildi" };

    // faqat teacher forgot-password ishlatishi mumkin
    if (user.role !== 'teacher') {
      return { message: "Agar email mavjud bo'lsa, xat yuborildi" };
    }

    const token = randomUUID();
    const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 daqiqa

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      },
    });

    await this.mailService.sendResetPasswordEmail(email, token);
    return {
      message: 'Parolni tiklash havolasi shaxsiy emailingizga yuborildi',
    };
  }

  // Parolni o'zgartirish
  async resetPassword(dto: ResetPasswordDto, currentUser: any) {
    const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;
    const targetId = dto.targetUserId ?? currentUser.id;
    const isChangingOwnPassword = targetId === currentUser.id;

    // Tekshiriladigan user (o'zi yoki target)
    const user = await this.prisma.user.findUnique({
      where: { id: targetId },
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    // super_admin boshqanikini o'zgartirsa oldPassword shart emas
    // boshqa barcha holatlarda oldPassword tekshiriladi
    if (!isSuperAdmin || isChangingOwnPassword) {
      const passwordMatch = await bcrypt.compare(
        dto.oldPassword,
        user.password,
      );
      if (!passwordMatch) {
        throw new BadRequestException("Eski parol noto'g'ri");
      }
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: targetId },
      data: { password: hashedPassword },
    });

    return { message: 'Parol muvaffaqiyatli yangilandi' };
  }

  // Parol esdan chiqqanda qayta tiklash
  async resetPasswordByToken(dto: ResetPasswordByTokenDto) {
    const user = await this.prisma.user.findFirst({
      where: { resetPasswordToken: dto.token },
    });

    if (!user || !user.resetPasswordExpires) {
      throw new BadRequestException('Token yaroqsiz');
    }

    if (user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Token muddati tugagan');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return { message: 'Parol muvaffaqiyatli yangilandi' };
  }
}
