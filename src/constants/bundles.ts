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
    complexity: 'comprehensive',
    responsibilities: [
      'React component architecture and best practices',
      'TanStack Router file-based routing patterns',
      'Server state management with TanStack Query',
      'Form handling with React Hook Form + Zod',
      'UI components with Shadcn/Radix primitives',
    ],
    scope: 'Full frontend stack for React SPAs and admin dashboards',
    useCases: [
      'Admin dashboards and internal tools',
      'Complex single-page applications',
      'Data-heavy applications with tables/forms',
      'Projects using TanStack ecosystem',
    ],
    moduleDetails: {
      agents: [
        {
          id: 'frontend-engineer',
          role: 'Frontend Development',
          responsibilities: ['Component design', 'State management', 'Performance optimization'],
        },
        {
          id: 'ux-ui-designer',
          role: 'UI/UX Design',
          responsibilities: ['Component styling', 'Accessibility', 'Design system'],
        },
      ],
      skills: [
        { id: 'react-patterns', purpose: 'React component patterns' },
        { id: 'tanstack-start-patterns', purpose: 'TanStack Router/Start patterns' },
        { id: 'web-app-testing', purpose: 'React Testing Library patterns' },
        { id: 'shadcn-specialist', purpose: 'Shadcn UI component usage' },
        { id: 'accessibility-audit', purpose: 'WCAG compliance' },
        { id: 'tanstack-query-patterns', purpose: 'Query/mutation patterns' },
        { id: 'react-hook-form-patterns', purpose: 'Form validation patterns' },
        { id: 'zustand-patterns', purpose: 'Client state management' },
      ],
      commands: [],
      docs: [{ id: 'design-standards', topic: 'UI/UX design standards' }],
    },
    modules: [
      { id: 'frontend-engineer', category: 'agents' },
      { id: 'ux-ui-designer', category: 'agents' },
      { id: 'react-patterns', category: 'skills' },
      { id: 'tanstack-start-patterns', category: 'skills' },
      { id: 'web-app-testing', category: 'skills' },
      { id: 'shadcn-specialist', category: 'skills' },
      { id: 'accessibility-audit', category: 'skills' },
      { id: 'tanstack-query-patterns', category: 'skills' },
      { id: 'react-hook-form-patterns', category: 'skills' },
      { id: 'zustand-patterns', category: 'skills', optional: true },
      { id: 'design-standards', category: 'docs', requiredBy: ['ux-ui-designer'], optional: true },
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
    complexity: 'standard',
    responsibilities: [
      'Static site generation with Astro',
      'Interactive React islands for dynamic content',
      'SEO optimization and meta tags',
      'Performance-first architecture',
      'Content management with MDX',
    ],
    scope: 'Content-focused websites with selective interactivity',
    useCases: [
      'Marketing and landing pages',
      'Documentation sites',
      'Blogs and content platforms',
      'Portfolio websites',
    ],
    moduleDetails: {
      agents: [
        {
          id: 'frontend-engineer',
          role: 'Frontend Development',
          responsibilities: ['Routing', 'Islands architecture', 'Build optimization'],
        },
        {
          id: 'seo-ai-specialist',
          role: 'SEO Optimization',
          responsibilities: ['Meta tags', 'Structured data', 'Performance'],
        },
      ],
      skills: [
        { id: 'astro-patterns', purpose: 'Astro-specific patterns' },
        { id: 'react-patterns', purpose: 'React island components' },
        { id: 'web-app-testing', purpose: 'Component testing' },
        { id: 'vercel-specialist', purpose: 'Deployment optimization' },
        { id: 'performance-audit', purpose: 'Core Web Vitals' },
      ],
      commands: [],
      docs: [],
    },
    modules: [
      { id: 'frontend-engineer', category: 'agents' },
      { id: 'seo-ai-specialist', category: 'agents' },
      { id: 'astro-patterns', category: 'skills' },
      { id: 'react-patterns', category: 'skills' },
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
    complexity: 'comprehensive',
    alternativeTo: ['react-tanstack-stack', 'astro-react-stack'],
    responsibilities: [
      'Full-stack React with Next.js App Router',
      'Database modeling with Prisma ORM',
      'Server Actions and API routes',
      'Authentication with NextAuth.js',
      'Deployment on Vercel',
    ],
    scope: 'Complete full-stack web application development',
    useCases: [
      'SaaS applications',
      'E-commerce platforms',
      'Full-stack web apps with auth',
      'Projects needing SSR/SSG flexibility',
    ],
    moduleDetails: {
      agents: [
        {
          id: 'frontend-engineer',
          role: 'Frontend Development',
          responsibilities: ['App Router', 'Server Actions', 'Client components'],
        },
        {
          id: 'database-engineer',
          role: 'Database',
          responsibilities: ['Schema design', 'Migrations', 'Query optimization'],
        },
        {
          id: 'ux-ui-designer',
          role: 'UI/UX',
          responsibilities: ['Design system', 'Responsive design'],
        },
      ],
      skills: [
        { id: 'nextjs-patterns', purpose: 'Next.js App Router patterns' },
        { id: 'react-patterns', purpose: 'React component patterns' },
        { id: 'prisma-patterns', purpose: 'Prisma ORM patterns' },
        { id: 'web-app-testing', purpose: 'Next.js testing patterns' },
        { id: 'shadcn-specialist', purpose: 'UI components' },
        { id: 'vercel-specialist', purpose: 'Deployment' },
        { id: 'tanstack-query-patterns', purpose: 'Client data fetching' },
        { id: 'react-hook-form-patterns', purpose: 'Form handling' },
        { id: 'nextauth-patterns', purpose: 'Authentication' },
      ],
      commands: [],
      docs: [],
    },
    modules: [
      { id: 'frontend-engineer', category: 'agents' },
      { id: 'database-engineer', category: 'agents' },
      { id: 'ux-ui-designer', category: 'agents' },
      { id: 'nextjs-patterns', category: 'skills' },
      { id: 'react-patterns', category: 'skills' },
      { id: 'prisma-patterns', category: 'skills' },
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
    complexity: 'standard',
    alternativeTo: ['hono-drizzle-stack'],
    responsibilities: [
      'RESTful API design with Express',
      'Database access with Prisma ORM',
      'Request validation with Zod',
      'Error handling and logging',
      'Authentication middleware',
    ],
    scope: 'Backend API development with traditional Express patterns',
    useCases: [
      'REST APIs for mobile apps',
      'Backend services for SPAs',
      'Microservices',
      'Projects needing Express ecosystem',
    ],
    moduleDetails: {
      agents: [
        {
          id: 'api-engineer',
          role: 'API Development',
          responsibilities: ['Route design', 'Middleware', 'Error handling'],
        },
        {
          id: 'database-engineer',
          role: 'Database',
          responsibilities: ['Schema', 'Migrations', 'Queries'],
        },
        {
          id: 'node-typescript-engineer',
          role: 'Node.js/TypeScript',
          responsibilities: ['Type safety', 'Build config', 'Shared packages'],
        },
      ],
      skills: [
        { id: 'express-patterns', purpose: 'Express.js patterns' },
        { id: 'prisma-patterns', purpose: 'Prisma ORM patterns' },
        { id: 'api-app-testing', purpose: 'API testing with supertest' },
        { id: 'error-handling-patterns', purpose: 'Error middleware' },
        { id: 'security-testing', purpose: 'Security best practices' },
      ],
      commands: [],
      docs: [{ id: 'architecture-patterns', topic: 'API architecture patterns' }],
    },
    modules: [
      { id: 'api-engineer', category: 'agents' },
      { id: 'database-engineer', category: 'agents' },
      { id: 'node-typescript-engineer', category: 'agents' },
      { id: 'express-patterns', category: 'skills' },
      { id: 'prisma-patterns', category: 'skills' },
      { id: 'api-app-testing', category: 'skills' },
      { id: 'error-handling-patterns', category: 'skills' },
      { id: 'security-testing', category: 'skills' },
      { id: 'architecture-patterns', category: 'docs', optional: true },
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
    complexity: 'standard',
    alternativeTo: ['express-prisma-stack'],
    responsibilities: [
      'High-performance APIs with Hono',
      'Type-safe database queries with Drizzle',
      'Schema validation with Zod',
      'Edge-ready deployment',
      'Monorepo-friendly architecture',
    ],
    scope: 'Modern, type-safe backend API development',
    useCases: [
      'Edge/serverless APIs',
      'Type-safe monorepo backends',
      'High-performance REST APIs',
      'Projects prioritizing type safety',
    ],
    moduleDetails: {
      agents: [
        {
          id: 'api-engineer',
          role: 'API Development',
          responsibilities: ['Route handlers', 'Middleware', 'OpenAPI integration'],
        },
        {
          id: 'database-engineer',
          role: 'Database',
          responsibilities: ['Schema design', 'Migrations', 'Type-safe queries'],
        },
        {
          id: 'node-typescript-engineer',
          role: 'TypeScript/Node',
          responsibilities: ['Type inference', 'Build setup', 'Shared types'],
        },
      ],
      skills: [
        { id: 'hono-patterns', purpose: 'Hono framework patterns' },
        { id: 'drizzle-patterns', purpose: 'Drizzle ORM patterns' },
        { id: 'api-app-testing', purpose: 'Hono testing patterns' },
        { id: 'error-handling-patterns', purpose: 'Error middleware' },
        { id: 'security-testing', purpose: 'Security validation' },
      ],
      commands: [],
      docs: [{ id: 'architecture-patterns', topic: 'API architecture patterns' }],
    },
    modules: [
      { id: 'api-engineer', category: 'agents' },
      { id: 'database-engineer', category: 'agents' },
      { id: 'node-typescript-engineer', category: 'agents' },
      { id: 'hono-patterns', category: 'skills' },
      { id: 'drizzle-patterns', category: 'skills' },
      { id: 'api-app-testing', category: 'skills' },
      { id: 'error-handling-patterns', category: 'skills' },
      { id: 'security-testing', category: 'skills' },
      { id: 'architecture-patterns', category: 'docs', optional: true },
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
    complexity: 'comprehensive',
    responsibilities: [
      'TDD workflow enforcement (Red-Green-Refactor)',
      'Unit, integration, and E2E testing patterns',
      'API testing with mocking and fixtures',
      'Performance testing and benchmarking',
      'QA validation and acceptance criteria',
    ],
    scope: 'Complete testing strategy from unit tests to E2E',
    useCases: [
      'Projects requiring 90%+ test coverage',
      'TDD-first development workflow',
      'API-heavy applications needing thorough testing',
      'Projects with QA validation requirements',
    ],
    moduleDetails: {
      agents: [
        {
          id: 'qa-engineer',
          role: 'Quality Assurance',
          responsibilities: [
            'Test planning and strategy',
            'Acceptance criteria validation',
            'Bug triage and reporting',
          ],
        },
      ],
      skills: [
        { id: 'tdd-methodology', purpose: 'TDD workflow and best practices' },
        { id: 'web-app-testing', purpose: 'Frontend testing patterns' },
        { id: 'api-app-testing', purpose: 'API and backend testing' },
        { id: 'performance-testing', purpose: 'Performance benchmarks' },
        { id: 'qa-criteria-validator', purpose: 'Acceptance validation' },
      ],
      commands: [{ id: 'run-tests', usage: '/run-tests --coverage' }],
      docs: [{ id: 'testing-standards', topic: 'Testing conventions and standards' }],
    },
    modules: [
      { id: 'qa-engineer', category: 'agents' },
      { id: 'tdd-methodology', category: 'skills' },
      { id: 'web-app-testing', category: 'skills' },
      { id: 'api-app-testing', category: 'skills' },
      { id: 'performance-testing', category: 'skills' },
      { id: 'qa-criteria-validator', category: 'skills' },
      { id: 'run-tests', category: 'commands' },
      // Doc required by QA agent and TDD skill
      { id: 'testing-standards', category: 'docs', requiredBy: ['qa-engineer', 'tdd-methodology'] },
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
    complexity: 'minimal',
    responsibilities: [
      'Basic TDD workflow support',
      'Unit and integration testing',
      'Test execution and reporting',
    ],
    scope: 'Essential testing for small to medium projects',
    useCases: [
      'Small projects with basic testing needs',
      'Quick prototypes needing some test coverage',
      'Projects where full QA suite is overkill',
    ],
    moduleDetails: {
      agents: [],
      skills: [
        { id: 'tdd-methodology', purpose: 'TDD workflow basics' },
        { id: 'api-app-testing', purpose: 'API testing patterns' },
      ],
      commands: [{ id: 'run-tests', usage: '/run-tests' }],
      docs: [],
    },
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
    complexity: 'comprehensive',
    responsibilities: [
      'Security vulnerability detection and prevention',
      'Performance profiling and optimization guidance',
      'Accessibility compliance (WCAG) validation',
      'Code quality review and best practices',
      'Bug investigation and debugging assistance',
    ],
    scope: 'Complete quality assurance across security, performance, and accessibility',
    useCases: [
      'Enterprise applications with strict security requirements',
      'Public-facing apps needing accessibility compliance',
      'Performance-critical applications',
      'Projects requiring comprehensive code reviews',
    ],
    moduleDetails: {
      agents: [
        {
          id: 'qa-engineer',
          role: 'Quality Assurance Lead',
          responsibilities: [
            'Test strategy and coverage',
            'Acceptance criteria validation',
            'Quality metrics tracking',
          ],
        },
        {
          id: 'debugger',
          role: 'Debug Specialist',
          responsibilities: ['Root cause analysis', 'Bug reproduction', 'Fix verification'],
        },
      ],
      skills: [
        { id: 'security-audit', purpose: 'OWASP vulnerability scanning' },
        { id: 'security-testing', purpose: 'Security test patterns' },
        { id: 'performance-audit', purpose: 'Performance bottleneck detection' },
        { id: 'performance-testing', purpose: 'Load and stress testing' },
        { id: 'accessibility-audit', purpose: 'WCAG compliance checking' },
        { id: 'qa-criteria-validator', purpose: 'Acceptance criteria validation' },
      ],
      commands: [
        { id: 'quality-check', usage: '/quality-check' },
        { id: 'code-check', usage: '/code-check src/' },
        { id: 'review-code', usage: '/review-code --thorough' },
        { id: 'review-security', usage: '/review-security' },
        { id: 'review-performance', usage: '/review-performance' },
      ],
      docs: [
        { id: 'code-standards', topic: 'Code quality standards' },
        { id: 'atomic-commits', topic: 'Atomic commit practices' },
      ],
    },
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
      // Docs required by agents
      { id: 'code-standards', category: 'docs', requiredBy: ['qa-engineer'] },
      { id: 'atomic-commits', category: 'docs', optional: true },
    ],
  },
  {
    id: 'quality-minimal',
    name: 'Minimal Quality',
    description: 'Essential quality checks for everyday development',
    category: 'quality',
    longDescription: 'Core quality tools without the full audit suite.',
    tags: ['quality', 'minimal'],
    complexity: 'minimal',
    responsibilities: [
      'Basic code quality checks',
      'Quick code reviews',
      'Lint and format validation',
    ],
    scope: 'Essential quality checks for day-to-day development',
    useCases: [
      'Small projects with basic quality needs',
      'Quick PRs needing fast review',
      'Projects where full audits are overkill',
    ],
    moduleDetails: {
      agents: [],
      skills: [],
      commands: [
        { id: 'quality-check', usage: '/quality-check' },
        { id: 'code-check', usage: '/code-check' },
        { id: 'review-code', usage: '/review-code' },
      ],
      docs: [],
    },
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
      { id: 'database-engineer', category: 'agents' },
      { id: 'drizzle-patterns', category: 'skills' },
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
      { id: 'database-engineer', category: 'agents' },
      { id: 'prisma-patterns', category: 'skills' },
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
      { id: 'database-engineer', category: 'agents' },
      { id: 'mongoose-patterns', category: 'skills' },
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
      { id: 'api-engineer', category: 'agents' },
      { id: 'hono-patterns', category: 'skills' },
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
      { id: 'api-engineer', category: 'agents' },
      { id: 'express-patterns', category: 'skills' },
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
      { id: 'api-engineer', category: 'agents' },
      { id: 'fastify-patterns', category: 'skills' },
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
      { id: 'api-engineer', category: 'agents' },
      { id: 'nestjs-patterns', category: 'skills' },
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
      { id: 'frontend-engineer', category: 'agents' },
      { id: 'ux-ui-designer', category: 'agents' },
      { id: 'react-patterns', category: 'skills' },
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
      { id: 'frontend-engineer', category: 'agents' },
      { id: 'react-patterns', category: 'skills' },
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
      { id: 'frontend-engineer', category: 'agents' },
      { id: 'react-patterns', category: 'skills' },
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
      { id: 'frontend-engineer', category: 'agents' },
      { id: 'react-patterns', category: 'skills' },
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
      { id: 'frontend-engineer', category: 'agents' },
      { id: 'nextjs-patterns', category: 'skills' },
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
      { id: 'frontend-engineer', category: 'agents' },
      { id: 'i18n-specialist', category: 'agents', optional: true },
      { id: 'nextjs-patterns', category: 'skills' },
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
    complexity: 'comprehensive',
    responsibilities: [
      'Feature planning from requirements to implementation tasks',
      'Technical analysis and architecture decision documentation',
      'Task breakdown with atomic task methodology',
      'Integration with issue trackers (GitHub, Linear)',
    ],
    scope: 'End-to-end planning workflow for features, refactors, and epics',
    useCases: [
      'Starting a new feature from scratch',
      'Planning a major refactor or migration',
      'Breaking down epics into manageable tasks',
      'Documenting technical decisions (ADRs)',
    ],
    moduleDetails: {
      agents: [
        {
          id: 'product-functional',
          role: 'Product Requirements',
          responsibilities: [
            'Create PDR documents',
            'Define acceptance criteria',
            'User story mapping',
          ],
        },
        {
          id: 'product-technical',
          role: 'Technical Analysis',
          responsibilities: ['Architecture decisions', 'Tech stack evaluation', 'Risk assessment'],
        },
        {
          id: 'tech-lead',
          role: 'Coordination & Task Breakdown',
          responsibilities: ['Task atomization', 'Workflow selection', 'Team coordination'],
        },
      ],
      skills: [],
      commands: [
        { id: 'start-feature-plan', usage: '/start-feature-plan "User authentication"' },
        { id: 'start-refactor-plan', usage: '/start-refactor-plan "Database optimization"' },
        { id: 'sync-planning', usage: '/sync-planning' },
      ],
      docs: [
        { id: 'decision-tree', topic: 'Workflow selection guide' },
        { id: 'phase-1-planning', topic: 'Planning phase methodology' },
        { id: 'phase-2-implementation', topic: 'Implementation phase guide' },
        { id: 'phase-3-validation', topic: 'Validation and QA phase' },
        { id: 'phase-4-finalization', topic: 'Closing and documentation' },
        { id: 'pdr-template', topic: 'Product Definition Record template' },
        { id: 'tech-analysis-template', topic: 'Technical analysis template' },
        { id: 'todos-template', topic: 'Task tracking template' },
      ],
    },
    modules: [
      { id: 'product-functional', category: 'agents' },
      { id: 'product-technical', category: 'agents' },
      { id: 'tech-lead', category: 'agents' },
      { id: 'start-feature-plan', category: 'commands' },
      { id: 'start-refactor-plan', category: 'commands' },
      { id: 'sync-planning', category: 'commands' },
      // Required docs - needed for agents to work properly
      { id: 'decision-tree', category: 'docs', requiredBy: ['tech-lead'] },
      {
        id: 'phase-1-planning',
        category: 'docs',
        requiredBy: ['product-functional', 'product-technical'],
      },
      { id: 'phase-2-implementation', category: 'docs', requiredBy: ['tech-lead'] },
      { id: 'phase-3-validation', category: 'docs' },
      { id: 'phase-4-finalization', category: 'docs' },
      { id: 'pdr-template', category: 'docs', requiredBy: ['product-functional'] },
      { id: 'tech-analysis-template', category: 'docs', requiredBy: ['product-technical'] },
      { id: 'todos-template', category: 'docs', requiredBy: ['tech-lead'] },
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
    complexity: 'standard',
    responsibilities: [
      'Technical documentation writing',
      'API documentation generation',
      'Architecture diagram creation',
      'Markdown formatting and standards',
      'Glossary and terminology management',
    ],
    scope: 'Complete documentation workflow for technical projects',
    useCases: [
      'Creating and maintaining project documentation',
      'Writing API and SDK documentation',
      'Creating architecture diagrams',
      'Standardizing documentation across team',
    ],
    moduleDetails: {
      agents: [
        {
          id: 'tech-writer',
          role: 'Technical Writer',
          responsibilities: ['Documentation structure', 'Content writing', 'Style consistency'],
        },
      ],
      skills: [
        { id: 'markdown-formatter', purpose: 'Markdown formatting' },
        { id: 'mermaid-diagram-specialist', purpose: 'Diagram creation' },
      ],
      commands: [
        { id: 'update-docs', usage: '/update-docs' },
        { id: 'markdown-format', usage: '/markdown-format' },
      ],
      docs: [
        { id: 'documentation-standards', topic: 'Documentation conventions' },
        { id: 'workflow-diagrams', topic: 'Diagram templates' },
        { id: 'glossary', topic: 'Project terminology' },
      ],
    },
    modules: [
      { id: 'tech-writer', category: 'agents' },
      { id: 'markdown-formatter', category: 'skills' },
      { id: 'mermaid-diagram-specialist', category: 'skills' },
      { id: 'update-docs', category: 'commands' },
      { id: 'markdown-format', category: 'commands' },
      { id: 'documentation-standards', category: 'docs', requiredBy: ['tech-writer'] },
      { id: 'workflow-diagrams', category: 'docs', optional: true },
      { id: 'glossary', category: 'docs', optional: true },
    ],
  },
  {
    id: 'git-workflow',
    name: 'Git Workflow',
    description: 'Git commit conventions and atomic commit practices',
    category: 'workflow',
    longDescription: 'Git workflow tools including conventional commits and atomic commit helpers.',
    tags: ['git', 'commits', 'workflow'],
    complexity: 'minimal',
    responsibilities: [
      'Conventional commit message formatting',
      'Atomic commit enforcement',
      'Commit message generation',
    ],
    scope: 'Git commit workflow and conventions',
    useCases: [
      'Enforcing commit message standards',
      'Generating semantic commit messages',
      'Following atomic commit practices',
    ],
    moduleDetails: {
      agents: [],
      skills: [{ id: 'git-commit-helper', purpose: 'Commit message patterns' }],
      commands: [{ id: 'commit', usage: '/commit' }],
      docs: [{ id: 'atomic-commits', topic: 'Atomic commit guidelines' }],
    },
    modules: [
      { id: 'git-commit-helper', category: 'skills' },
      { id: 'commit', category: 'commands' },
      { id: 'atomic-commits', category: 'docs', optional: true },
    ],
  },
  {
    id: 'cicd-github-actions',
    name: 'GitHub Actions CI/CD',
    description: 'GitHub Actions workflows for CI/CD automation',
    category: 'workflow',
    longDescription:
      'Complete CI/CD setup with GitHub Actions including testing, quality checks, security scanning, and deployment workflows.',
    techStack: ['GitHub Actions', 'Node.js', 'PNPM'],
    tags: ['cicd', 'github', 'automation', 'devops'],
    complexity: 'standard',
    responsibilities: [
      'Continuous Integration workflows',
      'Automated testing on PRs',
      'Code quality checks',
      'Security scanning',
      'Deployment automation',
    ],
    scope: 'CI/CD pipeline automation with GitHub Actions',
    useCases: [
      'Automating test runs on PRs',
      'Automated deployments to staging/production',
      'Code quality gates',
      'Security vulnerability scanning',
    ],
    moduleDetails: {
      agents: [],
      skills: [{ id: 'github-actions-specialist', purpose: 'GitHub Actions workflow patterns' }],
      commands: [],
      docs: [{ id: 'cicd-workflows', topic: 'CI/CD workflow documentation' }],
    },
    modules: [
      { id: 'github-actions-specialist', category: 'skills', optional: true },
      { id: 'cicd-workflows', category: 'docs', optional: true },
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
  cicd: 'CI/CD & DevOps',
};
