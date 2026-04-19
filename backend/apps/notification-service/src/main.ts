import { NestFactory } from '@nestjs/core';
import { NotificationServiceModule } from './notification-service.module';
import { ConfigService } from '@nestjs/config';
import {
  createRmqMicroserviceOptions,
  QUEUES,
} from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(NotificationServiceModule);
  const configService = app.get(ConfigService);
  app.connectMicroservice(
    createRmqMicroserviceOptions(configService, QUEUES.NOTIFICATION),
  );
  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3004);
}
bootstrap();
