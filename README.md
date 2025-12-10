# @qazuor/claude-code-config

[![npm version](https://img.shields.io/npm/v/@qazuor/claude-code-config.svg)](https://www.npmjs.com/package/@qazuor/claude-code-config)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@qazuor/claude-code-config.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

A comprehensive CLI tool to install and manage Claude Code configurations in your projects. Configure AI agents, skills, commands, MCP servers, permissions, and template placeholders with an interactive wizard or preset-based setup.

## Table of Contents

- [Features](#features)
- [What's Included](#whats-included)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
  - [init](#init-path)
  - [configure](#configure)
  - [list](#list-type)
  - [add](#add-module)
  - [remove](#remove-module)
  - [status](#status)
  - [update](#update)
- [Presets](#presets)
- [Bundles](#bundles)
- [Modules](#modules)
  - [Agents](#agents-23-available)
  - [Skills](#skills-25-available)
  - [Commands](#commands-23-available)
  - [Documentation](#documentation-18-available)
- [Template Configuration](#template-configuration)
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

- **Interactive Wizard**: Step-by-step configuration with intelligent defaults
- **Auto-Detection**: Automatically detects project type, package manager, and tech stack
- **7 Presets**: Pre-configured module sets for different project types
- **Module Bundles**: Grouped modules for specific use cases (frontend-react, api-hono, etc.)
- **Template Configuration**: Interactive setup for `{{PLACEHOLDER}}` values with smart defaults
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
| **Docs** | 18 | Reference documentation and guides |
| **MCP Servers** | 9 | External tool integrations |
| **Bundles** | 10+ | Pre-grouped module sets |

### Smart Defaults

- **Package Manager Detection**: Automatically detects pnpm, yarn, npm, or bun
- **Script Detection**: Reads package.json scripts for command defaults
- **Dependency Detection**: Identifies frameworks and libraries (React, Drizzle, Zod, etc.)
- **Git Detection**: Checks for git repository and GitHub remotes
- **Global Defaults**: Save preferences for future projects in `~/.claude/defaults.json`

## What's Included

After running `claude-config init`, your project will have:

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
├── docs/                    # 18 documentation files
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
claude-config init

# Initialize in specific directory
claude-config init ./my-project
```

The wizard will guide you through:

1. **Project Information** - Name, description, organization, entity types
2. **Preferences** - Language, co-author settings
3. **Scaffold Options** - Claude-only or full project structure
4. **Module Selection** - Choose preset or custom modules
5. **Hook Configuration** - Desktop/audio notifications
6. **MCP Servers** - External tool integrations
7. **Permissions** - What Claude can do
8. **Code Style** - EditorConfig, Biome, Prettier, Commitlint
9. **Template Configuration** - Auto-detected command/path/target values

### Preset-based Setup

```bash
# Quick setup with fullstack preset
claude-config init --preset fullstack

# Skip all prompts with defaults
claude-config init --preset minimal --yes

# Preview what would be created
claude-config init --preset frontend --dry-run
```

### Post-Installation Configuration

```bash
# Reconfigure template placeholders
claude-config configure

# Scan for unconfigured placeholders
claude-config configure --scan

# Preview changes without applying
claude-config configure --preview
```

## Commands

### `init [path]`

Initialize Claude configuration in a project.

```bash
claude-config init [options] [path]
```

#### Options

| Option | Description |
|--------|-------------|
| `-p, --preset <name>` | Use preset: `fullstack`, `frontend`, `backend`, `minimal`, `api-only`, `documentation`, `quality-focused` |
| `-t, --template <url>` | Remote git repository URL for custom templates |
| `-b, --branch <name>` | Branch or tag for remote template (default: `main`) |
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
claude-config init

# Quick setup with preset
claude-config init --preset fullstack --yes

# From custom template repository
claude-config init --template https://github.com/your-org/claude-templates --branch v2.0

# Force overwrite existing
claude-config init --preset backend --force
```

### `configure`

Configure or reconfigure template placeholders interactively.

```bash
claude-config configure [options] [path]
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
claude-config configure

# Scan for unconfigured placeholders
claude-config configure --scan

# Configure only commands
claude-config configure --category commands

# Preview what would be replaced
claude-config configure --preview

# Show global defaults
claude-config configure --show-defaults
```

### `list [type]`

List available modules, presets, bundles, or MCP servers.

```bash
claude-config list [options] [type]
```

#### Types

| Type | Description |
|------|-------------|
| `agents` | List all 23 available agents |
| `skills` | List all 25 available skills |
| `commands` | List all 23 available commands |
| `docs` | List all 18 documentation modules |
| `presets` | List all 7 presets with their modules |
| `bundles` | List all module bundles |
| `mcp` | List all 9 MCP servers |
| *(none)* | List summary of all modules |

#### Options

| Option | Description |
|--------|-------------|
| `-v, --verbose` | Show detailed information |
| `-j, --json` | Output as JSON |

#### Examples

```bash
# List all modules summary
claude-config list

# List agents with details
claude-config list agents --verbose

# List presets
claude-config list presets

# Export as JSON
claude-config list agents --json > agents.json
```

### `add <module>`

Add a module to the configuration.

```bash
claude-config add [options] <module>
```

#### Module Format

```
<category>:<module-id>

Categories: agent, skill, command, doc
```

#### Examples

```bash
# Add an agent
claude-config add agent:tech-lead
claude-config add agent:prisma-engineer

# Add a skill
claude-config add skill:tdd-methodology

# Add a command
claude-config add command:security-audit

# Force overwrite
claude-config add agent:qa-engineer --force
```

### `remove <module>`

Remove a module from the configuration.

```bash
claude-config remove [options] <module>
```

#### Examples

```bash
# Remove an agent
claude-config remove agent:tech-lead

# Remove without confirmation
claude-config remove skill:tdd-methodology --force
```

### `status`

Show current Claude configuration status.

```bash
claude-config status [options]
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
claude-config update [options]
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

## Presets

Presets are pre-configured module sets optimized for different project types.

| Preset | Description | Agents | Skills | Commands |
|--------|-------------|--------|--------|----------|
| `fullstack` | Complete full-stack configuration | 14 | 9 | 8 |
| `frontend` | React, Astro, TanStack projects | 7 | 4 | 4 |
| `backend` | Hono, Drizzle, Node.js APIs | 7 | 5 | 5 |
| `minimal` | Bare essentials | 2 | 2 | 2 |
| `api-only` | Pure API/microservice | 4 | 3 | 3 |
| `documentation` | Documentation focus | 3 | 2 | 3 |
| `quality-focused` | Testing emphasis | 3 | 4 | 4 |

### Full Stack Preset Details

**Agents**: tech-lead, product-functional, product-technical, hono-engineer, db-drizzle-engineer, node-typescript-engineer, astro-engineer, tanstack-start-engineer, react-senior-dev, ux-ui-designer, qa-engineer, debugger, tech-writer, seo-ai-specialist

**Skills**: tdd-methodology, security-testing, performance-testing, api-app-testing, web-app-testing, qa-criteria-validator, git-commit-helper, brand-guidelines, error-handling-patterns

**Commands**: quality-check, code-check, commit, run-tests, review-code, add-new-entity, update-docs, start-feature-plan

**Extras**: schemas, scripts, hooks, sessions

## Bundles

Bundles are pre-grouped modules for specific use cases. They can be selected during setup or added later.

| Bundle | Description | Contents |
|--------|-------------|----------|
| `frontend-react` | React development | react-senior-dev, tanstack-start-engineer, web-app-testing |
| `frontend-astro` | Astro development | astro-engineer, seo-ai-specialist, performance-testing |
| `api-hono` | Hono API development | hono-engineer, api-app-testing, security-testing |
| `api-express` | Express API development | express-engineer, api-app-testing, security-testing |
| `database-drizzle` | Drizzle ORM | db-drizzle-engineer, schemas |
| `database-prisma` | Prisma ORM | prisma-engineer, schemas |
| `quality-full` | Complete quality tooling | qa-engineer, debugger, tdd-methodology, all testing skills |
| `planning-full` | Feature planning | product-functional, product-technical, planning commands |

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
| `enrichment-agent` | Enrichment Agent | Data enrichment |
| `markdown-formatter` | Markdown Formatter | Document formatting |
| `git-commit-helper` | Git Commit Helper | Commit message generation |

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

### Documentation (18 Available)

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
| `code-standards` | Coding standards |
| `testing-standards` | Testing guidelines |
| `documentation-standards` | Documentation guidelines |
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
claude-config configure --show-defaults
```

Defaults are stored in `~/.claude/defaults.json`.

## MCP Servers

Model Context Protocol servers extend Claude's capabilities.

| ID | Name | Category | Requires Config |
|----|------|----------|-----------------|
| `context7` | Context7 | Documentation | No |
| `github` | GitHub | Version Control | Yes (`GITHUB_TOKEN`) |
| `postgres` | PostgreSQL | Database | Yes (`DATABASE_URL`) |
| `neon` | Neon | Database | Yes (`NEON_API_KEY`) |
| `vercel` | Vercel | Deployment | Yes (`VERCEL_TOKEN`) |
| `docker` | Docker | Infrastructure | No |
| `linear` | Linear | Project Mgmt | Yes (`LINEAR_API_KEY`) |
| `sentry` | Sentry | Monitoring | Yes (`SENTRY_AUTH_TOKEN`) |
| `filesystem` | Filesystem | Infrastructure | No |

### Configuration Levels

- **User level**: `~/.claude/settings.json` - Available in all projects
- **Project level**: `.claude/settings.local.json` - Project-specific

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@anthropic/context7-mcp"]
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

  // Template Configuration
  scanForPlaceholders,
  replaceTemplatePlaceholders,
  buildConfigContext,

  // Global Defaults
  readGlobalDefaults,
  writeGlobalDefaults,

  // Constants
  PRESETS,
  MCP_SERVERS,
  PERMISSION_PRESETS,
  TEMPLATE_PLACEHOLDERS,
} from '@qazuor/claude-code-config';

// Detect project type
const detection = await detectProject('./my-project');
console.log(detection.projectType);      // 'nextjs', 'astro', 'hono', etc.
console.log(detection.packageManager);   // 'pnpm', 'npm', 'yarn', 'bun'
console.log(detection.suggestedPreset);  // 'frontend', 'backend', etc.

// Build context for template configuration
const context = await buildConfigContext('./my-project');
console.log(context.scripts);        // { test: 'vitest', lint: 'biome check' }
console.log(context.dependencies);   // { react: '^18.0.0', drizzle-orm: '...' }
console.log(context.packageManager); // 'pnpm'

// Scan for placeholders
const scan = await scanForPlaceholders('./.claude');
console.log(scan.placeholders);      // ['{{TYPECHECK_COMMAND}}', ...]
console.log(scan.byCategory);        // { commands: [...], paths: [...] }

// Read/write configuration
const config = await readConfig('./my-project');
await writeConfig('./my-project', config);
```

### Types

```typescript
import type {
  // Configuration
  ClaudeConfig,
  ProjectInfo,
  TemplateConfig,
  TemplateConfigContext,

  // Modules
  ModuleRegistry,
  ModuleDefinition,
  ModuleCategory,

  // Template
  TemplatePlaceholderDefinition,
  PlaceholderScanResult,

  // Presets & Bundles
  PresetName,
  PresetDefinition,
  BundleDefinition,

  // MCP & Permissions
  McpServerDefinition,
  PermissionsConfig,
} from '@qazuor/claude-code-config';
```

## Configuration File

The main configuration is stored in `.claude/config.json`.

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
claude-config init --template https://github.com/your-org/claude-templates

# Specify branch or tag
claude-config init --template https://github.com/your-org/claude-templates --branch v2.0
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
