# Next.js App Router Patterns

## Overview

Next.js is a React framework with server-side rendering and App Router. This skill provides patterns for building Next.js applications.

---

## Server Components (Default)

### Data Fetching in Server Components

```typescript
// app/items/page.tsx
import { getItems } from '@/lib/actions/items';
import { ItemList } from '@/components/features/item-list';

export default async function ItemsPage() {
  const items = await getItems();

  return (
    <main className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Items</h1>
      <ItemList items={items} />
    </main>
  );
}
```

### With Search Params

```typescript
// app/items/page.tsx
interface PageProps {
  searchParams: { q?: string; page?: string };
}

export default async function ItemsPage({ searchParams }: PageProps) {
  const query = searchParams.q || '';
  const page = Number(searchParams.page) || 1;

  const { items, totalPages } = await getItems({ query, page });

  return (
    <main>
      <SearchBar defaultValue={query} />
      <ItemList items={items} />
      <Pagination currentPage={page} totalPages={totalPages} />
    </main>
  );
}
```

---

## Client Components

### Interactive Components

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { updateItem } from '@/lib/actions/items';
import { useToast } from '@/hooks/use-toast';

interface ItemCardProps {
  item: { id: string; title: string };
}

export function ItemCard({ item }: ItemCardProps) {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const handleUpdate = async () => {
    setIsPending(true);
    try {
      await updateItem(item.id, { title: 'Updated' });
      toast({ title: 'Item updated' });
    } catch (error) {
      toast({ title: 'Error updating item', variant: 'destructive' });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      <p>{item.title}</p>
      <Button onClick={handleUpdate} disabled={isPending}>
        {isPending ? 'Updating...' : 'Update'}
      </Button>
    </div>
  );
}
```

---

## Server Actions

### Form Action

```typescript
// lib/actions/items.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

const createItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});

export async function createItem(formData: FormData) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const data = {
    title: formData.get('title'),
    description: formData.get('description'),
  };

  const parsed = createItemSchema.parse(data);

  const item = await db.item.create({
    data: {
      ...parsed,
      authorId: session.user.id,
    },
  });

  revalidatePath('/items');
  redirect(`/items/${item.id}`);
}
```

### Action with Return Value

```typescript
'use server';

import { revalidatePath } from 'next/cache';

type ActionResult =
  | { success: true; data: Item }
  | { success: false; error: string };

export async function updateItem(
  id: string,
  data: Partial<Item>
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const item = await db.item.update({
      where: { id, authorId: session.user.id },
      data,
    });

    revalidatePath('/items');
    revalidatePath(`/items/${id}`);

    return { success: true, data: item };
  } catch (error) {
    return { success: false, error: 'Failed to update item' };
  }
}
```

---

## Route Handlers

### API Route

```typescript
// app/api/items/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;

  const items = await db.item.findMany({
    where: { status: 'active' },
    take: limit,
    skip: (page - 1) * limit,
  });

  return NextResponse.json({ data: items });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const item = await db.item.create({
    data: { ...body, authorId: session.user.id },
  });

  return NextResponse.json({ data: item }, { status: 201 });
}
```

### Dynamic Route Handler

```typescript
// app/api/items/[id]/route.ts
import { NextResponse } from 'next/server';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: Request, { params }: RouteParams) {
  const item = await db.item.findUnique({
    where: { id: params.id },
  });

  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ data: item });
}
```

---

## Layouts and Loading States

### Root Layout

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import { Header } from '@/components/layout/header';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'My App',
  description: 'App description',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### Loading State

```typescript
// app/items/loading.tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="container py-8">
      <Skeleton className="h-8 w-48 mb-4" />
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
}
```

### Error Handling

```typescript
// app/items/error.tsx
'use client';

import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="container py-8">
      <div className="p-4 border border-red-500 rounded">
        <h2 className="text-lg font-bold">Something went wrong!</h2>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button onClick={reset} className="mt-4">
          Try again
        </Button>
      </div>
    </div>
  );
}
```

---

## Caching and Revalidation

### Static Generation

```typescript
// Generate static pages at build time
export async function generateStaticParams() {
  const items = await db.item.findMany({
    select: { id: true },
  });

  return items.map((item) => ({
    id: item.id,
  }));
}
```

### Revalidation Options

```typescript
// Time-based revalidation
export const revalidate = 3600; // Revalidate every hour

// On-demand revalidation in Server Actions
import { revalidatePath, revalidateTag } from 'next/cache';

export async function createItem() {
  // ... create item
  revalidatePath('/items');
  revalidateTag('items');
}
```

### Fetch with Cache Options

```typescript
// Cache forever (default)
const data = await fetch(url);

// Don't cache
const data = await fetch(url, { cache: 'no-store' });

// Revalidate after time
const data = await fetch(url, { next: { revalidate: 3600 } });

// Tag-based revalidation
const data = await fetch(url, { next: { tags: ['items'] } });
```

---

## Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuth = !!token;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');

  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (!isAuth) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
```

---

## Project Structure

```
app/
├── layout.tsx              # Root layout
├── page.tsx                # Home page
├── loading.tsx             # Loading UI
├── error.tsx               # Error UI
├── not-found.tsx           # 404 page
├── (auth)/                 # Route group (no URL impact)
│   ├── login/page.tsx
│   └── register/page.tsx
├── items/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── loading.tsx
│   └── [id]/
│       ├── page.tsx
│       └── edit/page.tsx
├── api/
│   └── items/
│       └── route.ts
components/
├── ui/                     # Base UI components
└── features/               # Feature components
lib/
├── actions/                # Server Actions
├── db/                     # Database client
├── auth/                   # Authentication
└── utils/
```

---

## Best Practices

### Good

- Use Server Components by default
- Use Client Components only for interactivity
- Use Server Actions for mutations
- Use loading.tsx for instant feedback
- Use error.tsx for graceful error handling
- Use generateStaticParams for static pages

### Bad

- 'use client' everywhere (loses server benefits)
- Client-side fetching when server fetch works
- No error handling
- Ignoring caching strategies
- Not using revalidation
