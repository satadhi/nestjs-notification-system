import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productId: string;

  @Column()
  productName: string; // snapshot

  @Column('decimal')
  price: number; // snapshot

  @Column()
  quantity: number;

  @Column('decimal')
  totalPrice: number;

  @ManyToOne(() => Order, (order) => order.items)
  order: Order;
}