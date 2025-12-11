# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-12-10

### Added

#### Core CLI Features

- Interactive wizard for step-by-step configuration
- `init` command with full project initialization
- `configure` command for template placeholder management
- `list` command to display available modules, bundles, and MCP servers
- `add` command to add individual modules
- `remove` command to remove modules
- `status` command to show current configuration
- `update` command for configuration updates
- ASCII banner on startup with figlet
- Graceful cancellation handling with ESC key support
- Bilingual support (Spanish and English interfaces)

#### Module System

- **23 Agents**: Specialized AI agents organized by category
  - Engineering: tech-lead, hono-engineer, express-engineer, fastify-engineer, nestjs-engineer, db-drizzle-engineer, prisma-engineer, mongoose-engineer, node-typescript-engineer, astro-engineer, tanstack-start-engineer, react-senior-dev
  - Product: product-functional, product-technical
  - Quality: qa-engineer, debugger
  - Design: ux-ui-designer
  - Specialized: tech-writer, seo-ai-specialist, i18n-specialist, content-writer, enrichment-agent
- **25 Skills**: Reusable capabilities for agents
  - Testing: tdd-methodology, security-testing, performance-testing, api-app-testing, web-app-testing, qa-criteria-validator
  - Development: git-commit-helper, vercel-specialist, shadcn-specialist, mermaid-diagram-specialist, add-memory
  - Design: brand-guidelines, error-handling-patterns, markdown-formatter, pdf-creator-editor, json-data-auditor
  - Patterns: react-hook-form-patterns, zustand-patterns, redux-toolkit-patterns, tanstack-query-patterns, nextauth-patterns, i18n-patterns
- **23 Commands**: Slash commands for workflows
  - Quality: quality-check, code-check, run-tests
  - Audit: security-audit, performance-audit, accessibility-audit
  - Planning: start-feature-plan, start-refactor-plan, sync-planning, sync-planning-github, sync-todos-github, check-completed-tasks, planning-cleanup, cleanup-issues
  - Development: add-new-entity, update-docs, five-why
  - Git: commit
  - Meta: create-agent, create-command, create-skill, help
  - Formatting: format-markdown
- **18 Documentation modules**: Workflows, standards, and templates

#### Bundle System

- **23 Pre-configured bundles** organized by category:
  - Stack bundles: react-tanstack-stack, astro-react-stack, nextjs-prisma-stack, express-prisma-stack, hono-drizzle-stack
  - Testing bundles: testing-complete, testing-minimal
  - Quality bundles: quality-complete, quality-minimal
  - Database bundles: drizzle-database, prisma-database, mongoose-database
  - API bundles: hono-api, express-api, fastify-api, nestjs-api
  - Frontend bundles: react-ui, react-forms, react-state-zustand, react-state-redux, nextjs-auth, nextjs-i18n
  - Workflow bundles: planning-complete, documentation-complete, git-workflow, cicd-github-actions
- Bundle dependency validation system
- Visual display system with ASCII boxes
- Multi-select bundle selection with detailed preview
- Bundle summary with totals and edit option

#### Template Configuration System

- Auto-detection of project configuration from package.json
- Template placeholder scanner for `{{PLACEHOLDER}}` values
- Configuration categories: commands, paths, targets, tracking, techStack, environment, brand
- Global defaults storage in `~/.claude/defaults.json`
- Preview mode for template replacements
- Category-specific configuration

#### MCP Server Integration

- **9 Built-in MCP servers**: context7, github, postgres, neon, vercel, docker, linear, sentry, filesystem
- Support for user-level and project-level configuration
- Post-install instructions for servers requiring API keys
- Chrome DevTools MCP server support

#### Permissions System

- Three permission presets: default, trust, restrictive
- Fine-grained control over file, git, and bash operations
- Project-level permissions in `.claude/settings.local.json`

#### Code Style Tools

- **EditorConfig** configuration with customizable options
- **Biome** linter/formatter configuration
- **Prettier** configuration
- **Commitlint** with conventional commits support
- Husky integration for git hooks

#### Hook System

- Desktop notification support (Linux, macOS, Windows)
- Audio notifications with TTS support
- Custom command execution on task completion
- Configurable hooks for stop and subagent events

#### Project Detection

- Automatic package manager detection (pnpm, npm, yarn, bun)
- Framework detection (React, Next.js, Astro, Hono, Express, etc.)
- Dependency detection (Drizzle, Prisma, Zod, Vitest, Jest, etc.)
- Git repository and GitHub remote detection
- Script detection from package.json

#### Scaffold System

- Claude-only configuration mode
- Full project structure scaffolding
- Folder structure preferences (schemas, scripts, hooks, sessions)
- Support for remote git template repositories

#### Programmatic API

- Full TypeScript support with exported types
- Configuration read/write utilities
- Module resolution and installation
- Bundle resolution and merging
- Project detection utilities
- Template processing functions

#### Developer Experience

- Comprehensive test suite with 95%+ coverage
- GitHub Actions CI/CD workflows
- Biome for linting and formatting
- TypeScript strict mode
- tsup for building ESM and CJS outputs

### Technical Details

- Built with Commander.js for CLI framework
- Inquirer.js for interactive prompts
- chalk for terminal styling
- ora for spinners
- simple-git for git operations
- fs-extra for file system operations
- Vitest for testing
- TypeScript 5.7+
- Node.js 18+ required

[0.1.0]: https://github.com/qazuor/claude-code-config/releases/tag/v0.1.0
