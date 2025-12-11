/**
 * Template placeholder definitions for configurable values
 *
 * These placeholders use the {{PLACEHOLDER}} syntax and are configured
 * during installation or via the `configure` command.
 */

import type {
  TemplateConfigContext,
  TemplatePlaceholderDefinition,
} from '../types/template-config.js';

/**
 * Detect package manager command prefix
 */
function getPackageManagerPrefix(context: TemplateConfigContext): string {
  switch (context.packageManager) {
    case 'yarn':
      return 'yarn';
    case 'bun':
      return 'bun run';
    case 'npm':
      return 'npm run';
    default:
      return 'pnpm';
  }
}

/**
 * Check if a script exists in package.json
 */
function hasScript(context: TemplateConfigContext, name: string): boolean {
  return Boolean(context.scripts?.[name]);
}

/**
 * Get script command if it exists
 */
function getScriptCommand(context: TemplateConfigContext, scriptName: string): string | undefined {
  if (!hasScript(context, scriptName)) return undefined;
  const prefix = getPackageManagerPrefix(context);
  return `${prefix} ${scriptName}`;
}

/**
 * Check if a dependency exists
 */
function hasDependency(context: TemplateConfigContext, name: string): boolean {
  return Boolean(context.dependencies?.[name]);
}

/**
 * All configurable template placeholders
 */
export const TEMPLATE_PLACEHOLDERS: TemplatePlaceholderDefinition[] = [
  // ==========================================
  // COMMANDS CATEGORY
  // ==========================================
  {
    key: 'TYPECHECK_COMMAND',
    pattern: '{{TYPECHECK_COMMAND}}',
    category: 'commands',
    label: 'TypeScript Check Command',
    description: 'Command to run TypeScript type checking',
    inputType: 'text',
    default: (ctx) =>
      getScriptCommand(ctx, 'typecheck') ||
      getScriptCommand(ctx, 'type-check') ||
      getScriptCommand(ctx, 'tsc') ||
      `${getPackageManagerPrefix(ctx)} typecheck`,
    required: true,
    example: 'pnpm typecheck',
  },
  {
    key: 'LINT_COMMAND',
    pattern: '{{LINT_COMMAND}}',
    category: 'commands',
    label: 'Lint Command',
    description: 'Command to run linting (ESLint, Biome, etc.)',
    inputType: 'text',
    default: (ctx) => getScriptCommand(ctx, 'lint') || `${getPackageManagerPrefix(ctx)} lint`,
    required: true,
    example: 'pnpm lint',
  },
  {
    key: 'LINT_FIX_COMMAND',
    pattern: '{{LINT_FIX_COMMAND}}',
    category: 'commands',
    label: 'Lint Fix Command',
    description: 'Command to run linting with auto-fix',
    inputType: 'text',
    default: (ctx) =>
      getScriptCommand(ctx, 'lint:fix') || `${getPackageManagerPrefix(ctx)} lint --fix`,
    required: false,
    relatedTo: ['LINT_COMMAND'],
    example: 'pnpm lint --fix',
  },
  {
    key: 'TEST_COMMAND',
    pattern: '{{TEST_COMMAND}}',
    category: 'commands',
    label: 'Test Command',
    description: 'Command to run tests',
    inputType: 'text',
    default: (ctx) => getScriptCommand(ctx, 'test') || `${getPackageManagerPrefix(ctx)} test`,
    required: true,
    example: 'pnpm test',
  },
  {
    key: 'TEST_WATCH_COMMAND',
    pattern: '{{TEST_WATCH_COMMAND}}',
    category: 'commands',
    label: 'Test Watch Command',
    description: 'Command to run tests in watch mode',
    inputType: 'text',
    default: (ctx) =>
      getScriptCommand(ctx, 'test:watch') || `${getPackageManagerPrefix(ctx)} test --watch`,
    required: false,
    relatedTo: ['TEST_COMMAND'],
    example: 'pnpm test --watch',
  },
  {
    key: 'COVERAGE_COMMAND',
    pattern: '{{COVERAGE_COMMAND}}',
    category: 'commands',
    label: 'Coverage Command',
    description: 'Command to run tests with coverage',
    inputType: 'text',
    default: (ctx) =>
      getScriptCommand(ctx, 'test:coverage') ||
      getScriptCommand(ctx, 'coverage') ||
      `${getPackageManagerPrefix(ctx)} test --coverage`,
    required: true,
    relatedTo: ['TEST_COMMAND'],
    example: 'pnpm test:coverage',
  },
  {
    key: 'BUILD_COMMAND',
    pattern: '{{BUILD_COMMAND}}',
    category: 'commands',
    label: 'Build Command',
    description: 'Command to build the project',
    inputType: 'text',
    default: (ctx) => getScriptCommand(ctx, 'build') || `${getPackageManagerPrefix(ctx)} build`,
    required: false,
    example: 'pnpm build',
  },
  {
    key: 'FORMAT_COMMAND',
    pattern: '{{FORMAT_COMMAND}}',
    category: 'commands',
    label: 'Format Command',
    description: 'Command to format code (Prettier, Biome, etc.)',
    inputType: 'text',
    default: (ctx) => getScriptCommand(ctx, 'format') || `${getPackageManagerPrefix(ctx)} format`,
    required: false,
    example: 'pnpm format',
  },
  {
    key: 'SECURITY_SCAN_COMMAND',
    pattern: '{{SECURITY_SCAN_COMMAND}}',
    category: 'commands',
    label: 'Security Scan Command',
    description: 'Command to run security vulnerability scanning',
    inputType: 'text',
    default: (ctx) => getScriptCommand(ctx, 'audit') || `${getPackageManagerPrefix(ctx)} audit`,
    required: false,
    example: 'pnpm audit',
  },
  {
    key: 'LIGHTHOUSE_COMMAND',
    pattern: '{{LIGHTHOUSE_COMMAND}}',
    category: 'commands',
    label: 'Lighthouse Command',
    description: 'Command to run Lighthouse performance audit',
    inputType: 'text',
    default: 'npx lighthouse http://localhost:3000 --output=json',
    required: false,
    example: 'npx lighthouse http://localhost:3000 --output=json',
  },
  {
    key: 'BUNDLE_ANALYZE_COMMAND',
    pattern: '{{BUNDLE_ANALYZE_COMMAND}}',
    category: 'commands',
    label: 'Bundle Analyze Command',
    description: 'Command to analyze bundle size',
    inputType: 'text',
    default: (ctx) =>
      getScriptCommand(ctx, 'analyze') || `${getPackageManagerPrefix(ctx)} build --analyze`,
    required: false,
    example: 'pnpm build --analyze',
  },

  // ==========================================
  // PATHS CATEGORY
  // ==========================================
  {
    key: 'PLANNING_PATH',
    pattern: '{{PLANNING_PATH}}',
    category: 'paths',
    label: 'Planning Directory',
    description: 'Path for planning session documents',
    inputType: 'path',
    default: '.claude/sessions/planning',
    required: true,
    example: '.claude/sessions/planning',
  },
  {
    key: 'REFACTOR_PATH',
    pattern: '{{REFACTOR_PATH}}',
    category: 'paths',
    label: 'Refactor Directory',
    description: 'Path for refactoring session documents',
    inputType: 'path',
    default: '.claude/sessions/refactor',
    required: false,
    relatedTo: ['PLANNING_PATH'],
    example: '.claude/sessions/refactor',
  },
  {
    key: 'ARCHIVE_PATH',
    pattern: '{{ARCHIVE_PATH}}',
    category: 'paths',
    label: 'Archive Directory',
    description: 'Path for archived planning sessions',
    inputType: 'path',
    default: '.claude/sessions/archive',
    required: false,
    relatedTo: ['PLANNING_PATH'],
    example: '.claude/sessions/archive',
  },
  {
    key: 'SCHEMAS_PATH',
    pattern: '{{SCHEMAS_PATH}}',
    category: 'paths',
    label: 'Schemas Directory',
    description: 'Path for JSON schemas',
    inputType: 'path',
    default: '.claude/schemas',
    required: false,
    example: '.claude/schemas',
  },
  {
    key: 'PROJECT_ROOT',
    pattern: '{{PROJECT_ROOT}}',
    category: 'paths',
    label: 'Project Root',
    description: 'Root directory of the project',
    inputType: 'path',
    default: (ctx) => ctx.projectPath || '.',
    required: true,
    example: '.',
  },

  // ==========================================
  // TARGETS CATEGORY
  // ==========================================
  {
    key: 'COVERAGE_TARGET',
    pattern: '{{COVERAGE_TARGET}}',
    category: 'targets',
    label: 'Coverage Target (%)',
    description: 'Minimum test coverage percentage',
    inputType: 'number',
    default: '90',
    validate: (value) => {
      const num = Number.parseInt(value, 10);
      if (Number.isNaN(num) || num < 0 || num > 100) {
        return 'Coverage must be between 0 and 100';
      }
      return true;
    },
    required: true,
    example: '90',
  },
  {
    key: 'BUNDLE_SIZE_TARGET',
    pattern: '{{BUNDLE_SIZE_TARGET}}',
    category: 'targets',
    label: 'Bundle Size Target (KB)',
    description: 'Maximum bundle size in kilobytes',
    inputType: 'number',
    default: '500',
    validate: (value) => {
      const num = Number.parseInt(value, 10);
      if (Number.isNaN(num) || num < 0) {
        return 'Bundle size must be a positive number';
      }
      return true;
    },
    required: false,
    example: '500',
  },
  {
    key: 'LCP_TARGET',
    pattern: '{{LCP_TARGET}}',
    category: 'performance',
    label: 'LCP Target (ms)',
    description: 'Largest Contentful Paint target in milliseconds',
    inputType: 'number',
    default: '2500',
    required: false,
    example: '2500',
  },
  {
    key: 'FID_TARGET',
    pattern: '{{FID_TARGET}}',
    category: 'performance',
    label: 'FID Target (ms)',
    description: 'First Input Delay target in milliseconds',
    inputType: 'number',
    default: '100',
    required: false,
    example: '100',
  },
  {
    key: 'CLS_TARGET',
    pattern: '{{CLS_TARGET}}',
    category: 'performance',
    label: 'CLS Target',
    description: 'Cumulative Layout Shift target',
    inputType: 'number',
    default: '0.1',
    required: false,
    example: '0.1',
  },
  {
    key: 'API_RESPONSE_TARGET',
    pattern: '{{API_RESPONSE_TARGET}}',
    category: 'performance',
    label: 'API Response Target (ms)',
    description: 'Maximum API response time in milliseconds',
    inputType: 'number',
    default: '200',
    required: false,
    example: '200',
  },
  {
    key: 'DB_QUERY_TARGET',
    pattern: '{{DB_QUERY_TARGET}}',
    category: 'performance',
    label: 'DB Query Target (ms)',
    description: 'Maximum database query time in milliseconds',
    inputType: 'number',
    default: '50',
    required: false,
    example: '50',
  },
  {
    key: 'WCAG_LEVEL',
    pattern: '{{WCAG_LEVEL}}',
    category: 'targets',
    label: 'WCAG Compliance Level',
    description: 'Target WCAG accessibility compliance level',
    inputType: 'select',
    choices: [
      { name: 'Level A (Minimum)', value: 'A' },
      { name: 'Level AA (Recommended)', value: 'AA' },
      { name: 'Level AAA (Highest)', value: 'AAA' },
    ],
    default: 'AA',
    required: false,
    example: 'AA',
  },

  // ==========================================
  // TRACKING CATEGORY
  // ==========================================
  {
    key: 'ISSUE_TRACKER',
    pattern: '{{ISSUE_TRACKER}}',
    category: 'tracking',
    label: 'Issue Tracker',
    description: 'Issue tracking system to use',
    inputType: 'select',
    choices: [
      { name: 'GitHub Issues', value: 'github', description: 'Use GitHub Issues for tracking' },
      { name: 'Linear', value: 'linear', description: 'Use Linear for tracking' },
      { name: 'Jira', value: 'jira', description: 'Use Jira for tracking' },
      { name: 'None', value: 'none', description: 'No issue tracker integration' },
    ],
    default: (ctx) => (ctx.hasGitHubRemote ? 'github' : 'none'),
    required: true,
    example: 'github',
  },
  {
    key: 'TRACKING_FILE',
    pattern: '{{TRACKING_FILE}}',
    category: 'tracking',
    label: 'Tracking File',
    description: 'Path to the task tracking file',
    inputType: 'path',
    default: '.claude/tracking/tasks.json',
    required: false,
    example: '.claude/tracking/tasks.json',
  },
  {
    key: 'REGISTRY_FILE',
    pattern: '{{REGISTRY_FILE}}',
    category: 'tracking',
    label: 'Registry File',
    description: 'Path to the code registry file',
    inputType: 'path',
    default: '.claude/tracking/registry.json',
    required: false,
    example: '.claude/tracking/registry.json',
  },
  {
    key: 'TASK_CODE_PATTERN',
    pattern: '{{TASK_CODE_PATTERN}}',
    category: 'tracking',
    label: 'Task Code Pattern',
    description: 'Pattern for task codes (e.g., PROJ-XXX)',
    inputType: 'text',
    default: 'TASK-',
    required: false,
    example: 'TASK-',
  },
  {
    key: 'CLOSED_DAYS',
    pattern: '{{CLOSED_DAYS}}',
    category: 'tracking',
    label: 'Closed Days Threshold',
    description: 'Days after which closed issues can be cleaned up',
    inputType: 'number',
    default: '30',
    required: false,
    example: '30',
  },
  {
    key: 'STALE_DAYS',
    pattern: '{{STALE_DAYS}}',
    category: 'tracking',
    label: 'Stale Days Threshold',
    description: 'Days of inactivity before an issue is considered stale',
    inputType: 'number',
    default: '14',
    required: false,
    example: '14',
  },

  // ==========================================
  // TECH STACK CATEGORY
  // ==========================================
  {
    key: 'FRONTEND_FRAMEWORK',
    pattern: '{{FRONTEND_FRAMEWORK}}',
    category: 'techStack',
    label: 'Frontend Framework',
    description: 'Primary frontend framework',
    inputType: 'select',
    choices: [
      { name: 'React', value: 'React' },
      { name: 'Next.js', value: 'Next.js' },
      { name: 'TanStack Start', value: 'TanStack Start' },
      { name: 'Vue', value: 'Vue' },
      { name: 'Nuxt', value: 'Nuxt' },
      { name: 'Svelte', value: 'Svelte' },
      { name: 'SvelteKit', value: 'SvelteKit' },
      { name: 'Astro', value: 'Astro' },
      { name: 'SolidJS', value: 'SolidJS' },
      { name: 'Remix', value: 'Remix' },
      { name: 'Angular', value: 'Angular' },
      { name: 'None', value: 'None' },
    ],
    default: (ctx) => {
      if (hasDependency(ctx, '@tanstack/start')) return 'TanStack Start';
      if (hasDependency(ctx, 'next')) return 'Next.js';
      if (hasDependency(ctx, 'nuxt')) return 'Nuxt';
      if (hasDependency(ctx, 'vue')) return 'Vue';
      if (hasDependency(ctx, 'svelte')) return 'Svelte';
      if (hasDependency(ctx, '@sveltejs/kit')) return 'SvelteKit';
      if (hasDependency(ctx, 'astro')) return 'Astro';
      if (hasDependency(ctx, 'solid-js')) return 'SolidJS';
      if (hasDependency(ctx, '@remix-run/react')) return 'Remix';
      if (hasDependency(ctx, '@angular/core')) return 'Angular';
      if (hasDependency(ctx, 'react')) return 'React';
      return 'None';
    },
    required: false,
    example: 'React',
  },
  {
    key: 'DATABASE_ORM',
    pattern: '{{DATABASE_ORM}}',
    category: 'techStack',
    label: 'Database/ORM',
    description: 'Database ORM or query builder',
    inputType: 'select',
    choices: [
      { name: 'Drizzle', value: 'Drizzle' },
      { name: 'Prisma', value: 'Prisma' },
      { name: 'TypeORM', value: 'TypeORM' },
      { name: 'Sequelize', value: 'Sequelize' },
      { name: 'Knex', value: 'Knex' },
      { name: 'Kysely', value: 'Kysely' },
      { name: 'MongoDB/Mongoose', value: 'Mongoose' },
      { name: 'None', value: 'None' },
    ],
    default: (ctx) => {
      if (hasDependency(ctx, 'drizzle-orm')) return 'Drizzle';
      if (hasDependency(ctx, 'prisma') || hasDependency(ctx, '@prisma/client')) return 'Prisma';
      if (hasDependency(ctx, 'typeorm')) return 'TypeORM';
      if (hasDependency(ctx, 'sequelize')) return 'Sequelize';
      if (hasDependency(ctx, 'knex')) return 'Knex';
      if (hasDependency(ctx, 'kysely')) return 'Kysely';
      if (hasDependency(ctx, 'mongoose')) return 'Mongoose';
      return 'None';
    },
    required: false,
    example: 'Drizzle',
  },
  {
    key: 'VALIDATION_LIBRARY',
    pattern: '{{VALIDATION_LIBRARY}}',
    category: 'techStack',
    label: 'Validation Library',
    description: 'Schema validation library',
    inputType: 'select',
    choices: [
      { name: 'Zod', value: 'Zod' },
      { name: 'Yup', value: 'Yup' },
      { name: 'Joi', value: 'Joi' },
      { name: 'Valibot', value: 'Valibot' },
      { name: 'ArkType', value: 'ArkType' },
      { name: 'None', value: 'None' },
    ],
    default: (ctx) => {
      if (hasDependency(ctx, 'zod')) return 'Zod';
      if (hasDependency(ctx, 'yup')) return 'Yup';
      if (hasDependency(ctx, 'joi')) return 'Joi';
      if (hasDependency(ctx, 'valibot')) return 'Valibot';
      if (hasDependency(ctx, 'arktype')) return 'ArkType';
      return 'None';
    },
    required: false,
    example: 'Zod',
  },
  {
    key: 'AUTH_PATTERN',
    pattern: '{{AUTH_PATTERN}}',
    category: 'techStack',
    label: 'Authentication Pattern',
    description: 'Authentication approach',
    inputType: 'select',
    choices: [
      { name: 'Better Auth', value: 'Better Auth' },
      { name: 'Clerk', value: 'Clerk' },
      { name: 'Auth.js (NextAuth)', value: 'Auth.js' },
      { name: 'Lucia', value: 'Lucia' },
      { name: 'Firebase Auth', value: 'Firebase' },
      { name: 'Supabase Auth', value: 'Supabase' },
      { name: 'Kinde', value: 'Kinde' },
      { name: 'WorkOS', value: 'WorkOS' },
      { name: 'Custom JWT', value: 'JWT' },
      { name: 'Session-based', value: 'Session' },
      { name: 'None', value: 'None' },
    ],
    default: (ctx) => {
      if (hasDependency(ctx, 'better-auth')) return 'Better Auth';
      if (hasDependency(ctx, '@clerk/nextjs') || hasDependency(ctx, '@clerk/clerk-react'))
        return 'Clerk';
      if (hasDependency(ctx, 'next-auth') || hasDependency(ctx, '@auth/core')) return 'Auth.js';
      if (hasDependency(ctx, 'lucia')) return 'Lucia';
      if (hasDependency(ctx, 'firebase')) return 'Firebase';
      if (hasDependency(ctx, '@supabase/supabase-js')) return 'Supabase';
      if (hasDependency(ctx, '@kinde-oss/kinde-auth-nextjs')) return 'Kinde';
      if (hasDependency(ctx, '@workos-inc/authkit-nextjs')) return 'WorkOS';
      return 'None';
    },
    required: false,
    example: 'Better Auth',
  },
  {
    key: 'STATE_MANAGEMENT',
    pattern: '{{STATE_MANAGEMENT}}',
    category: 'techStack',
    label: 'State Management',
    description: 'Client-side state management',
    inputType: 'select',
    choices: [
      { name: 'TanStack Query', value: 'TanStack Query' },
      { name: 'Zustand', value: 'Zustand' },
      { name: 'Jotai', value: 'Jotai' },
      { name: 'Redux Toolkit', value: 'Redux' },
      { name: 'MobX', value: 'MobX' },
      { name: 'Recoil', value: 'Recoil' },
      { name: 'Pinia (Vue)', value: 'Pinia' },
      { name: 'None/Context', value: 'None' },
    ],
    default: (ctx) => {
      if (hasDependency(ctx, '@tanstack/react-query')) return 'TanStack Query';
      if (hasDependency(ctx, 'zustand')) return 'Zustand';
      if (hasDependency(ctx, 'jotai')) return 'Jotai';
      if (hasDependency(ctx, '@reduxjs/toolkit')) return 'Redux';
      if (hasDependency(ctx, 'mobx')) return 'MobX';
      if (hasDependency(ctx, 'recoil')) return 'Recoil';
      if (hasDependency(ctx, 'pinia')) return 'Pinia';
      return 'None';
    },
    required: false,
    example: 'TanStack Query',
  },
  {
    key: 'TEST_FRAMEWORK',
    pattern: '{{TEST_FRAMEWORK}}',
    category: 'techStack',
    label: 'Test Framework',
    description: 'Testing framework',
    inputType: 'select',
    choices: [
      { name: 'Vitest', value: 'Vitest' },
      { name: 'Jest', value: 'Jest' },
      { name: 'Mocha', value: 'Mocha' },
      { name: 'Ava', value: 'Ava' },
      { name: 'Node Test Runner', value: 'Node' },
      { name: 'None', value: 'None' },
    ],
    default: (ctx) => {
      if (hasDependency(ctx, 'vitest')) return 'Vitest';
      if (hasDependency(ctx, 'jest')) return 'Jest';
      if (hasDependency(ctx, 'mocha')) return 'Mocha';
      if (hasDependency(ctx, 'ava')) return 'Ava';
      return 'None';
    },
    required: false,
    example: 'Vitest',
  },
  {
    key: 'BUNDLER',
    pattern: '{{BUNDLER}}',
    category: 'techStack',
    label: 'Bundler',
    description: 'Build tool/bundler',
    inputType: 'select',
    choices: [
      { name: 'Vite', value: 'Vite' },
      { name: 'Webpack', value: 'Webpack' },
      { name: 'Rollup', value: 'Rollup' },
      { name: 'esbuild', value: 'esbuild' },
      { name: 'Parcel', value: 'Parcel' },
      { name: 'Turbopack', value: 'Turbopack' },
      { name: 'tsup', value: 'tsup' },
      { name: 'None', value: 'None' },
    ],
    default: (ctx) => {
      if (hasDependency(ctx, 'vite')) return 'Vite';
      if (hasDependency(ctx, 'webpack')) return 'Webpack';
      if (hasDependency(ctx, 'rollup')) return 'Rollup';
      if (hasDependency(ctx, 'esbuild')) return 'esbuild';
      if (hasDependency(ctx, 'parcel')) return 'Parcel';
      if (hasDependency(ctx, 'tsup')) return 'tsup';
      return 'None';
    },
    required: false,
    example: 'Vite',
  },
  {
    key: 'API_FRAMEWORK',
    pattern: '{{API_FRAMEWORK}}',
    category: 'techStack',
    label: 'API Framework',
    description: 'Backend API framework',
    inputType: 'select',
    choices: [
      { name: 'Hono', value: 'Hono' },
      { name: 'Express', value: 'Express' },
      { name: 'Fastify', value: 'Fastify' },
      { name: 'Koa', value: 'Koa' },
      { name: 'NestJS', value: 'NestJS' },
      { name: 'tRPC', value: 'tRPC' },
      { name: 'Next.js API Routes', value: 'Next.js API' },
      { name: 'None', value: 'None' },
    ],
    default: (ctx) => {
      if (hasDependency(ctx, 'hono')) return 'Hono';
      if (hasDependency(ctx, 'express')) return 'Express';
      if (hasDependency(ctx, 'fastify')) return 'Fastify';
      if (hasDependency(ctx, 'koa')) return 'Koa';
      if (hasDependency(ctx, '@nestjs/core')) return 'NestJS';
      if (hasDependency(ctx, '@trpc/server')) return 'tRPC';
      if (hasDependency(ctx, 'next')) return 'Next.js API';
      return 'None';
    },
    required: false,
    example: 'Hono',
  },

  // ==========================================
  // ENVIRONMENT CATEGORY
  // ==========================================
  {
    key: 'GITHUB_TOKEN_ENV',
    pattern: '{{GITHUB_TOKEN_ENV}}',
    category: 'environment',
    label: 'GitHub Token Env Var',
    description: 'Environment variable name for GitHub token',
    inputType: 'envVar',
    default: 'GITHUB_TOKEN',
    required: false,
    example: 'GITHUB_TOKEN',
  },
  {
    key: 'GITHUB_OWNER_ENV',
    pattern: '{{GITHUB_OWNER_ENV}}',
    category: 'environment',
    label: 'GitHub Owner Env Var',
    description: 'Environment variable name for GitHub owner/org',
    inputType: 'envVar',
    default: 'GITHUB_OWNER',
    required: false,
    example: 'GITHUB_OWNER',
  },
  {
    key: 'GITHUB_REPO_ENV',
    pattern: '{{GITHUB_REPO_ENV}}',
    category: 'environment',
    label: 'GitHub Repo Env Var',
    description: 'Environment variable name for GitHub repository',
    inputType: 'envVar',
    default: 'GITHUB_REPO',
    required: false,
    example: 'GITHUB_REPO',
  },
  {
    key: 'ISSUE_TRACKER_TOKEN_ENV',
    pattern: '{{ISSUE_TRACKER_TOKEN_ENV}}',
    category: 'environment',
    label: 'Issue Tracker Token Env Var',
    description: 'Environment variable for issue tracker API token',
    inputType: 'envVar',
    default: (ctx) => {
      // Set based on selected tracker
      const tracker = ctx.values.ISSUE_TRACKER;
      if (tracker === 'linear') return 'LINEAR_API_KEY';
      if (tracker === 'jira') return 'JIRA_API_TOKEN';
      return 'GITHUB_TOKEN';
    },
    dependsOn: ['ISSUE_TRACKER'],
    required: false,
    example: 'GITHUB_TOKEN',
  },

  // ==========================================
  // BRAND CATEGORY
  // ==========================================
  {
    key: 'BRAND_NAME',
    pattern: '{{BRAND_NAME}}',
    category: 'brand',
    label: 'Brand Name',
    description: 'Your brand or product name',
    inputType: 'text',
    default: '',
    required: false,
    example: 'MyProduct',
  },
  {
    key: 'PRIMARY_COLOR',
    pattern: '{{PRIMARY_COLOR}}',
    category: 'brand',
    label: 'Primary Color',
    description: 'Primary brand color (hex)',
    inputType: 'text',
    validate: (value) => {
      if (!value) return true;
      if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
        return 'Must be a valid hex color (e.g., #3B82F6)';
      }
      return true;
    },
    default: '#3B82F6',
    required: false,
    example: '#3B82F6',
  },
  {
    key: 'SECONDARY_COLOR',
    pattern: '{{SECONDARY_COLOR}}',
    category: 'brand',
    label: 'Secondary Color',
    description: 'Secondary brand color (hex)',
    inputType: 'text',
    validate: (value) => {
      if (!value) return true;
      if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
        return 'Must be a valid hex color (e.g., #10B981)';
      }
      return true;
    },
    default: '#10B981',
    required: false,
    example: '#10B981',
  },
  {
    key: 'FONT_FAMILY',
    pattern: '{{FONT_FAMILY}}',
    category: 'brand',
    label: 'Font Family',
    description: 'Primary font family',
    inputType: 'text',
    default: 'Inter, system-ui, sans-serif',
    required: false,
    example: 'Inter, system-ui, sans-serif',
  },
  {
    key: 'TONE_OF_VOICE',
    pattern: '{{TONE_OF_VOICE}}',
    category: 'brand',
    label: 'Tone of Voice',
    description: 'Brand communication tone',
    inputType: 'select',
    choices: [
      { name: 'Professional', value: 'professional' },
      { name: 'Friendly', value: 'friendly' },
      { name: 'Casual', value: 'casual' },
      { name: 'Technical', value: 'technical' },
      { name: 'Playful', value: 'playful' },
    ],
    default: 'professional',
    required: false,
    example: 'professional',
  },
];

/**
 * Get placeholder definition by key
 */
export function getPlaceholderByKey(key: string): TemplatePlaceholderDefinition | undefined {
  return TEMPLATE_PLACEHOLDERS.find((p) => p.key === key);
}

/**
 * Get placeholder definition by pattern
 */
export function getPlaceholderByPattern(
  pattern: string
): TemplatePlaceholderDefinition | undefined {
  return TEMPLATE_PLACEHOLDERS.find((p) => p.pattern === pattern);
}

/**
 * Get all placeholders for a category
 */
export function getPlaceholdersByCategory(category: string): TemplatePlaceholderDefinition[] {
  return TEMPLATE_PLACEHOLDERS.filter((p) => p.category === category);
}

/**
 * Get all required placeholders
 */
export function getRequiredPlaceholders(): TemplatePlaceholderDefinition[] {
  return TEMPLATE_PLACEHOLDERS.filter((p) => p.required);
}

/**
 * Get all placeholder keys
 */
export function getAllPlaceholderKeys(): string[] {
  return TEMPLATE_PLACEHOLDERS.map((p) => p.key);
}

/**
 * Get all placeholder patterns
 */
export function getAllPlaceholderPatterns(): string[] {
  return TEMPLATE_PLACEHOLDERS.map((p) => p.pattern);
}

/**
 * Check if a pattern is a configurable placeholder
 */
export function isConfigurablePlaceholder(pattern: string): boolean {
  return TEMPLATE_PLACEHOLDERS.some((p) => p.pattern === pattern);
}

/**
 * Compute default value for a placeholder
 */
export function computeDefaultValue(
  placeholder: TemplatePlaceholderDefinition,
  context: TemplateConfigContext
): string | undefined {
  if (typeof placeholder.default === 'function') {
    return placeholder.default(context);
  }
  return placeholder.default;
}
