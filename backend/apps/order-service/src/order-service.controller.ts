import { Body, Controller, Get, Post } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { OrderServiceService } from './order-service.service';
import { CreateOrderDto } from './dtos/get-order.dto';
import {
  acknowledgeMessage,
  EVENTS,
  rejectMessage,
} from '@app/common';
import type {
  InventoryFailedEvent,
  InventoryReservedEvent,
  PaymentFailedEvent,
} from '@app/common';

@Controller('orders')
export class OrderServiceController {
  constructor(private readonly orderServiceService: OrderServiceService) {}

  @Get()
  getHello(): string {
    return this.orderServiceService.getHello();
  }

  @Post()
  async createOrder(@Body() dto: CreateOrderDto) {
    return this.orderServiceService.createOrder(dto);
  }

  @EventPattern(EVENTS.PAYMENT_FAILED)
  async handlePaymentFailed(
    @Payload() event: PaymentFailedEvent,
    @Ctx() context: RmqContext,
  ) {
    await this.handleEvent(context, () =>
      this.orderServiceService.handlePaymentFailed(event),
    );
  }

  @EventPattern(EVENTS.INVENTORY_FAILED)
  async handleInventoryFailed(
    @Payload() event: InventoryFailedEvent,
    @Ctx() context: RmqContext,
  ) {
    await this.handleEvent(context, () =>
      this.orderServiceService.handleInventoryFailed(event),
    );
  }

  @EventPattern(EVENTS.INVENTORY_RESERVED)
  async handleInventoryReserved(
    @Payload() event: InventoryReservedEvent,
    @Ctx() context: RmqContext,
  ) {
    await this.handleEvent(context, () =>
      this.orderServiceService.handleInventoryReserved(event),
    );
  }

  private async handleEvent(
    context: RmqContext,
    handler: () => Promise<void>,
  ) {
    try {
      await handler();
      acknowledgeMessage(context);
    } catch (error) {
      rejectMessage(context);
      throw error;
    }
  }
}
