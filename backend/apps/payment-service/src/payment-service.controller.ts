import { Controller, Get } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { PaymentServiceService } from './payment-service.service';
import {
  acknowledgeMessage,
  EVENTS,
  rejectMessage,
} from '@app/common';
import type { OrderCreatedEvent } from '@app/common';

@Controller()
export class PaymentServiceController {
  constructor(private readonly paymentServiceService: PaymentServiceService) {}

  @Get()
  getHello(): string {
    return this.paymentServiceService.getHello();
  }

  @EventPattern(EVENTS.ORDER_CREATED)
  async handleOrderCreated(
    @Payload() event: OrderCreatedEvent,
    @Ctx() context: RmqContext,
  ) {
    try {
      await this.paymentServiceService.handleOrderCreated(event);
      acknowledgeMessage(context);
    } catch (error) {
      rejectMessage(context);
      throw error;
    }
  }
}
