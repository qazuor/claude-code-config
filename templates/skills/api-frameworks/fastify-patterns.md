# Fastify Framework Patterns

## Overview

Fastify is a high-performance, low-overhead web framework for Node.js. This skill provides patterns for implementing APIs with Fastify.

---

## App Setup

**Pattern**: Plugin-based with type provider

```typescript
import Fastify from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { databasePlugin } from './plugins/database';
import { authPlugin } from './plugins/auth';
import { itemRoutes } from './routes/items';
import { errorHandler } from './handlers/error';

export async function buildApp() {
  const app = Fastify({
    logger: true,
  }).withTypeProvider<TypeBoxTypeProvider>();

  // Register plugins
  await app.register(helmet);
  await app.register(cors);
  await app.register(databasePlugin);
  await app.register(authPlugin);

  // Register routes
  await app.register(itemRoutes, { prefix: '/api/v1/items' });

  // Error handler
  app.setErrorHandler(errorHandler);

  return app;
}
```

---

## Route Definition with TypeBox

### Schema-First Routes

```typescript
import { Type } from '@sinclair/typebox';
import type { FastifyPluginAsync } from 'fastify';
import { ItemsService } from '../services/items.service';

// Schema definitions
const ItemSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  description: Type.Optional(Type.String()),
  createdAt: Type.String(),
});

const CreateItemSchema = Type.Object({
  title: Type.String({ minLength: 1 }),
  description: Type.Optional(Type.String()),
});

const UpdateItemSchema = Type.Partial(CreateItemSchema);

const IdParamSchema = Type.Object({
  id: Type.String(),
});

// Route plugin
export const itemRoutes: FastifyPluginAsync = async (fastify) => {
  const service = new ItemsService(fastify.db);

  // GET /items
  fastify.get('/', {
    schema: {
      response: {
        200: Type.Object({
          data: Type.Array(ItemSchema),
        }),
      },
    },
    handler: async (request, reply) => {
      const items = await service.findAll();
      return { data: items };
    },
  });

  // GET /items/:id
  fastify.get<{ Params: { id: string } }>('/:id', {
    schema: {
      params: IdParamSchema,
      response: {
        200: Type.Object({ data: ItemSchema }),
        404: Type.Object({ error: Type.String() }),
      },
    },
    handler: async (request, reply) => {
      const item = await service.findById(request.params.id);
      if (!item) {
        reply.status(404);
        return { error: 'Item not found' };
      }
      return { data: item };
    },
  });

  // POST /items
  fastify.post('/', {
    schema: {
      body: CreateItemSchema,
      response: {
        201: Type.Object({ data: ItemSchema }),
      },
    },
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      const item = await service.create(request.body);
      reply.status(201);
      return { data: item };
    },
  });

  // PUT /items/:id
  fastify.put<{ Params: { id: string } }>('/:id', {
    schema: {
      params: IdParamSchema,
      body: UpdateItemSchema,
      response: {
        200: Type.Object({ data: ItemSchema }),
      },
    },
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      const item = await service.update(request.params.id, request.body);
      return { data: item };
    },
  });

  // DELETE /items/:id
  fastify.delete<{ Params: { id: string } }>('/:id', {
    schema: {
      params: IdParamSchema,
    },
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      await service.delete(request.params.id);
      reply.status(204).send();
    },
  });
};
```

---

## Plugin Patterns

### Database Plugin

```typescript
import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';

interface DatabasePluginOptions {
  connectionString?: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    db: Database;
  }
}

const plugin: FastifyPluginAsync<DatabasePluginOptions> = async (
  fastify,
  options
) => {
  const connectionString = options.connectionString || process.env.DATABASE_URL;
  const db = await createDatabaseConnection(connectionString);

  // Decorate fastify instance
  fastify.decorate('db', db);

  // Cleanup on close
  fastify.addHook('onClose', async () => {
    await db.disconnect();
  });
};

export const databasePlugin = fp(plugin, {
  name: 'database',
  dependencies: [],
});
```

### Authentication Plugin

```typescript
import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user?: User;
  }
}

const plugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      reply.status(401).send({ error: 'Unauthorized' });
      return;
    }

    const user = await verifyToken(token);
    if (!user) {
      reply.status(401).send({ error: 'Invalid token' });
      return;
    }

    request.user = user;
  });
};

export const authPlugin = fp(plugin, {
  name: 'auth',
});
```

---

## Error Handler

```typescript
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const statusCode = error.statusCode ?? 500;

  // Log server errors
  if (statusCode >= 500) {
    request.log.error(error);
  }

  // Validation errors
  if (error.validation) {
    return reply.status(400).send({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.validation,
      },
    });
  }

  // Known errors
  reply.status(statusCode).send({
    error: {
      message: error.message,
      code: error.code ?? 'INTERNAL_ERROR',
    },
  });
}
```

---

## Hooks and Lifecycle

| Hook | When it runs | Use case |
|------|--------------|----------|
| onRequest | Start of request | Request ID, timing |
| preParsing | Before body parsing | Stream manipulation |
| preValidation | Before validation | Transform before validate |
| preHandler | After validation | Authorization |
| preSerialization | Before response serialization | Response transformation |
| onSend | Before response sent | Headers, logging |
| onResponse | After response sent | Metrics, cleanup |
| onError | On error | Error handling |

### Example Hook Usage

```typescript
// Add request ID
fastify.addHook('onRequest', async (request, reply) => {
  request.requestId = crypto.randomUUID();
});

// Log response time
fastify.addHook('onResponse', async (request, reply) => {
  request.log.info({
    responseTime: reply.elapsedTime,
    statusCode: reply.statusCode,
  });
});
```

---

## Testing with Fastify Inject

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../app';
import type { FastifyInstance } from 'fastify';

describe('Item Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/items', () => {
    it('should return all items', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/items',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/v1/items', () => {
    it('should create item with valid data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/items',
        headers: {
          authorization: 'Bearer valid-token',
        },
        payload: { title: 'Test Item' },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json().data).toHaveProperty('id');
    });

    it('should return 400 with invalid data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/items',
        headers: {
          authorization: 'Bearer valid-token',
        },
        payload: { title: '' },
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
```

---

## Project Structure

```
{API_PATH}/
├── plugins/
│   ├── database.ts        # Database connection
│   ├── auth.ts            # Authentication
│   └── swagger.ts         # API documentation
├── routes/
│   ├── items/
│   │   ├── index.ts       # Route registration
│   │   ├── handlers.ts    # Route handlers
│   │   └── schemas.ts     # TypeBox schemas
│   └── users/
├── services/
│   └── items.service.ts
├── handlers/
│   └── error.ts           # Error handler
├── types/
│   └── fastify.d.ts       # Type augmentations
└── app.ts
```

---

## Best Practices

### Good

- Use TypeBox or Zod type providers
- Use `fastify-plugin` for shared plugins
- Define schemas for all routes (validation + serialization)
- Use Pino logger (built-in)
- Use encapsulation for route-specific context

### Bad

- No schemas (lose validation and serialization)
- `console.log` (Fastify has Pino built-in)
- Breaking encapsulation unnecessarily
- Ignoring type providers
- Blocking operations in handlers
