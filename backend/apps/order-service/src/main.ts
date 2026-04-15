import { NestFactory } from '@nestjs/core';
import { OrderServiceModule } from './order-service.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(OrderServiceModule);
  app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // removes extra fields
    forbidNonWhitelisted: true, // throws error if extra fields
    transform: true, // enables class-transformer
  }),
);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
