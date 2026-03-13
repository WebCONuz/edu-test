import { Controller, Post, Body, Res, UseGuards, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenGuard } from '../common/guards/refresh-token.guard';
import { AccessTokenGuard } from '../common/guards/access-token.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordGuard } from '../common/guards/reset-password.guard';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResetPasswordByTokenDto } from './dto/reset-password-by-token.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: "Teacher ro'yxatdan o'tish" })
  @ApiResponse({
    status: 201,
    description: "Muvaffaqiyatli ro'yxatdan o'tildi",
  })
  @ApiResponse({ status: 409, description: 'Bu email allaqachon mavjud' })
  register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.register(registerDto, res);
  }

  @Post('login')
  @ApiOperation({ summary: 'Tizimga kirish' })
  @ApiResponse({ status: 200, description: 'Muvaffaqiyatli kirish' })
  @ApiResponse({ status: 401, description: "Email yoki parol noto'g'ri" })
  login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(loginDto, res);
  }

  @Get('refresh')
  @UseGuards(RefreshTokenGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Access tokenni yangilash' })
  @ApiResponse({ status: 200, description: 'Yangi access token' })
  refresh(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refresh(userId, res);
  }

  @Post('logout')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tizimdan chiqish' })
  logout(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.logout(userId, res);
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Parolni tiklash uchun email yuborish (faqat teacher)',
  })
  @ApiResponse({ status: 200, description: 'Email yuborildi' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  // Parolni o'zgartirish
  @Post('reset-password')
  @UseGuards(AccessTokenGuard, ResetPasswordGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Parolni yangilash (login qilingan holda)' })
  resetPassword(
    @Body() dto: ResetPasswordDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.authService.resetPassword(dto, currentUser);
  }

  // Parol esdan chiqqanda qayta tiklash
  @Post('reset-password/token')
  @ApiOperation({
    summary: 'Token orqali parolni tiklash (forgot-password dan)',
  })
  resetPasswordByToken(@Body() dto: ResetPasswordByTokenDto) {
    return this.authService.resetPasswordByToken(dto);
  }
}
