import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: number;

  @Column({ default: 'pending' })
  status: string;

  @Column({ unique: true })
  transactionId: string;

  @CreateDateColumn()
  createdAt: Date;
}
