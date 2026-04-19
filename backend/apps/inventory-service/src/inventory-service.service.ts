import {
  EVENTS,
  InventoryFailedEvent,
  InventoryReservedEvent,
  PaymentCompletedEvent,
  QUEUES,
  RabbitMqService,
} from '@app/common';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Inventory } from './entities/inventory.entity';
import { InventoryLog } from './entities/inventory-log.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class InventoryServiceService implements OnModuleInit {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    private readonly dataSource: DataSource,
    private readonly rabbitMqService: RabbitMqService,
  ) {}

  getHello(): string {
    return 'Inventory service is running';
  }

  async onModuleInit() {
    await this.rabbitMqService.subscribe<PaymentCompletedEvent>({
      queue: QUEUES.INVENTORY,
      routingKeys: [EVENTS.PAYMENT_COMPLETED],
      handler: async ({ payload }) => {
        await this.reserveInventory(payload);
      },
    });
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

      await this.rabbitMqService.publish(EVENTS.INVENTORY_FAILED, inventoryFailedEvent);
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

    await this.rabbitMqService.publish(EVENTS.INVENTORY_RESERVED, inventoryReservedEvent);
  }
}
