What this code is doing is easier if we split it into 2 jobs:

1. “How do I send a message to another service?”
2. “How do I listen for messages sent to me?”

That is exactly why you have 2 helpers.

**Big Picture**

In this project, every service has its own RabbitMQ queue:

- `order-service` listens on `order.queue`
- `payment-service` listens on `payment.queue`
- `inventory-service` listens on `inventory.queue`
- `notification-service` listens on `notification.queue`

Those queue names live in [queues.ts](/Users/satadhi/Documents/nestjs-notification-system/backend/libs/common/src/queues.ts:1).

Now the confusing part:

- `QUEUES.PAYMENT = 'payment.queue'` means “the actual RabbitMQ queue name”
- `RMQ_CLIENTS.PAYMENT = 'PAYMENT_RMQ_CLIENT'` means “the NestJS dependency-injection token for a client object that knows how to talk to `payment.queue`”

So `RMQ_CLIENTS` is not RabbitMQ itself. It is just names Nest uses internally to inject the right `ClientProxy`.

**Helper 1**

`createRmqClientProvider(...)` in [rabbitmq.ts](/Users/satadhi/Documents/nestjs-notification-system/backend/libs/common/src/rabbitmq.ts:15) is for creating an outgoing client.

It returns an object like this conceptually:

```ts
{
  name: 'PAYMENT_RMQ_CLIENT',
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService) => ({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://...'],
      queue: 'payment.queue',
      queueOptions: { durable: true },
      persistent: true,
    },
  }),
}
```

That object is not sending anything yet. It is just configuration telling Nest:

- create a RabbitMQ client
- connect it to this queue
- register it in DI under this token name

Then it gets used here in [payment-service.module.ts](/Users/satadhi/Documents/nestjs-notification-system/backend/apps/payment-service/src/payment-service.module.ts:24):

```ts
ClientsModule.registerAsync([
  createRmqClientProvider(RMQ_CLIENTS.INVENTORY, QUEUES.INVENTORY),
  createRmqClientProvider(RMQ_CLIENTS.ORDER, QUEUES.ORDER),
]),
```

That means:

- build one client called `INVENTORY_RMQ_CLIENT` that sends to `inventory.queue`
- build one client called `ORDER_RMQ_CLIENT` that sends to `order.queue`

Then Nest injects them here in [payment-service.service.ts](/Users/satadhi/Documents/nestjs-notification-system/backend/apps/payment-service/src/payment-service.service.ts:20):

```ts
@Inject(RMQ_CLIENTS.INVENTORY)
private readonly inventoryClient: ClientProxy,

@Inject(RMQ_CLIENTS.ORDER)
private readonly orderClient: ClientProxy,
```

So after boot:

- `inventoryClient` can publish to `inventory.queue`
- `orderClient` can publish to `order.queue`

That is why it is called a `CLIENT`.

**Helper 2**

`createRmqMicroserviceOptions(...)` in [rabbitmq.ts](/Users/satadhi/Documents/nestjs-notification-system/backend/libs/common/src/rabbitmq.ts:35) is for creating the incoming listener for this service itself.

It returns plain RMQ options:

```ts
{
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://...'],
    queue: 'payment.queue',
    queueOptions: { durable: true },
    noAck: false,
    prefetchCount: 10,
  },
}
```

This gets used in `main.ts`, for example [order-service main.ts](/Users/satadhi/Documents/nestjs-notification-system/backend/apps/order-service/src/main.ts:20):

```ts
app.connectMicroservice(
  createRmqMicroserviceOptions(configService, QUEUES.ORDER),
);
await app.startAllMicroservices();
```

That means:

- this service should connect to RabbitMQ
- it should consume messages from `order.queue`
- start listening for incoming messages

So this helper is not for creating an injected client. It is for turning the app into a RabbitMQ consumer.

**The Difference In One Sentence**

- `createRmqClientProvider` = “give me a client so I can send messages to some queue”
- `createRmqMicroserviceOptions` = “make this app listen to its own queue”

**How a full message flow works**

Let’s trace one real flow.

In [order-service.service.ts](/Users/satadhi/Documents/nestjs-notification-system/backend/apps/order-service/src/order-service.service.ts:63), order service does:

```ts
await this.emitEvent(
  this.paymentClient,
  EVENTS.ORDER_CREATED,
  orderCreatedEvent,
);
```

`this.paymentClient` was injected using `RMQ_CLIENTS.PAYMENT`, which points to a client configured for `payment.queue`.

So order-service sends a message to `payment.queue`.

Now payment-service is already listening on `payment.queue` because of [payment main.ts](/Users/satadhi/Documents/nestjs-notification-system/backend/apps/payment-service/src/main.ts:12).

When a message arrives, Nest checks the event pattern in the message and matches it to this handler in [payment-service.controller.ts](/Users/satadhi/Documents/nestjs-notification-system/backend/apps/payment-service/src/payment-service.controller.ts:20):

```ts
@EventPattern(EVENTS.ORDER_CREATED)
async handleOrderCreated(...) { ... }
```

So the flow is:

1. Order service publishes to `payment.queue`
2. Payment service consumes from `payment.queue`
3. Nest sees pattern `order.created`
4. Nest calls `handleOrderCreated(...)`

That is the whole magic.

**Why both queue and pattern exist**

This is the part many people miss.

A message has 2 important routing ideas here:

- Queue: which service receives the message
- Pattern: which handler inside that service should run

So:

- `queue = payment.queue` decides message goes to payment-service
- `pattern = order.created` decides payment-service should run `@EventPattern(EVENTS.ORDER_CREATED)`

**Why `noAck: false` matters**

In `createRmqMicroserviceOptions`, you have:

```ts
noAck: false
```

That means RabbitMQ will wait for your code to explicitly confirm success.

That is why controllers do this in [payment-service.controller.ts](/Users/satadhi/Documents/nestjs-notification-system/backend/apps/payment-service/src/payment-service.controller.ts:25):

- `acknowledgeMessage(context)` if successful
- `rejectMessage(context)` if failed

So:

- `ack` = “message processed successfully”
- `nack/reject` = “processing failed”

**Why one helper uses `registerAsync` and the other doesn’t**

Because they are used in different places:

- `createRmqClientProvider` is used inside a module with `ClientsModule.registerAsync(...)`, where Nest expects provider definitions
- `createRmqMicroserviceOptions` is used in `main.ts`, where you already have `configService` and just need RMQ options immediately

So they return different shapes because Nest expects different shapes there.

**Super Short Mental Model**

Think of each service as a shop:

- `createRmqMicroserviceOptions` = opens your shop’s front door and says “I receive packages here”
- `createRmqClientProvider` = gives you courier accounts to send packages to other shops
- `RMQ_CLIENTS.*` = labels for those courier accounts inside Nest
- `QUEUES.*` = actual shop addresses
- `@EventPattern(...)` = which employee handles which package type

If you want, I can do one more pass and draw this exact project as a tiny request flow diagram from `POST /orders` all the way to notification.