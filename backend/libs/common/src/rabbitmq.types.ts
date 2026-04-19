export type OrderEventItem = {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  totalPrice: number;
};

export type OrderCreatedEvent = {
  orderId: number;
  userId: number;
  status: string;
  items: OrderEventItem[];
};

export type PaymentCompletedEvent = {
  orderId: number;
  paymentId: number;
  transactionId: string;
  amount: number;
  items: OrderEventItem[];
};

export type PaymentFailedEvent = {
  orderId: number;
  paymentId: number;
  transactionId: string;
  reason: string;
  amount: number;
  items: OrderEventItem[];
};

export type InventoryReservedEvent = {
  orderId: number;
  items: OrderEventItem[];
};

export type InventoryFailedEvent = {
  orderId: number;
  reason: string;
  items: OrderEventItem[];
};

export type OrderCompletedEvent = {
  orderId: number;
  userId: number;
  status: string;
};

export type OrderCancelledEvent = {
  orderId: number;
  userId: number;
  status: string;
  reason: string;
};
