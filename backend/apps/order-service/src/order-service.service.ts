import { EVENTS, PaymentFailedEvent, InventoryFailedEvent, InventoryReservedEvent, OrderCancelledEvent, OrderCompletedEvent, OrderCreatedEvent, QUEUES, RabbitMqService } from '@app/common';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dtos/get-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Repository } from 'typeorm';

@Injectable()
export class OrderServiceService implements OnModuleInit {
  private readonly logger = new Logger(OrderServiceService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly rabbitMqService: RabbitMqService,
  ) {}

  getHello(): string {
    return 'Order service is running';
  }

  async onModuleInit() {
    await this.rabbitMqService.subscribe<
      PaymentFailedEvent | InventoryFailedEvent | InventoryReservedEvent
    >({
      queue: QUEUES.ORDER,
      routingKeys: [
        EVENTS.PAYMENT_FAILED,
        EVENTS.INVENTORY_FAILED,
        EVENTS.INVENTORY_RESERVED,
      ],
      handler: async ({ routingKey, payload }) => {
        switch (routingKey) {
          case EVENTS.PAYMENT_FAILED:
            await this.markOrderAsCancelled(payload as PaymentFailedEvent);
            break;
          case EVENTS.INVENTORY_FAILED:
            await this.markOrderAsCancelled(payload as InventoryFailedEvent);
            break;
          case EVENTS.INVENTORY_RESERVED:
            await this.markOrderAsCompleted(payload as InventoryReservedEvent);
            break;
          default:
            this.logger.warn(`Unhandled routing key: ${routingKey}`);
        }
      },
    });
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

    await this.rabbitMqService.publish(EVENTS.ORDER_CREATED, orderCreatedEvent);

    return savedOrder;
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

    await this.rabbitMqService.publish(EVENTS.ORDER_COMPLETED, orderCompletedEvent);
  }

  private async markOrderAsCancelled(event: PaymentFailedEvent | InventoryFailedEvent) {
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

    await this.rabbitMqService.publish(EVENTS.ORDER_CANCELLED, orderCancelledEvent);
  }
}
