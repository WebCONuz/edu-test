import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { StartSessionDto } from './dto/start-session.dto';
import { SubmitSessionDto } from './dto/submit-session.dto';
import { AccessTokenGuard } from '../common/guards/access-token.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/types';
import { TestSessionsService } from './test-sessions.service';

@ApiTags('Sessions')
@Controller('sessions')
export class TestSessionsController {
  constructor(private readonly sessionsService: TestSessionsService) {}

  @Post('start')
  @ApiOperation({ summary: 'Testni boshlash — random savollar qaytariladi' })
  @ApiResponse({
    status: 201,
    description: 'Sessiya boshlandi, savollar qaytarildi',
  })
  @ApiResponse({ status: 404, description: 'Student yoki fan topilmadi' })
  @ApiResponse({ status: 400, description: 'Savollar mavjud emas' })
  startSession(@Body() dto: StartSessionDto) {
    return this.sessionsService.startSession(dto);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Javoblarni yuborish — natija qaytariladi' })
  @ApiParam({ name: 'id', description: 'Session ID (uuid)' })
  @ApiResponse({ status: 201, description: 'Natija hisoblandi' })
  @ApiResponse({ status: 400, description: 'Sessiya allaqachon yakunlangan' })
  @ApiResponse({ status: 404, description: 'Sessiya topilmadi' })
  submitSession(@Param('id') sessionId: string, @Body() dto: SubmitSessionDto) {
    return this.sessionsService.submitSession(sessionId, dto);
  }

  @Get()
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Barcha sessiyalar (admin va super_admin)' })
  @ApiQuery({ name: 'studentId', required: false })
  @ApiQuery({ name: 'subjectId', required: false })
  findAll(
    @Query('studentId') studentId?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.sessionsService.findAll(studentId, subjectId);
  }

  @Get(':id')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bitta sessiya natijasi (admin va super_admin)' })
  @ApiParam({ name: 'id', description: 'Session ID (uuid)' })
  @ApiResponse({ status: 200, description: 'Sessiya topildi' })
  @ApiResponse({ status: 404, description: 'Sessiya topilmadi' })
  findOne(@Param('id') sessionId: string) {
    return this.sessionsService.findOne(sessionId);
  }
}
