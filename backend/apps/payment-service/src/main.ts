import { NestFactory } from '@nestjs/core';
import { PaymentServiceModule } from './payment-service.module';
import { ConfigService } from '@nestjs/config';
import {
  createRmqMicroserviceOptions,
  QUEUES,
} from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(PaymentServiceModule);
  const configService = app.get(ConfigService);
  app.connectMicroservice(
    createRmqMicroserviceOptions(configService, QUEUES.PAYMENT),
  );
  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
