import {
  EVENTS,
  OrderCancelledEvent,
  OrderCompletedEvent,
  QUEUES,
  RabbitMqService,
} from '@app/common';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { Repository } from 'typeorm';

@Injectable()
export class NotificationServiceService implements OnModuleInit {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly rabbitMqService: RabbitMqService,
  ) {}

  getHello(): string {
    return 'Notification service is running';
  }

  async onModuleInit() {
    await this.rabbitMqService.subscribe<OrderCompletedEvent | OrderCancelledEvent>({
      queue: QUEUES.NOTIFICATION,
      routingKeys: [EVENTS.ORDER_COMPLETED, EVENTS.ORDER_CANCELLED],
      handler: async ({ routingKey, payload }) => {
        const isCompleted = routingKey === EVENTS.ORDER_COMPLETED;
        const message = isCompleted
          ? `Order ${payload.orderId} completed successfully`
          : `Order ${payload.orderId} was cancelled${'reason' in payload ? `: ${payload.reason}` : ''}`;

        await this.notificationRepository.save({
          orderId: payload.orderId,
          type: routingKey,
          recipient: `user:${payload.userId}`,
          message,
          status: 'sent',
        });
      },
    });
  }
}
