# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [0.5.0](///compare/v0.4.0...v0.5.0) (2025-12-15)

### Features

* **cli:** add prompts for standards, pre-commit and response style aa76c3b
* **cli:** add standards command with scan, preview and category options 8d3c195
* **constants:** add pre-commit config defaults and presets e4ff6bb
* **constants:** add response style defaults and guidelines generator e5b038b
* **constants:** add standards defaults and presets ca1d2c7
* **docs:** register security, performance and design standards modules e0bb338
* **git-hooks:** add configurable pre-commit hook generator f1ae86b
* **init:** use existing config values as defaults when re-running c605b5e
* **lib:** add standards library with definitions, replacer and scanner 6df3e5f
* **standards:** add template sync functionality with --update-templates option a17968e
* **templates:** add security and performance templates, add placeholders to existing 119af3f

### Refactoring

* **config:** rename config file to qazuor-claude-config.json 5576e55

### Documentation

* update changelog and readme for v0.5.0 features 81bd901

## [0.4.0](///compare/v0.3.1...v0.4.0) (2025-12-13)

### Features

* **mcp:** show already installed servers as disabled in selection 4e5a950

## [Unreleased]

### Added

#### Standards Wizard

- **New `standards` command** for interactive project standards configuration
- **6 Standard categories**: code, testing, documentation, design, security, performance
- **Configurable placeholders** in documentation templates (e.g., `{{COVERAGE_TARGET}}`, `{{AUTH_PATTERN}}`)
- **Standards presets**: strict, balanced, relaxed, startup, enterprise
- **Placeholder scanner** to detect unconfigured standards (`--scan` option)
- **Preview mode** for reviewing changes before applying (`--preview` option)
- **Category filtering** to configure specific categories (`--category` option)
- **Template sync** for existing installations (`--update-templates` option) - syncs new templates with backup
- **New templates**: `security-standards.md` and `performance-standards.md`
- **Updated templates**: code-standards, testing-standards, documentation-standards, design-standards with configurable placeholders

#### Configurable Pre-commit Hooks

- **Enhanced Husky integration** with configurable validation steps
- **Pre-commit generator** that creates sophisticated bash scripts from configuration
- **Configurable validations**: lint, typecheck, tests, format check
- **Test modes**: none, affected (changed files only), all
- **Custom commands support** with order and allowFailure options
- **Pre-commit presets**: minimal (lint only), standard (lint + typecheck), strict (all checks)
- **Execution options**: showTiming for step durations, continueOnFailure for running all checks
- **Tool-specific commands**: Biome, ESLint, Prettier support

#### Response Style Configuration

- **Response style wizard** for configuring Claude's communication style
- **Tone options**: friendly, professional, formal, strict, mentor
- **Verbosity levels**: concise, balanced, detailed
- **Error reporting styles**: supportive, neutral, direct
- **Configurable options**: emojis, explain reasoning, offer alternatives, proactivity
- **Response style presets**: friendly, professional, strict, mentor
- **CLAUDE.md guidelines generator** that outputs configured style as documentation

#### Init Wizard Improvements

- **Persistent configuration defaults** - When running `init` on existing projects, previously saved choices are used as defaults
- **Smoother re-configuration** - Both "Merge" and "Overwrite" options now pre-populate prompts with existing values

### Changed

- **Documentation count** increased from 18 to 21 (added security, performance, and design standards)
- **Husky installer** updated to use new pre-commit generator when config provided
- **README** updated with comprehensive documentation for all new features

## [0.3.1] - 2025-12-12

### Added

#### CLI Improvements

- **Version display** in startup banner
- **Update notification** - automatically checks npm for newer versions and displays upgrade instructions

## [0.3.0] - 2025-12-12

### Added

#### Wizard State Machine with Back Navigation

- **Reusable wizard engine** for multi-step configuration flows
- Back navigation support - return to previous steps at any time
- History tracking - maintains record of all user modifications
- "Keep or Reconfigure" flow when revisiting previously completed steps
- Visual progress indicator with step status (`● ◉ ○`)
- Skip conditions for conditional step execution
- Graceful cancellation handling integrated with existing ESC support

## [0.2.0] - 2025-12-10

### Added

#### MCP Server Expansion

- **27 Verified MCP servers** (up from 9), all validated npm packages:
  - Documentation: context7
  - Database: postgres, neon, mysql, redis
  - Version Control: github, gitlab, git
  - Deployment: vercel, cloudflare
  - Infrastructure: docker, aws-kb-retrieval
  - Monitoring: sentry
  - Testing: playwright, chrome-devtools
  - Communication: slack
  - Payments: stripe, mercadopago
  - Search: brave-search, perplexity
  - Project Management: linear, notion
  - Notes: obsidian
  - Automation: n8n
  - Design: figma
  - UI Libraries: shadcn, magic-ui
  - AI: sequential-thinking
- New MCP categories: `project-mgmt`, `design`, `ui-library`, `ai`
- Removed fictional/non-existent MCP packages

#### CI/CD Configuration

- GitHub Actions workflow generator for CI/CD
- Support for multiple package managers (npm, yarn, pnpm, bun)
- Configurable CI workflow (lint, test, typecheck, build)
- Release workflow generation with GitHub Release support
- Node.js version configuration
- Dependency caching support

#### VSCode Integration

- VSCode settings.json generator
- Extensions.json generator with recommended extensions
- Biome/Prettier/EditorConfig integration
- Language-specific settings for TypeScript, JavaScript, JSON
- Merge support for existing settings

#### Git Hooks (Husky)

- Husky installer with automatic directory setup
- commit-msg hook for commitlint integration
- pre-commit hook for linting (Biome/lint-staged)
- pre-push hook support
- Configurable hook content based on code style settings

#### CLAUDE.md Generator

- Dynamic CLAUDE.md template generator
- Project-specific placeholder replacement
- Support for custom templates
- Configurable overwrite behavior

#### File Conflict Utilities

- Backup file name generator with timestamps
- Interactive file conflict resolution
- Batch conflict policy prompts
- Support for overwrite, skip, merge, and backup actions

### Changed

- Improved test coverage with 50+ new tests for new modules
- Updated MCP types with new categories

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

[0.3.1]: https://github.com/qazuor/claude-code-config/releases/tag/v0.3.1
[0.3.0]: https://github.com/qazuor/claude-code-config/releases/tag/v0.3.0
[0.2.0]: https://github.com/qazuor/claude-code-config/releases/tag/v0.2.0
[0.1.0]: https://github.com/qazuor/claude-code-config/releases/tag/v0.1.0
