# NextAuth.js / Auth.js Patterns

Expert patterns for **NextAuth.js (Auth.js)** authentication in Next.js applications.

## Core Concepts

- Session-based authentication
- Multiple OAuth providers
- Credentials provider
- Database adapters
- JWT and session strategies
- Middleware protection

## Setup

### Auth Configuration (Next.js App Router)

```typescript
// lib/auth.ts
import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.password) return null;

        const passwordMatch = await bcrypt.compare(
          parsed.data.password,
          user.password
        );

        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      if (account?.provider === 'github') {
        token.accessToken = account.access_token;
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
    async signIn({ user, account, profile }) {
      // Custom sign-in logic
      if (account?.provider === 'github') {
        // Check if user is allowed
        const allowedEmails = process.env.ALLOWED_EMAILS?.split(',') ?? [];
        if (allowedEmails.length > 0 && !allowedEmails.includes(user.email!)) {
          return false;
        }
      }
      return true;
    },
  },
});
```

### Route Handler

```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/lib/auth';
export const { GET, POST } = handlers;
```

### Type Extensions

```typescript
// types/next-auth.d.ts
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }

  interface User {
    role: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    accessToken?: string;
  }
}
```

## Middleware Protection

```typescript
// middleware.ts
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Public routes
  const publicRoutes = ['/', '/login', '/register', '/api/auth'];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Admin routes
  const isAdminRoute = pathname.startsWith('/admin');
  const isAdmin = req.auth?.user?.role === 'admin';

  // Redirect unauthenticated users
  if (!isPublicRoute && !isLoggedIn) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect non-admins from admin routes
  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

## Server Components

### Getting Session

```typescript
// app/dashboard/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}</h1>
      <p>Email: {session.user.email}</p>
      <p>Role: {session.user.role}</p>
    </div>
  );
}
```

### Protected Layout

```typescript
// app/(protected)/layout.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div>
      <nav>
        <span>{session.user.name}</span>
        <SignOutButton />
      </nav>
      {children}
    </div>
  );
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

// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Using Session in Client

```typescript
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <Spinner />;
  }

  if (session) {
    return (
      <div>
        <img src={session.user.image} alt={session.user.name} />
        <span>{session.user.name}</span>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => signIn('github')}>Sign in with GitHub</button>
      <button onClick={() => signIn('google')}>Sign in with Google</button>
    </div>
  );
}
```

### Login Form

```typescript
'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const result = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false,
    });

    setIsLoading(false);

    if (result?.error) {
      setError('Invalid email or password');
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}

      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>

      <div className="divider">or</div>

      <button type="button" onClick={() => signIn('github', { callbackUrl })}>
        Continue with GitHub
      </button>
      <button type="button" onClick={() => signIn('google', { callbackUrl })}>
        Continue with Google
      </button>
    </form>
  );
}
```

## Server Actions

```typescript
// actions/auth.ts
'use server';

import { signIn, signOut } from '@/lib/auth';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export async function handleSignOut() {
  await signOut({ redirectTo: '/' });
}

export async function signInWithProvider(provider: string) {
  await signIn(provider, { redirectTo: '/dashboard' });
}
```

## Role-Based Access

### Higher-Order Component

```typescript
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ComponentType } from 'react';

type Role = 'user' | 'admin' | 'moderator';

export function withAuth<P extends object>(
  Component: ComponentType<P>,
  allowedRoles?: Role[]
) {
  return async function AuthenticatedComponent(props: P) {
    const session = await auth();

    if (!session) {
      redirect('/login');
    }

    if (allowedRoles && !allowedRoles.includes(session.user.role as Role)) {
      redirect('/unauthorized');
    }

    return <Component {...props} session={session} />;
  };
}

// Usage
const AdminPage = withAuth(AdminDashboard, ['admin']);
```

### Permission Check

```typescript
// lib/permissions.ts
import { auth } from '@/lib/auth';

export async function checkPermission(permission: string): Promise<boolean> {
  const session = await auth();
  if (!session) return false;

  const rolePermissions: Record<string, string[]> = {
    admin: ['read', 'write', 'delete', 'manage_users'],
    moderator: ['read', 'write', 'delete'],
    user: ['read', 'write'],
  };

  const userPermissions = rolePermissions[session.user.role] ?? [];
  return userPermissions.includes(permission);
}

// Usage in Server Component
export default async function ManageUsersPage() {
  const canManageUsers = await checkPermission('manage_users');

  if (!canManageUsers) {
    redirect('/unauthorized');
  }

  // ...
}
```

## Best Practices

1. **JWT Strategy**: Use JWT for stateless auth, database sessions for revocable sessions
2. **Type Safety**: Extend NextAuth types for custom user properties
3. **Middleware**: Use middleware for route protection
4. **Callbacks**: Use callbacks to customize tokens and sessions
5. **Error Handling**: Handle auth errors gracefully
6. **Security**: Store secrets in environment variables

## When to Use

- Next.js applications needing authentication
- OAuth integration (GitHub, Google, etc.)
- Session-based authentication
- Role-based access control
- Multi-tenant applications
