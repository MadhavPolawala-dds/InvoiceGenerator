import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { createValidationPipe } from './common/pipes/validation.pipe';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Base path /api
  app.setGlobalPrefix('api');

  // Payload size limit to prevent DOS
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  // Global validation pipe with exact path formatting
  app.useGlobalPipes(createValidationPipe());

  // Global exception filter for consistent error shape
  app.useGlobalFilters(new HttpExceptionFilter());

  // CORS configuration (supports comma-separated origins and strips trailing slashes)
  const rawOrigin = process.env.WEB_ORIGIN || 'http://localhost:3000';
  const allowedOrigins = rawOrigin.split(',').map((o) => o.trim().replace(/\/$/, ''));
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Invoice API running on http://localhost:${port}/api`);
}

bootstrap();
