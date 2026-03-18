import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as basicAuth from 'express-basic-auth';
import { seedSuperAdmin } from './prisma/seed';
import helmet from 'helmet';

async function start() {
  // port
  const PORT = process.env.PORT || 3001;
  // app
  const app = await NestFactory.create(AppModule);
  // cookie-parser
  app.use(cookieParser());
  // global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTOda bo'lmagan fieldlarni o'chiradi
      forbidNonWhitelisted: true, // noma'lum field kelsa xato beradi
      transform: true,
    }),
  );
  // global prefix
  app.setGlobalPrefix('/api');
  // helmet
  app.use(helmet());
  // cors
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        process.env.FRONTEND_URL,
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new BadRequestException('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  // add auth to read swagger docs
  app.use(
    ['/api/docs'],
    basicAuth({
      users: { kottaAdmin: '12345' },
      challenge: true,
    }),
  );
  // swagger
  const config = new DocumentBuilder()
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your Bearer token',
      },
      'authorization',
    )
    .setTitle('Edu-TEST')
    .setDescription('A website designed to test knowledge by taking tests.')
    .setVersion('1.0.0')
    .addTag('Nestjs, Prizma, Validation')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api/docs', app, document);
  // Dastur 1-marta ishga tushganda super admin avtomatik yaratiladi
  await seedSuperAdmin();
  // listen app
  await app.listen(PORT, () => console.log(`Server running at port ${PORT}`));
}

start();
