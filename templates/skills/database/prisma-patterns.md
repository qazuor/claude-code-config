# Prisma ORM Patterns

## Overview

Prisma is a next-generation ORM with auto-generated types and intuitive API. This skill provides patterns for database operations with Prisma.

---

## Schema Definition

### Model with Relations

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String
  role      Role     @default(USER)
  items     Item[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  @@index([email])
  @@map("users")
}

model Item {
  id          String    @id @default(cuid())
  title       String
  description String?
  status      Status    @default(ACTIVE)
  price       Int
  author      User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId    String
  tags        ItemTag[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  @@index([authorId])
  @@index([status])
  @@map("items")
}

model Tag {
  id    String    @id @default(cuid())
  name  String    @unique
  items ItemTag[]

  @@map("tags")
}

model ItemTag {
  item   Item   @relation(fields: [itemId], references: [id], onDelete: Cascade)
  itemId String
  tag    Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)
  tagId  String

  @@id([itemId, tagId])
  @@map("item_tags")
}

enum Role {
  USER
  ADMIN
}

enum Status {
  ACTIVE
  ARCHIVED
}
```

---

## Query Patterns

### Basic CRUD

```typescript
import { prisma } from './client';

// Create
const item = await prisma.item.create({
  data: {
    title: 'New Item',
    price: 100,
    authorId: userId,
  },
});

// Read one with relations
const item = await prisma.item.findUnique({
  where: { id: itemId },
  include: {
    author: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
    tags: {
      include: {
        tag: true,
      },
    },
  },
});

// Read many with filters
const items = await prisma.item.findMany({
  where: {
    status: 'ACTIVE',
    deletedAt: null,
  },
  include: {
    author: {
      select: { name: true },
    },
  },
  orderBy: { createdAt: 'desc' },
  take: 10,
});

// Update
const updated = await prisma.item.update({
  where: { id: itemId },
  data: {
    title: 'Updated Title',
  },
});

// Delete
await prisma.item.delete({
  where: { id: itemId },
});
```

### Pagination

```typescript
async function findPaginated(input: {
  page: number;
  pageSize: number;
  status?: Status;
}) {
  const { page, pageSize, status } = input;
  const skip = (page - 1) * pageSize;

  const where = {
    deletedAt: null,
    ...(status && { status }),
  };

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      include: {
        author: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip,
    }),
    prisma.item.count({ where }),
  ]);

  return {
    data: items,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
```

### Cursor Pagination

```typescript
async function findWithCursor(cursor?: string, take = 10) {
  const items = await prisma.item.findMany({
    take: take + 1,
    ...(cursor && {
      skip: 1,
      cursor: { id: cursor },
    }),
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  const hasMore = items.length > take;
  const results = hasMore ? items.slice(0, -1) : items;
  const nextCursor = hasMore ? results[results.length - 1].id : null;

  return {
    items: results,
    nextCursor,
    hasMore,
  };
}
```

### Soft Delete

```typescript
// Soft delete
await prisma.item.update({
  where: { id: itemId },
  data: { deletedAt: new Date() },
});

// Restore
await prisma.item.update({
  where: { id: itemId },
  data: { deletedAt: null },
});

// Middleware for automatic filtering
prisma.$use(async (params, next) => {
  if (params.model === 'Item') {
    if (params.action === 'findUnique' || params.action === 'findMany') {
      params.args.where = {
        ...params.args.where,
        deletedAt: null,
      };
    }
  }
  return next(params);
});
```

### Transactions

```typescript
// Sequential transaction
const [item, user] = await prisma.$transaction([
  prisma.item.create({
    data: { title: 'New', price: 100, authorId: userId },
  }),
  prisma.user.update({
    where: { id: userId },
    data: { itemsCount: { increment: 1 } },
  }),
]);

// Interactive transaction
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.itemsCount >= 100) {
    throw new Error('Item limit reached');
  }

  const item = await tx.item.create({
    data: { title, price, authorId: userId },
  });

  await tx.user.update({
    where: { id: userId },
    data: { itemsCount: { increment: 1 } },
  });

  return item;
});
```

---

## Service Pattern

```typescript
import { prisma } from './client';
import type { Prisma } from '@prisma/client';

export class ItemService {
  async findById(id: string) {
    return prisma.item.findUnique({
      where: { id, deletedAt: null },
      include: { author: true },
    });
  }

  async findByAuthor(authorId: string) {
    return prisma.item.findMany({
      where: { authorId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Prisma.ItemCreateInput) {
    return prisma.item.create({ data });
  }

  async update(id: string, data: Prisma.ItemUpdateInput) {
    return prisma.item.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string) {
    return prisma.item.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
```

---

## Migrations

### Commands

```bash
# Create migration
pnpm prisma migrate dev --name add_items_table

# Apply migrations in production
pnpm prisma migrate deploy

# Reset database (dev only)
pnpm prisma migrate reset

# Generate client after schema changes
pnpm prisma generate

# Open Prisma Studio
pnpm prisma studio
```

### Seeding

```typescript
// prisma/seed.ts
import { prisma } from '../src/lib/prisma';

async function main() {
  // Create users
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      password: 'hashed_password',
      role: 'ADMIN',
    },
  });

  // Create items
  await prisma.item.createMany({
    data: [
      { title: 'Item 1', price: 100, authorId: user.id },
      { title: 'Item 2', price: 200, authorId: user.id },
    ],
  });

  console.log('Seed completed');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## Client Setup

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

---

## Testing

```typescript
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { ItemService } from '../services/item.service';

const prisma = new PrismaClient({
  datasourceUrl: process.env.TEST_DATABASE_URL,
});

describe('ItemService', () => {
  const service = new ItemService();

  beforeEach(async () => {
    await prisma.item.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('create', () => {
    it('should create item', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test',
          password: 'hash',
        },
      });

      const item = await service.create({
        title: 'Test Item',
        price: 100,
        author: { connect: { id: user.id } },
      });

      expect(item.id).toBeDefined();
      expect(item.title).toBe('Test Item');
    });
  });

  describe('findById', () => {
    it('should return null for non-existent', async () => {
      const item = await service.findById('non-existent-id');
      expect(item).toBeNull();
    });
  });
});
```

---

## Best Practices

### Good

- Use `@@map` for custom table names
- Use `@@index` for frequently queried fields
- Use `select` over `include` when you don't need all fields
- Use transactions for multi-step operations
- Use soft deletes for recoverability
- Review generated migrations before applying

### Bad

- No indexes (poor query performance)
- Include everything (fetches unnecessary data)
- Ignoring migrations (production deployment issues)
- Duplicate types (let Prisma generate types)
- No soft deletes (data loss risk)
