import {
  IsArray,
  IsInt,
  ValidateNested,
  IsString,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateOrderItemDto {
  @IsString()
  productId: string;

  @IsString()
  productName: string;

  @IsNumber()
  price: number;

  @IsInt()
  quantity: number;
}

export class CreateOrderDto {
  @IsInt()
  userId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}