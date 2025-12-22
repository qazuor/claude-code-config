# Astro Patterns

## Overview

Astro is a web framework for content-focused websites with islands architecture. This skill provides patterns for building Astro applications.

---

## Page Components

### Basic Page

```astro
---
// src/pages/index.astro
import BaseLayout from '@/layouts/BaseLayout.astro';
import { getItems } from '@/lib/api';

const items = await getItems();
---

<BaseLayout title="Home">
  <main>
    <h1>Welcome</h1>
    <ul>
      {items.map((item) => (
        <li>
          <a href={`/items/${item.id}`}>{item.title}</a>
        </li>
      ))}
    </ul>
  </main>
</BaseLayout>
```

### Dynamic Route

```astro
---
// src/pages/items/[id].astro
import BaseLayout from '@/layouts/BaseLayout.astro';
import { getItem, getItems } from '@/lib/api';

export async function getStaticPaths() {
  const items = await getItems();

  return items.map((item) => ({
    params: { id: item.id },
    props: { item },
  }));
}

interface Props {
  item: Item;
}

const { item } = Astro.props;
---

<BaseLayout title={item.title}>
  <article>
    <h1>{item.title}</h1>
    <p>{item.description}</p>
    <p>Price: ${item.price}</p>
  </article>
</BaseLayout>
```

---

## Layouts

### Base Layout

```astro
---
// src/layouts/BaseLayout.astro
import Header from '@/components/Header.astro';
import Footer from '@/components/Footer.astro';
import '@/styles/global.css';

interface Props {
  title: string;
  description?: string;
}

const { title, description = 'Default description' } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <title>{title}</title>
  </head>
  <body>
    <Header />
    <slot />
    <Footer />
  </body>
</html>
```

### Nested Layouts

```astro
---
// src/layouts/DocsLayout.astro
import BaseLayout from './BaseLayout.astro';
import Sidebar from '@/components/Sidebar.astro';

interface Props {
  title: string;
}

const { title } = Astro.props;
---

<BaseLayout title={title}>
  <div class="flex">
    <Sidebar />
    <main class="flex-1">
      <slot />
    </main>
  </div>
</BaseLayout>
```

---

## Islands Architecture

### React Island

```astro
---
// src/pages/interactive.astro
import BaseLayout from '@/layouts/BaseLayout.astro';
import Counter from '@/components/Counter'; // React component
import ItemForm from '@/components/ItemForm'; // React component
---

<BaseLayout title="Interactive Page">
  <h1>Static Content</h1>

  <!-- Hydrates on page load -->
  <Counter client:load initialCount={0} />

  <!-- Hydrates when visible -->
  <ItemForm client:visible />

  <!-- Hydrates on idle -->
  <HeavyComponent client:idle />

  <!-- Only client-side (no SSR) -->
  <ClientOnlyWidget client:only="react" />
</BaseLayout>
```

### Interactive React Component

```tsx
// src/components/Counter.tsx
import { useState } from 'react';

interface CounterProps {
  initialCount: number;
}

export default function Counter({ initialCount }: CounterProps) {
  const [count, setCount] = useState(initialCount);

  return (
    <div className="p-4 border rounded">
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
    </div>
  );
}
```

---

## Content Collections

### Collection Schema

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const authors = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    bio: z.string(),
    avatar: z.string(),
  }),
});

export const collections = { blog, authors };
```

### Using Collections

```astro
---
// src/pages/blog/index.astro
import { getCollection } from 'astro:content';
import BaseLayout from '@/layouts/BaseLayout.astro';
import BlogCard from '@/components/BlogCard.astro';

const posts = await getCollection('blog', ({ data }) => {
  return !data.draft;
});

const sortedPosts = posts.sort(
  (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
);
---

<BaseLayout title="Blog">
  <h1>Blog Posts</h1>
  <div class="grid gap-4">
    {sortedPosts.map((post) => (
      <BlogCard post={post} />
    ))}
  </div>
</BaseLayout>
```

### Blog Post Page

```astro
---
// src/pages/blog/[...slug].astro
import { getCollection } from 'astro:content';
import BlogLayout from '@/layouts/BlogLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('blog');

  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await post.render();
---

<BlogLayout title={post.data.title}>
  <article>
    <h1>{post.data.title}</h1>
    <time datetime={post.data.pubDate.toISOString()}>
      {post.data.pubDate.toLocaleDateString()}
    </time>
    <Content />
  </article>
</BlogLayout>
```

---

## API Routes

### Basic Endpoint

```typescript
// src/pages/api/items.ts
import type { APIRoute } from 'astro';
import { getItems } from '@/lib/api';

export const GET: APIRoute = async () => {
  const items = await getItems();

  return new Response(JSON.stringify({ data: items }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();

  // Create item...

  return new Response(JSON.stringify({ data: newItem }), {
    status: 201,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
```

### Dynamic Endpoint

```typescript
// src/pages/api/items/[id].ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;
  const item = await getItem(id);

  if (!item) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
    });
  }

  return new Response(JSON.stringify({ data: item }), {
    status: 200,
  });
};
```

---

## Integrations

### Config with Integrations

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  site: 'https://example.com',
  integrations: [
    react(),
    tailwind(),
    sitemap(),
  ],
  output: 'hybrid', // Static by default, opt-in to server rendering
  adapter: vercel(),
});
```

---

## Project Structure

```
src/
├── pages/
│   ├── index.astro
│   ├── about.astro
│   ├── blog/
│   │   ├── index.astro
│   │   └── [...slug].astro
│   └── api/
│       └── items.ts
├── layouts/
│   ├── BaseLayout.astro
│   └── BlogLayout.astro
├── components/
│   ├── Header.astro          # Static component
│   ├── Footer.astro
│   ├── BlogCard.astro
│   └── Counter.tsx           # React island
├── content/
│   ├── config.ts
│   └── blog/
│       ├── post-1.md
│       └── post-2.md
├── lib/
│   └── api.ts
└── styles/
    └── global.css
```

---

## Best Practices

### Good

- Use Astro components for static content
- Use islands (`client:*`) only for interactive parts
- Use content collections for structured content
- Use `client:visible` for below-the-fold interactivity
- Generate static pages when possible

### Bad

- Adding `client:load` to everything (defeats the purpose)
- Using React/Vue for static content
- Not using content collections for blog/docs
- Ignoring image optimization
- Server rendering when static works
