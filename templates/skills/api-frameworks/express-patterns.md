# Express.js Framework Patterns

## Overview

Express.js is a minimal and flexible Node.js web application framework. This skill provides patterns for implementing APIs with Express.

---

## App Setup

**Pattern**: Security-first with proper middleware order

```typescript
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './middleware/error-handler';
import { routes } from './routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// Routes
app.use('/api/v1', routes);

// Error handler (must be last)
app.use(errorHandler);

export { app };
```

---

## Route Definition

### Controller-Based Pattern

```typescript
// routes/items.routes.ts
import { Router } from 'express';
import { ItemsController } from '../controllers/items.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createItemSchema, updateItemSchema } from '../schemas/items';

const router = Router();
const controller = new ItemsController();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', authenticate, validate(createItemSchema), controller.create);
router.put('/:id', authenticate, validate(updateItemSchema), controller.update);
router.delete('/:id', authenticate, controller.delete);

export { router as itemsRouter };
```

### Controller Implementation

```typescript
// controllers/items.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { ItemsService } from '../services/items.service';

export class ItemsController {
  private service = new ItemsService();

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await this.service.findAll(req.query);
      res.json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await this.service.findById(req.params.id);
      if (!item) {
        return res.status(404).json({
          success: false,
          error: { message: 'Item not found', code: 'NOT_FOUND' },
        });
      }
      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await this.service.create(req.body);
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await this.service.update(req.params.id, req.body);
      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
```

### Async Handler Wrapper

```typescript
// utils/async-handler.ts
import type { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

export function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Usage
router.get('/', asyncHandler(async (req, res) => {
  const items = await service.findAll();
  res.json({ data: items });
}));
```

---

## Middleware Patterns

### Authentication Middleware

```typescript
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const user = await verifyToken(token);
    if (!user) {
      throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
```

### Validation Middleware

```typescript
import type { Request, Response, NextFunction } from 'express';
import type { z } from 'zod';
import { AppError } from '../errors/AppError';

export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new AppError(
          'Validation failed',
          400,
          'VALIDATION_ERROR',
          error.errors
        ));
      } else {
        next(error);
      }
    }
  };
}
```

### Error Handler Middleware

```typescript
import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/AppError';

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // Already sent response
  if (res.headersSent) {
    return next(err);
  }

  // Known application error
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
        details: err.details,
      },
    });
  }

  // Unknown error
  console.error('Unhandled error:', err);

  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  });
};
```

### Custom Error Class

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}
```

---

## Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
});

// Apply to all API routes
app.use('/api/', apiLimiter);
```

---

## Testing with Supertest

```typescript
import request from 'supertest';
import { app } from '../app';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Item Routes', () => {
  describe('GET /api/v1/items', () => {
    it('should return all items', async () => {
      const response = await request(app)
        .get('/api/v1/items')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/items', () => {
    it('should create item with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/items')
        .set('Authorization', 'Bearer valid-token')
        .send({ title: 'Test Item', description: 'Test' })
        .expect(201);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe('Test Item');
    });

    it('should return 400 with invalid data', async () => {
      await request(app)
        .post('/api/v1/items')
        .set('Authorization', 'Bearer valid-token')
        .send({ title: '' })
        .expect(400);
    });

    it('should return 401 without auth', async () => {
      await request(app)
        .post('/api/v1/items')
        .send({ title: 'Test' })
        .expect(401);
    });
  });

  describe('GET /api/v1/items/:id', () => {
    it('should return 404 for non-existent item', async () => {
      await request(app)
        .get('/api/v1/items/non-existent-id')
        .expect(404);
    });
  });
});
```

---

## Project Structure

```
{API_PATH}/
├── routes/
│   ├── index.ts           # Route aggregator
│   ├── items.routes.ts    # Item routes
│   └── users.routes.ts    # User routes
├── controllers/
│   ├── items.controller.ts
│   └── users.controller.ts
├── services/
│   ├── items.service.ts
│   └── users.service.ts
├── middleware/
│   ├── auth.ts
│   ├── validate.ts
│   └── error-handler.ts
├── schemas/
│   └── items.ts           # Zod schemas
├── errors/
│   └── AppError.ts
├── types/
│   └── express.d.ts       # Type augmentations
└── app.ts
```

---

## Best Practices

### Good

- Use helmet for security headers
- Use async handler wrapper for cleaner code
- Use controller-service pattern
- Centralized error handling
- Type augmentation for custom properties

### Bad

- Sync error handlers (Express doesn't catch async errors)
- Missing validation
- console.log instead of proper logging
- Business logic in routes
- No rate limiting
