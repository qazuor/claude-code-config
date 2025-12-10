# Internationalization (i18n) Patterns

Expert patterns for **internationalization** in React and Next.js applications.

## Core Concepts

- Locale detection and routing
- Translation file management
- Pluralization and formatting
- RTL support
- Date, number, and currency formatting

## next-intl (Recommended for Next.js)

### Setup

```typescript
// i18n.ts
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['en', 'es', 'fr', 'de'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as Locale)) notFound();

  return {
    messages: (await import(`./messages/${locale}.json`)).default,
    timeZone: 'America/New_York',
    now: new Date(),
  };
});
```

### Middleware

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // or 'always' | 'never'
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

### Translation Files

```json
// messages/en.json
{
  "common": {
    "welcome": "Welcome, {name}!",
    "items": "{count, plural, =0 {No items} =1 {One item} other {# items}}"
  },
  "navigation": {
    "home": "Home",
    "about": "About",
    "contact": "Contact"
  },
  "errors": {
    "notFound": "Page not found",
    "serverError": "Something went wrong"
  }
}
```

```json
// messages/es.json
{
  "common": {
    "welcome": "¡Bienvenido, {name}!",
    "items": "{count, plural, =0 {Sin elementos} =1 {Un elemento} other {# elementos}}"
  },
  "navigation": {
    "home": "Inicio",
    "about": "Acerca de",
    "contact": "Contacto"
  },
  "errors": {
    "notFound": "Página no encontrada",
    "serverError": "Algo salió mal"
  }
}
```

### Server Components

```typescript
// app/[locale]/page.tsx
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

// Server component with translations
export default function HomePage() {
  const t = useTranslations('common');

  return (
    <div>
      <h1>{t('welcome', { name: 'John' })}</h1>
      <p>{t('items', { count: 5 })}</p>
    </div>
  );
}

// Generate metadata with translations
export async function generateMetadata({ params: { locale } }) {
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('title'),
    description: t('description'),
  };
}
```

### Client Components

```typescript
'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    // Replace locale in pathname
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <select value={locale} onChange={(e) => switchLocale(e.target.value)}>
      <option value="en">English</option>
      <option value="es">Español</option>
      <option value="fr">Français</option>
    </select>
  );
}

export function TranslatedComponent() {
  const t = useTranslations('navigation');

  return (
    <nav>
      <a href="/">{t('home')}</a>
      <a href="/about">{t('about')}</a>
    </nav>
  );
}
```

## Formatting

### Date and Time

```typescript
import { useFormatter } from 'next-intl';

function DateDisplay({ date }: { date: Date }) {
  const format = useFormatter();

  return (
    <div>
      {/* Full date */}
      <p>{format.dateTime(date, { dateStyle: 'full' })}</p>

      {/* Relative time */}
      <p>{format.relativeTime(date)}</p>

      {/* Custom format */}
      <p>
        {format.dateTime(date, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
    </div>
  );
}
```

### Numbers and Currency

```typescript
import { useFormatter } from 'next-intl';

function PriceDisplay({ amount, currency }: { amount: number; currency: string }) {
  const format = useFormatter();

  return (
    <div>
      {/* Currency */}
      <p>{format.number(amount, { style: 'currency', currency })}</p>

      {/* Percentage */}
      <p>{format.number(0.15, { style: 'percent' })}</p>

      {/* Compact notation */}
      <p>{format.number(1234567, { notation: 'compact' })}</p>
    </div>
  );
}
```

### Lists

```typescript
import { useFormatter } from 'next-intl';

function Contributors({ names }: { names: string[] }) {
  const format = useFormatter();

  return (
    <p>
      Contributors: {format.list(names, { type: 'conjunction' })}
      {/* en: "Alice, Bob, and Charlie" */}
      {/* es: "Alice, Bob y Charlie" */}
    </p>
  );
}
```

## react-i18next (Alternative)

### Setup

```typescript
// i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'es', 'fr'],
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
  });

export default i18n;
```

### Usage

```typescript
import { useTranslation, Trans } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      {/* Simple translation */}
      <h1>{t('common.welcome')}</h1>

      {/* With interpolation */}
      <p>{t('common.greeting', { name: 'John' })}</p>

      {/* Pluralization */}
      <p>{t('common.items', { count: 5 })}</p>

      {/* Trans component for JSX */}
      <Trans i18nKey="common.linkText">
        Click <a href="/link">here</a> to continue
      </Trans>

      {/* Change language */}
      <button onClick={() => i18n.changeLanguage('es')}>
        Español
      </button>
    </div>
  );
}
```

## Best Practices

### Translation Key Organization

```json
{
  "pages": {
    "home": {
      "title": "Welcome",
      "subtitle": "Get started today"
    },
    "about": {
      "title": "About Us"
    }
  },
  "components": {
    "header": {
      "logo": "Logo",
      "menu": "Menu"
    },
    "footer": {
      "copyright": "© {year} Company"
    }
  },
  "forms": {
    "validation": {
      "required": "This field is required",
      "email": "Invalid email address",
      "minLength": "Must be at least {min} characters"
    }
  },
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "confirm": "Are you sure?"
  }
}
```

### Type Safety

```typescript
// types/i18n.d.ts
import en from '../messages/en.json';

type Messages = typeof en;

declare global {
  interface IntlMessages extends Messages {}
}
```

### RTL Support

```typescript
// components/RTLProvider.tsx
import { useLocale } from 'next-intl';

const rtlLocales = ['ar', 'he', 'fa'];

export function RTLProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const isRTL = rtlLocales.includes(locale);

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      {children}
    </div>
  );
}
```

### Dynamic Content

```typescript
// For user-generated content that needs translation
async function getTranslatedContent(key: string, locale: string) {
  // Fetch from CMS or database
  const content = await cms.getContent(key, locale);
  return content;
}
```

## Best Practices Summary

1. **Key Naming**: Use namespaced, descriptive keys
2. **Fallbacks**: Always provide fallback language
3. **Type Safety**: Use TypeScript for translation keys
4. **Lazy Loading**: Load translations on demand
5. **RTL**: Support right-to-left languages
6. **Formatting**: Use built-in formatters for dates, numbers, lists
7. **Context**: Provide context for translators

## When to Use

- Multi-language applications
- Global user bases
- Content-heavy applications
- E-commerce with multiple markets
- Applications requiring RTL support
