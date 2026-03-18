import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { CheckPhoneDto } from './dto/check-phone.dto';
import { StudentEntity } from './entities/student.entity';
import { AccessTokenGuard } from '../common/guards/access-token.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/types';

@ApiTags('Students')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post('check-phone')
  @ApiOperation({
    summary: "Telefon raqamini tekshirish — mavjud bo'lsa ismni qaytaradi",
  })
  @ApiResponse({
    status: 200,
    description: '{ exists: false } yoki { exists: true, student: {...} }',
  })
  checkPhone(@Body() dto: CheckPhoneDto) {
    return this.studentsService.checkPhone(dto);
  }

  @Post()
  @ApiOperation({ summary: 'Yangi student yaratish (test boshlashdan oldin)' })
  @ApiResponse({
    status: 201,
    description: 'Student yaratildi yoki mavjudi qaytarildi',
    type: StudentEntity,
  })
  @ApiResponse({ status: 409, description: 'Telefon raqam bloklangan' })
  create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  @Post('my-results')
  @ApiOperation({
    summary: "Student o'z natijalarini ko'radi (telefon orqali)",
  })
  @ApiResponse({ status: 200, description: 'Student natijalari' })
  @ApiResponse({ status: 404, description: "O'quvchi topilmadi" })
  getMyResults(@Body() dto: CheckPhoneDto) {
    return this.studentsService.getMyResults(dto.phone);
  }

  @Get()
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Barcha studentlar (admin va super_admin)' })
  @ApiResponse({
    status: 200,
    description: "Studentlar ro'yxati",
    type: [StudentEntity],
  })
  findAll() {
    return this.studentsService.findAll();
  }

  @Get(':id')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bitta student (admin va super_admin)' })
  @ApiParam({ name: 'id', description: 'Student ID (uuid)' })
  @ApiResponse({
    status: 200,
    description: 'Student topildi',
    type: StudentEntity,
  })
  @ApiResponse({ status: 404, description: "O'quvchi topilmadi" })
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Studentni inactive qilish (admin va super_admin)' })
  @ApiParam({ name: 'id', description: 'Student ID (uuid)' })
  @ApiResponse({ status: 200, description: "Student holati o'zgartirildi" })
  inActiveStudent(@Param('id') id: string) {
    return this.studentsService.inActiveStudent(id);
  }

  @Patch(':id')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Studentni active qilish (admin va super_admin)' })
  @ApiParam({ name: 'id', description: 'Student ID (uuid)' })
  @ApiResponse({ status: 200, description: "Student holati o'zgartirildi" })
  activeStudent(@Param('id') id: string) {
    return this.studentsService.activeStudent(id);
  }
}
