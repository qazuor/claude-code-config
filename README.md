# @qazuor/claude-code-config

[![npm version](https://img.shields.io/npm/v/@qazuor/claude-code-config.svg)](https://www.npmjs.com/package/@qazuor/claude-code-config)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@qazuor/claude-code-config.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

A comprehensive CLI tool to install and manage Claude Code configurations in your projects. Configure AI agents, skills, commands, MCP servers, permissions, and template placeholders with an interactive wizard or bundle-based setup.

## Table of Contents

- [Features](#features)
- [What's Included](#whats-included)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
  - [init](#init-path)
  - [configure](#configure)
  - [standards](#standards)
  - [list](#list-type)
  - [add](#add-module)
  - [remove](#remove-module)
  - [status](#status)
  - [update](#update)
- [Bundles](#bundles)
- [Modules](#modules)
  - [Agents](#agents-23-available)
  - [Skills](#skills-25-available)
  - [Commands](#commands-23-available)
  - [Documentation](#documentation-21-available)
- [Template Configuration](#template-configuration)
- [Standards Configuration](#standards-configuration)
- [Pre-commit Hooks](#pre-commit-hooks)
- [Response Style](#response-style)
- [MCP Servers](#mcp-servers)
- [Permissions](#permissions)
- [Code Style](#code-style)
- [Hooks](#hooks)
- [Project Structure](#project-structure)
- [Placeholders](#placeholders)
- [Programmatic API](#programmatic-api)
- [Configuration File](#configuration-file)
- [Custom Templates](#custom-templates)
- [Requirements](#requirements)
- [Contributing](#contributing)
- [License](#license)

## Features

### Core Capabilities

- **Interactive Wizard**: Step-by-step configuration with intelligent defaults and **back navigation**
- **Back Navigation**: Return to previous steps at any time to modify your choices
- **Auto-Detection**: Automatically detects project type, package manager, and tech stack
- **23 Bundles**: Pre-grouped module sets organized by category (stacks, testing, quality, etc.)
- **Bundle Categories**: Stack bundles (React+TanStack, Astro, Next.js), API bundles (Hono, Express), testing, quality, and more
- **Template Configuration**: Interactive setup for `{{PLACEHOLDER}}` values with smart defaults
- **Standards Wizard**: Configure code, testing, documentation, design, security, and performance standards
- **Pre-commit Hooks**: Configurable git hooks with lint, typecheck, tests, and custom commands
- **Response Style**: Configure Claude's tone, verbosity, and communication preferences
- **MCP Server Integration**: Configure Model Context Protocol servers
- **Permissions System**: Fine-grained control over Claude's capabilities
- **Code Style Tools**: EditorConfig, Biome, Prettier, and Commitlint configuration
- **Hooks System**: Notifications when Claude finishes tasks
- **Bilingual Support**: Spanish and English interfaces

### Modular Architecture

| Category | Count | Description |
|----------|-------|-------------|
| **Agents** | 23 | Specialized AI agents for different roles |
| **Skills** | 25 | Reusable capabilities and knowledge |
| **Commands** | 23 | Slash commands for workflows |
| **Docs** | 21 | Reference documentation and guides |
| **MCP Servers** | 27 | External tool integrations |
| **Bundles** | 23 | Pre-grouped module sets |
| **Standards** | 6 | Configurable project standards (code, testing, docs, design, security, performance) |

### Smart Defaults

- **Package Manager Detection**: Automatically detects pnpm, yarn, npm, or bun
- **Script Detection**: Reads package.json scripts for command defaults
- **Dependency Detection**: Identifies frameworks and libraries (React, Drizzle, Zod, etc.)
- **Git Detection**: Checks for git repository and GitHub remotes
- **Global Defaults**: Save preferences for future projects in `~/.claude/defaults.json`

## What's Included

After running `qazuor-claude-config init`, your project will have:

```
.claude/
├── config.json              # Configuration storage
├── settings.local.json      # Local permissions & MCP
├── agents/                  # 23 specialized AI agents
│   ├── engineering/         # Backend, frontend, DB engineers
│   ├── product/             # Product functional & technical
│   ├── quality/             # QA, debugger
│   ├── design/              # UX/UI designer
│   └── specialized/         # SEO, i18n, content, tech writer
├── skills/                  # 25 development skills
│   ├── testing/             # TDD, security, performance, QA
│   ├── development/         # Git, Vercel, Shadcn, diagrams
│   └── design/              # Brand, errors, markdown, PDF
├── commands/                # 23 slash commands
│   ├── audit/               # Security, performance, accessibility
│   ├── planning/            # Feature planning, sync, cleanup
│   ├── git/                 # Commit helper
│   ├── meta/                # Create agent/command/skill, help
│   └── formatting/          # Markdown formatter
├── docs/                    # 21 documentation files
│   ├── workflows/           # Decision tree, phases, protocols
│   ├── standards/           # Code, testing, docs standards
│   └── templates/           # PDR, tech analysis, TODOs
├── schemas/                 # JSON schemas (optional)
├── scripts/                 # Utility scripts (optional)
├── hooks/                   # Notification hooks (optional)
└── sessions/                # Planning sessions (optional)
    └── planning/
CLAUDE.md                    # Main Claude instructions
```

## Installation

### Global Installation (Recommended)

```bash
# Using pnpm (recommended)
pnpm add -g @qazuor/claude-code-config

# Using npm
npm install -g @qazuor/claude-code-config

# Using yarn
yarn global add @qazuor/claude-code-config

# Using bun
bun add -g @qazuor/claude-code-config
```

### Using npx (No Installation)

```bash
npx @qazuor/claude-code-config init
```

### Local Development

```bash
git clone https://github.com/qazuor/claude-code-config.git
cd claude-code-config
pnpm install
pnpm build
pnpm link --global
```

## Quick Start

### Interactive Setup (Recommended)

```bash
# Initialize in current directory
qazuor-claude-config init

# Initialize in specific directory
qazuor-claude-config init ./my-project
```

The wizard will guide you through:

1. **Project Information** - Name, description, organization, entity types
2. **Preferences** - Language, co-author settings
3. **Scaffold Options** - Claude-only or full project structure
4. **Module Selection** - Choose bundles or custom modules
5. **Hook Configuration** - Desktop/audio notifications
6. **MCP Servers** - External tool integrations
7. **Permissions** - What Claude can do
8. **Code Style** - EditorConfig, Biome, Prettier, Commitlint
9. **Template Configuration** - Auto-detected command/path/target values

> **Tip**: You can go back to any previous step using the "← Back" option to modify your choices.

### Bundle-based Setup

```bash
# Quick setup with specific bundles
qazuor-claude-config init --bundles react-tanstack-stack,testing-complete

# Skip all prompts with defaults
qazuor-claude-config init --bundles hono-drizzle-stack --yes

# Preview what would be created
qazuor-claude-config init --bundles astro-react-stack --dry-run
```

### Post-Installation Configuration

```bash
# Reconfigure template placeholders
qazuor-claude-config configure

# Scan for unconfigured placeholders
qazuor-claude-config configure --scan

# Preview changes without applying
qazuor-claude-config configure --preview
```

## Commands

### `init [path]`

Initialize Claude configuration in a project.

```bash
qazuor-claude-config init [options] [path]
```

#### Options

| Option | Description |
|--------|-------------|
| `-b, --bundles <ids>` | Comma-separated bundle IDs (e.g., `react-tanstack-stack,testing-complete`) |
| `-t, --template <url>` | Remote git repository URL for custom templates |
| `--branch <name>` | Branch or tag for remote template (default: `main`) |
| `-y, --yes` | Accept all defaults, skip interactive prompts |
| `-f, --force` | Overwrite existing configuration |
| `--dry-run` | Show what would be created without making changes |
| `--claude-only` | Only create Claude config, skip project scaffolding |
| `--no-placeholders` | Skip placeholder replacement |
| `--no-mcp` | Skip MCP server configuration |
| `-v, --verbose` | Show detailed output |

#### Examples

```bash
# Full interactive setup
qazuor-claude-config init

# Quick setup with bundles
qazuor-claude-config init --bundles react-tanstack-stack,testing-complete --yes

# From custom template repository
qazuor-claude-config init --template https://github.com/your-org/claude-templates --branch v2.0

# Force overwrite existing
qazuor-claude-config init --bundles hono-drizzle-stack --force
```

### `configure`

Configure or reconfigure template placeholders interactively.

```bash
qazuor-claude-config configure [options] [path]
```

#### Options

| Option | Description |
|--------|-------------|
| `--scan` | Scan for unconfigured placeholders only |
| `-c, --category <name>` | Configure specific category: `commands`, `paths`, `targets`, `tracking`, `techStack`, `environment`, `brand` |
| `--preview` | Preview changes without applying |
| `--show-defaults` | Show global defaults stored in `~/.claude/defaults.json` |
| `-v, --verbose` | Show detailed output |

#### Examples

```bash
# Interactive configuration
qazuor-claude-config configure

# Scan for unconfigured placeholders
qazuor-claude-config configure --scan

# Configure only commands
qazuor-claude-config configure --category commands

# Preview what would be replaced
qazuor-claude-config configure --preview

# Show global defaults
qazuor-claude-config configure --show-defaults
```

### `standards`

Configure project standards interactively. This wizard helps you define code style, testing, documentation, design, security, and performance standards for your project.

```bash
qazuor-claude-config standards [options] [path]
```

#### Options

| Option | Description |
|--------|-------------|
| `--scan` | Scan for unconfigured standard placeholders only |
| `-c, --category <name>` | Configure specific category: `code`, `testing`, `documentation`, `design`, `security`, `performance` |
| `--preview` | Preview changes without applying |
| `--update-templates` | Update/sync templates from package to project (for existing installations) |
| `-y, --yes` | Accept defaults without prompts |
| `-v, --verbose` | Show detailed output |

#### Categories

| Category | Configures |
|----------|------------|
| `code` | Indent style, quotes, semicolons, max lines, TypeScript rules |
| `testing` | Coverage target, TDD, test patterns, test location |
| `documentation` | JSDoc level, examples, changelog format, comments |
| `design` | CSS framework, component library, accessibility, dark mode |
| `security` | Auth pattern, validation library, CSRF, rate limiting |
| `performance` | Core Web Vitals (LCP, FID, CLS), bundle size, API response time |

#### Examples

```bash
# Full interactive standards wizard
qazuor-claude-config standards

# Configure only code standards
qazuor-claude-config standards --category code

# Scan for unconfigured placeholders
qazuor-claude-config standards --scan

# Preview changes without applying
qazuor-claude-config standards --preview

# Update templates from package (for existing installations)
qazuor-claude-config standards --update-templates

# Accept all defaults
qazuor-claude-config standards --yes
```

### `list [type]`

List available modules, bundles, or MCP servers.

```bash
qazuor-claude-config list [options] [type]
```

#### Types

| Type | Description |
|------|-------------|
| `agents` | List all 23 available agents |
| `skills` | List all 25 available skills |
| `commands` | List all 23 available commands |
| `docs` | List all 21 documentation modules |
| `bundles` | List all 23 module bundles |
| `mcp` | List all 27 MCP servers |
| *(none)* | List summary of all modules |

#### Options

| Option | Description |
|--------|-------------|
| `-v, --verbose` | Show detailed information |
| `-j, --json` | Output as JSON |

#### Examples

```bash
# List all modules summary
qazuor-claude-config list

# List agents with details
qazuor-claude-config list agents --verbose

# List bundles
qazuor-claude-config list bundles

# Export as JSON
qazuor-claude-config list agents --json > agents.json
```

### `add <module>`

Add a module to the configuration.

```bash
qazuor-claude-config add [options] <module>
```

#### Module Format

```
<category>:<module-id>

Categories: agent, skill, command, doc
```

#### Examples

```bash
# Add an agent
qazuor-claude-config add agent:tech-lead
qazuor-claude-config add agent:prisma-engineer

# Add a skill
qazuor-claude-config add skill:tdd-methodology

# Add a command
qazuor-claude-config add command:security-audit

# Force overwrite
qazuor-claude-config add agent:qa-engineer --force
```

### `remove <module>`

Remove a module from the configuration.

```bash
qazuor-claude-config remove [options] <module>
```

#### Examples

```bash
# Remove an agent
qazuor-claude-config remove agent:tech-lead

# Remove without confirmation
qazuor-claude-config remove skill:tdd-methodology --force
```

### `status`

Show current Claude configuration status.

```bash
qazuor-claude-config status [options]
```

#### Options

| Option | Description |
|--------|-------------|
| `-v, --verbose` | Show detailed configuration |
| `-j, --json` | Output as JSON |
| `--path <path>` | Project path (default: current directory) |

### `update`

Update configuration and modules.

```bash
qazuor-claude-config update [options]
```

#### Options

| Option | Description |
|--------|-------------|
| `--check` | Check for updates without applying |
| `--modules` | Update only modules |
| `--config` | Re-run configuration prompts |
| `--all` | Update everything |
| `-f, --force` | Overwrite local changes |
| `-i, --interactive` | Ask about each change |

## Bundles

Bundles are pre-grouped modules for specific use cases. Select them during `init` with `--bundles` or add interactively. The CLI includes 23 bundles organized by category.

### Stack Bundles

Complete technology stacks for different project types.

| Bundle | Description | Tech Stack |
|--------|-------------|------------|
| `react-tanstack-stack` | React + TanStack for SPAs/admin dashboards | React, TanStack Start/Router/Query, TypeScript |
| `astro-react-stack` | Astro + React for content sites | Astro, React, Tailwind CSS, MDX |
| `nextjs-prisma-stack` | Full-stack Next.js with Prisma | Next.js, React, Prisma, Tailwind CSS |
| `express-prisma-stack` | Express API with Prisma ORM | Express.js, Prisma, PostgreSQL, Zod |
| `hono-drizzle-stack` | Hono API with Drizzle ORM | Hono, Drizzle ORM, PostgreSQL, Zod |

### Testing Bundles

| Bundle | Description | Includes |
|--------|-------------|----------|
| `testing-complete` | Full testing suite (TDD, E2E, performance, QA) | qa-engineer, tdd-methodology, web-app-testing, api-app-testing, performance-testing, qa-criteria-validator |
| `testing-minimal` | Essential testing tools | tdd-methodology, api-app-testing, run-tests |

### Quality Bundles

| Bundle | Description | Includes |
|--------|-------------|----------|
| `quality-complete` | Full QA with security/performance/accessibility audits | qa-engineer, debugger, security-audit, performance-audit, accessibility-audit, review commands |
| `quality-minimal` | Essential quality checks | quality-check, code-check, review-code |

### Database Bundles

| Bundle | Description | Includes |
|--------|-------------|----------|
| `drizzle-database` | Drizzle ORM patterns | db-drizzle-engineer, json-data-auditor |
| `prisma-database` | Prisma ORM patterns | prisma-engineer, json-data-auditor |
| `mongoose-database` | MongoDB + Mongoose | mongoose-engineer, json-data-auditor |

### API Bundles

| Bundle | Description | Includes |
|--------|-------------|----------|
| `hono-api` | Hono framework | hono-engineer, api-app-testing, error-handling-patterns |
| `express-api` | Express.js framework | express-engineer, api-app-testing, error-handling-patterns |
| `fastify-api` | Fastify framework | fastify-engineer, api-app-testing, error-handling-patterns |
| `nestjs-api` | NestJS framework | nestjs-engineer, api-app-testing, error-handling-patterns |

### Frontend Bundles

| Bundle | Description | Includes |
|--------|-------------|----------|
| `react-ui` | React + Shadcn UI | react-senior-dev, ux-ui-designer, shadcn-specialist, brand-guidelines, accessibility-audit |
| `react-forms` | React Hook Form + Zod | react-senior-dev, react-hook-form-patterns, shadcn-specialist |
| `react-state-zustand` | Zustand state management | react-senior-dev, zustand-patterns, tanstack-query-patterns |
| `react-state-redux` | Redux Toolkit | react-senior-dev, redux-toolkit-patterns |
| `nextjs-auth` | NextAuth.js authentication | nextjs-engineer, nextauth-patterns, security-testing |
| `nextjs-i18n` | Next.js internationalization | nextjs-engineer, i18n-specialist, i18n-patterns |

### Workflow Bundles

| Bundle | Description | Includes |
|--------|-------------|----------|
| `planning-complete` | Full planning workflow (PDR, tech analysis, tasks) | product-functional, product-technical, tech-lead, planning commands, templates |
| `documentation-complete` | Documentation tools | tech-writer, mermaid-diagram-specialist, update-docs, documentation-standards |
| `git-workflow` | Git commit conventions | git-commit-helper, commit command |
| `cicd-github-actions` | GitHub Actions CI/CD | github-actions-specialist, cicd-workflows |

## Modules

### Agents (23 Available)

Specialized AI agents for different development roles.

#### Engineering Agents

| ID | Name | Description |
|----|------|-------------|
| `tech-lead` | Tech Lead | Architecture, coordination, code review |
| `hono-engineer` | Hono Engineer | Hono API development |
| `express-engineer` | Express Engineer | Express.js API development |
| `fastify-engineer` | Fastify Engineer | Fastify API development |
| `nestjs-engineer` | NestJS Engineer | NestJS framework development |
| `db-drizzle-engineer` | Drizzle Engineer | Database with Drizzle ORM |
| `prisma-engineer` | Prisma Engineer | Database with Prisma ORM |
| `node-typescript-engineer` | Node/TS Engineer | Node.js/TypeScript development |
| `astro-engineer` | Astro Engineer | Astro framework development |
| `tanstack-start-engineer` | TanStack Engineer | TanStack Router/Query |
| `react-senior-dev` | React Developer | React component development |

#### Product Agents

| ID | Name | Description |
|----|------|-------------|
| `product-functional` | Product Functional | PDR and user requirements |
| `product-technical` | Product Technical | Technical analysis and task breakdown |

#### Quality Agents

| ID | Name | Description |
|----|------|-------------|
| `qa-engineer` | QA Engineer | Testing and quality assurance |
| `debugger` | Debugger | Bug investigation and fixing |

#### Design Agents

| ID | Name | Description |
|----|------|-------------|
| `ux-ui-designer` | UX/UI Designer | UI/UX design and implementation |

#### Specialized Agents

| ID | Name | Description |
|----|------|-------------|
| `tech-writer` | Tech Writer | Technical documentation |
| `seo-ai-specialist` | SEO Specialist | SEO optimization |
| `i18n-specialist` | i18n Specialist | Internationalization |
| `content-writer` | Content Writer | Web copywriting |
| `enrichment-agent` | Enrichment Agent | Data enrichment and planning context |

### Skills (25 Available)

Reusable capabilities that can be invoked by agents.

#### Testing Skills

| ID | Name | Description |
|----|------|-------------|
| `tdd-methodology` | TDD Methodology | Test-driven development |
| `security-testing` | Security Testing | Security vulnerability testing |
| `performance-testing` | Performance Testing | Performance optimization |
| `api-app-testing` | API Testing | API testing strategies |
| `web-app-testing` | Web App Testing | Web application testing |
| `qa-criteria-validator` | QA Validator | Quality criteria validation |

#### Development Skills

| ID | Name | Description |
|----|------|-------------|
| `git-commit-helper` | Git Commit | Commit message formatting |
| `vercel-specialist` | Vercel | Vercel deployment |
| `shadcn-specialist` | Shadcn | Shadcn UI components |
| `mermaid-diagram-specialist` | Mermaid | Diagram generation |
| `add-memory` | Add Memory | Context memory |

#### Design Skills

| ID | Name | Description |
|----|------|-------------|
| `brand-guidelines` | Brand Guidelines | Brand consistency |
| `error-handling-patterns` | Error Handling | Error patterns |
| `markdown-formatter` | Markdown | Markdown formatting |
| `pdf-creator-editor` | PDF Editor | PDF manipulation |
| `json-data-auditor` | JSON Auditor | JSON validation |

### Commands (23 Available)

Slash commands for common workflows.

#### Quality Commands

| Command | Description |
|---------|-------------|
| `/quality-check` | Comprehensive quality validation |
| `/code-check` | Lint + typecheck |
| `/run-tests` | Execute test suites |

#### Audit Commands

| Command | Description |
|---------|-------------|
| `/security-audit` | OWASP security audit |
| `/performance-audit` | Performance analysis |
| `/accessibility-audit` | WCAG compliance audit |

#### Planning Commands

| Command | Description |
|---------|-------------|
| `/start-feature-plan` | Initialize feature planning |
| `/start-refactor-plan` | Plan refactoring |
| `/sync-planning` | Sync to issue tracker |
| `/sync-planning-github` | Sync to GitHub Issues |
| `/sync-todos-github` | Sync TODOs to GitHub |
| `/check-completed-tasks` | Auto-detect completed tasks |
| `/planning-cleanup` | Clean up planning artifacts |
| `/cleanup-issues` | Clean up stale issues |

#### Development Commands

| Command | Description |
|---------|-------------|
| `/add-new-entity` | Scaffold new entity |
| `/update-docs` | Update documentation |
| `/five-why` | Root cause analysis |

#### Git Commands

| Command | Description |
|---------|-------------|
| `/commit` | Generate atomic commit |

#### Meta Commands

| Command | Description |
|---------|-------------|
| `/create-agent` | Create new agent |
| `/create-command` | Create new command |
| `/create-skill` | Create new skill |
| `/help` | Show help information |

#### Formatting Commands

| Command | Description |
|---------|-------------|
| `/format-markdown` | Format markdown files |

### Documentation (20 Available)

Reference documentation and workflow guides.

| ID | Description |
|----|-------------|
| `quick-start` | Quick start guide |
| `decision-tree` | Workflow decision guide |
| `quick-fix-protocol` | Level 1 quick fix workflow |
| `atomic-task-protocol` | Level 2 atomic task workflow |
| `phase-1-planning` | Planning phase guide |
| `phase-2-implementation` | Implementation guide |
| `phase-3-validation` | Validation guide |
| `phase-4-finalization` | Finalization guide |
| `code-standards` | Coding standards (configurable) |
| `testing-standards` | Testing guidelines (configurable) |
| `documentation-standards` | Documentation guidelines (configurable) |
| `design-standards` | Design system standards (configurable) |
| `security-standards` | Security standards (configurable) |
| `performance-standards` | Performance standards (configurable) |
| `architecture-patterns` | Architecture patterns |
| `pdr-template` | Product Definition Report template |
| `tech-analysis-template` | Technical analysis template |
| `todos-template` | Task breakdown template |
| `workflow-diagrams` | Mermaid diagrams |
| `glossary` | Project terminology |
| `mcp-servers` | MCP documentation |

## Template Configuration

The CLI can auto-configure `{{PLACEHOLDER}}` values in templates by detecting your project setup.

### Configuration Categories

| Category | Examples |
|----------|----------|
| **Commands** | `{{TYPECHECK_COMMAND}}`, `{{LINT_COMMAND}}`, `{{TEST_COMMAND}}`, `{{COVERAGE_COMMAND}}` |
| **Paths** | `{{PLANNING_PATH}}`, `{{ARCHIVE_PATH}}`, `{{SCHEMAS_PATH}}` |
| **Targets** | `{{COVERAGE_TARGET}}`, `{{BUNDLE_SIZE_TARGET}}`, `{{LCP_TARGET}}` |
| **Tracking** | `{{ISSUE_TRACKER}}`, `{{TRACKING_FILE}}`, `{{TASK_CODE_PATTERN}}` |
| **Tech Stack** | `{{FRONTEND_FRAMEWORK}}`, `{{DATABASE_ORM}}`, `{{VALIDATION_LIBRARY}}` |
| **Environment** | `{{GITHUB_TOKEN_ENV}}`, `{{GITHUB_OWNER_ENV}}` |
| **Brand** | `{{BRAND_NAME}}`, `{{PRIMARY_COLOR}}`, `{{TONE_OF_VOICE}}` |

### Auto-Detection

The CLI automatically detects values from:

- **package.json scripts**: `typecheck`, `lint`, `test`, `coverage`, `build`
- **Dependencies**: React, Next.js, Drizzle, Prisma, Zod, Vitest, Jest
- **Lock files**: pnpm-lock.yaml, yarn.lock, package-lock.json, bun.lockb
- **Config files**: tsconfig.json, .git directory

### Global Defaults

Save configuration as defaults for future projects:

```bash
# During init, you'll be asked:
# "Save these values as global defaults for future projects?"

# View saved defaults
qazuor-claude-config configure --show-defaults
```

Defaults are stored in `~/.claude/defaults.json`.

## Standards Configuration

The standards wizard (`qazuor-claude-config standards`) allows you to configure project-wide standards that are automatically applied to documentation templates.

### Standard Categories

#### Code Standards

| Setting | Options | Default |
|---------|---------|---------|
| Indent Style | `space`, `tab` | `space` |
| Indent Size | `2`, `4` | `2` |
| Max Line Length | `80`, `100`, `120` | `100` |
| Max File Lines | `300`, `500`, `800`, `1000` | `500` |
| Quote Style | `single`, `double` | `single` |
| Semicolons | `true`, `false` | `true` |
| Trailing Commas | `all`, `es5`, `none` | `all` |
| Allow `any` Type | `true`, `false` | `false` |
| Named Exports Only | `true`, `false` | `true` |
| RO-RO Pattern | `true`, `false` | `true` |
| JSDoc Required | `true`, `false` | `true` |

#### Testing Standards

| Setting | Options | Default |
|---------|---------|---------|
| Coverage Target | `60%`, `70%`, `80%`, `90%`, `95%` | `90%` |
| TDD Required | `true`, `false` | `true` |
| Test Pattern | `aaa` (Arrange-Act-Assert), `gwt` (Given-When-Then) | `aaa` |
| Test Location | `separate` (test/ folder), `colocated` (__tests__) | `separate` |
| Unit Test Max | `50ms`, `100ms`, `200ms` | `100ms` |
| Integration Test Max | `500ms`, `1000ms`, `2000ms` | `1000ms` |

#### Documentation Standards

| Setting | Options | Default |
|---------|---------|---------|
| JSDoc Level | `minimal`, `standard`, `comprehensive` | `standard` |
| Require Examples | `true`, `false` | `true` |
| Changelog Format | `conventional`, `keepachangelog` | `conventional` |
| Inline Comment Policy | `why-not-what`, `minimal`, `extensive` | `why-not-what` |

#### Design Standards

| Setting | Options | Default |
|---------|---------|---------|
| CSS Framework | `tailwind`, `css-modules`, `styled-components`, `vanilla` | `tailwind` |
| Component Library | `shadcn`, `radix`, `headless`, `none` | `shadcn` |
| Accessibility Level | `A`, `AA`, `AAA` | `AA` |
| Dark Mode Support | `true`, `false` | `true` |

#### Security Standards

| Setting | Options | Default |
|---------|---------|---------|
| Auth Pattern | `jwt`, `session`, `oauth`, `none` | `jwt` |
| Input Validation | `zod`, `yup`, `joi`, `manual` | `zod` |
| CSRF Protection | `true`, `false` | `true` |
| Rate Limiting | `true`, `false` | `true` |

#### Performance Standards

| Setting | Options | Default |
|---------|---------|---------|
| LCP Target | `1500ms`, `2000ms`, `2500ms`, `4000ms` | `2500ms` |
| FID Target | `50ms`, `100ms`, `200ms`, `300ms` | `100ms` |
| CLS Target | `0.05`, `0.1`, `0.15`, `0.25` | `0.1` |
| Bundle Size Target | `100KB`, `150KB`, `250KB`, `500KB` | `250KB` |
| API Response Target | `100ms`, `200ms`, `300ms`, `500ms` | `200ms` |

### Presets

| Preset | Description |
|--------|-------------|
| `strict` | High coverage (95%), strict TypeScript, comprehensive docs |
| `balanced` | Standard settings for most projects (default) |
| `relaxed` | Lower coverage (70%), more flexible rules |
| `startup` | Fast iteration, minimal overhead |
| `enterprise` | Maximum standards, full documentation |

## Pre-commit Hooks

Configurable pre-commit hooks powered by Husky. The wizard generates sophisticated bash scripts based on your configuration.

### Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `enabled` | Enable/disable pre-commit hook | `true` |
| `lint.enabled` | Run linting | `true` |
| `lint.stagedOnly` | Only lint staged files | `true` |
| `lint.tool` | Linting tool (`biome`, `eslint`, `custom`) | `biome` |
| `typecheck.enabled` | Run TypeScript type checking | `true` |
| `tests.enabled` | Run tests | `true` |
| `tests.mode` | Test mode (`none`, `affected`, `all`) | `affected` |
| `tests.coverageThreshold` | Minimum coverage (0 = disabled) | `0` |
| `formatCheck.enabled` | Check formatting | `false` |
| `formatCheck.tool` | Format tool (`biome`, `prettier`, `custom`) | `biome` |
| `showTiming` | Show execution time for each step | `true` |
| `continueOnFailure` | Run all checks even if one fails | `false` |

### Custom Commands

Add custom validation commands:

```json
{
  "customCommands": [
    {
      "name": "Security Scan",
      "command": "pnpm audit --audit-level=high",
      "allowFailure": true,
      "order": 50
    }
  ]
}
```

### Presets

| Preset | Description |
|--------|-------------|
| `minimal` | Lint only (staged files) |
| `standard` | Lint + typecheck (default) |
| `strict` | Lint + typecheck + affected tests |

### Generated Hook Example

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Pre-commit hook - Generated by @qazuor/claude-code-config
echo "🔍 Running pre-commit checks..."

# Linting
echo ""
echo "📝 Linting..."
step_start
pnpm biome check --staged --no-errors-on-unmatched || { echo "  ❌ Lint failed"; exit 1; }
echo "  ✅ Lint passed"
step_end

# Type checking
echo ""
echo "🔷 Type checking..."
step_start
pnpm typecheck || { echo "  ❌ Type check failed"; exit 1; }
echo "  ✅ Types OK"
step_end

echo ""
echo "✨ All checks passed!"
```

## Response Style

Configure Claude's communication style and tone for your project.

### Configuration Options

| Option | Description | Options |
|--------|-------------|---------|
| `tone` | Overall response tone | `friendly`, `professional`, `formal`, `strict`, `mentor` |
| `verbosity` | Level of detail in responses | `concise`, `balanced`, `detailed` |
| `responseLanguage` | Language for responses (code always in English) | `en`, `es`, `auto` |
| `useEmojis` | Use emojis in responses | `true`, `false` |
| `errorStyle` | How to report errors | `supportive`, `neutral`, `direct` |
| `explainReasoning` | Include explanation of "why" | `true`, `false` |
| `offerAlternatives` | Suggest multiple solutions | `true`, `false` |
| `proactivity` | Level of unsolicited suggestions | `minimal`, `moderate`, `high` |
| `confirmBeforeBigChanges` | Ask before major changes | `true`, `false` |

### Tone Options

| Tone | Description |
|------|-------------|
| `friendly` | Casual, approachable, occasional emojis |
| `professional` | Professional but accessible |
| `formal` | Formal, technical language |
| `strict` | Direct, no-nonsense, to the point |
| `mentor` | Educational, explains the "why" |

### Presets

| Preset | Tone | Verbosity | Emojis | Error Style |
|--------|------|-----------|--------|-------------|
| `friendly` | friendly | balanced | ✓ | supportive |
| `professional` | professional | balanced | ✗ | neutral |
| `strict` | strict | concise | ✗ | direct |
| `mentor` | mentor | detailed | ✗ | supportive |

### Generated Guidelines

The configuration generates guidelines in CLAUDE.md:

```markdown
## Response Style

**Tone:** Professional
**Verbosity:** Balanced
**Language:** Spanish (code in English)
**Emojis:** No
**Error Style:** Neutral
**Explain Reasoning:** Yes
**Offer Alternatives:** Yes
**Proactivity:** Moderate
**Confirm Big Changes:** Yes

### Guidelines
- Respond in Spanish, write code/comments in English
- Be professional but accessible
- Explain the "why" behind decisions
- Present alternatives when multiple valid approaches exist
- Ask for confirmation before architectural changes
```

## MCP Servers

Model Context Protocol servers extend Claude's capabilities. All 27 servers are verified npm packages.

### By Category

#### Documentation & Search
| ID | Name | Requires Config |
|----|------|-----------------|
| `context7` | Context7 | No |
| `brave-search` | Brave Search | Yes (`BRAVE_API_KEY`) |
| `perplexity` | Perplexity | Yes (`PERPLEXITY_API_KEY`) |

#### Database & Cache
| ID | Name | Requires Config |
|----|------|-----------------|
| `postgres` | PostgreSQL | Yes (`DATABASE_URL`) |
| `neon` | Neon | Yes (`NEON_API_KEY`) |
| `mysql` | MySQL | Yes (`MYSQL_URL`) |
| `redis` | Redis | Yes (`REDIS_URL`) |

#### Version Control
| ID | Name | Requires Config |
|----|------|-----------------|
| `github` | GitHub | Yes (`GITHUB_TOKEN`) |
| `gitlab` | GitLab | Yes (`GITLAB_TOKEN`) |
| `git` | Git | No |

#### Deployment & Infrastructure
| ID | Name | Requires Config |
|----|------|-----------------|
| `vercel` | Vercel | Yes (`VERCEL_TOKEN`) |
| `cloudflare` | Cloudflare | Yes (`CLOUDFLARE_TOKEN`) |
| `docker` | Docker | No |
| `aws-kb-retrieval` | AWS KB | Yes (`AWS_ACCESS_KEY_ID`) |

#### Testing & Debugging
| ID | Name | Requires Config |
|----|------|-----------------|
| `playwright` | Playwright | No |
| `chrome-devtools` | Chrome DevTools | No |

#### Communication & Project Management
| ID | Name | Requires Config |
|----|------|-----------------|
| `slack` | Slack | Yes (`SLACK_TOKEN`) |
| `linear` | Linear | Yes (`LINEAR_API_KEY`) |
| `notion` | Notion | Yes (`NOTION_TOKEN`) |

#### Payments
| ID | Name | Requires Config |
|----|------|-----------------|
| `stripe` | Stripe | Yes (`STRIPE_API_KEY`) |
| `mercadopago` | Mercado Pago | Yes (`MP_ACCESS_TOKEN`) |

#### Design & UI
| ID | Name | Requires Config |
|----|------|-----------------|
| `figma` | Figma | Yes (`FIGMA_TOKEN`) |
| `shadcn` | Shadcn UI | No |
| `magic-ui` | Magic UI | No |

#### Other
| ID | Name | Requires Config |
|----|------|-----------------|
| `sentry` | Sentry | Yes (`SENTRY_AUTH_TOKEN`) |
| `obsidian` | Obsidian | No |
| `n8n` | n8n | Yes (`N8N_API_KEY`) |
| `sequential-thinking` | Sequential Thinking | No |

### Configuration Levels

- **User level**: `~/.claude/settings.json` - Available in all projects
- **Project level**: `.claude/settings.local.json` - Project-specific

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@anthropic/claude-code-mcp-context7"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

## Permissions

Control what Claude can do in your project.

### Presets

| Preset | Description |
|--------|-------------|
| `default` | Safe defaults - read all, write code/config, no git push |
| `trust` | Full trust - all operations allowed except push |
| `restrictive` | Read-only mode - minimal write permissions |

### Permission Categories

#### File Operations

| Permission | Default | Trust | Restrictive |
|------------|---------|-------|-------------|
| Read any file | ✓ | ✓ | ✓ |
| Write code (.ts, .js, .tsx) | ✓ | ✓ | ✗ |
| Write config (.json, .yaml) | ✓ | ✓ | ✗ |
| Write markdown (.md) | ✓ | ✓ | ✗ |
| Write other files | ✗ | ✓ | ✗ |

#### Git Operations

| Permission | Default | Trust | Restrictive |
|------------|---------|-------|-------------|
| status, diff, log | ✓ | ✓ | ✓ |
| add (staging) | ✗ | ✓ | ✗ |
| commit | ✗ | ✓ | ✗ |
| push | ✗ | ✗ | ✗ |
| checkout, branch | ✗ | ✓ | ✗ |

#### Bash Operations

| Permission | Default | Trust | Restrictive |
|------------|---------|-------|-------------|
| Package manager | ✓ | ✓ | ✗ |
| Testing commands | ✓ | ✓ | ✗ |
| Build commands | ✓ | ✓ | ✗ |
| Docker commands | ✗ | ✓ | ✗ |
| Arbitrary commands | ✗ | ✓ | ✗ |

## Code Style

Configure code style tools during initialization.

### Available Tools

| Tool | Description |
|------|-------------|
| **EditorConfig** | Editor-agnostic formatting rules |
| **Biome** | Fast linter and formatter |
| **Prettier** | Opinionated code formatter |
| **Commitlint** | Commit message linting |

### EditorConfig Options

- Indent style (tabs/spaces)
- Indent size
- Line endings (LF/CRLF)
- Final newline
- Trim trailing whitespace
- Max line length

### Biome Options

- Formatter settings (indent, quotes, semicolons)
- Linter rules (recommended, correctness, security)
- Import organization
- Ignore patterns

### Prettier Options

- Print width
- Tab width
- Semicolons
- Quote style
- Trailing commas
- Bracket spacing

### Commitlint Options

- Commit types allowed
- Scope requirements
- Header max length
- Body requirements
- Husky integration

## Hooks

Notification hooks alert you when Claude finishes tasks.

### Available Hooks

| Hook | Trigger | Description |
|------|---------|-------------|
| `notification` | Task completion | Desktop/audio notifications |
| `stop` | Claude stops | Beep or custom sound |
| `subagentStop` | Subagent completes | Background task notifications |

### Configuration

```json
{
  "hooks": {
    "enabled": true,
    "notification": {
      "desktop": true,
      "audio": true,
      "customCommand": "notify-send 'Claude' '$MESSAGE'"
    },
    "stop": {
      "beep": true,
      "customSound": "/path/to/sound.wav"
    }
  }
}
```

### System Requirements

| Feature | Linux | macOS | Windows |
|---------|-------|-------|---------|
| Desktop notifications | `libnotify-bin` | Built-in | Built-in |
| Audio (TTS) | Piper TTS | `say` | SAPI |
| Audio (beep) | `aplay` | `afplay` | PowerShell |

## Project Structure

```
your-project/
├── .claude/
│   ├── config.json              # Claude Code Config settings
│   ├── settings.local.json      # Local permissions & MCP
│   ├── agents/                  # AI agent definitions
│   │   ├── engineering/
│   │   ├── product/
│   │   ├── quality/
│   │   ├── design/
│   │   └── specialized/
│   ├── skills/                  # Skill definitions
│   │   ├── testing/
│   │   ├── development/
│   │   └── design/
│   ├── commands/                # Slash commands
│   │   ├── audit/
│   │   ├── planning/
│   │   ├── git/
│   │   ├── meta/
│   │   └── formatting/
│   ├── docs/                    # Documentation
│   │   ├── workflows/
│   │   ├── standards/
│   │   └── templates/
│   ├── schemas/                 # JSON schemas (optional)
│   ├── scripts/                 # Utility scripts (optional)
│   ├── hooks/                   # Hook scripts (optional)
│   └── sessions/                # Planning sessions (optional)
│       └── planning/
├── CLAUDE.md                    # Main Claude instructions
└── .editorconfig               # EditorConfig (optional)
```

## Placeholders

Templates use two types of placeholders:

### Project Placeholders (Replaced During Init)

| Placeholder | Description |
|-------------|-------------|
| `[Project Name]` | Project name |
| `your-org` | GitHub organization |
| `your-repo` | Repository name |
| `example.com` | Project domain |
| `entity` | Primary entity type |

### Template Placeholders (Configured via `configure`)

| Placeholder | Example Value |
|-------------|---------------|
| `{{TYPECHECK_COMMAND}}` | `pnpm typecheck` |
| `{{LINT_COMMAND}}` | `pnpm lint` |
| `{{TEST_COMMAND}}` | `pnpm test` |
| `{{COVERAGE_TARGET}}` | `90` |
| `{{ISSUE_TRACKER}}` | `github` |
| `{{DATABASE_ORM}}` | `Drizzle` |

## Programmatic API

Use the library programmatically in Node.js applications.

### Installation

```bash
npm install @qazuor/claude-code-config
```

### Usage

```typescript
import {
  // Configuration
  readConfig,
  writeConfig,
  hasConfig,
  createDefaultConfig,

  // Modules
  loadRegistry,
  resolveModules,
  installModules,

  // Detection
  detectProject,

  // Placeholders
  replacePlaceholders,

  // Templates
  processTemplates,
  buildTemplateContext,

  // Bundles
  resolveBundles,
  resolveBundle,
  mergeBundleSelection,
  BUNDLES,
  getAllBundles,
  getBundleById,

  // Constants
  MCP_SERVERS,
  DEPENDENCIES,
  PLACEHOLDERS,
  PERMISSION_PRESETS,
} from '@qazuor/claude-code-config';

// Detect project type
const detection = await detectProject('./my-project');
console.log(detection.projectType);      // 'nextjs', 'astro', 'hono', etc.
console.log(detection.packageManager);   // 'pnpm', 'npm', 'yarn', 'bun'

// Resolve bundles to module selections
const bundleResult = resolveBundles(['react-tanstack-stack', 'testing-complete']);
console.log(bundleResult.agents);    // ['react-senior-dev', 'tanstack-start-engineer', ...]
console.log(bundleResult.skills);    // ['web-app-testing', 'tdd-methodology', ...]

// Read/write configuration
const config = await readConfig('./my-project');
await writeConfig('./my-project', config);
```

### Types

```typescript
import type {
  // Configuration
  ClaudeConfig,
  ModuleSelection,
  HookConfig,
  TemplateSource,
  Preferences,
  ScaffoldConfig,
  Customizations,

  // Modules
  ModuleRegistry,
  ModuleDefinition,
  ModuleCategory,
  ResolvedModule,

  // Bundles
  BundleCategory,
  BundleDefinition,
  BundleSelectionResult,
  ResolvedBundle,

  // Scaffold & Detection
  ScaffoldType,
  ProjectType,
  ScaffoldOptions,
  ScaffoldResult,
  ProjectDetectionResult,

  // Templates
  TemplateContext,
  TemplateResult,
  TemplateProcessingReport,

  // MCP & Permissions
  McpServerDefinition,
  McpCategory,
  McpConfigField,
  McpInstallation,
  PermissionPreset,
  PermissionsConfig,
} from '@qazuor/claude-code-config';
```

## Configuration File

The main configuration is stored in `.claude/qazuor-claude-config.json`.

```json
{
  "version": "0.1.0",
  "templateSource": {
    "type": "local",
    "installedAt": "2024-01-15T10:30:00.000Z"
  },
  "project": {
    "name": "my-project",
    "description": "My awesome project",
    "org": "myorg",
    "repo": "my-project",
    "entityType": "product",
    "entityTypePlural": "products"
  },
  "preferences": {
    "language": "en",
    "responseLanguage": "en",
    "includeCoAuthor": true
  },
  "mcp": {
    "level": "project",
    "servers": [
      { "serverId": "context7", "level": "project" }
    ]
  },
  "modules": {
    "agents": { "selected": ["tech-lead", "qa-engineer"], "excluded": [] },
    "skills": { "selected": ["tdd-methodology"], "excluded": [] },
    "commands": { "selected": ["quality-check", "commit"], "excluded": [] },
    "docs": { "selected": ["quick-start"], "excluded": [] }
  },
  "extras": {
    "schemas": true,
    "scripts": false,
    "hooks": { "enabled": true, "notification": { "desktop": true } },
    "sessions": true,
    "codeStyle": { "enabled": true, "biome": true }
  },
  "templateConfig": {
    "commands": {
      "typecheck": "pnpm typecheck",
      "lint": "pnpm lint",
      "test": "pnpm test"
    },
    "targets": {
      "coverageTarget": 90
    },
    "tracking": {
      "issueTracker": "github"
    },
    "techStack": {
      "frontendFramework": "React",
      "databaseOrm": "Drizzle",
      "validationLibrary": "Zod"
    }
  }
}
```

## Custom Templates

### Using Remote Templates

```bash
# Use templates from custom repository
qazuor-claude-config init --template https://github.com/your-org/claude-templates

# Specify branch or tag
qazuor-claude-config init --template https://github.com/your-org/claude-templates --branch v2.0
```

### Template Structure

```
your-templates/
├── agents/
│   ├── _registry.json
│   ├── engineering/
│   │   └── *.md
│   └── quality/
│       └── *.md
├── skills/
│   ├── _registry.json
│   └── *.md
├── commands/
│   ├── _registry.json
│   └── *.md
├── docs/
│   ├── _registry.json
│   └── *.md
├── schemas/
│   └── *.json
├── scripts/
│   └── *.sh
└── hooks/
    └── *.sh
```

### Registry Format

```json
{
  "category": "agents",
  "modules": [
    {
      "id": "my-agent",
      "name": "My Agent",
      "description": "Description of my agent",
      "file": "engineering/my-agent.md",
      "tags": ["engineering", "custom"],
      "longDescription": "Extended description...",
      "whatItDoes": ["Action 1", "Action 2"],
      "whenToUse": "When to use this agent",
      "skillLevel": "intermediate",
      "relatedModules": ["other-agent"]
    }
  ]
}
```

## Requirements

- **Node.js**: >= 18.0.0
- **Package Manager**: pnpm, npm, yarn, or bun
- **Git**: For version control operations

### Optional Dependencies

| Dependency | Purpose | Installation |
|------------|---------|--------------|
| `libnotify-bin` | Desktop notifications (Linux) | `apt install libnotify-bin` |
| `piper-tts` | Audio notifications | `pip install piper-tts` |
| `jq` | JSON processing in hooks | `apt install jq` |

## Contributing

Contributions are welcome! Please follow these guidelines:

### Development Setup

```bash
# Clone repository
git clone https://github.com/qazuor/claude-code-config.git
cd claude-code-config

# Install dependencies
pnpm install

# Development mode (watch)
pnpm dev

# Build
pnpm build

# Run linter
pnpm lint

# Fix linting issues
pnpm lint:fix

# Type checking
pnpm typecheck

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

### Contribution Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Run linter: `pnpm lint`
6. Run typecheck: `pnpm typecheck`
7. Commit using conventional commits: `git commit -m 'feat: add my feature'`
8. Push: `git push origin feature/my-feature`
9. Open a Pull Request

### Conventional Commits

Use conventional commit messages:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test additions/changes
- `chore:` - Maintenance tasks

### Adding New Modules

1. Create the module file in the appropriate `templates/` directory
2. Add entry to `_registry.json` with full metadata
3. Update tests if needed
4. Update documentation

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

**Leandro Asrilevich**
- Email: qazuor@gmail.com
- GitHub: [@qazuor](https://github.com/qazuor)

## Acknowledgments

- [Anthropic](https://www.anthropic.com/) for Claude
- [Commander.js](https://github.com/tj/commander.js/) for CLI framework
- [Inquirer.js](https://github.com/SBoudrias/Inquirer.js/) for interactive prompts
- [tsup](https://github.com/egoist/tsup) for TypeScript bundling
- [Biome](https://biomejs.dev/) for linting and formatting
- [Vitest](https://vitest.dev/) for testing
