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

@Module({
  imports: [
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
  providers: [],
})
export class AppModule {}
