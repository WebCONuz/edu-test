import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // barcha modullarda import qilmasdan ishlatish uchun
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
