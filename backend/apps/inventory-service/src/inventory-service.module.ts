import { Module } from '@nestjs/common';
import { InventoryServiceController } from './inventory-service.controller';
import { InventoryServiceService } from './inventory-service.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import { Inventory } from './entities/inventory.entity';
import { InventoryLog } from './entities/inventory-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.resolve(process.cwd(), 'apps/inventory-service/.env'),
    }),
    DatabaseModule.forRoot([Inventory, InventoryLog]),
    TypeOrmModule.forFeature([Inventory, InventoryLog]),
  ],
  controllers: [InventoryServiceController],
  providers: [InventoryServiceService],
})
export class InventoryServiceModule {}
