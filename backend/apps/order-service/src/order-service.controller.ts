import { Body, Controller, Get, Post } from '@nestjs/common';
import { OrderServiceService } from './order-service.service';
import { CreateOrderDto } from './dtos/get-order.dto';

@Controller()
export class OrderServiceController {
  constructor(private readonly orderServiceService: OrderServiceService) {}

  @Get()
  getHello(): string {
    return this.orderServiceService.getHello();
  }

  @Post()
async createOrder(@Body() dto: CreateOrderDto) {
    return this.orderServiceService.createOrder(dto);
  }
}
