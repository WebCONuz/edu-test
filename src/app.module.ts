import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { SubjectsModule } from './subjects/subjects.module';
import { QuestionsModule } from './questions/questions.module';
import { StudentsModule } from './students/students.module';
import { TestSessionsModule } from './test-sessions/test-sessions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    MailModule,
    SubjectsModule,
    QuestionsModule,
    StudentsModule,
    TestSessionsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
