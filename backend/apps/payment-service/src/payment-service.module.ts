import { Module } from '@nestjs/common';
import { PaymentServiceController } from './payment-service.controller';
import { PaymentServiceService } from './payment-service.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import { Payment } from './entities/payment.entity';
import { ClientsModule } from '@nestjs/microservices';
import {
  createRmqClientProvider,
  RMQ_CLIENTS,
  QUEUES,
} from '@app/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.resolve(process.cwd(), 'apps/payment-service/.env'),
    }),
    DatabaseModule.forRoot([Payment]),
    TypeOrmModule.forFeature([Payment]),
    ClientsModule.registerAsync([
      createRmqClientProvider(RMQ_CLIENTS.INVENTORY, QUEUES.INVENTORY),
      createRmqClientProvider(RMQ_CLIENTS.ORDER, QUEUES.ORDER),
    ]),
  ],
  controllers: [PaymentServiceController],
  providers: [PaymentServiceService],
})
export class PaymentServiceModule {}
