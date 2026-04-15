import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('inventory')
export class Inventory {
  @PrimaryColumn()
  productId: string;

  @Column({ default: 0 })
  stock: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
