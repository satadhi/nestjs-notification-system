import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { Payment } from './entities/payment.entity';
import {
  EVENTS,
  OrderCreatedEvent,
  PaymentCompletedEvent,
  PaymentFailedEvent,
  RMQ_CLIENTS,
} from '@app/common';

@Injectable()
export class PaymentServiceService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @Inject(RMQ_CLIENTS.INVENTORY)
    private readonly inventoryClient: ClientProxy,
    @Inject(RMQ_CLIENTS.ORDER)
    private readonly orderClient: ClientProxy,
  ) {}

  getHello(): string {
    return 'Payment service is running';
  }

  async handleOrderCreated(event: OrderCreatedEvent) {
    await this.processPayment(event);
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

      await this.emitEvent(
        this.orderClient,
        EVENTS.PAYMENT_FAILED,
        paymentFailedEvent,
      );
      return;
    }

    const paymentCompletedEvent: PaymentCompletedEvent = {
      orderId: event.orderId,
      paymentId: savedPayment.id,
      transactionId: savedPayment.transactionId,
      amount,
      items: event.items,
    };

    await this.emitEvent(
      this.inventoryClient,
      EVENTS.PAYMENT_COMPLETED,
      paymentCompletedEvent,
    );
  }

  private shouldFailPayment() {
    return (process.env.PAYMENT_FORCE_FAIL ?? '').toLowerCase() === 'true';
  }

  private async emitEvent<TPayload>(
    client: ClientProxy,
    pattern: string,
    payload: TPayload,
  ) {
    await firstValueFrom(client.emit(pattern, payload), {
      defaultValue: undefined,
    });
  }
}
