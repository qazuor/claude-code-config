# AI Agents

This directory contains **specialized AI agents** that can be configured for any project. Each agent is an expert in specific areas and can be invoked during development workflow.

## ⚙️ Configuration Required

All agents include a `config_required` section in their YAML frontmatter. Before using an agent, ensure you've configured the required settings in your project's `CLAUDE.md` or configuration files.

**Example agent frontmatter:**
```yaml
---
name: agent-name
description: Brief description
tools: Read, Write, Edit, Glob, Grep, Bash
model: sonnet
config_required:
  - setting_name: "Description of what to configure"
---
```

## Agent Categories

### Product & Planning (2 agents)

| Agent | Description | Phase |
|-------|-------------|-------|
| [product-functional](product/product-functional.md) | Creates PDRs with user stories and acceptance criteria | Phase 1 |
| [product-technical](product/product-technical.md) | Technical analysis, architecture design, task breakdown | Phase 1 |

### Technical Leadership (1 agent)

| Agent | Description | Phase |
|-------|-------------|-------|
| [tech-lead](engineering/tech-lead.md) | Architectural oversight, code quality, security/performance validation | All |

### Backend Development (6 agents)

| Agent | Description | Phase |
|-------|-------------|-------|
| [hono-engineer](engineering/hono-engineer.md) | API development with Hono framework | Phase 2 |
| [express-engineer](engineering/express-engineer.md) | API development with Express framework | Phase 2 |
| [fastify-engineer](engineering/fastify-engineer.md) | API development with Fastify framework | Phase 2 |
| [nestjs-engineer](engineering/nestjs-engineer.md) | API development with NestJS framework | Phase 2 |
| [db-drizzle-engineer](engineering/db-drizzle-engineer.md) | Database schemas with Drizzle ORM | Phase 2 |
| [mongoose-engineer](engineering/mongoose-engineer.md) | Database schemas with Mongoose ODM | Phase 2 |
| [prisma-engineer](engineering/prisma-engineer.md) | Database schemas with Prisma ORM | Phase 2 |
| [node-typescript-engineer](engineering/node-typescript-engineer.md) | Shared packages, utilities, Node.js/TypeScript | Phase 2 |

### Frontend Development (4 agents)

| Agent | Description | Phase |
|-------|-------------|-------|
| [astro-engineer](engineering/astro-engineer.md) | Web apps with Astro, SSR, static generation | Phase 2 |
| [nextjs-engineer](engineering/nextjs-engineer.md) | Web apps with Next.js | Phase 2 |
| [react-senior-dev](engineering/react-senior-dev.md) | React components, hooks, state management | Phase 2 |
| [tanstack-start-engineer](engineering/tanstack-start-engineer.md) | Admin dashboards with TanStack Start | Phase 2 |

### Design & UX (2 agents)

| Agent | Description | Phase |
|-------|-------------|-------|
| [ux-ui-designer](design/ux-ui-designer.md) | UI design, user flows, accessibility | Phase 1, 3 |
| [content-writer](design/content-writer.md) | Web content, copywriting, tone of voice | All |

### Quality Assurance (2 agents)

| Agent | Description | Phase |
|-------|-------------|-------|
| [qa-engineer](quality/qa-engineer.md) | Testing strategy, quality validation | Phase 3 |
| [debugger](quality/debugger.md) | Bug investigation, root cause analysis | Phase 3 |

### Specialized (4 agents)

| Agent | Description | Phase |
|-------|-------------|-------|
| [tech-writer](specialized/tech-writer.md) | Documentation, API docs, changelogs | Phase 4 |
| [i18n-specialist](specialized/i18n-specialist.md) | Internationalization, translations | All |
| [enrichment-agent](specialized/enrichment-agent.md) | Issue enrichment, planning context | Planning |
| [seo-ai-specialist](specialized/seo-ai-specialist.md) | SEO, Core Web Vitals, structured data | All |

## Usage

Invoke agents using the Task tool:

```text
Use the Task tool with subagent_type="agent-name"
```

**Examples:**
```text
"Invoke product-functional to create the PDR"
"Use tech-lead to review architecture"
"Call db-drizzle-engineer to design database schema"
```

## Agent File Format

Each agent file includes:

1. **YAML Frontmatter**
   - `name`: Unique identifier (kebab-case)
   - `description`: When to invoke the agent
   - `tools`: Allowed tools (comma-separated)
   - `model`: sonnet/opus/haiku (optional)
   - `config_required`: Configuration directives

2. **Configuration Section**
   - Table of required settings
   - Examples for each setting

3. **Agent Content**
   - Role and responsibilities
   - Core workflow
   - Best practices
   - Quality checklist

## Directory Structure

```text
agents/
├── README.md
├── product/
│   ├── product-functional.md
│   └── product-technical.md
├── engineering/
│   ├── tech-lead.md
│   ├── hono-engineer.md
│   ├── express-engineer.md
│   ├── fastify-engineer.md
│   ├── nestjs-engineer.md
│   ├── db-drizzle-engineer.md
│   ├── mongoose-engineer.md
│   ├── prisma-engineer.md
│   ├── node-typescript-engineer.md
│   ├── astro-engineer.md
│   ├── nextjs-engineer.md
│   ├── react-senior-dev.md
│   └── tanstack-start-engineer.md
├── quality/
│   ├── qa-engineer.md
│   └── debugger.md
├── design/
│   ├── ux-ui-designer.md
│   └── content-writer.md
└── specialized/
    ├── tech-writer.md
    ├── i18n-specialist.md
    ├── enrichment-agent.md
    └── seo-ai-specialist.md
```

## Adding New Agents

1. Create `.md` file in appropriate category folder
2. Use naming convention: `kebab-case-name.md`
3. Include YAML frontmatter with `config_required`
4. Add `⚙️ Configuration` section with settings table
5. Keep content concise (200-400 lines target)
6. Update this README

## Related

- [Commands](../commands/README.md)
- [Skills](../skills/README.md)
