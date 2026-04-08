# 🚀 Project Idea: Order Processing & Inventory System (Event-Driven)

This is MUCH stronger than a basic notification system.

You’ll build a **mini e-commerce backend** where:

* Orders are created
* Payments are processed
* Inventory is reserved
* Notifications are sent
* Failures trigger compensations

👉 This uses **RabbitMQ heavily** and forces you to think like a backend engineer.

---

# 🏗 High-Level Architecture

```
Client → API Gateway (NestJS)
              ↓
        Order Service (Producer)
              ↓
           RabbitMQ
    ┌─────────┼─────────┐
    ▼         ▼         ▼
 Payment   Inventory   Notification
 Service    Service       Service
```

---

# 🧩 Core Services (All in NestJS)

## 1️⃣ Order Service (ENTRY POINT)

**Responsibilities:**

* Create order
* Store in DB (TypeORM)
* Publish event: `order.created`

**DB Tables:**

* orders
* order_items

---

## 2️⃣ Payment Service (Consumer)

Consumes: `order.created`

**Does:**

* Simulate payment
* Update DB (payment table)
* Emit:

  * `payment.success`
  * `payment.failed`

---

## 3️⃣ Inventory Service (Consumer)

Consumes: `payment.success`

**Does:**

* Reduce stock
* Prevent overselling
* Emit:

  * `inventory.reserved`
  * `inventory.failed`

---

## 4️⃣ Notification Service (Consumer)

Consumes:

* `payment.success`
* `inventory.failed`
* `order.completed`

Sends:

* Email / SMS (mock)

---

# 🔁 Event Flow (IMPORTANT)

```
order.created
   ↓
payment.success / payment.failed
   ↓
inventory.reserved / inventory.failed
   ↓
order.completed
```

---

# 🧠 Where RabbitMQ REALLY shines here

You’ll implement:

### ✅ Multiple producers & consumers

* Order → produces
* Payment/Inventory → consume + produce

### ✅ Event chaining

Each service triggers the next

### ✅ Failure handling

* Payment fails → stop flow
* Inventory fails → compensation (refund)

### ✅ Retry + DLQ

* Payment retry if fails
* Inventory retry
* Dead letter queue for poison messages

### ✅ Competing consumers

* Scale Payment Service horizontally

---

# 🗃 Database Design (TypeORM-heavy)

## Orders Table

* id
* user_id
* status (CREATED, PAID, COMPLETED, FAILED)

## Payments Table

* id
* order_id
* status
* transaction_id

## Inventory Table

* product_id
* stock

## Inventory Logs

* id
* product_id
* change
* reason

---

# 🔥 Advanced Concept: Saga Pattern (BIG WIN)

This project lets you implement:

👉 **Choreography-based Saga**

Example:

* Payment success → inventory fails
  → you trigger **refund event**

This is REAL backend architecture.

---

# 📦 RabbitMQ Design

## Exchange:

* `order.exchange` (topic)

## Routing Keys:

* `order.created`
* `payment.success`
* `payment.failed`
* `inventory.reserved`
* `inventory.failed`

## Queues:

* payment.queue
* inventory.queue
* notification.queue

---

# 🧪 Real Scenarios You’ll Handle

* Duplicate messages → idempotency
* Partial failure → compensation
* Message retry → exponential backoff
* High load → multiple consumers
* DB consistency → transactions

---

# 🗓 10-Day Plan

## Day 1–2

* Setup NestJS monorepo
* Setup TypeORM + PostgreSQL
* Create Order Service

## Day 3

* Setup RabbitMQ
* Publish `order.created`

## Day 4–5

* Build Payment Service
* Handle success/failure events

## Day 6

* Build Inventory Service
* Stock deduction logic

## Day 7

* Add retry + DLQ

## Day 8

* Add Notification Service

## Day 9

* Implement Saga compensation (refund flow)

## Day 10

* Dockerize + test with multiple consumers

---

# 💥 Why This Project Is WAY Better

Instead of:

> “I built a notification system”

You can say:

> “I built an event-driven order processing system using RabbitMQ with Saga pattern, retry mechanisms, DLQ, and distributed services in NestJS”

That hits HARD in interviews.

---

# 🎯 What You’ll Master

* Event-driven microservices
* Distributed transactions
* RabbitMQ production patterns
* TypeORM relations & transactions
* NestJS modular architecture

---

If you want, I can next:

* Design **exact RabbitMQ topology (with retry queues & DLQ config)**
* Give you **NestJS module structure per service**
* Or even help you **start coding Day 1 properly**

This project is honestly interview-level strong if you execute it cleanly.


# Run instruction 

```shell
npm run start:dev order-service
npm run start:dev payment-service
npm run start:dev inventory-service
npm run start:dev notification-service
```