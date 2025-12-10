# Improvements Design Document

## Overview

This document outlines the comprehensive improvements to the CLI configuration tool.

---

## 1. Module Bundle System

### New Data Structures

```typescript
// src/types/bundles.ts

export interface BundleDefinition {
  id: string;
  name: string;
  description: string;
  longDescription: string; // Detailed explanation
  icon: string; // Emoji for visual identification
  agents: string[];
  skills: string[];
  commands: string[];
  docs: string[];
  mcpServers?: string[]; // Related MCP servers
  relatedBundles?: string[]; // Bundles that work well together
  techStack?: string[]; // Technologies this bundle supports
}

export type BundleCategory =
  | 'testing-qa'
  | 'backend'
  | 'frontend'
  | 'database'
  | 'devops'
  | 'planning'
  | 'documentation'
  | 'security'
  | 'performance';
```

### Proposed Bundles

| Bundle | Agents | Skills | Commands | MCP Servers |
|--------|--------|--------|----------|-------------|
| **Testing & QA** | qa-engineer, debugger | tdd-methodology, web-app-testing, api-app-testing, qa-criteria-validator | quality-check, run-tests, review-code | chrome-devtools, playwright |
| **Security** | - | security-testing, security-audit | review-security | socket, semgrep |
| **Backend Core** | node-typescript-engineer | error-handling-patterns | add-new-entity | - |
| **Database - Drizzle/PostgreSQL** | db-drizzle-engineer | - | - | postgres, neon |
| **Database - Prisma** | db-prisma-engineer | - | - | postgres, neon, planetscale |
| **Database - MongoDB** | db-mongodb-engineer | - | - | mongodb |
| **API - Hono** | hono-engineer | - | - | - |
| **API - Express** | express-engineer | - | - | - |
| **API - Fastify** | fastify-engineer | - | - | - |
| **API - NestJS** | nestjs-engineer | - | - | - |
| **API - tRPC** | trpc-engineer | - | - | - |
| **Frontend - React** | react-senior-dev | shadcn-specialist, brand-guidelines | - | - |
| **Frontend - Next.js** | nextjs-engineer | - | - | vercel |
| **Frontend - Astro** | astro-engineer | - | - | - |
| **Frontend - Nuxt/Vue** | nuxt-engineer | - | - | - |
| **Frontend - SvelteKit** | sveltekit-engineer | - | - | - |
| **UI - Shadcn** | - | shadcn-specialist | - | - |
| **UI - MUI** | - | mui-specialist | - | - |
| **UI - Chakra** | - | chakra-specialist | - | - |
| **UI - Mantine** | - | mantine-specialist | - | - |
| **State - Redux** | - | redux-patterns | - | - |
| **State - Zustand** | - | zustand-patterns | - | - |
| **Auth - Clerk** | - | clerk-integration | - | - |
| **Auth - Auth.js** | - | authjs-integration | - | - |
| **Design & UX** | ux-ui-designer | brand-guidelines | - | figma |
| **Planning & Architecture** | product-functional, product-technical, tech-lead | - | start-feature-plan, start-refactor-plan, sync-planning | linear, sequential-thinking |
| **Documentation** | tech-writer, seo-ai-specialist | documentation-writer, markdown-formatter | update-docs, format-markdown | notion |
| **Git & DevOps** | - | git-commit-helper | commit, code-check | git, github |
| **Performance** | - | performance-testing, performance-audit | review-performance | - |
| **Deployment - Vercel** | - | vercel-specialist | - | vercel |
| **Monorepo - Turborepo** | - | turborepo-patterns | - | - |
| **Monorepo - Nx** | - | nx-patterns | - | - |

---

## 2. Enhanced Module Descriptions

### New Registry Schema

```typescript
// Enhanced RegistryFileItem
export interface RegistryFileItem {
  id: string;
  name: string;
  description: string; // Short (1 line)
  longDescription?: string; // Detailed (paragraph)
  file: string;
  dependencies?: string[];
  tags?: string[];
  // NEW fields:
  whatItDoes?: string[]; // Bullet points of capabilities
  whenToUse?: string[]; // Use case scenarios
  techStack?: string[]; // Technologies it supports
  alternativeTo?: string[]; // Other modules it can replace
  bundle?: string; // Bundle this belongs to
}
```

### Example Enhanced Registry Entry

```json
{
  "id": "db-drizzle-engineer",
  "name": "DB Drizzle Engineer",
  "description": "Database design and development with Drizzle ORM",
  "longDescription": "Expert in designing and implementing database solutions using Drizzle ORM. Handles schema design, migrations, query optimization, and type-safe database operations for PostgreSQL, MySQL, and SQLite.",
  "file": "engineering/db-drizzle-engineer.md",
  "tags": ["backend", "database", "drizzle", "orm"],
  "whatItDoes": [
    "Design and implement database schemas",
    "Create and manage migrations",
    "Write type-safe queries with Drizzle",
    "Optimize query performance",
    "Handle database relationships"
  ],
  "whenToUse": [
    "Building applications with PostgreSQL, MySQL, or SQLite",
    "Need type-safe database operations",
    "Want lightweight ORM with SQL-like syntax",
    "Prefer explicit over magic (vs Prisma)"
  ],
  "techStack": ["drizzle-orm", "postgresql", "mysql", "sqlite"],
  "alternativeTo": ["db-prisma-engineer", "db-typeorm-engineer"],
  "bundle": "database-drizzle"
}
```

---

## 3. MCP Keys - Optional with Post-Install Instructions

### Modified MCP Type

```typescript
// Update McpConfigField
export interface McpConfigField {
  name: string;
  type: 'string' | 'boolean' | 'number';
  required: boolean; // Keep required flag for validation
  description: string;
  envVar?: string;
  default?: string | boolean | number;
  // NEW fields:
  howToGet?: string; // URL or instructions to get the key
  scopes?: string[]; // Required scopes/permissions
  example?: string; // Example value format
}
```

### Enhanced MCP Server Definition

```typescript
{
  id: 'github',
  name: 'GitHub',
  description: 'GitHub API integration (issues, PRs, repos)',
  package: '@modelcontextprotocol/server-github',
  category: 'version-control',
  requiresConfig: true,
  configFields: [
    {
      name: 'token',
      type: 'string',
      required: true,
      description: 'GitHub Personal Access Token',
      envVar: 'GITHUB_TOKEN',
      howToGet: 'https://github.com/settings/tokens/new',
      scopes: ['repo', 'read:org', 'read:user'],
      example: 'ghp_xxxxxxxxxxxxxxxxxxxx'
    }
  ]
}
```

### Post-Install Instructions Table

When keys are skipped, show:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ MCP Server Configuration Required                                            │
├─────────────┬───────────────────────────────────────────────────────────────┤
│ Server      │ Configuration                                                  │
├─────────────┼───────────────────────────────────────────────────────────────┤
│ GitHub      │ Get token: https://github.com/settings/tokens/new             │
│             │ Scopes: repo, read:org                                         │
│             │ Env var: GITHUB_TOKEN                                          │
├─────────────┼───────────────────────────────────────────────────────────────┤
│ Vercel      │ Get token: https://vercel.com/account/tokens                  │
│             │ Scope: Full Account                                            │
│             │ Env var: VERCEL_TOKEN                                          │
├─────────────┼───────────────────────────────────────────────────────────────┤
│ Stripe      │ Get key: https://dashboard.stripe.com/apikeys                 │
│             │ Use: Secret key (sk_test_... or sk_live_...)                  │
│             │ Env var: STRIPE_SECRET_KEY                                     │
└─────────────┴───────────────────────────────────────────────────────────────┘

Configure in: .claude/settings.local.json (project) or ~/.claude/settings.json (global)
```

---

## 4. Code Style Configuration

### New Types

```typescript
// src/types/code-style.ts

export interface CodeStyleConfig {
  enabled: boolean;

  // Editor Config
  editorconfig: {
    enabled: boolean;
    indentStyle: 'space' | 'tab';
    indentSize: 2 | 4 | 8;
    endOfLine: 'lf' | 'crlf';
    charset: 'utf-8' | 'utf-8-bom' | 'latin1';
    trimTrailingWhitespace: boolean;
    insertFinalNewline: boolean;
  };

  // Formatter (Biome or Prettier)
  formatter: {
    tool: 'biome' | 'prettier' | 'none';
    printWidth: number; // 80, 100, 120
    tabWidth: number; // 2, 4
    useTabs: boolean;
    semi: boolean;
    singleQuote: boolean;
    trailingComma: 'none' | 'es5' | 'all';
    bracketSpacing: boolean;
    arrowParens: 'avoid' | 'always';
    jsxSingleQuote: boolean;
  };

  // Linter
  linter: {
    tool: 'biome' | 'eslint' | 'none';
    strictMode: boolean;
    noUnusedVars: boolean;
    noAny: boolean;
    preferConst: boolean;
  };

  // Import organization
  imports: {
    organizeImports: boolean;
    sortImports: boolean;
    groupImports: boolean;
  };
}
```

### Generated .editorconfig Template

```ini
# Generated by qazuor-claude-config
root = true

[*]
charset = {{charset}}
end_of_line = {{endOfLine}}
indent_size = {{indentSize}}
indent_style = {{indentStyle}}
insert_final_newline = {{insertFinalNewline}}
trim_trailing_whitespace = {{trimTrailingWhitespace}}

[*.md]
trim_trailing_whitespace = false

[*.{yml,yaml}]
indent_size = 2

[Makefile]
indent_style = tab
```

### Generated biome.json Template

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "formatter": {
    "enabled": true,
    "indentStyle": "{{indentStyle}}",
    "indentWidth": {{indentSize}},
    "lineWidth": {{printWidth}},
    "lineEnding": "{{endOfLine}}"
  },
  "javascript": {
    "formatter": {
      "semicolons": "{{semi ? 'always' : 'asNeeded'}}",
      "quoteStyle": "{{singleQuote ? 'single' : 'double'}}",
      "trailingCommas": "{{trailingComma}}",
      "bracketSpacing": {{bracketSpacing}},
      "arrowParentheses": "{{arrowParens}}"
    }
  },
  "linter": {
    "rules": {
      "correctness": {
        "noUnusedVariables": "{{noUnusedVars ? 'error' : 'off'}}"
      },
      "suspicious": {
        "noExplicitAny": "{{noAny ? 'warn' : 'off'}}"
      },
      "style": {
        "useConst": "{{preferConst ? 'error' : 'off'}}"
      }
    }
  }
}
```

---

## 5. Commitlint Configuration

### New Types

```typescript
// src/types/commitlint.ts

export interface CommitlintConfig {
  enabled: boolean;

  // Commit types allowed
  types: CommitType[];

  // Rules
  rules: {
    headerMaxLength: number; // 72, 100, 120
    bodyMaxLineLength: number; // 100, 200
    subjectCase: 'lower-case' | 'sentence-case' | 'start-case';
    subjectEmpty: boolean; // false = subject required
    typeCase: 'lower-case' | 'upper-case';
    scopeCase: 'lower-case' | 'kebab-case';
    footerMaxLineLength: number;
  };

  // Scopes (optional, project-specific)
  scopes?: string[];

  // Husky integration
  husky: {
    enabled: boolean;
    commitMsg: boolean;
    prePush: boolean;
  };
}

export type CommitType =
  | 'feat'     // New feature
  | 'fix'      // Bug fix
  | 'docs'     // Documentation
  | 'style'    // Formatting (no code change)
  | 'refactor' // Code refactoring
  | 'perf'     // Performance improvement
  | 'test'     // Adding tests
  | 'build'    // Build system
  | 'ci'       // CI configuration
  | 'chore'    // Maintenance
  | 'revert'   // Revert commit
  | 'wip';     // Work in progress (optional)
```

### Generated commitlint.config.js

```javascript
// Generated by qazuor-claude-config
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [{{types.map(t => `'${t}'`).join(', ')}}]
    ],
    'type-case': [2, 'always', '{{typeCase}}'],
    'subject-case': [2, 'always', '{{subjectCase}}'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', {{headerMaxLength}}],
    'body-max-line-length': [2, 'always', {{bodyMaxLineLength}}],
    {{#if scopes}}
    'scope-enum': [
      2,
      'always',
      [{{scopes.map(s => `'${s}'`).join(', ')}}]
    ],
    {{/if}}
  },
};
```

---

## 6. New MCP Servers to Add

### Communication & Collaboration

| Server | Category | Description | Config Fields |
|--------|----------|-------------|---------------|
| slack | communication | Team messaging and notifications | token (xoxb-...) |
| notion | documentation | Document and database access | apiKey |
| discord | communication | Discord server integration | botToken |

### Databases

| Server | Category | Description | Config Fields |
|--------|----------|-------------|---------------|
| mongodb | database | MongoDB database access | connectionString |
| mysql | database | MySQL database access | connectionString |
| redis | cache | Redis cache and data store | url |
| supabase | database | Supabase all-in-one backend | apiKey, projectUrl |
| planetscale | database | Serverless MySQL | token, org |
| turso | database | Edge SQLite (libSQL) | url, authToken |

### Design & Content

| Server | Category | Description | Config Fields |
|--------|----------|-------------|---------------|
| figma | design | Figma design access | accessToken |

### Payments & Business

| Server | Category | Description | Config Fields |
|--------|----------|-------------|---------------|
| stripe | payments | Payment processing | secretKey |

### Testing & Security

| Server | Category | Description | Config Fields |
|--------|----------|-------------|---------------|
| playwright | testing | Browser automation E2E | - |
| browserstack | testing | Cross-browser testing | username, accessKey |
| semgrep | security | Static code analysis | appToken |
| socket | security | Dependency security | apiKey |

### AI & Search

| Server | Category | Description | Config Fields |
|--------|----------|-------------|---------------|
| exa | search | AI-optimized search | apiKey |
| firecrawl | scraping | Web scraping | apiKey |

### Development Tools

| Server | Category | Description | Config Fields |
|--------|----------|-------------|---------------|
| e2b | sandbox | Code execution sandbox | apiKey |
| raycast | productivity | Raycast integration | - |

### Project Management

| Server | Category | Description | Config Fields |
|--------|----------|-------------|---------------|
| jira | project-mgmt | Atlassian Jira | token, domain |
| asana | project-mgmt | Asana tasks | token |
| todoist | project-mgmt | Todoist tasks | apiToken |

---

## 7. New Agents to Add

### Backend Frameworks

| Agent | Description | Tech Stack |
|-------|-------------|------------|
| express-engineer | Express.js API development | express, node |
| fastify-engineer | Fastify high-performance APIs | fastify, node |
| nestjs-engineer | NestJS enterprise applications | nestjs, typescript |
| trpc-engineer | tRPC end-to-end typesafe APIs | trpc, typescript |
| graphql-engineer | GraphQL API development | graphql, apollo |

### Database ORMs

| Agent | Description | Tech Stack |
|-------|-------------|------------|
| db-prisma-engineer | Prisma ORM specialist | prisma, postgresql, mysql |
| db-mongodb-engineer | MongoDB/Mongoose specialist | mongodb, mongoose |
| db-typeorm-engineer | TypeORM specialist | typeorm, postgresql |

### Frontend Frameworks

| Agent | Description | Tech Stack |
|-------|-------------|------------|
| nextjs-engineer | Next.js full-stack development | nextjs, react |
| nuxt-engineer | Nuxt.js Vue applications | nuxt, vue |
| sveltekit-engineer | SvelteKit applications | sveltekit, svelte |
| remix-engineer | Remix full-stack React | remix, react |
| angular-engineer | Angular enterprise apps | angular, typescript |

### UI Libraries

| Agent | Description | Tech Stack |
|-------|-------------|------------|
| mui-specialist | Material-UI components | mui, react |
| chakra-specialist | Chakra UI components | chakra-ui, react |
| mantine-specialist | Mantine components | mantine, react |

### Testing

| Agent | Description | Tech Stack |
|-------|-------------|------------|
| vitest-engineer | Vitest testing specialist | vitest |
| playwright-engineer | Playwright E2E testing | playwright |
| cypress-engineer | Cypress E2E testing | cypress |
| jest-engineer | Jest testing specialist | jest |

### DevOps

| Agent | Description | Tech Stack |
|-------|-------------|------------|
| aws-engineer | AWS cloud services | aws, s3, lambda |
| docker-engineer | Docker containerization | docker, compose |
| kubernetes-engineer | Kubernetes orchestration | k8s, helm |

### Auth

| Agent | Description | Tech Stack |
|-------|-------------|------------|
| clerk-specialist | Clerk authentication | clerk |
| authjs-specialist | Auth.js/NextAuth | authjs, nextauth |
| firebase-auth-specialist | Firebase authentication | firebase |

### Monorepo

| Agent | Description | Tech Stack |
|-------|-------------|------------|
| turborepo-specialist | Turborepo monorepo | turborepo |
| nx-specialist | Nx monorepo | nx |

---

## 8. New Skills to Add

### State Management
- redux-patterns
- zustand-patterns
- jotai-patterns
- xstate-patterns

### UI Frameworks
- radix-ui-patterns
- daisy-ui-patterns
- tailwind-advanced

### Database
- mysql-optimization
- redis-caching
- database-indexing

### API
- rest-api-design
- graphql-schema-design
- openapi-specification

### DevOps
- docker-best-practices
- ci-cd-github-actions
- aws-deployment

### Security
- owasp-top-10
- auth-best-practices
- api-security

---

## 9. Template Processing System

### Post-Copy Processing

When modules are copied, process them with the user's configuration:

```typescript
// src/lib/templates/processor.ts

export interface TemplateContext {
  // Project info
  project: ProjectInfo;

  // Tech stack choices
  techStack: {
    database: 'drizzle' | 'prisma' | 'mongoose' | 'typeorm';
    backend: 'hono' | 'express' | 'fastify' | 'nestjs' | 'trpc';
    frontend: 'react' | 'nextjs' | 'astro' | 'nuxt' | 'sveltekit';
    ui: 'shadcn' | 'mui' | 'chakra' | 'mantine' | 'tailwind';
    testing: 'vitest' | 'jest';
    e2e: 'playwright' | 'cypress' | 'none';
    auth: 'clerk' | 'authjs' | 'lucia' | 'supabase' | 'none';
    stateManagement: 'tanstack-query' | 'redux' | 'zustand' | 'none';
    monorepo: 'turborepo' | 'nx' | 'pnpm-workspaces' | 'none';
    packageManager: 'pnpm' | 'npm' | 'yarn' | 'bun';
  };

  // Code style
  codeStyle: CodeStyleConfig;

  // Commitlint
  commitlint: CommitlintConfig;

  // Feature flags
  features: {
    typescript: boolean;
    eslint: boolean;
    prettier: boolean;
    biome: boolean;
    husky: boolean;
    docker: boolean;
  };
}

export async function processTemplate(
  content: string,
  context: TemplateContext
): Promise<string> {
  // Replace placeholders
  let processed = content;

  // Replace {{variable}} patterns
  processed = processed.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
    return getNestedValue(context, path) ?? match;
  });

  // Process conditionals {{#if condition}}...{{/if}}
  processed = processConditionals(processed, context);

  // Process loops {{#each items}}...{{/each}}
  processed = processLoops(processed, context);

  return processed;
}
```

### Example Processed Template

**Before (code-standards.md):**
```markdown
# Code Standards

## Package Manager
We use **{{techStack.packageManager}}** for dependency management.

{{#if techStack.monorepo}}
## Monorepo Structure
This project uses **{{techStack.monorepo}}** for monorepo management.
{{/if}}

## Database
- ORM: **{{techStack.database}}**
{{#if techStack.database === 'drizzle'}}
- Use Drizzle migrations for schema changes
- Prefer explicit SQL over magic
{{/if}}
{{#if techStack.database === 'prisma'}}
- Use Prisma migrations for schema changes
- Use Prisma Studio for database exploration
{{/if}}

## Code Formatting
- Indent: {{codeStyle.formatter.useTabs ? 'tabs' : 'spaces'}} ({{codeStyle.formatter.tabWidth}})
- Quotes: {{codeStyle.formatter.singleQuote ? 'single' : 'double'}}
- Semicolons: {{codeStyle.formatter.semi ? 'always' : 'never'}}
```

**After Processing:**
```markdown
# Code Standards

## Package Manager
We use **pnpm** for dependency management.

## Monorepo Structure
This project uses **turborepo** for monorepo management.

## Database
- ORM: **prisma**
- Use Prisma migrations for schema changes
- Use Prisma Studio for database exploration

## Code Formatting
- Indent: spaces (2)
- Quotes: single
- Semicolons: always
```

---

## 10. CLI Flow Changes

### New Selection Flow

```
? How would you like to configure your project?

  ○ Quick Setup (recommended presets)
  ○ Bundle Selection (pick feature bundles)
  ○ Custom Selection (full control)

────────────────────────────────────────

[If Bundle Selection]

? Select the bundles for your project:
  (Use space to select, enter to confirm)

  Backend:
  ◉ Backend Core (node-typescript-engineer, error handling)
  ◉ API - Express (express-engineer)
  ○ API - Fastify (fastify-engineer)
  ○ API - NestJS (nestjs-engineer)
  ○ API - tRPC (trpc-engineer)
  ○ API - Hono (hono-engineer)

  Database:
  ○ Database - Drizzle + PostgreSQL
  ◉ Database - Prisma + PostgreSQL
  ○ Database - MongoDB

  Frontend:
  ◉ Frontend - Next.js
  ○ Frontend - Astro
  ○ Frontend - Nuxt/Vue
  ○ Frontend - SvelteKit
  ◉ Frontend - React Core

  UI:
  ◉ UI - Shadcn
  ○ UI - MUI
  ○ UI - Chakra
  ○ UI - Mantine

  Quality:
  ◉ Testing & QA Bundle
  ◉ Security Bundle
  ○ Performance Bundle

  DevOps:
  ◉ Git & DevOps Bundle
  ◉ Deployment - Vercel
  ○ Deployment - AWS

  Planning:
  ◉ Planning & Architecture Bundle
  ○ Documentation Bundle
```

### Code Style Configuration Flow

```
? Configure Code Style

  Indentation:
  ◉ Spaces (recommended)
  ○ Tabs

  Indent Size:
  ○ 2 spaces (recommended)
  ○ 4 spaces

  Quotes:
  ◉ Single quotes (recommended)
  ○ Double quotes

  Semicolons:
  ◉ Always (recommended)
  ○ Never (ASI)

  Line Width:
  ○ 80 characters
  ◉ 100 characters (recommended)
  ○ 120 characters

  Trailing Commas:
  ○ None
  ◉ ES5 (recommended)
  ○ All

  Formatter:
  ◉ Biome (recommended - fast, all-in-one)
  ○ Prettier
  ○ None (will use editor settings)
```

### Commitlint Configuration Flow

```
? Configure Commit Linting

  ◉ Enable commitlint (recommended)

  Commit Types:
  ◉ feat - New feature
  ◉ fix - Bug fix
  ◉ docs - Documentation
  ◉ style - Formatting
  ◉ refactor - Code refactoring
  ◉ perf - Performance
  ◉ test - Tests
  ◉ build - Build system
  ◉ ci - CI configuration
  ◉ chore - Maintenance
  ◉ revert - Revert commit
  ○ wip - Work in progress

  Header Max Length:
  ○ 72 characters
  ◉ 100 characters (recommended)
  ○ 120 characters

  Project Scopes (optional):
  > Enter scopes separated by comma (e.g., api, web, db)
  > Leave empty to skip

  ◉ Setup Husky git hooks
```

---

## Implementation Priority

### Phase 1: Core Improvements (This PR)
1. ✅ MCP keys optional with post-install instructions
2. ✅ Code style fully configurable
3. ✅ Commitlint fully configurable
4. ✅ Default yes for module selection
5. ✅ Template processing system basics

### Phase 2: Module Expansion
1. Add new agents (prisma, express, nextjs, etc.)
2. Add new skills (state management, ui patterns)
3. Add enhanced descriptions to all modules
4. Implement bundle system

### Phase 3: MCP Expansion
1. Add new MCP servers
2. Enhanced configuration instructions
3. MCP server compatibility matrix

### Phase 4: Advanced Features
1. Interactive tech stack wizard
2. Project templates
3. Update/migration commands
4. Config validation and linting
