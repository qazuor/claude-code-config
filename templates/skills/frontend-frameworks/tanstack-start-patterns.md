# TanStack Start Patterns

## Overview

TanStack Start is a full-stack React framework with file-based routing and server functions. This skill provides patterns for building TanStack Start applications.

---

## Route Definition

### Basic Route

```typescript
// app/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <main className="container py-8">
      <h1>Welcome</h1>
      <p>This is the home page.</p>
    </main>
  );
}
```

### Route with Loader

```typescript
// app/routes/items/index.tsx
import { createFileRoute } from '@tanstack/react-router';
import { getItems } from '@/lib/api';

export const Route = createFileRoute('/items/')({
  loader: async () => {
    const items = await getItems();
    return { items };
  },
  component: ItemsPage,
});

function ItemsPage() {
  const { items } = Route.useLoaderData();

  return (
    <main>
      <h1>Items</h1>
      <ul>
        {items.map((item) => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    </main>
  );
}
```

### Dynamic Route

```typescript
// app/routes/items/$itemId.tsx
import { createFileRoute, notFound } from '@tanstack/react-router';
import { getItem } from '@/lib/api';

export const Route = createFileRoute('/items/$itemId')({
  loader: async ({ params }) => {
    const item = await getItem(params.itemId);

    if (!item) {
      throw notFound();
    }

    return { item };
  },
  component: ItemPage,
});

function ItemPage() {
  const { item } = Route.useLoaderData();

  return (
    <article>
      <h1>{item.title}</h1>
      <p>{item.description}</p>
      <p>Price: ${item.price}</p>
    </article>
  );
}
```

---

## Server Functions

### Basic Server Function

```typescript
// app/lib/server-fns.ts
import { createServerFn } from '@tanstack/start';
import { db } from './db';

export const getItems = createServerFn('GET', async () => {
  const items = await db.item.findMany({
    where: { status: 'active' },
    orderBy: { createdAt: 'desc' },
  });

  return items;
});

export const getItem = createServerFn('GET', async (id: string) => {
  const item = await db.item.findUnique({
    where: { id },
  });

  return item;
});
```

### Mutation Server Function

```typescript
// app/lib/server-fns.ts
import { createServerFn } from '@tanstack/start';
import { z } from 'zod';
import { db } from './db';
import { getSession } from './auth';

const createItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
});

export const createItem = createServerFn('POST', async (input: unknown) => {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const data = createItemSchema.parse(input);

  const item = await db.item.create({
    data: {
      ...data,
      authorId: session.user.id,
    },
  });

  return item;
});

export const updateItem = createServerFn(
  'POST',
  async ({ id, data }: { id: string; data: unknown }) => {
    const session = await getSession();
    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    const parsed = createItemSchema.partial().parse(data);

    const item = await db.item.update({
      where: { id, authorId: session.user.id },
      data: parsed,
    });

    return item;
  }
);

export const deleteItem = createServerFn('POST', async (id: string) => {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  await db.item.delete({
    where: { id, authorId: session.user.id },
  });

  return { success: true };
});
```

---

## Using Server Functions in Components

### With TanStack Query

```typescript
// app/routes/items/index.tsx
import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getItems, createItem, deleteItem } from '@/lib/server-fns';

export const Route = createFileRoute('/items/')({
  loader: () => getItems(),
  component: ItemsPage,
});

function ItemsPage() {
  const items = Route.useLoaderData();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  return (
    <main>
      <h1>Items</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          createMutation.mutate({
            title: formData.get('title') as string,
            price: Number(formData.get('price')),
          });
        }}
      >
        <input name="title" placeholder="Title" required />
        <input name="price" type="number" placeholder="Price" required />
        <button type="submit" disabled={createMutation.isPending}>
          Create
        </button>
      </form>

      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.title} - ${item.price}
            <button
              onClick={() => deleteMutation.mutate(item.id)}
              disabled={deleteMutation.isPending}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

---

## Layouts

### Root Layout

```typescript
// app/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}
```

### Nested Layout

```typescript
// app/routes/dashboard/_layout.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { Sidebar } from '@/components/Sidebar';

export const Route = createFileRoute('/dashboard/_layout')({
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
```

---

## Error Handling

### Route Error Boundary

```typescript
// app/routes/items/$itemId.tsx
import { createFileRoute, notFound, ErrorComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/items/$itemId')({
  loader: async ({ params }) => {
    const item = await getItem(params.itemId);

    if (!item) {
      throw notFound();
    }

    return { item };
  },
  errorComponent: ItemErrorBoundary,
  notFoundComponent: ItemNotFound,
  component: ItemPage,
});

function ItemErrorBoundary({ error }: { error: Error }) {
  return (
    <div className="p-4 border border-red-500 rounded">
      <h2>Error loading item</h2>
      <p>{error.message}</p>
    </div>
  );
}

function ItemNotFound() {
  return (
    <div className="p-4">
      <h2>Item not found</h2>
      <p>The item you're looking for doesn't exist.</p>
    </div>
  );
}
```

---

## Search Params

### Route with Search Params

```typescript
// app/routes/items/index.tsx
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const itemsSearchSchema = z.object({
  q: z.string().optional(),
  page: z.number().default(1),
  status: z.enum(['active', 'archived']).optional(),
});

export const Route = createFileRoute('/items/')({
  validateSearch: itemsSearchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps }) => {
    const items = await getItems(deps.search);
    return { items };
  },
  component: ItemsPage,
});

function ItemsPage() {
  const { items } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <main>
      <input
        value={search.q || ''}
        onChange={(e) =>
          navigate({ search: { ...search, q: e.target.value } })
        }
        placeholder="Search..."
      />

      <select
        value={search.status || ''}
        onChange={(e) =>
          navigate({
            search: { ...search, status: e.target.value || undefined },
          })
        }
      >
        <option value="">All</option>
        <option value="active">Active</option>
        <option value="archived">Archived</option>
      </select>

      <ul>
        {items.map((item) => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    </main>
  );
}
```

---

## Project Structure

```
app/
├── routes/
│   ├── __root.tsx           # Root layout
│   ├── index.tsx            # Home page
│   ├── about.tsx
│   ├── items/
│   │   ├── index.tsx        # /items
│   │   └── $itemId.tsx      # /items/:itemId
│   └── dashboard/
│       ├── _layout.tsx      # Dashboard layout
│       └── index.tsx        # /dashboard
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── Sidebar.tsx
├── lib/
│   ├── server-fns.ts        # Server functions
│   ├── db.ts                # Database client
│   └── auth.ts              # Authentication
└── styles/
    └── global.css
```

---

## Best Practices

### Good

- Use loaders for data fetching
- Use server functions for mutations
- Use search params validation with Zod
- Use TanStack Query for client-side caching
- Use error and notFound components

### Bad

- Client-side fetching when loader works
- Not validating search params
- Ignoring error boundaries
- Not using server functions for sensitive operations
- Putting business logic in components
