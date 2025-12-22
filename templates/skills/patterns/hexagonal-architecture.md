---
name: hexagonal-architecture
category: patterns
description: Hexagonal Architecture (Ports and Adapters) for loosely coupled, testable applications
usage: Use when building applications that need to be independent of external systems and highly testable
input: Application requirements, domain models, external system integrations
output: Core domain with ports (interfaces) and adapters (implementations) for all external interactions
config_required:
  - CORE_DIR: "Directory for core domain (e.g., src/core/)"
  - PORTS_DIR: "Directory for port interfaces (e.g., src/core/ports/)"
  - ADAPTERS_DIR: "Directory for adapters (e.g., src/adapters/)"
---

# Hexagonal Architecture (Ports and Adapters)

## Overview

Hexagonal Architecture, introduced by Alistair Cockburn, creates loosely coupled application components that can be connected to their software environment via ports and adapters. The application core is isolated from external concerns.

## Configuration

| Setting | Description | Example |
|---------|-------------|---------|
| CORE_DIR | Core domain logic | `src/core/`, `domain/` |
| PORTS_DIR | Port interfaces | `src/core/ports/`, `ports/` |
| ADAPTERS_DIR | Adapter implementations | `src/adapters/`, `infrastructure/` |
| DRIVING_DIR | Driving (primary) adapters | `src/adapters/driving/` |
| DRIVEN_DIR | Driven (secondary) adapters | `src/adapters/driven/` |

## The Hexagonal Model

```
                    ┌─────────────────┐
                    │   REST API      │
                    │   (Driving)     │
                    └────────┬────────┘
                             │
        ┌────────────────────▼────────────────────┐
        │              INPUT PORT                  │
        │         (Primary Interface)              │
        ├──────────────────────────────────────────┤
        │                                          │
        │           APPLICATION CORE               │
        │                                          │
        │    ┌────────────────────────────┐        │
        │    │      Domain Services       │        │
        │    │                            │        │
        │    │   ┌──────────────────┐     │        │
        │    │   │  Domain Entities │     │        │
        │    │   └──────────────────┘     │        │
        │    └────────────────────────────┘        │
        │                                          │
        ├──────────────────────────────────────────┤
        │             OUTPUT PORT                  │
        │        (Secondary Interface)             │
        └────────────────┬─────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
   ┌──────▼──────┐             ┌────────▼────────┐
   │  Database   │             │   External API  │
   │  (Driven)   │             │    (Driven)     │
   └─────────────┘             └─────────────────┘
```

## Port Types

### Driving Ports (Primary/Inbound)

**Purpose:** Define how the outside world can use the application.

```typescript
// core/ports/driving/OrderService.ts
import type { Order, CreateOrderData } from '../../domain/Order';

export interface OrderService {
  createOrder(data: CreateOrderData): Promise<Order>;
  getOrder(id: string): Promise<Order | null>;
  listUserOrders(userId: string): Promise<Order[]>;
  cancelOrder(id: string): Promise<void>;
}
```

### Driven Ports (Secondary/Outbound)

**Purpose:** Define how the application interacts with external systems.

```typescript
// core/ports/driven/OrderRepository.ts
import type { Order, CreateOrderData } from '../../domain/Order';

export interface OrderRepository {
  save(order: Order): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByUserId(userId: string): Promise<Order[]>;
  delete(id: string): Promise<void>;
}

// core/ports/driven/PaymentGateway.ts
export interface PaymentGateway {
  processPayment(amount: number, token: string): Promise<PaymentResult>;
  refund(transactionId: string): Promise<RefundResult>;
}

// core/ports/driven/NotificationSender.ts
export interface NotificationSender {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
  sendSMS(phone: string, message: string): Promise<void>;
}
```

## Adapter Types

### Driving Adapters (Primary)

**Purpose:** Adapt external requests to port calls.

```typescript
// adapters/driving/rest/OrderController.ts
import type { Request, Response } from 'express';
import type { OrderService } from '../../../core/ports/driving/OrderService';

export class OrderRestController {
  constructor(private orderService: OrderService) {}

  async create(req: Request, res: Response): Promise<void> {
    const order = await this.orderService.createOrder(req.body);
    res.status(201).json(order);
  }

  async get(req: Request, res: Response): Promise<void> {
    const order = await this.orderService.getOrder(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(order);
  }
}

// adapters/driving/cli/OrderCLI.ts
import type { OrderService } from '../../../core/ports/driving/OrderService';

export class OrderCLI {
  constructor(private orderService: OrderService) {}

  async handleCommand(args: string[]): Promise<void> {
    const [command, ...rest] = args;

    switch (command) {
      case 'create':
        const order = await this.orderService.createOrder({
          userId: rest[0],
          items: JSON.parse(rest[1]),
        });
        console.log(`Created order: ${order.id}`);
        break;
      case 'get':
        const found = await this.orderService.getOrder(rest[0]);
        console.log(found || 'Order not found');
        break;
    }
  }
}

// adapters/driving/graphql/OrderResolver.ts
import type { OrderService } from '../../../core/ports/driving/OrderService';

export class OrderResolver {
  constructor(private orderService: OrderService) {}

  async order(_: unknown, { id }: { id: string }) {
    return this.orderService.getOrder(id);
  }

  async createOrder(_: unknown, { input }: { input: CreateOrderData }) {
    return this.orderService.createOrder(input);
  }
}
```

### Driven Adapters (Secondary)

**Purpose:** Implement ports for external systems.

```typescript
// adapters/driven/persistence/PostgresOrderRepository.ts
import type { Order } from '../../../core/domain/Order';
import type { OrderRepository } from '../../../core/ports/driven/OrderRepository';
import { pool } from './database';

export class PostgresOrderRepository implements OrderRepository {
  async save(order: Order): Promise<Order> {
    const result = await pool.query(
      `INSERT INTO orders (id, user_id, items, total, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         items = EXCLUDED.items,
         total = EXCLUDED.total,
         status = EXCLUDED.status
       RETURNING *`,
      [order.id, order.userId, order.items, order.total, order.status, order.createdAt]
    );
    return this.toDomain(result.rows[0]);
  }

  async findById(id: string): Promise<Order | null> {
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async findByUserId(userId: string): Promise<Order[]> {
    const result = await pool.query('SELECT * FROM orders WHERE user_id = $1', [userId]);
    return result.rows.map(this.toDomain);
  }

  async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM orders WHERE id = $1', [id]);
  }

  private toDomain(row: any): Order {
    return {
      id: row.id,
      userId: row.user_id,
      items: row.items,
      total: parseFloat(row.total),
      status: row.status,
      createdAt: new Date(row.created_at),
    };
  }
}

// adapters/driven/payment/StripePaymentGateway.ts
import type { PaymentGateway, PaymentResult } from '../../../core/ports/driven/PaymentGateway';
import Stripe from 'stripe';

export class StripePaymentGateway implements PaymentGateway {
  private stripe: Stripe;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey);
  }

  async processPayment(amount: number, token: string): Promise<PaymentResult> {
    const charge = await this.stripe.charges.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      source: token,
    });

    return {
      success: charge.status === 'succeeded',
      transactionId: charge.id,
    };
  }

  async refund(transactionId: string): Promise<RefundResult> {
    const refund = await this.stripe.refunds.create({
      charge: transactionId,
    });

    return {
      success: refund.status === 'succeeded',
      refundId: refund.id,
    };
  }
}

// adapters/driven/notification/SendGridNotificationSender.ts
import type { NotificationSender } from '../../../core/ports/driven/NotificationSender';
import sgMail from '@sendgrid/mail';

export class SendGridNotificationSender implements NotificationSender {
  constructor(apiKey: string) {
    sgMail.setApiKey(apiKey);
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    await sgMail.send({
      to,
      from: 'noreply@example.com',
      subject,
      text: body,
    });
  }

  async sendSMS(phone: string, message: string): Promise<void> {
    // Implementation with Twilio or similar
    console.log(`SMS to ${phone}: ${message}`);
  }
}
```

## Application Core

```typescript
// core/domain/Order.ts
export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface CreateOrderData {
  userId: string;
  items: Omit<OrderItem, 'price'>[];
}

// core/services/OrderServiceImpl.ts
import type { Order, CreateOrderData } from '../domain/Order';
import type { OrderService } from '../ports/driving/OrderService';
import type { OrderRepository } from '../ports/driven/OrderRepository';
import type { PaymentGateway } from '../ports/driven/PaymentGateway';
import type { NotificationSender } from '../ports/driven/NotificationSender';
import { v4 as uuid } from 'uuid';

export class OrderServiceImpl implements OrderService {
  constructor(
    private orderRepo: OrderRepository,
    private paymentGateway: PaymentGateway,
    private notificationSender: NotificationSender
  ) {}

  async createOrder(data: CreateOrderData): Promise<Order> {
    // Calculate prices
    const items = await this.enrichWithPrices(data.items);
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order: Order = {
      id: uuid(),
      userId: data.userId,
      items,
      total,
      status: 'pending',
      createdAt: new Date(),
    };

    const savedOrder = await this.orderRepo.save(order);

    await this.notificationSender.sendEmail(
      data.userId,
      'Order Created',
      `Your order ${order.id} has been created.`
    );

    return savedOrder;
  }

  async getOrder(id: string): Promise<Order | null> {
    return this.orderRepo.findById(id);
  }

  async listUserOrders(userId: string): Promise<Order[]> {
    return this.orderRepo.findByUserId(userId);
  }

  async cancelOrder(id: string): Promise<void> {
    const order = await this.orderRepo.findById(id);
    if (!order) throw new Error('Order not found');
    if (order.status !== 'pending') throw new Error('Cannot cancel non-pending order');

    order.status = 'cancelled';
    await this.orderRepo.save(order);
  }

  private async enrichWithPrices(items: Omit<OrderItem, 'price'>[]): Promise<OrderItem[]> {
    // Fetch prices from catalog service
    return items.map((item) => ({ ...item, price: 10 }));
  }
}
```

## Project Structure

```
src/
├── core/                           # Application Core (Hexagon)
│   ├── domain/                     # Domain entities and value objects
│   │   ├── Order.ts
│   │   ├── User.ts
│   │   └── Product.ts
│   ├── ports/
│   │   ├── driving/               # Inbound ports (use cases)
│   │   │   ├── OrderService.ts
│   │   │   └── UserService.ts
│   │   └── driven/                # Outbound ports (repositories, gateways)
│   │       ├── OrderRepository.ts
│   │       ├── PaymentGateway.ts
│   │       └── NotificationSender.ts
│   └── services/                   # Domain services implementing driving ports
│       ├── OrderServiceImpl.ts
│       └── UserServiceImpl.ts
└── adapters/
    ├── driving/                    # Primary/Inbound adapters
    │   ├── rest/
    │   │   ├── OrderController.ts
    │   │   └── routes.ts
    │   ├── graphql/
    │   │   └── OrderResolver.ts
    │   └── cli/
    │       └── OrderCLI.ts
    └── driven/                     # Secondary/Outbound adapters
        ├── persistence/
        │   ├── PostgresOrderRepository.ts
        │   └── database.ts
        ├── payment/
        │   └── StripePaymentGateway.ts
        └── notification/
            └── SendGridNotificationSender.ts
```

## Composition Root

```typescript
// main.ts - Application composition
import { OrderServiceImpl } from './core/services/OrderServiceImpl';
import { PostgresOrderRepository } from './adapters/driven/persistence/PostgresOrderRepository';
import { StripePaymentGateway } from './adapters/driven/payment/StripePaymentGateway';
import { SendGridNotificationSender } from './adapters/driven/notification/SendGridNotificationSender';
import { OrderRestController } from './adapters/driving/rest/OrderController';
import express from 'express';

// Create driven adapters (outbound)
const orderRepo = new PostgresOrderRepository();
const paymentGateway = new StripePaymentGateway(process.env.STRIPE_KEY!);
const notificationSender = new SendGridNotificationSender(process.env.SENDGRID_KEY!);

// Create core service
const orderService = new OrderServiceImpl(orderRepo, paymentGateway, notificationSender);

// Create driving adapters (inbound)
const orderController = new OrderRestController(orderService);

// Wire up Express
const app = express();
app.post('/orders', (req, res) => orderController.create(req, res));
app.get('/orders/:id', (req, res) => orderController.get(req, res));

app.listen(3000);
```

## Testing with Test Adapters

```typescript
// tests/core/services/OrderServiceImpl.test.ts
import { describe, it, expect, vi } from 'vitest';
import { OrderServiceImpl } from '../../../src/core/services/OrderServiceImpl';

// In-memory test adapters
class InMemoryOrderRepository {
  private orders: Map<string, Order> = new Map();

  async save(order: Order): Promise<Order> {
    this.orders.set(order.id, order);
    return order;
  }

  async findById(id: string): Promise<Order | null> {
    return this.orders.get(id) || null;
  }

  async findByUserId(userId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter((o) => o.userId === userId);
  }
}

class MockPaymentGateway {
  processPayment = vi.fn().mockResolvedValue({ success: true, transactionId: 'tx-1' });
  refund = vi.fn().mockResolvedValue({ success: true, refundId: 'ref-1' });
}

class MockNotificationSender {
  sendEmail = vi.fn().mockResolvedValue(undefined);
  sendSMS = vi.fn().mockResolvedValue(undefined);
}

describe('OrderServiceImpl', () => {
  it('should create an order', async () => {
    const orderRepo = new InMemoryOrderRepository();
    const paymentGateway = new MockPaymentGateway();
    const notificationSender = new MockNotificationSender();

    const service = new OrderServiceImpl(orderRepo, paymentGateway, notificationSender);

    const order = await service.createOrder({
      userId: 'user-1',
      items: [{ productId: 'prod-1', quantity: 2 }],
    });

    expect(order.id).toBeDefined();
    expect(order.userId).toBe('user-1');
    expect(notificationSender.sendEmail).toHaveBeenCalled();
  });
});
```

## Best Practices

### Do's

- Define ports before implementing adapters
- Keep the core domain free of framework code
- Use dependency injection for all adapters
- Create test adapters for unit testing
- Name ports after domain concepts, not technology

### Don'ts

- Don't let the core import from adapters
- Don't put business logic in adapters
- Don't create circular dependencies
- Don't skip ports for "simple" integrations
- Don't expose adapter types in ports

## Hexagonal vs Clean Architecture

| Aspect | Hexagonal | Clean Architecture |
|--------|-----------|-------------------|
| Focus | Ports & Adapters | Concentric layers |
| Terminology | Driving/Driven | Use Cases/Entities |
| Structure | Inside/Outside | Layers (4+) |
| Interfaces | Ports only | Multiple per layer |
| Complexity | Simpler | More structured |

## When to Use Hexagonal

**Good for:**

- Applications with multiple entry points (REST, CLI, GraphQL)
- Integration-heavy applications
- Systems needing easy adapter swapping
- Microservices architecture
- Applications requiring high testability

**Less suitable for:**

- Simple CRUD applications
- Prototypes with unclear requirements
- Very small applications
- Teams unfamiliar with the pattern

## Output

**Produces:**

- Core domain with clean boundaries
- Port interfaces for all external interactions
- Adapters for each technology/framework
- Highly testable application code

**Success Criteria:**

- Core has zero external dependencies
- All external interactions go through ports
- Adapters are easily swappable
- Tests use in-memory/mock adapters
