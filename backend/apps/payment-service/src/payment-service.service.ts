import {
  EVENTS,
  OrderCreatedEvent,
  PaymentCompletedEvent,
  PaymentFailedEvent,
  QUEUES,
  RabbitMqService,
} from '@app/common';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PaymentServiceService implements OnModuleInit {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly rabbitMqService: RabbitMqService,
  ) {}

  getHello(): string {
    return 'Payment service is running';
  }

  async onModuleInit() {
    await this.rabbitMqService.subscribe<OrderCreatedEvent>({
      queue: QUEUES.PAYMENT,
      routingKeys: [EVENTS.ORDER_CREATED],
      handler: async ({ payload }) => {
        await this.processPayment(payload);
      },
    });
  }

  private async processPayment(event: OrderCreatedEvent) {
    const amount = event.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const payment = this.paymentRepository.create({
      orderId: event.orderId,
      transactionId: `txn-${event.orderId}-${Date.now()}`,
      status: this.shouldFailPayment() ? 'failed' : 'completed',
    });

    const savedPayment = await this.paymentRepository.save(payment);

    if (savedPayment.status === 'failed') {
      const paymentFailedEvent: PaymentFailedEvent = {
        orderId: event.orderId,
        paymentId: savedPayment.id,
        transactionId: savedPayment.transactionId,
        reason: 'Payment processor rejected the transaction',
        amount,
        items: event.items,
      };

      await this.rabbitMqService.publish(EVENTS.PAYMENT_FAILED, paymentFailedEvent);
      return;
    }

    const paymentCompletedEvent: PaymentCompletedEvent = {
      orderId: event.orderId,
      paymentId: savedPayment.id,
      transactionId: savedPayment.transactionId,
      amount,
      items: event.items,
    };

    await this.rabbitMqService.publish(EVENTS.PAYMENT_COMPLETED, paymentCompletedEvent);
  }

  private shouldFailPayment() {
    return (process.env.PAYMENT_FORCE_FAIL ?? '').toLowerCase() === 'true';
  }
}
