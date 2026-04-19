import { NestFactory } from '@nestjs/core';
import { InventoryServiceModule } from './inventory-service.module';
import { ConfigService } from '@nestjs/config';
import {
  createRmqMicroserviceOptions,
  QUEUES,
} from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(InventoryServiceModule);
  const configService = app.get(ConfigService);
  app.connectMicroservice(
    createRmqMicroserviceOptions(configService, QUEUES.INVENTORY),
  );
  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3003);
}
bootstrap();
