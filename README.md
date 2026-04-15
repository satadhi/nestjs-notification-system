# Run instruction 

```shell
npm run start:dev order-service
npm run start:dev payment-service
npm run start:dev inventory-service
npm run start:dev notification-service
```

# More Understanding of how to design

1. Ideally per service should have 1 db but we are doing something funny i.e per service we will have 1 table and that service will be responsible for that table and anything else we will use communication between service if I have to update some other table


2. API call

`POST /orders`

```json
{
  "userId": 1,
  "items": [
    {
      "productId": "p1",
      "productName": "iPhone",
      "price": 50000,
      "quantity": 1
    },
    {
      "productId": "p2",
      "productName": "AirPods",
      "price": 10000,
      "quantity": 2
    }
  ]
}
```