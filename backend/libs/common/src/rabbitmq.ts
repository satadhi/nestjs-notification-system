import { ConfigModule, ConfigService } from '@nestjs/config';
import { RmqContext, RmqOptions, Transport } from '@nestjs/microservices';
import type { ClientsProviderAsyncOptions } from '@nestjs/microservices/module/interfaces/clients-module.interface';
import { QUEUES } from './queues';

export const DEFAULT_RABBITMQ_URL = 'amqp://admin:admin@localhost:5672';

export const RMQ_CLIENTS = {
  ORDER: 'ORDER_RMQ_CLIENT',
  PAYMENT: 'PAYMENT_RMQ_CLIENT',
  INVENTORY: 'INVENTORY_RMQ_CLIENT',
  NOTIFICATION: 'NOTIFICATION_RMQ_CLIENT',
} as const;

export const createRmqClientProvider = (
  name: string,
  queue: string,
): ClientsProviderAsyncOptions => ({
  name,
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService): RmqOptions => ({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABBITMQ_URL') ?? DEFAULT_RABBITMQ_URL],
      queue,
      queueOptions: {
        durable: true,
      },
      persistent: true,
    },
  }),
});

export const createRmqMicroserviceOptions = (
  configService: ConfigService,
  queue: string,
): RmqOptions => ({
  transport: Transport.RMQ,
  options: {
    urls: [configService.get<string>('RABBITMQ_URL') ?? DEFAULT_RABBITMQ_URL],
    queue,
    queueOptions: {
      durable: true,
    },
    noAck: false,
    prefetchCount: 10,
  },
});

export const acknowledgeMessage = (context: RmqContext) => {
  context.getChannelRef().ack(context.getMessage());
};

export const rejectMessage = (context: RmqContext) => {
  context.getChannelRef().nack(context.getMessage(), false, false);
};

export { QUEUES };
