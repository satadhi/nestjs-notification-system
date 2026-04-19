import { Controller, Get } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { NotificationServiceService } from './notification-service.service';
import {
  acknowledgeMessage,
  EVENTS,
  rejectMessage,
} from '@app/common';
import type {
  OrderCancelledEvent,
  OrderCompletedEvent,
} from '@app/common';

@Controller()
export class NotificationServiceController {
  constructor(private readonly notificationServiceService: NotificationServiceService) {}

  @Get()
  getHello(): string {
    return this.notificationServiceService.getHello();
  }

  @EventPattern(EVENTS.ORDER_COMPLETED)
  async handleOrderCompleted(
    @Payload() event: OrderCompletedEvent,
    @Ctx() context: RmqContext,
  ) {
    try {
      await this.notificationServiceService.handleOrderCompleted(event);
      acknowledgeMessage(context);
    } catch (error) {
      rejectMessage(context);
      throw error;
    }
  }

  @EventPattern(EVENTS.ORDER_CANCELLED)
  async handleOrderCancelled(
    @Payload() event: OrderCancelledEvent,
    @Ctx() context: RmqContext,
  ) {
    try {
      await this.notificationServiceService.handleOrderCancelled(event);
      acknowledgeMessage(context);
    } catch (error) {
      rejectMessage(context);
      throw error;
    }
  }
}
