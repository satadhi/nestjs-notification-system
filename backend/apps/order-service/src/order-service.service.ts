import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { CreateOrderDto } from './dtos/get-order.dto';
import { Order } from './entities/order.entity';
import {
  EVENTS,
  InventoryFailedEvent,
  InventoryReservedEvent,
  OrderCancelledEvent,
  OrderCompletedEvent,
  OrderCreatedEvent,
  PaymentFailedEvent,
  RMQ_CLIENTS,
} from '@app/common';

@Injectable()
export class OrderServiceService {
  private readonly logger = new Logger(OrderServiceService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @Inject(RMQ_CLIENTS.PAYMENT)
    private readonly paymentClient: ClientProxy,
    @Inject(RMQ_CLIENTS.NOTIFICATION)
    private readonly notificationClient: ClientProxy,
  ) {}

  getHello(): string {
    return 'Order service is running';
  }

  async createOrder(dto: CreateOrderDto) {
    const order = this.orderRepository.create({
      userId: dto.userId,
      status: 'pending',
      items: dto.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        price: item.price,
        totalPrice: item.price * item.quantity,
        quantity: item.quantity,
      })),
    });

    const savedOrder = await this.orderRepository.save(order);
    const orderCreatedEvent: OrderCreatedEvent = {
      orderId: savedOrder.id,
      userId: savedOrder.userId,
      status: savedOrder.status,
      items: savedOrder.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        price: Number(item.price),
        quantity: item.quantity,
        totalPrice: Number(item.totalPrice),
      })),
    };

    await this.emitEvent(
      this.paymentClient,
      EVENTS.ORDER_CREATED,
      orderCreatedEvent,
    );

    return savedOrder;
  }

  async handlePaymentFailed(event: PaymentFailedEvent) {
    await this.markOrderAsCancelled(event);
  }

  async handleInventoryFailed(event: InventoryFailedEvent) {
    await this.markOrderAsCancelled(event);
  }

  async handleInventoryReserved(event: InventoryReservedEvent) {
    await this.markOrderAsCompleted(event);
  }

  private async markOrderAsCompleted(event: InventoryReservedEvent) {
    const order = await this.orderRepository.findOne({
      where: { id: event.orderId },
    });

    if (!order || order.status === 'completed') {
      return;
    }

    order.status = 'completed';
    await this.orderRepository.save(order);

    const orderCompletedEvent: OrderCompletedEvent = {
      orderId: order.id,
      userId: order.userId,
      status: order.status,
    };

    await this.emitEvent(
      this.notificationClient,
      EVENTS.ORDER_COMPLETED,
      orderCompletedEvent,
    );
  }

  private async markOrderAsCancelled(
    event: PaymentFailedEvent | InventoryFailedEvent,
  ) {
    const order = await this.orderRepository.findOne({
      where: { id: event.orderId },
    });

    if (!order || order.status === 'cancelled') {
      return;
    }

    order.status = 'cancelled';
    await this.orderRepository.save(order);

    const orderCancelledEvent: OrderCancelledEvent = {
      orderId: order.id,
      userId: order.userId,
      status: order.status,
      reason: 'reason' in event ? event.reason : 'Order cancelled by saga',
    };

    await this.emitEvent(
      this.notificationClient,
      EVENTS.ORDER_CANCELLED,
      orderCancelledEvent,
    );
  }

  private async emitEvent<TPayload>(
    client: ClientProxy,
    pattern: string,
    payload: TPayload,
  ) {
    await firstValueFrom(client.emit(pattern, payload), {
      defaultValue: undefined,
    });
    this.logger.log(`Published ${pattern}`);
  }
}
