import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { SubjectEntity } from './entities/subject.entity';
import { AccessTokenGuard } from '../common/guards/access-token.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/types';

@ApiTags('Subjects')
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yangi kategoriya yaratish' })
  @ApiResponse({
    status: 201,
    description: 'Kategoriya yaratildi',
    type: SubjectEntity,
  })
  @ApiResponse({ status: 409, description: 'Bu nom allaqachon mavjud' })
  create(
    @Body() dto: CreateSubjectDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.subjectsService.create(dto, currentUserId);
  }

  @Get('full')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Barcha kategoriyalarni olish (hammaga ochiq)' })
  @ApiResponse({
    status: 200,
    description: "Kategoriyalar ro'yxati",
    type: [SubjectEntity],
  })
  findAllFull() {
    return this.subjectsService.findAllFull();
  }

  @Get()
  @ApiOperation({ summary: 'Barcha kategoriyalarni olish (hammaga ochiq)' })
  @ApiResponse({
    status: 200,
    description: "Kategoriyalar ro'yxati",
    type: [SubjectEntity],
  })
  findAll() {
    return this.subjectsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta kategoriyani olish (hammaga ochiq)' })
  @ApiParam({ name: 'id', description: 'Subject ID (uuid)' })
  @ApiResponse({
    status: 200,
    description: 'Kategoriya topildi',
    type: SubjectEntity,
  })
  @ApiResponse({ status: 404, description: 'Kategoriya topilmadi' })
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kategoriyani yangilash' })
  @ApiParam({ name: 'id', description: 'Subject ID (uuid)' })
  @ApiResponse({
    status: 200,
    description: 'Kategoriya yangilandi',
    type: SubjectEntity,
  })
  @ApiResponse({ status: 404, description: 'Kategoriya (fan) topilmadi' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSubjectDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.subjectsService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Kategoriyani inactive qilish (admin va super_admin)',
  })
  @ApiParam({ name: 'id', description: 'Subject ID (uuid)' })
  @ApiResponse({ status: 200, description: "Kategoriya holati o'zgartirildi" })
  @ApiResponse({ status: 404, description: 'Kategoriya topilmadi' })
  toggleActive(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.subjectsService.toggleActive(id, currentUser);
  }
}
