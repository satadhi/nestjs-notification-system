import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('inventory_logs')
export class InventoryLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productId: string;

  @Column()
  change: number;

  @Column()
  reason: string;

  @CreateDateColumn()
  createdAt: Date;
}
