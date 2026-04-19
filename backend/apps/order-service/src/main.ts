import { NestFactory } from '@nestjs/core';
import { OrderServiceModule } from './order-service.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import {
  createRmqMicroserviceOptions,
  QUEUES,
} from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(OrderServiceModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const configService = app.get(ConfigService);
  app.connectMicroservice(
    createRmqMicroserviceOptions(configService, QUEUES.ORDER),
  );
  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
