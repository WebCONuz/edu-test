import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { SubjectsModule } from './subjects/subjects.module';
import { QuestionsModule } from './questions/questions.module';
import { StudentsModule } from './students/students.module';
import { TestSessionsModule } from './test-sessions/test-sessions.module';
import { StorageModule } from './storage/storage.module';
import { AiModule } from './ai/ai.module';
import { FileParserModule } from './file-parser/file-parser.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 sekund
        limit: 10, // 10 ta so'rov
      },
      {
        name: 'long',
        ttl: 60000, // 1 daqiqa
        limit: 100, // 100 ta so'rov
      },
    ]),
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    MailModule,
    SubjectsModule,
    QuestionsModule,
    StudentsModule,
    TestSessionsModule,
    StorageModule,
    AiModule,
    FileParserModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // global — hamma endpointga qo'llaniladi
    },
  ],
})
export class AppModule {}
