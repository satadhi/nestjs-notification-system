# Run instruction

```shell
npm run start:dev order-service
npm run start:dev payment-service
npm run start:dev inventory-service
npm run start:dev notification-service
```

RabbitMQ defaults to `amqp://admin:admin@localhost:5672` and each service listens on its own queue using NestJS `@EventPattern()` handlers.

Ports:

- `order-service`: `3001`
- `payment-service`: `3002`
- `inventory-service`: `3003`
- `notification-service`: `3004`

Saga flow:

- `order-service` saves the order and publishes `order.created`
- `payment-service` consumes `order.created` and publishes `payment.completed` or `payment.failed`
- `inventory-service` consumes `payment.completed` and publishes `inventory.reserved` or `inventory.failed`
- `order-service` consumes the result events and updates the final order state
- `notification-service` consumes `order.completed` and `order.cancelled`

Optional env vars:

- `RABBITMQ_URL=amqp://admin:admin@localhost:5672`
- `PAYMENT_FORCE_FAIL=true`

# More Understanding of how to design

1. Ideally per service should have 1 db but we are doing something funny i.e per service we will have 1 table and that service will be responsible for that table and anything else we will use communication between service if I have to update some other table


2. API call order-service

`POST http://localhost:3000/orders`

```json
{
  "userId": 101,
  "items": [
    {
      "productId": "p1",
      "productName": "iPhone 15",
      "price": 79999,
      "quantity": 1
    },
    {
      "productId": "p2",
      "productName": "AirPods Pro",
      "price": 24999,
      "quantity": 2
    }
  ]
}
```
