import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dtos/get-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Repository } from 'typeorm';

@Injectable()
export class OrderServiceService {

  constructor(
  @InjectRepository(Order)
  private orderRepository: Repository<Order>,
) {}

  getHello(): string {
    return 'Hello World!';
  }
 async createOrder(dto: CreateOrderDto) {
  const order = this.orderRepository.create({
    userId: dto.userId,
    items: dto.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      price: item.price,
      totalPrice: item.price * item.quantity,
      quantity: item.quantity,
    })),
  });

  return await this.orderRepository.save(order);
}
}
