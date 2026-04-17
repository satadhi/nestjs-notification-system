# Order Processing and Inventory System

## Overview

This project is an event-driven backend for a small e-commerce workflow built with NestJS, PostgreSQL, TypeORM, and RabbitMQ.

The system models a realistic order lifecycle:

- A customer places an order
- The payment service processes the payment
- The inventory service reserves stock
- The notification service sends user-facing updates
- Failures trigger compensating actions

The goal is not just to build CRUD services, but to practice message-driven architecture, service boundaries, resilience patterns, and data consistency in a distributed system.

## Objectives

By building this system, you should be able to practice:

- NestJS monorepo service design
- PostgreSQL and TypeORM entity modeling
- RabbitMQ exchanges, queues, routing keys, retries, and DLQs
- Event chaining across services
- Idempotent consumers and duplicate-message handling
- Compensation flows using a choreography-based Saga pattern

## High-Level Architecture

```text
Client
  |
  v
Order Service
  |
  | publishes domain events
  v
RabbitMQ Exchange
  |
  +-------------------+-------------------+
  |                   |                   |
  v                   v                   v
Payment Service   Inventory Service   Notification Service
```

## Services and Responsibilities

### 1. Order Service

The order service is the entry point into the workflow.

Responsibilities:

- Accept order creation requests
- Validate request payloads
- Persist orders and order items
- Set the initial order state
- Publish the `order.created` event

Owned data:

- `orders`
- `order_items`

### 2. Payment Service

The payment service reacts to newly created orders.

Consumes:

- `order.created`

Responsibilities:

- Simulate or process a payment
- Store payment attempt details
- Mark payment as successful or failed
- Publish the next event in the workflow

Owned data:

- `payments`

Produces:

- `payment.success`
- `payment.failed`

### 3. Inventory Service

The inventory service reacts only after payment succeeds.

Consumes:

- `payment.success`

Responsibilities:

- Validate stock availability
- Reserve or deduct stock
- Prevent overselling
- Record stock movement history
- Publish a success or failure event

Owned data:

- `inventory`
- `inventory_logs`

Produces:

- `inventory.reserved`
- `inventory.failed`

### 4. Notification Service

The notification service handles customer-facing communication.

Consumes:

- `payment.success`
- `payment.failed`
- `inventory.failed`
- `order.completed`

Responsibilities:

- Send mock email or SMS notifications
- Track notification delivery attempts if needed
- Centralize user-facing status messages

Owned data:

- `notifications` (optional but recommended for auditability)

## Core Event Flow

```text
order.created
  -> payment.success | payment.failed
  -> inventory.reserved | inventory.failed
  -> order.completed
```

Expected workflow:

1. Order Service creates an order and emits `order.created`.
2. Payment Service consumes the event.
3. If payment succeeds, Payment Service emits `payment.success`.
4. Inventory Service consumes `payment.success` and attempts stock reservation.
5. If inventory reservation succeeds, Inventory Service emits `inventory.reserved`.
6. Order Service or another orchestrating consumer can then mark the order as completed and emit `order.completed`.
7. Notification Service consumes the relevant events and sends messages to the user.

## Failure Handling

This project becomes much more realistic when failures are treated as part of the design instead of edge cases.

### Payment Failure

If payment fails:

- Mark the payment attempt as failed
- Emit `payment.failed`
- Do not continue to inventory reservation
- Notify the user if needed

### Inventory Failure After Payment Success

If inventory reservation fails after a successful payment:

- Emit `inventory.failed`
- Trigger a compensation step such as a refund event
- Update order state to a failed or compensating state
- Notify the user that the order could not be fulfilled

## Saga Pattern

This system is a good fit for a choreography-based Saga.

Each service reacts to domain events and publishes new events without a central workflow engine.

Example:

1. `order.created`
2. `payment.success`
3. `inventory.failed`
4. `payment.refund_requested` or a similar compensation event

This keeps services loosely coupled while still allowing the full business process to complete or roll back safely.

## RabbitMQ Topology

### Exchange

- `order.exchange`
- Exchange type: `topic`

### Routing Keys

- `order.created`
- `payment.success`
- `payment.failed`
- `inventory.reserved`
- `inventory.failed`
- `order.completed`
- `payment.refund_requested` (recommended extension)

### Queues

- `payment.queue`
- `inventory.queue`
- `notification.queue`

Recommended future additions:

- `payment.retry.queue`
- `inventory.retry.queue`
- `payment.dlq`
- `inventory.dlq`

## Data Model

### Orders

Suggested columns:

- `id`
- `user_id`
- `status`
- `created_at`

Possible status values:

- `CREATED`
- `PAID`
- `COMPLETED`
- `FAILED`
- `CANCELLED`

### Order Items

Suggested columns:

- `id`
- `order_id`
- `product_id`
- `product_name`
- `price`
- `quantity`
- `total_price`

### Payments

Suggested columns:

- `id`
- `order_id`
- `status`
- `transaction_id`
- `created_at`

Possible status values:

- `PENDING`
- `SUCCESS`
- `FAILED`
- `REFUNDED`

### Inventory

Suggested columns:

- `product_id`
- `stock`
- `updated_at`

### Inventory Logs

Suggested columns:

- `id`
- `product_id`
- `change`
- `reason`
- `created_at`

### Notifications

Suggested columns:

- `id`
- `order_id`
- `type`
- `recipient`
- `message`
- `status`
- `created_at`

## Engineering Concerns to Practice

This project is valuable because it forces you to handle problems that appear in real systems:

- Duplicate message delivery
- Consumer idempotency
- Partial failure across services
- Eventual consistency
- Transaction boundaries
- Retry strategy with backoff
- Dead-letter handling for poison messages
- Horizontal scaling of consumers

## Suggested Delivery Plan

### Phase 1: Foundation

- Set up the NestJS monorepo
- Configure PostgreSQL and shared database utilities
- Create the initial entities and service modules
- Define shared event and queue constants

### Phase 2: Order Flow

- Build order creation API
- Persist orders and order items
- Publish `order.created`

### Phase 3: Payment Processing

- Consume `order.created`
- Store payment records
- Publish `payment.success` or `payment.failed`

### Phase 4: Inventory Reservation

- Consume `payment.success`
- Reserve stock
- Record inventory logs
- Publish `inventory.reserved` or `inventory.failed`

### Phase 5: Notifications and Compensation

- Consume workflow events in the notification service
- Send mock notifications
- Add compensation flow for inventory failure after payment success

### Phase 6: Reliability and Ops

- Add retry queues and dead-letter queues
- Add structured logging and error handling
- Dockerize the services and supporting infrastructure
- Test with multiple consumers and repeated messages

## What This Project Demonstrates

If implemented well, this project shows that you understand more than basic NestJS APIs. It demonstrates:

- Service decomposition
- Event-driven communication
- Database ownership per service
- Messaging reliability patterns
- Distributed workflow design
- Practical backend architecture tradeoffs

## Optional Extensions

Once the core flow is stable, you can extend the system with:

- Refund processing service
- API gateway for unified client access
- Outbox pattern for safer event publication
- Observability with metrics and tracing
- Authentication and user ownership checks
- Inventory preloading and product catalog integration

## Success Criteria

A good version of this project should be able to:

- Create an order through the API
- Persist order data in PostgreSQL
- Publish and consume RabbitMQ events correctly
- Handle payment and inventory failures gracefully
- Avoid overselling inventory
- Retry transient failures safely
- Surface unrecoverable messages through a DLQ
- Keep each service responsible for its own data
