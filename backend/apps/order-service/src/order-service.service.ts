import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dtos/get-order.dto';

@Injectable()
export class OrderServiceService {
  getHello(): string {
    return 'Hello World!';
  }
  createOrder(dto:CreateOrderDto) {
    console.log(dto)
  }
}
