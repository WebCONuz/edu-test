import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionEntity } from './entities/question.entity';
import { AccessTokenGuard } from '../common/guards/access-token.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/types';

@ApiTags('Questions')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yangi savol yaratish' })
  @ApiResponse({
    status: 201,
    description: 'Savol yaratildi',
    type: QuestionEntity,
  })
  @ApiResponse({ status: 404, description: 'Kategoriya topilmadi' })
  @ApiResponse({ status: 400, description: 'Validation xatosi' })
  create(
    @Body() dto: CreateQuestionDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.questionsService.create(dto, currentUserId);
  }

  @Get('full')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Barcha savollarni olish' })
  @ApiQuery({
    name: 'subjectId',
    required: false,
    description: "Fan bo'yicha filter",
  })
  @ApiResponse({
    status: 200,
    description: "Savollar ro'yxati",
    type: [QuestionEntity],
  })
  findAllFull(@Query('subjectId') subjectId?: string) {
    return this.questionsService.findAllFull(subjectId);
  }

  @Get()
  @ApiOperation({ summary: 'Barcha savollarni aktive olish' })
  @ApiQuery({
    name: 'subjectId',
    required: false,
    description: "Fan bo'yicha filter",
  })
  @ApiResponse({
    status: 200,
    description: "Savollar ro'yxati",
    type: [QuestionEntity],
  })
  findAll(@Query('subjectId') subjectId?: string) {
    return this.questionsService.findAll(subjectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta savolni olish (hammaga ochiq)' })
  @ApiParam({ name: 'id', description: 'Question ID (uuid)' })
  @ApiResponse({
    status: 200,
    description: 'Savol topildi',
    type: QuestionEntity,
  })
  @ApiResponse({ status: 404, description: 'Savol topilmadi' })
  findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Savolni yangilash' })
  @ApiParam({ name: 'id', description: 'Question ID (uuid)' })
  @ApiResponse({
    status: 200,
    description: 'Savol yangilandi',
    type: QuestionEntity,
  })
  @ApiResponse({ status: 404, description: 'Savol topilmadi' })
  update(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.questionsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Savolni inactive qilish' })
  @ApiParam({ name: 'id', description: 'Question ID (uuid)' })
  @ApiResponse({ status: 200, description: "Savol holati o'zgartirildi" })
  @ApiResponse({ status: 404, description: 'Savol topilmadi' })
  toggleActive(@Param('id') id: string) {
    return this.questionsService.toggleActive(id);
  }
}
