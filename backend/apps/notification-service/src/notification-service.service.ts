import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import {
  EVENTS,
  OrderCancelledEvent,
  OrderCompletedEvent,
} from '@app/common';

@Injectable()
export class NotificationServiceService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  getHello(): string {
    return 'Notification service is running';
  }

  async handleOrderCompleted(payload: OrderCompletedEvent) {
    await this.notificationRepository.save({
      orderId: payload.orderId,
      type: EVENTS.ORDER_COMPLETED,
      recipient: `user:${payload.userId}`,
      message: `Order ${payload.orderId} completed successfully`,
      status: 'sent',
    });
  }

  async handleOrderCancelled(payload: OrderCancelledEvent) {
    await this.notificationRepository.save({
      orderId: payload.orderId,
      type: EVENTS.ORDER_CANCELLED,
      recipient: `user:${payload.userId}`,
      message: `Order ${payload.orderId} was cancelled: ${payload.reason}`,
      status: 'sent',
    });
  }
}
