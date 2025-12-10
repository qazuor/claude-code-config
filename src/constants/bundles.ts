/**
 * Predefined bundles for grouping related modules
 */

import type { BundleDefinition } from '../types/bundles.js';

/**
 * All available bundles
 */
export const BUNDLES: BundleDefinition[] = [
  // ===================
  // STACK BUNDLES
  // ===================
  {
    id: 'react-tanstack-stack',
    name: 'React + TanStack Stack',
    description: 'React with TanStack Router/Start for admin dashboards and SPAs',
    category: 'stack',
    longDescription:
      'Complete stack for building React applications with TanStack Router and Start. Includes React component development, TanStack-specific patterns, and related testing/quality tools.',
    techStack: ['React', 'TanStack Start', 'TanStack Router', 'TanStack Query', 'TypeScript'],
    tags: ['react', 'tanstack', 'admin', 'spa'],
    modules: [
      { id: 'react-senior-dev', category: 'agents' },
      { id: 'tanstack-start-engineer', category: 'agents' },
      { id: 'ux-ui-designer', category: 'agents' },
      { id: 'web-app-testing', category: 'skills' },
      { id: 'shadcn-specialist', category: 'skills' },
      { id: 'accessibility-audit', category: 'skills' },
      { id: 'tanstack-query-patterns', category: 'skills' },
      { id: 'react-hook-form-patterns', category: 'skills' },
      { id: 'zustand-patterns', category: 'skills', optional: true },
    ],
  },
  {
    id: 'astro-react-stack',
    name: 'Astro + React Stack',
    description: 'Astro with React islands for content-focused websites',
    category: 'stack',
    longDescription:
      'Stack for building fast, content-focused websites with Astro and React components. Perfect for marketing sites, blogs, and documentation sites.',
    techStack: ['Astro', 'React', 'Tailwind CSS', 'MDX', 'TypeScript'],
    tags: ['astro', 'react', 'ssg', 'content'],
    modules: [
      { id: 'astro-engineer', category: 'agents' },
      { id: 'react-senior-dev', category: 'agents' },
      { id: 'seo-ai-specialist', category: 'agents' },
      { id: 'web-app-testing', category: 'skills' },
      { id: 'vercel-specialist', category: 'skills' },
      { id: 'performance-audit', category: 'skills' },
    ],
  },
  {
    id: 'nextjs-prisma-stack',
    name: 'Next.js + Prisma Stack',
    description: 'Full-stack Next.js with Prisma for modern web apps',
    category: 'stack',
    longDescription:
      'Complete full-stack setup with Next.js App Router and Prisma ORM. Includes React components, Server Actions, and database patterns.',
    techStack: ['Next.js', 'React', 'Prisma', 'Tailwind CSS', 'TypeScript'],
    tags: ['nextjs', 'prisma', 'fullstack', 'react'],
    alternativeTo: ['react-tanstack-stack', 'astro-react-stack'],
    modules: [
      { id: 'nextjs-engineer', category: 'agents' },
      { id: 'react-senior-dev', category: 'agents' },
      { id: 'prisma-engineer', category: 'agents' },
      { id: 'ux-ui-designer', category: 'agents' },
      { id: 'web-app-testing', category: 'skills' },
      { id: 'shadcn-specialist', category: 'skills' },
      { id: 'vercel-specialist', category: 'skills' },
      { id: 'tanstack-query-patterns', category: 'skills' },
      { id: 'react-hook-form-patterns', category: 'skills' },
      { id: 'nextauth-patterns', category: 'skills', optional: true },
    ],
  },
  {
    id: 'express-prisma-stack',
    name: 'Express + Prisma API Stack',
    description: 'Express backend with Prisma ORM',
    category: 'stack',
    longDescription:
      'Backend stack using Express for APIs and Prisma for database access. Classic, well-documented stack for traditional REST APIs.',
    techStack: ['Express.js', 'Prisma', 'PostgreSQL', 'Zod', 'TypeScript'],
    tags: ['express', 'prisma', 'api', 'backend'],
    alternativeTo: ['hono-drizzle-stack'],
    modules: [
      { id: 'express-engineer', category: 'agents' },
      { id: 'prisma-engineer', category: 'agents' },
      { id: 'node-typescript-engineer', category: 'agents' },
      { id: 'api-app-testing', category: 'skills' },
      { id: 'error-handling-patterns', category: 'skills' },
      { id: 'security-testing', category: 'skills' },
    ],
  },
  {
    id: 'hono-drizzle-stack',
    name: 'Hono + Drizzle API Stack',
    description: 'Hono API framework with Drizzle ORM for type-safe backends',
    category: 'stack',
    longDescription:
      'Complete backend stack using Hono for APIs and Drizzle for database access. Includes shared TypeScript packages, API testing, and quality tools.',
    techStack: ['Hono', 'Drizzle ORM', 'PostgreSQL', 'Zod', 'TypeScript'],
    tags: ['hono', 'drizzle', 'api', 'backend'],
    alternativeTo: ['express-prisma-stack'],
    modules: [
      { id: 'hono-engineer', category: 'agents' },
      { id: 'db-drizzle-engineer', category: 'agents' },
      { id: 'node-typescript-engineer', category: 'agents' },
      { id: 'api-app-testing', category: 'skills' },
      { id: 'error-handling-patterns', category: 'skills' },
      { id: 'security-testing', category: 'skills' },
    ],
  },

  // ===================
  // TESTING BUNDLES
  // ===================
  {
    id: 'testing-complete',
    name: 'Complete Testing Suite',
    description: 'All testing skills and QA tools for comprehensive test coverage',
    category: 'testing',
    longDescription:
      'Everything you need for a robust testing strategy including TDD methodology, web testing, API testing, performance testing, and QA validation.',
    techStack: ['Vitest', 'Playwright', 'Testing Library', 'MSW'],
    tags: ['testing', 'tdd', 'qa', 'e2e'],
    modules: [
      { id: 'qa-engineer', category: 'agents' },
      { id: 'tdd-methodology', category: 'skills' },
      { id: 'web-app-testing', category: 'skills' },
      { id: 'api-app-testing', category: 'skills' },
      { id: 'performance-testing', category: 'skills' },
      { id: 'qa-criteria-validator', category: 'skills' },
      { id: 'run-tests', category: 'commands' },
    ],
  },
  {
    id: 'testing-minimal',
    name: 'Minimal Testing',
    description: 'Essential testing tools for TDD workflow',
    category: 'testing',
    longDescription: 'Core testing tools for TDD development without the full QA suite.',
    techStack: ['Vitest', 'Testing Library'],
    tags: ['testing', 'tdd', 'minimal'],
    modules: [
      { id: 'tdd-methodology', category: 'skills' },
      { id: 'api-app-testing', category: 'skills' },
      { id: 'run-tests', category: 'commands' },
    ],
  },

  // ===================
  // QUALITY BUNDLES
  // ===================
  {
    id: 'quality-complete',
    name: 'Complete Quality Suite',
    description: 'Full quality assurance with security, performance, and accessibility audits',
    category: 'quality',
    longDescription:
      'Comprehensive quality assurance bundle including all audit types, code review, and debugging tools.',
    tags: ['quality', 'audit', 'security', 'performance'],
    modules: [
      { id: 'qa-engineer', category: 'agents' },
      { id: 'debugger', category: 'agents' },
      { id: 'security-audit', category: 'skills' },
      { id: 'security-testing', category: 'skills' },
      { id: 'performance-audit', category: 'skills' },
      { id: 'performance-testing', category: 'skills' },
      { id: 'accessibility-audit', category: 'skills' },
      { id: 'qa-criteria-validator', category: 'skills' },
      { id: 'quality-check', category: 'commands' },
      { id: 'code-check', category: 'commands' },
      { id: 'review-code', category: 'commands' },
      { id: 'review-security', category: 'commands' },
      { id: 'review-performance', category: 'commands' },
    ],
  },
  {
    id: 'quality-minimal',
    name: 'Minimal Quality',
    description: 'Essential quality checks for everyday development',
    category: 'quality',
    longDescription: 'Core quality tools without the full audit suite.',
    tags: ['quality', 'minimal'],
    modules: [
      { id: 'quality-check', category: 'commands' },
      { id: 'code-check', category: 'commands' },
      { id: 'review-code', category: 'commands' },
    ],
  },

  // ===================
  // DATABASE BUNDLES
  // ===================
  {
    id: 'drizzle-database',
    name: 'Drizzle Database',
    description: 'Drizzle ORM with type-safe database patterns',
    category: 'database',
    longDescription:
      'Database development with Drizzle ORM including schema design, migrations, and data validation.',
    techStack: ['Drizzle ORM', 'PostgreSQL', 'SQLite', 'Zod'],
    tags: ['database', 'drizzle', 'orm'],
    alternativeTo: ['prisma-database', 'mongoose-database'],
    modules: [
      { id: 'db-drizzle-engineer', category: 'agents' },
      { id: 'json-data-auditor', category: 'skills' },
    ],
  },
  {
    id: 'prisma-database',
    name: 'Prisma Database',
    description: 'Prisma ORM with type-safe database patterns',
    category: 'database',
    longDescription:
      'Database development with Prisma ORM including schema design, migrations, and data validation.',
    techStack: ['Prisma', 'PostgreSQL', 'MySQL', 'SQLite', 'MongoDB'],
    tags: ['database', 'prisma', 'orm'],
    alternativeTo: ['drizzle-database', 'mongoose-database'],
    modules: [
      { id: 'prisma-engineer', category: 'agents' },
      { id: 'json-data-auditor', category: 'skills' },
    ],
  },
  {
    id: 'mongoose-database',
    name: 'MongoDB + Mongoose',
    description: 'MongoDB with Mongoose ODM',
    category: 'database',
    longDescription:
      'MongoDB development with Mongoose ODM including document schemas and aggregation pipelines.',
    techStack: ['Mongoose', 'MongoDB', 'TypeScript'],
    tags: ['database', 'mongodb', 'mongoose', 'nosql'],
    alternativeTo: ['drizzle-database', 'prisma-database'],
    modules: [
      { id: 'mongoose-engineer', category: 'agents' },
      { id: 'json-data-auditor', category: 'skills' },
    ],
  },

  // ===================
  // API BUNDLES
  // ===================
  {
    id: 'hono-api',
    name: 'Hono API',
    description: 'Hono framework for high-performance APIs',
    category: 'api',
    longDescription:
      'API development with Hono framework including middleware, validation, and error handling.',
    techStack: ['Hono', 'Zod', 'TypeScript'],
    tags: ['api', 'hono', 'backend'],
    alternativeTo: ['express-api', 'fastify-api', 'nestjs-api'],
    modules: [
      { id: 'hono-engineer', category: 'agents' },
      { id: 'api-app-testing', category: 'skills' },
      { id: 'error-handling-patterns', category: 'skills' },
    ],
  },
  {
    id: 'express-api',
    name: 'Express API',
    description: 'Express.js framework for REST APIs',
    category: 'api',
    longDescription:
      'API development with Express.js including middleware chains, validation, and error handling.',
    techStack: ['Express.js', 'Zod', 'TypeScript', 'Passport.js'],
    tags: ['api', 'express', 'backend'],
    alternativeTo: ['hono-api', 'fastify-api', 'nestjs-api'],
    modules: [
      { id: 'express-engineer', category: 'agents' },
      { id: 'api-app-testing', category: 'skills' },
      { id: 'error-handling-patterns', category: 'skills' },
    ],
  },
  {
    id: 'fastify-api',
    name: 'Fastify API',
    description: 'Fastify framework for high-performance APIs',
    category: 'api',
    longDescription:
      'High-performance API development with Fastify plugin architecture and schema validation.',
    techStack: ['Fastify', 'TypeBox', 'TypeScript', 'Pino'],
    tags: ['api', 'fastify', 'backend', 'performance'],
    alternativeTo: ['hono-api', 'express-api', 'nestjs-api'],
    modules: [
      { id: 'fastify-engineer', category: 'agents' },
      { id: 'api-app-testing', category: 'skills' },
      { id: 'error-handling-patterns', category: 'skills' },
    ],
  },
  {
    id: 'nestjs-api',
    name: 'NestJS API',
    description: 'NestJS framework for enterprise APIs',
    category: 'api',
    longDescription:
      'Enterprise API development with NestJS dependency injection and modular architecture.',
    techStack: ['NestJS', 'TypeScript', 'class-validator', 'TypeORM'],
    tags: ['api', 'nestjs', 'backend', 'enterprise'],
    alternativeTo: ['hono-api', 'express-api', 'fastify-api'],
    modules: [
      { id: 'nestjs-engineer', category: 'agents' },
      { id: 'api-app-testing', category: 'skills' },
      { id: 'error-handling-patterns', category: 'skills' },
    ],
  },

  // ===================
  // FRONTEND BUNDLES
  // ===================
  {
    id: 'react-ui',
    name: 'React UI Development',
    description: 'React component development with Shadcn UI',
    category: 'frontend',
    longDescription:
      'React component development bundle with Shadcn UI, accessibility, and design system tools.',
    techStack: ['React', 'Shadcn UI', 'Tailwind CSS', 'Radix UI'],
    tags: ['react', 'ui', 'components'],
    modules: [
      { id: 'react-senior-dev', category: 'agents' },
      { id: 'ux-ui-designer', category: 'agents' },
      { id: 'shadcn-specialist', category: 'skills' },
      { id: 'brand-guidelines', category: 'skills' },
      { id: 'accessibility-audit', category: 'skills' },
    ],
  },
  {
    id: 'react-forms',
    name: 'React Forms',
    description: 'React Hook Form with Zod validation',
    category: 'frontend',
    longDescription:
      'Form handling patterns with React Hook Form and Zod validation. Includes Shadcn form integration.',
    techStack: ['React Hook Form', 'Zod', 'React', 'TypeScript'],
    tags: ['react', 'forms', 'validation'],
    modules: [
      { id: 'react-senior-dev', category: 'agents' },
      { id: 'react-hook-form-patterns', category: 'skills' },
      { id: 'shadcn-specialist', category: 'skills' },
    ],
  },
  {
    id: 'react-state-zustand',
    name: 'React State (Zustand)',
    description: 'Zustand for lightweight state management',
    category: 'frontend',
    longDescription:
      'State management with Zustand including slices, persist middleware, and TanStack Query integration.',
    techStack: ['Zustand', 'TanStack Query', 'React', 'TypeScript'],
    tags: ['react', 'state', 'zustand'],
    alternativeTo: ['react-state-redux'],
    modules: [
      { id: 'react-senior-dev', category: 'agents' },
      { id: 'zustand-patterns', category: 'skills' },
      { id: 'tanstack-query-patterns', category: 'skills' },
    ],
  },
  {
    id: 'react-state-redux',
    name: 'React State (Redux)',
    description: 'Redux Toolkit for complex state management',
    category: 'frontend',
    longDescription:
      'State management with Redux Toolkit including RTK Query, async thunks, and enterprise patterns.',
    techStack: ['Redux Toolkit', 'RTK Query', 'React', 'TypeScript'],
    tags: ['react', 'state', 'redux'],
    alternativeTo: ['react-state-zustand'],
    modules: [
      { id: 'react-senior-dev', category: 'agents' },
      { id: 'redux-toolkit-patterns', category: 'skills' },
      { id: 'tanstack-query-patterns', category: 'skills', optional: true },
    ],
  },
  {
    id: 'nextjs-auth',
    name: 'Next.js Authentication',
    description: 'NextAuth.js authentication for Next.js apps',
    category: 'frontend',
    longDescription:
      'Authentication patterns with NextAuth.js including OAuth providers, credentials, sessions, and RBAC.',
    techStack: ['NextAuth.js', 'Auth.js', 'Next.js', 'Prisma'],
    tags: ['nextjs', 'auth', 'oauth'],
    modules: [
      { id: 'nextjs-engineer', category: 'agents' },
      { id: 'nextauth-patterns', category: 'skills' },
      { id: 'security-testing', category: 'skills' },
    ],
  },
  {
    id: 'nextjs-i18n',
    name: 'Next.js Internationalization',
    description: 'Multi-language support for Next.js apps',
    category: 'frontend',
    longDescription:
      'Internationalization with next-intl including locale routing, translations, and formatting.',
    techStack: ['next-intl', 'Next.js', 'React', 'TypeScript'],
    tags: ['nextjs', 'i18n', 'internationalization'],
    modules: [
      { id: 'nextjs-engineer', category: 'agents' },
      { id: 'i18n-specialist', category: 'agents', optional: true },
      { id: 'i18n-patterns', category: 'skills' },
    ],
  },

  // ===================
  // WORKFLOW BUNDLES
  // ===================
  {
    id: 'planning-complete',
    name: 'Complete Planning Workflow',
    description: 'Full planning workflow with PDR, tech analysis, and task tracking',
    category: 'workflow',
    longDescription:
      'Complete planning workflow bundle including product definition, technical analysis, task breakdown, and sync to issue trackers.',
    tags: ['planning', 'workflow', 'pdr'],
    modules: [
      { id: 'product-functional', category: 'agents' },
      { id: 'product-technical', category: 'agents' },
      { id: 'tech-lead', category: 'agents' },
      { id: 'start-feature-plan', category: 'commands' },
      { id: 'start-refactor-plan', category: 'commands' },
      { id: 'sync-planning', category: 'commands' },
      { id: 'decision-tree', category: 'docs' },
      { id: 'phase-1-planning', category: 'docs' },
      { id: 'phase-2-implementation', category: 'docs' },
      { id: 'phase-3-validation', category: 'docs' },
      { id: 'phase-4-finalization', category: 'docs' },
      { id: 'pdr-template', category: 'docs' },
      { id: 'tech-analysis-template', category: 'docs' },
      { id: 'todos-template', category: 'docs' },
    ],
  },
  {
    id: 'documentation-complete',
    name: 'Complete Documentation',
    description: 'All documentation standards, templates, and writing tools',
    category: 'workflow',
    longDescription:
      'Everything for comprehensive documentation including standards, templates, diagrams, and writing guidelines.',
    tags: ['documentation', 'writing', 'standards'],
    modules: [
      { id: 'tech-writer', category: 'agents' },
      { id: 'documentation-writer', category: 'skills' },
      { id: 'mermaid-diagram-specialist', category: 'skills' },
      { id: 'update-docs', category: 'commands' },
      { id: 'markdown-format', category: 'commands' },
      { id: 'documentation-standards', category: 'docs' },
      { id: 'workflow-diagrams', category: 'docs' },
      { id: 'glossary', category: 'docs' },
    ],
  },
  {
    id: 'git-workflow',
    name: 'Git Workflow',
    description: 'Git commit conventions and atomic commit practices',
    category: 'workflow',
    longDescription: 'Git workflow tools including conventional commits and atomic commit helpers.',
    tags: ['git', 'commits', 'workflow'],
    modules: [
      { id: 'git-commit-helper', category: 'skills' },
      { id: 'commit', category: 'commands' },
    ],
  },
];

/**
 * Get all bundles
 */
export function getAllBundles(): BundleDefinition[] {
  return BUNDLES;
}

/**
 * Get bundles by category
 */
export function getBundlesByCategory(category: string): BundleDefinition[] {
  return BUNDLES.filter((b) => b.category === category);
}

/**
 * Get bundle by ID
 */
export function getBundleById(id: string): BundleDefinition | undefined {
  return BUNDLES.find((b) => b.id === id);
}

/**
 * Get bundles grouped by category
 */
export function getBundlesGroupedByCategory(): Record<string, BundleDefinition[]> {
  const grouped: Record<string, BundleDefinition[]> = {};

  for (const bundle of BUNDLES) {
    if (!grouped[bundle.category]) {
      grouped[bundle.category] = [];
    }
    grouped[bundle.category].push(bundle);
  }

  return grouped;
}

/**
 * Category display names
 */
export const BUNDLE_CATEGORY_NAMES: Record<string, string> = {
  stack: 'Tech Stacks',
  testing: 'Testing',
  quality: 'Quality Assurance',
  database: 'Database',
  api: 'API Frameworks',
  frontend: 'Frontend',
  workflow: 'Workflows',
};
