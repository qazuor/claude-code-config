# @qazuor/claude-code-config

[![npm version](https://img.shields.io/npm/v/@qazuor/claude-code-config.svg)](https://www.npmjs.com/package/@qazuor/claude-code-config)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@qazuor/claude-code-config.svg)](https://nodejs.org)

CLI tool to install and manage Claude Code configurations in your projects. Configure AI agents, skills, commands, MCP servers, and permissions with an interactive wizard or preset-based setup.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
  - [init](#init-path)
  - [list](#list-type)
  - [add](#add-module)
  - [remove](#remove-module)
  - [status](#status)
  - [update](#update)
- [Presets](#presets)
- [Modules](#modules)
  - [Agents](#agents)
  - [Skills](#skills)
  - [Commands](#commands-1)
  - [Documentation](#documentation)
- [MCP Servers](#mcp-servers)
- [Permissions](#permissions)
- [Hooks](#hooks)
- [Project Structure](#project-structure)
- [Placeholders](#placeholders)
- [Programmatic API](#programmatic-api)
- [Configuration File](#configuration-file)
- [Templates](#templates)
- [Requirements](#requirements)
- [Contributing](#contributing)
- [License](#license)

## Features

- **7 Presets**: Pre-configured module sets for different project types
  - `fullstack` - Complete configuration with all agents, skills, and commands
  - `frontend` - Optimized for React, Astro, TanStack projects
  - `backend` - Focused on Hono, Drizzle, Node.js APIs
  - `minimal` - Bare essentials for small projects
  - `api-only` - Pure API/microservice configuration
  - `documentation` - Strong documentation capabilities
  - `quality-focused` - Emphasis on testing and code quality

- **Modular Architecture**: Install only what you need
  - 14 specialized AI agents
  - 19 development skills
  - 15 slash commands
  - 18 documentation modules

- **Granular Selection**: Choose modules one by one with shortcuts
  - `[Y/n]` - Accept/reject individual modules
  - `[a]` - Install all in category
  - `[n]` - Skip all remaining in category
  - `[p]` - Use preset for category

- **MCP Servers**: Configure Model Context Protocol servers
  - Context7, GitHub, PostgreSQL, Neon, Vercel, Docker, Linear, Sentry, Filesystem

- **Permissions System**: Interactive permission configuration
  - 3 presets: `default`, `trust`, `restrictive`
  - Fine-grained control over file, git, bash, and web operations

- **Hooks**: Notification system when Claude finishes tasks
  - Desktop notifications (notify-send)
  - Audio notifications (Piper TTS, beep sounds)
  - Custom commands

- **Auto-detection**: Automatically detects project type and suggests presets
  - Node.js, Monorepo, Astro, Next.js, Vite+React, Hono
  - Detects package manager (pnpm, npm, yarn, bun)

- **Placeholder System**: Replaces project-specific variables in templates
  - Project name, description, organization
  - Entity types, domains, locations

- **Bilingual Support**: Spanish and English interfaces

- **Remote Templates**: Use templates from custom git repositories

## Installation

### Global Installation (Recommended)

```bash
# Using npm
npm install -g @qazuor/claude-code-config

# Using pnpm
pnpm add -g @qazuor/claude-code-config

# Using yarn
yarn global add @qazuor/claude-code-config
```

### Using npx (No Installation)

```bash
npx @qazuor/claude-code-config init
```

### Local Development Installation

```bash
git clone https://github.com/qazuor/claude-code-config.git
cd claude-code-config
pnpm install
pnpm build
pnpm link --global
```

## Quick Start

### Interactive Setup

```bash
# Initialize in current directory with interactive wizard
claude-config init

# Initialize in a specific directory
claude-config init ./my-project
```

### Preset-based Setup

```bash
# Use a preset for quick setup
claude-config init --preset fullstack

# Skip prompts with defaults
claude-config init --preset minimal --yes

# Dry run to see what would be created
claude-config init --preset frontend --dry-run
```

### Adding Modules Later

```bash
# Add a specific agent
claude-config add agent:tech-lead

# Add a skill
claude-config add skill:tdd-methodology

# Add a command
claude-config add command:commit
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
| `--preset <name>` | Use a preset: `fullstack`, `frontend`, `backend`, `minimal`, `api-only`, `documentation`, `quality-focused` |
| `--template <url>` | Remote git repository URL for custom templates |
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
claude-config init

# Quick setup with fullstack preset
claude-config init --preset fullstack --yes

# Setup from custom template repository
claude-config init --template https://github.com/your-org/claude-templates --branch v2.0

# Initialize in a new project directory
claude-config init ./new-project --preset backend

# Preview what would be created
claude-config init --preset minimal --dry-run

# Force overwrite existing configuration
claude-config init --preset fullstack --force
```

### `list [type]`

List available modules, presets, or MCP servers.

```bash
claude-config list [options] [type]
```

#### Types

| Type | Description |
|------|-------------|
| `agents` | List all available agents |
| `skills` | List all available skills |
| `commands` | List all available commands |
| `docs` | List all available documentation |
| `presets` | List all presets with their modules |
| `mcp` | List all MCP servers |
| *(none)* | List all modules |

#### Options

| Option | Description |
|--------|-------------|
| `-v, --verbose` | Show detailed information |
| `-j, --json` | Output as JSON |

#### Examples

```bash
# List all modules
claude-config list

# List available agents
claude-config list agents

# List presets with details
claude-config list presets --verbose

# List MCP servers
claude-config list mcp

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

#### Options

| Option | Description |
|--------|-------------|
| `-f, --force` | Overwrite if module exists |
| `--path <path>` | Project path (default: current directory) |

#### Examples

```bash
# Add an agent
claude-config add agent:tech-lead
claude-config add agent:hono-engineer

# Add a skill
claude-config add skill:tdd-methodology
claude-config add skill:security-testing

# Add a command
claude-config add command:commit
claude-config add command:quality-check

# Add documentation
claude-config add doc:architecture-patterns

# Force overwrite
claude-config add agent:qa-engineer --force
```

### `remove <module>`

Remove a module from the configuration.

```bash
claude-config remove [options] <module>
```

#### Options

| Option | Description |
|--------|-------------|
| `-f, --force` | Skip confirmation prompt |
| `--path <path>` | Project path (default: current directory) |

#### Examples

```bash
# Remove an agent
claude-config remove agent:tech-lead

# Remove without confirmation
claude-config remove skill:tdd-methodology --force

# Remove from specific project
claude-config remove command:commit --path ./my-project
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
| `--path <path>` | Project path (default: current directory) |
| `-j, --json` | Output as JSON |

#### Examples

```bash
# Show status
claude-config status

# Detailed status
claude-config status --verbose

# Export configuration as JSON
claude-config status --json > config.json
```

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
| `--path <path>` | Project path (default: current directory) |

#### Examples

```bash
# Interactive update
claude-config update

# Check for available updates
claude-config update --check

# Update modules only
claude-config update --modules

# Re-configure (MCP, hooks, preferences)
claude-config update --config

# Force update everything
claude-config update --all --force
```

## Presets

Presets are pre-configured module sets optimized for different project types.

### Full Stack (`fullstack`)

Complete configuration for full-stack applications.

| Category | Modules |
|----------|---------|
| **Agents** | tech-lead, product-functional, product-technical, hono-engineer, db-drizzle-engineer, node-typescript-engineer, astro-engineer, tanstack-start-engineer, react-senior-dev, ux-ui-designer, qa-engineer, debugger, tech-writer, seo-ai-specialist |
| **Skills** | tdd-methodology, security-testing, performance-testing, api-app-testing, web-app-testing, qa-criteria-validator, git-commit-helper, brand-guidelines, error-handling-patterns |
| **Commands** | quality-check, code-check, commit, run-tests, review-code, add-new-entity, update-docs, start-feature-plan |
| **Extras** | schemas, scripts, hooks, sessions |

### Frontend (`frontend`)

Optimized for React, Astro, TanStack projects.

| Category | Modules |
|----------|---------|
| **Agents** | tech-lead, react-senior-dev, astro-engineer, tanstack-start-engineer, ux-ui-designer, qa-engineer, debugger |
| **Skills** | tdd-methodology, web-app-testing, qa-criteria-validator, brand-guidelines |
| **Commands** | quality-check, code-check, commit, run-tests |
| **Extras** | hooks, sessions |

### Backend (`backend`)

Focused on Hono, Drizzle, Node.js APIs.

| Category | Modules |
|----------|---------|
| **Agents** | tech-lead, product-technical, hono-engineer, db-drizzle-engineer, node-typescript-engineer, qa-engineer, debugger |
| **Skills** | tdd-methodology, security-testing, api-app-testing, git-commit-helper, error-handling-patterns |
| **Commands** | quality-check, code-check, commit, run-tests, add-new-entity |
| **Extras** | schemas, scripts, hooks, sessions |

### Minimal (`minimal`)

Bare essentials for small projects.

| Category | Modules |
|----------|---------|
| **Agents** | tech-lead, qa-engineer |
| **Skills** | tdd-methodology, git-commit-helper |
| **Commands** | quality-check, commit |
| **Extras** | *(none)* |

### API Only (`api-only`)

Pure API/microservice configuration.

| Category | Modules |
|----------|---------|
| **Agents** | tech-lead, hono-engineer, db-drizzle-engineer, qa-engineer |
| **Skills** | tdd-methodology, security-testing, api-app-testing |
| **Commands** | quality-check, commit, run-tests |
| **Extras** | schemas, hooks |

### Documentation (`documentation`)

Strong documentation capabilities.

| Category | Modules |
|----------|---------|
| **Agents** | tech-lead, tech-writer, qa-engineer |
| **Skills** | git-commit-helper, brand-guidelines |
| **Commands** | quality-check, update-docs, commit |
| **Extras** | sessions |

### Quality Focused (`quality-focused`)

Emphasis on testing and code quality.

| Category | Modules |
|----------|---------|
| **Agents** | tech-lead, qa-engineer, debugger |
| **Skills** | tdd-methodology, security-testing, performance-testing, qa-criteria-validator |
| **Commands** | quality-check, code-check, run-tests, review-code |
| **Extras** | schemas, scripts, hooks |

## Modules

### Agents

Specialized AI agents for different development tasks.

| ID | Name | Description |
|----|------|-------------|
| `tech-lead` | Tech Lead | Architecture, coordination, and technical decisions |
| `product-functional` | Product Functional | PDR creation and functional requirements |
| `product-technical` | Product Technical | Technical analysis and task breakdown |
| `hono-engineer` | Hono Engineer | Hono API development |
| `db-drizzle-engineer` | DB Drizzle Engineer | Database design with Drizzle ORM |
| `node-typescript-engineer` | Node TypeScript Engineer | Node.js/TypeScript development |
| `astro-engineer` | Astro Engineer | Astro framework development |
| `tanstack-start-engineer` | TanStack Start Engineer | TanStack Router/Query development |
| `react-senior-dev` | React Senior Dev | React component development |
| `ux-ui-designer` | UX/UI Designer | UI/UX design and implementation |
| `qa-engineer` | QA Engineer | Testing and quality assurance |
| `debugger` | Debugger | Bug investigation and fixing |
| `tech-writer` | Tech Writer | Technical documentation |
| `seo-ai-specialist` | SEO AI Specialist | SEO optimization |

### Skills

Specialized capabilities that can be invoked.

| ID | Name | Description |
|----|------|-------------|
| `tdd-methodology` | TDD Methodology | Test-driven development practices |
| `security-testing` | Security Testing | Security vulnerability testing |
| `performance-testing` | Performance Testing | Performance optimization |
| `api-app-testing` | API App Testing | API testing strategies |
| `web-app-testing` | Web App Testing | Web application testing |
| `qa-criteria-validator` | QA Criteria Validator | Quality criteria validation |
| `git-commit-helper` | Git Commit Helper | Commit message formatting |
| `vercel-specialist` | Vercel Specialist | Vercel deployment expertise |
| `shadcn-specialist` | Shadcn Specialist | Shadcn UI components |
| `mermaid-diagram-specialist` | Mermaid Diagrams | Diagram generation |
| `brand-guidelines` | Brand Guidelines | Brand consistency |
| `error-handling-patterns` | Error Handling | Error handling patterns |
| `markdown-formatter` | Markdown Formatter | Markdown formatting |
| `pdf-creator-editor` | PDF Creator/Editor | PDF manipulation |
| `json-data-auditor` | JSON Data Auditor | JSON validation |
| `add-memory` | Add Memory | Context memory management |
| `i18n-specialist` | i18n Specialist | Internationalization |
| `accessibility-audit` | Accessibility Audit | Accessibility testing |
| `performance-audit` | Performance Audit | Performance analysis |

### Commands

Slash commands for common operations.

| ID | Name | Description |
|----|------|-------------|
| `quality-check` | /quality-check | Run comprehensive quality checks |
| `code-check` | /code-check | Static code analysis |
| `commit` | /commit | Generate atomic commits |
| `run-tests` | /run-tests | Execute test suites |
| `review-code` | /review-code | Code review assistance |
| `review-security` | /review-security | Security review |
| `review-performance` | /review-performance | Performance review |
| `add-new-entity` | /add-new-entity | Scaffold new entities |
| `update-docs` | /update-docs | Update documentation |
| `start-feature-plan` | /start-feature-plan | Begin feature planning |
| `start-refactor-plan` | /start-refactor-plan | Plan refactoring |
| `sync-planning` | /sync-planning | Sync planning documents |
| `help` | /help | Show help information |
| `status` | /status | Project status |
| `cleanup` | /cleanup | Clean up resources |

### Documentation

Reference documentation and guides.

| ID | Name | Description |
|----|------|-------------|
| `quick-start` | Quick Start | Quick start guide |
| `decision-tree` | Decision Tree | Workflow decision guide |
| `quick-fix-protocol` | Quick Fix Protocol | Quick fix workflow |
| `atomic-task-protocol` | Atomic Task Protocol | Atomic task workflow |
| `phase-1-planning` | Phase 1 Planning | Planning phase guide |
| `phase-2-implementation` | Phase 2 Implementation | Implementation guide |
| `phase-3-validation` | Phase 3 Validation | Validation guide |
| `phase-4-finalization` | Phase 4 Finalization | Finalization guide |
| `code-standards` | Code Standards | Coding standards |
| `testing-standards` | Testing Standards | Testing guidelines |
| `documentation-standards` | Documentation Standards | Documentation guidelines |
| `architecture-patterns` | Architecture Patterns | Architecture patterns |
| `pdr-template` | PDR Template | Product Definition Report template |
| `tech-analysis-template` | Tech Analysis Template | Technical analysis template |
| `todos-template` | TODOs Template | Task breakdown template |
| `workflow-diagrams` | Workflow Diagrams | Mermaid diagrams |
| `glossary` | Glossary | Project terminology |
| `mcp-servers` | MCP Servers | MCP documentation |

## MCP Servers

Model Context Protocol servers extend Claude's capabilities.

| ID | Name | Category | Description | Requires Config |
|----|------|----------|-------------|-----------------|
| `context7` | Context7 | Documentation | Library/framework documentation lookup | No |
| `github` | GitHub | Version Control | GitHub API (issues, PRs, repos) | Yes (`GITHUB_TOKEN`) |
| `postgres` | PostgreSQL | Database | Direct PostgreSQL access | Yes (`DATABASE_URL`) |
| `neon` | Neon | Database | Neon serverless PostgreSQL | Yes (`NEON_API_KEY`) |
| `vercel` | Vercel | Deployment | Vercel deployment management | Yes (`VERCEL_TOKEN`) |
| `docker` | Docker | Infrastructure | Docker container management | No |
| `linear` | Linear | Project Mgmt | Linear issue tracking | Yes (`LINEAR_API_KEY`) |
| `sentry` | Sentry | Monitoring | Error monitoring | Yes (`SENTRY_AUTH_TOKEN`) |
| `filesystem` | Filesystem | Infrastructure | Enhanced file operations | No |

### Configuration

MCP servers can be configured at two levels:

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

| Permission | Description | Default |
|------------|-------------|---------|
| `readAll` | Read any file | ✓ |
| `writeCode` | Write `.ts`, `.js`, `.tsx`, `.jsx` | ✓ |
| `writeConfig` | Write `.json`, `.yaml`, `.toml` | ✓ |
| `writeMarkdown` | Write `.md` files | ✓ |
| `writeOther` | Write other file types | ✗ |
| `editTool` | Use Edit tool | ✓ |

#### Git Operations

| Permission | Description | Default |
|------------|-------------|---------|
| `readOnly` | `status`, `diff`, `log` | ✓ |
| `staging` | `add` | ✗ |
| `commit` | `commit` | ✗ |
| `push` | `push` (dangerous) | ✗ |
| `branching` | `checkout`, `branch` | ✗ |

#### Bash/Terminal

| Permission | Description | Default |
|------------|-------------|---------|
| `packageManager` | `pnpm`, `npm`, `yarn` | ✓ |
| `testing` | `vitest`, `jest`, etc. | ✓ |
| `building` | Build commands | ✓ |
| `docker` | Docker commands | ✗ |
| `arbitrary` | Any bash command | ✗ |

#### Web

| Permission | Description | Default |
|------------|-------------|---------|
| `fetch` | WebFetch tool | ✓ |
| `search` | WebSearch tool | ✓ |

## Hooks

Notification hooks alert you when Claude finishes tasks.

### Available Hooks

| Hook | Trigger | Description |
|------|---------|-------------|
| `notification` | Task completion | Desktop/audio notifications |
| `stop` | Claude stops | Beep or custom sound |
| `subagentStop` | Subagent completes | Notification for background tasks |

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

### System Requirements for Hooks

| Feature | Linux | macOS | Windows |
|---------|-------|-------|---------|
| Desktop notifications | `libnotify-bin` | Built-in | Built-in |
| Audio (TTS) | Piper TTS | `say` command | SAPI |
| Audio (beep) | `aplay` | `afplay` | PowerShell |

## Project Structure

After initialization, your project will have:

```
your-project/
├── .claude/
│   ├── config.json              # Claude Code Config settings
│   ├── agents/                  # AI agent definitions
│   │   ├── engineering/         # Engineering agents
│   │   ├── product/             # Product agents
│   │   ├── quality/             # Quality agents
│   │   └── specialized/         # Specialized agents
│   ├── skills/                  # Skill definitions
│   │   ├── testing/             # Testing skills
│   │   ├── development/         # Development skills
│   │   └── design/              # Design skills
│   ├── commands/                # Slash commands
│   │   ├── quality/             # Quality commands
│   │   ├── development/         # Development commands
│   │   └── planning/            # Planning commands
│   ├── docs/                    # Documentation
│   │   ├── workflows/           # Workflow guides
│   │   ├── standards/           # Coding standards
│   │   └── templates/           # Document templates
│   ├── schemas/                 # JSON schemas (optional)
│   ├── scripts/                 # Utility scripts (optional)
│   ├── hooks/                   # Hook scripts (optional)
│   └── sessions/                # Planning sessions (optional)
│       └── planning/            # Feature planning storage
├── CLAUDE.md                    # Main Claude instructions
└── .claude/settings.local.json  # Local settings (permissions, MCP)
```

## Placeholders

Templates use placeholders that are replaced with project-specific values.

### Available Placeholders

| Placeholder | Config Key | Description |
|-------------|------------|-------------|
| `{{PROJECT_NAME}}` | `name` | Project name |
| `{{PROJECT_DESCRIPTION}}` | `description` | Project description |
| `{{ORG_NAME}}` | `org` | GitHub organization |
| `{{REPO_NAME}}` | `repo` | Repository name |
| `{{DOMAIN}}` | `domain` | Project domain |
| `{{ENTITY_TYPE}}` | `entityType` | Primary entity (singular) |
| `{{ENTITY_TYPE_PLURAL}}` | `entityTypePlural` | Primary entity (plural) |
| `{{LOCATION}}` | `location` | Location for examples |
| `[City Name]` | `location` | Location placeholder |
| `your-org` | `org` | Organization placeholder |
| `your-repo` | `repo` | Repository placeholder |
| `example.com` | `domain` | Domain placeholder |

### Example

Before:
```markdown
# {{PROJECT_NAME}}

Visit https://{{DOMAIN}} for more information.
Report issues at https://github.com/{{ORG_NAME}}/{{REPO_NAME}}/issues
```

After:
```markdown
# My Awesome Project

Visit https://myproject.com for more information.
Report issues at https://github.com/myorg/myproject/issues
```

## Programmatic API

Use the library programmatically in your Node.js applications.

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

  // Constants
  PRESETS,
  MCP_SERVERS,
  PERMISSION_PRESETS,
  PLACEHOLDERS,
  DEPENDENCIES,
} from '@qazuor/claude-code-config';

// Check if project has Claude config
const hasClaudeConfig = await hasConfig('./my-project');

// Read existing configuration
const config = await readConfig('./my-project');
console.log(config.modules.agents.selected);

// Detect project type
const detection = await detectProject('./my-project');
console.log(detection.projectType);      // 'nextjs', 'astro', 'hono', etc.
console.log(detection.packageManager);   // 'pnpm', 'npm', 'yarn', 'bun'
console.log(detection.suggestedPreset);  // 'frontend', 'backend', etc.
console.log(detection.confidence);       // 'high', 'medium', 'low'

// Load module registry from templates
const registry = await loadRegistry('./templates');
console.log(registry.agents);  // Array of agent definitions
console.log(registry.skills);  // Array of skill definitions

// Get preset configuration
const fullstackPreset = PRESETS.fullstack;
console.log(fullstackPreset.modules.agents);  // ['tech-lead', 'hono-engineer', ...]

// Create default config
const defaultConfig = createDefaultConfig({
  name: 'my-project',
  description: 'My awesome project',
  org: 'myorg',
  repo: 'my-project',
});

// Write configuration
await writeConfig('./my-project', defaultConfig);
```

### Types

```typescript
import type {
  // Configuration
  ClaudeConfig,
  ProjectInfo,
  Preferences,
  ModuleSelection,
  HookConfig,

  // Modules
  ModuleRegistry,
  ModuleDefinition,
  ModuleCategory,
  ResolvedModule,

  // Presets
  PresetName,
  PresetDefinition,

  // MCP
  McpServerDefinition,
  McpInstallation,

  // Scaffold
  ProjectType,
  PackageManager,
  ProjectDetectionResult,
  ScaffoldOptions,

  // Permissions
  PermissionPreset,
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
    "domain": "myproject.com",
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
      {
        "serverId": "context7",
        "level": "project",
        "config": {}
      }
    ]
  },
  "modules": {
    "agents": {
      "selected": ["tech-lead", "qa-engineer"],
      "excluded": []
    },
    "skills": {
      "selected": ["tdd-methodology"],
      "excluded": []
    },
    "commands": {
      "selected": ["quality-check", "commit"],
      "excluded": []
    },
    "docs": {
      "selected": ["quick-start"],
      "excluded": []
    }
  },
  "extras": {
    "schemas": true,
    "scripts": false,
    "hooks": {
      "enabled": true,
      "notification": {
        "desktop": true,
        "audio": false
      }
    },
    "sessions": true
  },
  "scaffold": {
    "type": "claude-only",
    "createdStructure": [".claude/", "CLAUDE.md"]
  },
  "customizations": {
    "placeholdersReplaced": true,
    "lastUpdated": "2024-01-15T10:30:00.000Z",
    "customFiles": []
  }
}
```

## Templates

### Using Custom Templates

```bash
# Use templates from a custom repository
claude-config init --template https://github.com/your-org/claude-templates

# Specify a branch or tag
claude-config init --template https://github.com/your-org/claude-templates --branch v2.0
```

### Template Structure

Custom template repositories should follow this structure:

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

Each category needs a `_registry.json` file:

```json
{
  "category": "agents",
  "modules": [
    {
      "id": "my-agent",
      "name": "My Agent",
      "description": "Description of my agent",
      "file": "engineering/my-agent.md",
      "tags": ["engineering", "custom"]
    }
  ]
}
```

## Requirements

- **Node.js**: >= 18.0.0
- **Package Manager**: npm, pnpm, yarn, or bun
- **Git**: For version control operations

### Optional Dependencies

| Dependency | Purpose | Installation |
|------------|---------|--------------|
| `libnotify-bin` | Desktop notifications (Linux) | `apt install libnotify-bin` |
| `piper-tts` | Audio notifications | `pip install piper-tts` |
| `jq` | JSON processing in hooks | `apt install jq` |

## Contributing

Contributions are welcome! Please read our contributing guidelines.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Run linter: `pnpm lint`
6. Commit: `git commit -m 'feat: add my feature'`
7. Push: `git push origin feature/my-feature`
8. Open a Pull Request

### Development

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
```

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
