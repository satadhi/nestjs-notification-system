import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { DataSource, Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { Inventory } from './entities/inventory.entity';
import { InventoryLog } from './entities/inventory-log.entity';
import {
  EVENTS,
  InventoryFailedEvent,
  InventoryReservedEvent,
  PaymentCompletedEvent,
  RMQ_CLIENTS,
} from '@app/common';

@Injectable()
export class InventoryServiceService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    private readonly dataSource: DataSource,
    @Inject(RMQ_CLIENTS.ORDER)
    private readonly orderClient: ClientProxy,
  ) {}

  getHello(): string {
    return 'Inventory service is running';
  }

  async handlePaymentCompleted(event: PaymentCompletedEvent) {
    await this.reserveInventory(event);
  }

  private async reserveInventory(event: PaymentCompletedEvent) {
    const inventoryRecords = await Promise.all(
      event.items.map((item) =>
        this.inventoryRepository.findOne({
          where: { productId: item.productId },
        }),
      ),
    );

    const unavailableItems = event.items.filter((item, index) => {
      const inventory = inventoryRecords[index];
      return !inventory || inventory.stock < item.quantity;
    });

    if (unavailableItems.length > 0) {
      const inventoryFailedEvent: InventoryFailedEvent = {
        orderId: event.orderId,
        reason: `Insufficient stock for: ${unavailableItems.map((item) => item.productId).join(', ')}`,
        items: event.items,
      };

      await this.emitEvent(
        this.orderClient,
        EVENTS.INVENTORY_FAILED,
        inventoryFailedEvent,
      );
      return;
    }

    await this.dataSource.transaction(async (manager) => {
      const inventoryRepository = manager.getRepository(Inventory);
      const inventoryLogRepository = manager.getRepository(InventoryLog);

      for (const item of event.items) {
        const inventory = await inventoryRepository.findOneOrFail({
          where: { productId: item.productId },
        });

        inventory.stock -= item.quantity;
        await inventoryRepository.save(inventory);

        await inventoryLogRepository.save({
          productId: item.productId,
          change: -item.quantity,
          reason: `Reserved for order ${event.orderId}`,
        });
      }
    });

    const inventoryReservedEvent: InventoryReservedEvent = {
      orderId: event.orderId,
      items: event.items,
    };

    await this.emitEvent(
      this.orderClient,
      EVENTS.INVENTORY_RESERVED,
      inventoryReservedEvent,
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
  }
}
