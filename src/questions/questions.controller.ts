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
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
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
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportQuestionsDto } from './dto/import-questions.dto';

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

  @Get('by-subject/:subjectId')
  @ApiOperation({ summary: "Kategoriya bo'yicha savollarni olish" })
  @ApiParam({ name: 'subjectId', description: 'Subject ID (uuid)' })
  @ApiResponse({
    status: 200,
    description: "Savollar ro'yxati",
    type: [QuestionEntity],
  })
  @ApiResponse({ status: 404, description: 'Kategoriya topilmadi' })
  findBySubject(@Param('subjectId') subjectId: string) {
    return this.questionsService.findBySubject(subjectId);
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

  // inactive question
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

  // delete question
  @Delete(':id/permanent')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Savolni butunlay o'chirish (faqat super_admin)" })
  @ApiParam({ name: 'id', description: 'Question ID (uuid)' })
  @ApiResponse({ status: 200, description: "Savol o'chirildi" })
  @ApiResponse({ status: 404, description: 'Savol topilmadi' })
  removePermanent(@Param('id') id: string) {
    return this.questionsService.remove(id);
  }

  // faydan o'qib test qo'shish
  @Post('import')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Fayldan savollarni import qilish (.pdf, .docx, .txt)',
  })
  @ApiResponse({ status: 201, description: 'Savollar muvaffaqiyatli saqlandi' })
  @ApiResponse({
    status: 400,
    description: "Fayl turi noto'g'ri yoki savollar topilmadi",
  })
  create2(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: ImportQuestionsDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.questionsService.importFromFile(
      file,
      dto.subjectId,
      currentUserId,
    );
  }
}
