---
name: vertical-slice-architecture
category: patterns
description: Vertical Slice Architecture organizing code by feature instead of technical layers
usage: Use when you want to minimize cross-cutting changes and maximize feature cohesion
input: Feature requirements, use cases, domain operations
output: Self-contained feature slices with all layers co-located by functionality
config_required:
  - FEATURES_DIR: "Directory for feature slices (e.g., src/features/)"
  - SHARED_DIR: "Directory for truly shared code (e.g., src/shared/)"
---

# Vertical Slice Architecture

## Overview

Vertical Slice Architecture, popularized by Jimmy Bogard, organizes code by feature (vertical slices) rather than technical layers (horizontal slices). Each feature contains everything it needs: handlers, validators, DTOs, and data access.

## Configuration

| Setting | Description | Example |
|---------|-------------|---------|
| FEATURES_DIR | Feature slices location | `src/features/`, `modules/` |
| SHARED_DIR | Truly shared utilities | `src/shared/`, `common/` |
| HANDLERS_PATTERN | Handler file naming | `*.handler.ts`, `*.command.ts` |

## Traditional Layers vs Vertical Slices

### Traditional (Horizontal Layers)

```
src/
├── controllers/
│   ├── OrderController.ts      # All order endpoints
│   ├── UserController.ts       # All user endpoints
│   └── ProductController.ts    # All product endpoints
├── services/
│   ├── OrderService.ts         # All order logic
│   ├── UserService.ts          # All user logic
│   └── ProductService.ts       # All product logic
├── repositories/
│   ├── OrderRepository.ts      # All order data access
│   ├── UserRepository.ts       # All user data access
│   └── ProductRepository.ts    # All product data access
└── models/
    ├── Order.ts
    ├── User.ts
    └── Product.ts
```

**Problem:** Adding a feature requires changes across multiple folders.

### Vertical Slices

```
src/features/
├── orders/
│   ├── create-order/
│   │   ├── CreateOrder.handler.ts
│   │   ├── CreateOrder.validator.ts
│   │   └── CreateOrder.test.ts
│   ├── get-order/
│   │   ├── GetOrder.handler.ts
│   │   └── GetOrder.test.ts
│   └── cancel-order/
│       ├── CancelOrder.handler.ts
│       ├── CancelOrder.validator.ts
│       └── CancelOrder.test.ts
├── users/
│   ├── register-user/
│   ├── login-user/
│   └── update-profile/
└── products/
    ├── create-product/
    ├── search-products/
    └── update-inventory/
```

**Benefit:** Adding a feature means adding one folder.

## Slice Structure

### Command/Query Pattern

```typescript
// features/orders/create-order/CreateOrder.command.ts
export interface CreateOrderCommand {
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddress: {
    street: string;
    city: string;
    zipCode: string;
  };
}

export interface CreateOrderResult {
  orderId: string;
  total: number;
  estimatedDelivery: Date;
}

// features/orders/create-order/CreateOrder.handler.ts
import type { CreateOrderCommand, CreateOrderResult } from './CreateOrder.command';
import { db } from '../../../shared/database';
import { sendEmail } from '../../../shared/email';
import { calculateTotal } from './CreateOrder.utils';

export async function handleCreateOrder(
  command: CreateOrderCommand
): Promise<CreateOrderResult> {
  // Validate user exists
  const user = await db.user.findUnique({ where: { id: command.userId } });
  if (!user) {
    throw new Error('User not found');
  }

  // Get product prices
  const products = await db.product.findMany({
    where: { id: { in: command.items.map((i) => i.productId) } },
  });

  // Calculate total
  const total = calculateTotal(command.items, products);

  // Create order
  const order = await db.order.create({
    data: {
      userId: command.userId,
      items: command.items,
      total,
      shippingAddress: command.shippingAddress,
      status: 'pending',
    },
  });

  // Send confirmation
  await sendEmail({
    to: user.email,
    subject: 'Order Confirmation',
    body: `Your order ${order.id} has been placed.`,
  });

  return {
    orderId: order.id,
    total,
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };
}

// features/orders/create-order/CreateOrder.utils.ts
export function calculateTotal(
  items: Array<{ productId: string; quantity: number }>,
  products: Array<{ id: string; price: number }>
): number {
  return items.reduce((total, item) => {
    const product = products.find((p) => p.id === item.productId);
    return total + (product?.price || 0) * item.quantity;
  }, 0);
}
```

### Validation

```typescript
// features/orders/create-order/CreateOrder.validator.ts
import { z } from 'zod';

export const createOrderSchema = z.object({
  userId: z.string().uuid(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive().max(100),
      })
    )
    .min(1)
    .max(50),
  shippingAddress: z.object({
    street: z.string().min(1).max(200),
    city: z.string().min(1).max(100),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export function validateCreateOrder(input: unknown): CreateOrderInput {
  return createOrderSchema.parse(input);
}
```

### API Route

```typescript
// features/orders/create-order/CreateOrder.route.ts
import type { Request, Response } from 'express';
import { handleCreateOrder } from './CreateOrder.handler';
import { validateCreateOrder } from './CreateOrder.validator';

export async function createOrderRoute(req: Request, res: Response): Promise<void> {
  try {
    const command = validateCreateOrder(req.body);
    const result = await handleCreateOrder(command);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### Tests

```typescript
// features/orders/create-order/CreateOrder.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleCreateOrder } from './CreateOrder.handler';
import { validateCreateOrder } from './CreateOrder.validator';

// Mock shared dependencies
vi.mock('../../../shared/database', () => ({
  db: {
    user: { findUnique: vi.fn() },
    product: { findMany: vi.fn() },
    order: { create: vi.fn() },
  },
}));

vi.mock('../../../shared/email', () => ({
  sendEmail: vi.fn(),
}));

import { db } from '../../../shared/database';
import { sendEmail } from '../../../shared/email';

describe('CreateOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validation', () => {
    it('should accept valid input', () => {
      const input = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        items: [{ productId: '123e4567-e89b-12d3-a456-426614174001', quantity: 2 }],
        shippingAddress: { street: '123 Main St', city: 'Boston', zipCode: '02101' },
      };

      expect(() => validateCreateOrder(input)).not.toThrow();
    });

    it('should reject empty items', () => {
      const input = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        items: [],
        shippingAddress: { street: '123 Main St', city: 'Boston', zipCode: '02101' },
      };

      expect(() => validateCreateOrder(input)).toThrow();
    });
  });

  describe('handler', () => {
    it('should create order for valid user', async () => {
      // Arrange
      db.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
      db.product.findMany.mockResolvedValue([{ id: 'prod-1', price: 10 }]);
      db.order.create.mockResolvedValue({ id: 'order-1' });

      // Act
      const result = await handleCreateOrder({
        userId: 'user-1',
        items: [{ productId: 'prod-1', quantity: 2 }],
        shippingAddress: { street: '123 Main', city: 'Boston', zipCode: '02101' },
      });

      // Assert
      expect(result.orderId).toBe('order-1');
      expect(result.total).toBe(20);
      expect(sendEmail).toHaveBeenCalled();
    });

    it('should throw for non-existent user', async () => {
      db.user.findUnique.mockResolvedValue(null);

      await expect(
        handleCreateOrder({
          userId: 'invalid',
          items: [{ productId: 'prod-1', quantity: 1 }],
          shippingAddress: { street: '123 Main', city: 'Boston', zipCode: '02101' },
        })
      ).rejects.toThrow('User not found');
    });
  });
});
```

## Complete Project Structure

```
src/
├── features/                       # All feature slices
│   ├── orders/
│   │   ├── create-order/
│   │   │   ├── CreateOrder.command.ts
│   │   │   ├── CreateOrder.handler.ts
│   │   │   ├── CreateOrder.validator.ts
│   │   │   ├── CreateOrder.route.ts
│   │   │   ├── CreateOrder.utils.ts
│   │   │   └── CreateOrder.test.ts
│   │   ├── get-order/
│   │   │   ├── GetOrder.query.ts
│   │   │   ├── GetOrder.handler.ts
│   │   │   ├── GetOrder.route.ts
│   │   │   └── GetOrder.test.ts
│   │   ├── list-orders/
│   │   ├── cancel-order/
│   │   └── index.ts               # Feature barrel export
│   ├── users/
│   │   ├── register/
│   │   ├── login/
│   │   ├── update-profile/
│   │   └── index.ts
│   └── products/
│       ├── create-product/
│       ├── search-products/
│       └── index.ts
├── shared/                         # Truly shared code
│   ├── database/
│   │   ├── client.ts
│   │   └── index.ts
│   ├── email/
│   │   ├── sender.ts
│   │   └── index.ts
│   ├── auth/
│   │   ├── middleware.ts
│   │   └── index.ts
│   └── errors/
│       ├── AppError.ts
│       └── index.ts
├── app.ts                          # Application setup
└── routes.ts                       # Route registration
```

## Route Registration

```typescript
// routes.ts
import express from 'express';
import { createOrderRoute } from './features/orders/create-order/CreateOrder.route';
import { getOrderRoute } from './features/orders/get-order/GetOrder.route';
import { listOrdersRoute } from './features/orders/list-orders/ListOrders.route';
import { cancelOrderRoute } from './features/orders/cancel-order/CancelOrder.route';
import { registerRoute } from './features/users/register/Register.route';
import { loginRoute } from './features/users/login/Login.route';

const router = express.Router();

// Orders
router.post('/orders', createOrderRoute);
router.get('/orders/:id', getOrderRoute);
router.get('/orders', listOrdersRoute);
router.post('/orders/:id/cancel', cancelOrderRoute);

// Users
router.post('/users/register', registerRoute);
router.post('/users/login', loginRoute);

export default router;
```

## MediatR Pattern (Optional)

For larger applications, use a mediator:

```typescript
// shared/mediator/index.ts
type Handler<TRequest, TResponse> = (request: TRequest) => Promise<TResponse>;

class Mediator {
  private handlers = new Map<string, Handler<any, any>>();

  register<TRequest, TResponse>(
    name: string,
    handler: Handler<TRequest, TResponse>
  ): void {
    this.handlers.set(name, handler);
  }

  async send<TRequest, TResponse>(
    name: string,
    request: TRequest
  ): Promise<TResponse> {
    const handler = this.handlers.get(name);
    if (!handler) throw new Error(`No handler for ${name}`);
    return handler(request);
  }
}

export const mediator = new Mediator();

// Registration
import { handleCreateOrder } from '../features/orders/create-order/CreateOrder.handler';
mediator.register('CreateOrder', handleCreateOrder);

// Usage in route
router.post('/orders', async (req, res) => {
  const result = await mediator.send('CreateOrder', req.body);
  res.json(result);
});
```

## When to Duplicate vs Share

### Duplicate (per slice)

- DTOs/Commands/Queries
- Validation schemas
- Slice-specific utilities
- Response mappers

### Share (in shared/)

- Database client
- Email/notification services
- Authentication middleware
- Error handling
- Logging

### Rule of Thumb

> "When in doubt, duplicate. If you find yourself copying the same code into a third slice, consider extracting to shared."

## Best Practices

### Do's

- Keep slices independent and self-contained
- Test each slice in isolation
- Use clear naming: `CreateOrder`, `GetUser`, `SearchProducts`
- Favor duplication over wrong abstraction
- Keep shared code truly generic

### Don'ts

- Don't create "shared domain models" used by all slices
- Don't abstract too early
- Don't create service layers spanning multiple slices
- Don't share validators between slices
- Don't force slices to communicate through shared state

## Vertical Slice vs Layered

| Aspect | Vertical Slice | Layered Architecture |
|--------|---------------|---------------------|
| Code Organization | By feature | By technical concern |
| Adding Features | One folder | Multiple folders |
| Dependencies | Slice to shared | Layer to layer |
| Coupling | Low between slices | High between layers |
| Reuse | Explicit/intentional | Often forced |
| Testing | Per slice | Per layer |

## When to Use Vertical Slices

**Good for:**

- Feature-rich applications
- Teams working on separate features
- Rapid feature development
- Microservices preparation
- CQRS implementations

**Less suitable for:**

- Very small applications
- Heavy cross-cutting concerns
- Highly interconnected features
- Teams used to layered architecture

## Output

**Produces:**

- Self-contained feature slices
- Minimal cross-feature dependencies
- Easy-to-test handlers
- Clear feature boundaries

**Success Criteria:**

- Adding a feature = adding one folder
- Slices don't import from other slices
- Tests run per-slice without mocking other features
- Shared code is truly generic
