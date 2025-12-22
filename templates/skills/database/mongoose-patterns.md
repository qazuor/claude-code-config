# Mongoose Patterns

## Overview

Mongoose is an ODM (Object Document Mapper) for MongoDB. This skill provides patterns for database operations with Mongoose.

---

## Schema Definition

### Basic Schema with Validation

```typescript
import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface
export interface IUser {
  email: string;
  name?: string;
  passwordHash: string;
  role: 'user' | 'admin';
  items: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface IUserDocument extends IUser, Document {}

// Schema
const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: 255,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Don't include in queries by default
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    items: [{
      type: Schema.Types.ObjectId,
      ref: 'Item',
    }],
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

export const User = mongoose.model<IUserDocument>('User', userSchema);
```

### Schema with Relations

```typescript
export interface IItem {
  title: string;
  description?: string;
  status: 'active' | 'archived';
  price: number;
  author: mongoose.Types.ObjectId;
  tags: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface IItemDocument extends IItem, Document {}

const itemSchema = new Schema<IItemDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price must be positive'],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tags: [{
      type: Schema.Types.ObjectId,
      ref: 'Tag',
    }],
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index
itemSchema.index({ author: 1, status: 1 });

// Virtual for URL
itemSchema.virtual('url').get(function () {
  return `/items/${this._id}`;
});

export const Item = mongoose.model<IItemDocument>('Item', itemSchema);
```

---

## Query Patterns

### Basic CRUD

```typescript
// Create
const item = await Item.create({
  title: 'New Item',
  price: 100,
  author: userId,
});

// Read one with population
const item = await Item.findById(itemId)
  .populate('author', 'name email')
  .populate('tags', 'name')
  .lean();

// Read many with filters
const items = await Item.find({
  status: 'active',
  deletedAt: null,
})
  .populate('author', 'name')
  .sort({ createdAt: -1 })
  .limit(10)
  .lean();

// Update
const updated = await Item.findByIdAndUpdate(
  itemId,
  { title: 'Updated Title' },
  { new: true, runValidators: true }
);

// Delete
await Item.findByIdAndDelete(itemId);
```

### Pagination

```typescript
async function findPaginated(input: {
  page: number;
  pageSize: number;
  status?: string;
}) {
  const { page, pageSize, status } = input;
  const skip = (page - 1) * pageSize;

  const filter = {
    deletedAt: null,
    ...(status && { status }),
  };

  const [items, total] = await Promise.all([
    Item.find(filter)
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    Item.countDocuments(filter),
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

### Aggregation

```typescript
// Items count by status
const stats = await Item.aggregate([
  { $match: { deletedAt: null } },
  {
    $group: {
      _id: '$status',
      count: { $sum: 1 },
      avgPrice: { $avg: '$price' },
    },
  },
]);

// Items with author details
const itemsWithAuthors = await Item.aggregate([
  { $match: { status: 'active' } },
  {
    $lookup: {
      from: 'users',
      localField: 'author',
      foreignField: '_id',
      as: 'authorDetails',
    },
  },
  { $unwind: '$authorDetails' },
  {
    $project: {
      title: 1,
      price: 1,
      'authorDetails.name': 1,
      'authorDetails.email': 1,
    },
  },
]);
```

### Soft Delete

```typescript
// Soft delete
await Item.findByIdAndUpdate(itemId, {
  deletedAt: new Date(),
});

// Restore
await Item.findByIdAndUpdate(itemId, {
  deletedAt: null,
});

// Query middleware for automatic filtering
itemSchema.pre(/^find/, function (next) {
  // Skip if explicitly including deleted
  if (this.getOptions().includeDeleted) {
    return next();
  }
  this.where({ deletedAt: null });
  next();
});
```

### Transactions

```typescript
const session = await mongoose.startSession();

try {
  session.startTransaction();

  const item = await Item.create(
    [{ title: 'New', price: 100, author: userId }],
    { session }
  );

  await User.findByIdAndUpdate(
    userId,
    { $push: { items: item[0]._id } },
    { session }
  );

  await session.commitTransaction();
  return item[0];
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

---

## Model Methods

### Static Methods

```typescript
// Add static methods to schema
itemSchema.statics.findByAuthor = function (authorId: string) {
  return this.find({ author: authorId, deletedAt: null })
    .sort({ createdAt: -1 });
};

itemSchema.statics.findActive = function () {
  return this.find({ status: 'active', deletedAt: null });
};

// Interface for model with statics
interface IItemModel extends Model<IItemDocument> {
  findByAuthor(authorId: string): Promise<IItemDocument[]>;
  findActive(): Promise<IItemDocument[]>;
}

export const Item = mongoose.model<IItemDocument, IItemModel>('Item', itemSchema);

// Usage
const items = await Item.findByAuthor(userId);
```

### Instance Methods

```typescript
// Add instance methods
itemSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  return this.save();
};

itemSchema.methods.restore = function () {
  this.deletedAt = null;
  return this.save();
};

itemSchema.methods.archive = function () {
  this.status = 'archived';
  return this.save();
};

// Usage
const item = await Item.findById(itemId);
await item.softDelete();
```

---

## Connection Setup

```typescript
// db/connection.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

let cached = global as typeof globalThis & {
  mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

if (!cached.mongoose) {
  cached.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.mongoose.conn) {
    return cached.mongoose.conn;
  }

  if (!cached.mongoose.promise) {
    cached.mongoose.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cached.mongoose.conn = await cached.mongoose.promise;
  return cached.mongoose.conn;
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});
```

---

## Testing

```typescript
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Item } from '../models/item.model';
import { User } from '../models/user.model';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Item.deleteMany({});
  await User.deleteMany({});
});

describe('Item Model', () => {
  it('should create item with valid data', async () => {
    const user = await User.create({
      email: 'test@example.com',
      passwordHash: 'hash',
    });

    const item = await Item.create({
      title: 'Test Item',
      price: 100,
      author: user._id,
    });

    expect(item._id).toBeDefined();
    expect(item.title).toBe('Test Item');
  });

  it('should fail without required fields', async () => {
    await expect(
      Item.create({ title: 'No Price' })
    ).rejects.toThrow();
  });

  it('should populate author', async () => {
    const user = await User.create({
      email: 'test@example.com',
      passwordHash: 'hash',
      name: 'Test User',
    });

    const item = await Item.create({
      title: 'Test',
      price: 100,
      author: user._id,
    });

    const populated = await Item.findById(item._id).populate('author', 'name');
    expect(populated?.author.name).toBe('Test User');
  });
});
```

---

## Best Practices

### Good

- Use lean() for read-only queries (better performance)
- Use indexes for frequently queried fields
- Use timestamps option instead of manual dates
- Use virtuals for computed properties
- Use select: false for sensitive fields

### Bad

- Not using indexes (poor query performance)
- Populating everything (performance issues)
- Manual _id generation (use ObjectId)
- Not handling connection errors
- Storing references when embedding is better
