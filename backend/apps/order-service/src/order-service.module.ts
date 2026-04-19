import { Module } from '@nestjs/common';
import { OrderServiceController } from './order-service.controller';
import { OrderServiceService } from './order-service.service';
import { DatabaseModule } from '@app/database';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
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
      envFilePath: path.resolve(process.cwd(), 'apps/order-service/.env'),
    }),
    DatabaseModule.forRoot([Order, OrderItem]),
    TypeOrmModule.forFeature([Order, OrderItem]),
    ClientsModule.registerAsync([
      createRmqClientProvider(RMQ_CLIENTS.PAYMENT, QUEUES.PAYMENT),
      createRmqClientProvider(RMQ_CLIENTS.NOTIFICATION, QUEUES.NOTIFICATION),
    ]),
  ],
  controllers: [OrderServiceController],
  providers: [OrderServiceService],
})
export class OrderServiceModule {}
