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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/types';
import { AccessTokenGuard } from '../common/guards/access-token.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard) // barcha endpointlar himoyalangan
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN) // faqat super_admin admin yarata oladi
  @ApiOperation({ summary: 'Yangi foydalanuvchi yaratish' })
  @ApiResponse({
    status: 201,
    description: 'Foydalanuvchi yaratildi',
    type: UserEntity,
  })
  @ApiResponse({ status: 409, description: 'Bu email allaqachon mavjud' })
  @ApiResponse({ status: 400, description: 'Validation xatosi' })
  create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser('id') currentUserId: string, // token dan olinadi
  ) {
    return this.usersService.create(createUserDto, currentUserId);
  }

  @Get('full')
  @Roles(UserRole.SUPER_ADMIN) // faqat super_admin umumiy ro'yxatni ko'ra oladi
  @ApiOperation({ summary: 'Barcha foydalanuvchilarni olish' })
  @ApiResponse({
    status: 200,
    description: "Userlar full ro'yxati",
    type: [UserEntity],
  })
  findAllFull() {
    return this.usersService.findAllFull();
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) // faqat super_admin va adminlar umumiy ro'yxatni ko'ra oladi
  @ApiOperation({ summary: 'Barcha foydalanuvchilarni olish' })
  @ApiResponse({
    status: 200,
    description: "Userlar ro'yxati",
    type: [UserEntity],
  })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) // super_admin va admin ko'ra oladi
  @ApiOperation({ summary: 'Bitta userni olish' })
  @ApiParam({
    name: 'id',
    description: 'Foydalanuvchi ID',
    example: '1',
  })
  @ApiResponse({
    status: 200,
    description: 'Foydalanuvchi topildi',
    type: UserEntity,
  })
  @ApiResponse({ status: 404, description: 'Foydalanuvchi topilmadi' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN) // faqat super_admin update qila oladi
  @ApiOperation({ summary: 'Userni yangilash' })
  @ApiParam({
    name: 'id',
    description: 'Foydalanuvchi ID',
    example: '1',
  })
  @ApiResponse({
    status: 200,
    description: 'Foydalanuvchi yangilandi',
    type: UserEntity,
  })
  @ApiResponse({ status: 404, description: 'Foydalanuvchi topilmadi' })
  @ApiResponse({ status: 400, description: 'Validation xatosi' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN) // faqat super_admin o'chira oladi
  @ApiOperation({ summary: "Userni o'chirish" })
  @ApiParam({
    name: 'id',
    description: 'Foydalanuvchi ID',
    example: '1',
  })
  @ApiResponse({ status: 200, description: "Foydalanuvchi o'chirildi" })
  @ApiResponse({ status: 404, description: 'Foydalanuvchi topilmadi' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
