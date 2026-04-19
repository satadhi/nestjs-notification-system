import { Controller, Get } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { InventoryServiceService } from './inventory-service.service';
import {
  acknowledgeMessage,
  EVENTS,
  rejectMessage,
} from '@app/common';
import type { PaymentCompletedEvent } from '@app/common';

@Controller()
export class InventoryServiceController {
  constructor(private readonly inventoryServiceService: InventoryServiceService) {}

  @Get()
  getHello(): string {
    return this.inventoryServiceService.getHello();
  }

  @EventPattern(EVENTS.PAYMENT_COMPLETED)
  async handlePaymentCompleted(
    @Payload() event: PaymentCompletedEvent,
    @Ctx() context: RmqContext,
  ) {
    try {
      await this.inventoryServiceService.handlePaymentCompleted(event);
      acknowledgeMessage(context);
    } catch (error) {
      rejectMessage(context);
      throw error;
    }
  }
}
