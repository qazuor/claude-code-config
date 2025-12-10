---
name: auth-patterns
category: auth
description: Authentication patterns for Next.js and React applications
usage: Use when implementing authentication with OAuth, credentials, or session management
input: Auth provider, session strategy, protected routes
output: Auth configuration, middleware, hooks, components
config_required:
  auth_library: "Authentication library being used"
  auth_providers: "OAuth providers (GitHub, Google, etc.) or credentials"
  session_strategy: "Session strategy (JWT, database, etc.)"
  protected_routes: "Routes requiring authentication"
  database_adapter: "Database adapter if using database sessions"
---

# Auth Patterns

## ⚙️ Configuration

| Setting | Description | Example |
|---------|-------------|---------|
| `auth_library` | Authentication library | NextAuth.js, Auth0, Clerk, Supabase Auth |
| `auth_providers` | OAuth providers or credentials | GitHub, Google, Credentials |
| `session_strategy` | How sessions are stored | JWT, database |
| `protected_routes` | Routes requiring auth | `/dashboard`, `/admin/*` |
| `database_adapter` | Database adapter for sessions | Prisma, Drizzle, none |

## Purpose

Implement secure authentication with:
- Multiple authentication providers
- Protected routes and middleware
- Role-based access control
- Type-safe session management

## Core Setup

### Auth Configuration

```typescript
// lib/auth.ts
import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/lib/db';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' }, // or 'database'
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        const user = await validateCredentials(credentials);
        return user ?? null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
```

### Type Extensions

```typescript
// types/auth.d.ts
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }
}
```

## Route Protection

### Middleware

```typescript
// middleware.ts
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === 'admin';

  // Public routes
  const publicRoutes = ['/', '/login', '/register'];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users
  if (!isLoggedIn) {
    const url = new URL('/login', req.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Admin-only routes
  if (pathname.startsWith('/admin') && !isAdmin) {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  return NextResponse.next();
});
```

### Server Components

```typescript
// app/dashboard/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return <div>Welcome, {session.user.name}</div>;
}
```

## Client Components

### Session Provider

```typescript
// app/providers.tsx
'use client';
import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

### Login Form

```typescript
'use client';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const result = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid credentials');
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Sign in</button>
      <button type="button" onClick={() => signIn('github')}>
        GitHub
      </button>
    </form>
  );
}
```

## Role-Based Access

### Permission Check

```typescript
// lib/permissions.ts
export async function checkPermission(permission: string): Promise<boolean> {
  const session = await auth();
  if (!session) return false;

  const rolePermissions: Record<string, string[]> = {
    admin: ['read', 'write', 'delete', 'manage_users'],
    moderator: ['read', 'write', 'delete'],
    user: ['read', 'write'],
  };

  return rolePermissions[session.user.role]?.includes(permission) ?? false;
}

// Usage
export default async function ManageUsersPage() {
  const canManage = await checkPermission('manage_users');
  if (!canManage) redirect('/unauthorized');
  // ...
}
```

### Higher-Order Component

```typescript
export function withAuth<P extends object>(
  Component: ComponentType<P>,
  allowedRoles?: string[]
) {
  return async function AuthenticatedComponent(props: P) {
    const session = await auth();
    if (!session) redirect('/login');
    if (allowedRoles && !allowedRoles.includes(session.user.role)) {
      redirect('/unauthorized');
    }
    return <Component {...props} session={session} />;
  };
}

// Usage
const AdminPage = withAuth(AdminDashboard, ['admin']);
```

## Server Actions

```typescript
'use server';
import { signIn, signOut } from '@/lib/auth';
import { AuthError } from 'next-auth';

export async function authenticate(formData: FormData) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      return error.type === 'CredentialsSignin'
        ? 'Invalid credentials'
        : 'Something went wrong';
    }
    throw error;
  }
}

export async function handleSignOut() {
  await signOut({ redirectTo: '/' });
}
```

## Best Practices

| Practice | Description |
|----------|-------------|
| **JWT for Stateless** | Use JWT for stateless auth, database sessions for revocable sessions |
| **Type Safety** | Extend auth types for custom properties |
| **Middleware Protection** | Use middleware for route-level protection |
| **Environment Variables** | Store secrets securely in env vars |
| **Callbacks** | Customize tokens and sessions via callbacks |
| **Error Handling** | Handle auth errors gracefully with user feedback |

## When to Use

- Next.js applications requiring authentication
- OAuth integration (GitHub, Google, etc.)
- Role-based access control
- Multi-tenant applications
- Session management

## Related Skills

- `error-handling-patterns` - Handle auth errors
- `web-app-testing` - Test auth flows
