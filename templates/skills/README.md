# Skills

This directory contains **reusable skill modules** that provide specialized knowledge and workflows. Skills can be used by multiple agents and are invoked when specific expertise is needed.

## ⚙️ Configuration Required

All skills include a `config_required` section in their YAML frontmatter. Configure the required settings in your project before using a skill.

**Example skill frontmatter:**
```yaml
---
name: skill-name
category: testing|audit|patterns|tech|utils
description: Brief description
usage: When to use this skill
input: What the skill needs
output: What the skill produces
config_required:
  - setting_name: "Description of what to configure"
---
```

## Skill Categories

### Testing Skills (6 skills)

| Skill | Description | When to Use |
|-------|-------------|-------------|
| [api-app-testing](testing/api-app-testing.md) | API endpoint testing workflow | Testing APIs during development |
| [performance-testing](testing/performance-testing.md) | Performance benchmarks and load testing | Validating performance requirements |
| [security-testing](testing/security-testing.md) | Security testing patterns | Testing security during development |
| [web-app-testing](qa/web-app-testing.md) | E2E web application testing | Testing web UI flows |
| [qa-criteria-validator](qa/qa-criteria-validator.md) | Validate against PDR acceptance criteria | Before feature completion |
| [tdd-methodology](patterns/tdd-methodology.md) | Test-Driven Development workflow | During implementation |

### Audit Skills (3 skills)

| Skill | Description | When to Use |
|-------|-------------|-------------|
| [security-audit](audit/security-audit.md) | OWASP compliance and penetration testing | Pre-deployment, quarterly reviews |
| [performance-audit](audit/performance-audit.md) | Core Web Vitals and optimization | Pre-deployment, after major features |
| [accessibility-audit](audit/accessibility-audit.md) | WCAG 2.1 Level AA compliance | Pre-deployment, after UI changes |

### Pattern Skills (3 skills)

| Skill | Description | When to Use |
|-------|-------------|-------------|
| [error-handling-patterns](patterns/error-handling-patterns.md) | Error class hierarchy and handling | Implementing error handling |
| [auth-patterns](auth/nextauth-patterns.md) | Authentication patterns | Implementing auth flows |
| [i18n-patterns](i18n/i18n-patterns.md) | Internationalization patterns | Adding multi-language support |

### State Management Skills (3 skills)

| Skill | Description | When to Use |
|-------|-------------|-------------|
| [redux-toolkit-patterns](state/redux-toolkit-patterns.md) | Redux Toolkit patterns | Using Redux for state |
| [tanstack-query-patterns](state/tanstack-query-patterns.md) | TanStack Query patterns | Server state management |
| [zustand-patterns](state/zustand-patterns.md) | Zustand patterns | Simple client state |

### React Skills (1 skill)

| Skill | Description | When to Use |
|-------|-------------|-------------|
| [react-hook-form-patterns](react/react-hook-form-patterns.md) | Form handling with React Hook Form | Building forms |

### Tech Skills (3 skills)

| Skill | Description | When to Use |
|-------|-------------|-------------|
| [mermaid-diagram-specialist](tech/mermaid-diagram-specialist.md) | Creating Mermaid diagrams | Documentation, architecture |
| [component-library-specialist](tech/shadcn-specialist.md) | Component library integration | UI implementation |
| [deployment-platform-specialist](tech/vercel-specialist.md) | Deployment configuration | Deploying applications |

### Utility Skills (3 skills)

| Skill | Description | When to Use |
|-------|-------------|-------------|
| [add-memory](utils/add-memory.md) | Capture learnings and knowledge | After discovering patterns/issues |
| [json-data-auditor](utils/json-data-auditor.md) | JSON validation and transformation | Working with JSON data |
| [pdf-generator](utils/pdf-creator-editor.md) | PDF generation | Creating reports, invoices |

### Git Skills (1 skill)

| Skill | Description | When to Use |
|-------|-------------|-------------|
| [git-commit-helper](git/git-commit-helper.md) | Conventional commit messages | Creating commits |

### Documentation Skills (1 skill)

| Skill | Description | When to Use |
|-------|-------------|-------------|
| [markdown-formatter](documentation/markdown-formatter.md) | Markdown formatting standards | Formatting documentation |

### Design Skills (1 skill)

| Skill | Description | When to Use |
|-------|-------------|-------------|
| [brand-guidelines](brand-guidelines.md) | Brand consistency in UI | Creating UI components |

## Testing vs Audit Skills

| Aspect | Testing Skills | Audit Skills |
|--------|----------------|--------------|
| **When** | During development (Phase 2) | Before deployment (Phase 3-4) |
| **Frequency** | Continuous (every commit) | Periodic (quarterly, pre-deploy) |
| **Duration** | Minutes | 60-90 minutes |
| **Output** | Pass/Fail + Coverage % | Comprehensive report |
| **Focus** | Does code work? | Meets standards/compliance? |

## Usage

Skills are invoked within agent workflows or directly:

```text
"Apply the security-testing skill to validate input handling"
"Use git-commit-helper to generate commit message"
"Run qa-criteria-validator against the PDR"
```

## Skill File Format

Each skill file includes:

1. **YAML Frontmatter**
   - `name`: Unique identifier
   - `category`: Skill category
   - `description`: Brief description
   - `usage`: When to use
   - `input`/`output`: What skill needs and produces
   - `config_required`: Configuration directives

2. **Configuration Section**
   - Table of required settings

3. **Skill Content**
   - Purpose
   - Capabilities
   - Workflow steps
   - Best practices
   - Deliverables

## Directory Structure

```text
skills/
├── README.md
├── brand-guidelines.md
├── audit/
│   ├── security-audit.md
│   ├── performance-audit.md
│   └── accessibility-audit.md
├── auth/
│   └── nextauth-patterns.md
├── documentation/
│   └── markdown-formatter.md
├── git/
│   └── git-commit-helper.md
├── i18n/
│   └── i18n-patterns.md
├── patterns/
│   ├── error-handling-patterns.md
│   └── tdd-methodology.md
├── qa/
│   ├── qa-criteria-validator.md
│   └── web-app-testing.md
├── react/
│   └── react-hook-form-patterns.md
├── state/
│   ├── redux-toolkit-patterns.md
│   ├── tanstack-query-patterns.md
│   └── zustand-patterns.md
├── tech/
│   ├── mermaid-diagram-specialist.md
│   ├── shadcn-specialist.md
│   └── vercel-specialist.md
├── testing/
│   ├── api-app-testing.md
│   ├── performance-testing.md
│   └── security-testing.md
└── utils/
    ├── add-memory.md
    ├── json-data-auditor.md
    └── pdf-creator-editor.md
```

## Adding New Skills

1. Create `.md` file in appropriate category folder
2. Include YAML frontmatter with `config_required`
3. Add `⚙️ Configuration` section with settings table
4. Keep content concise (150-300 lines target)
5. Update this README

## Related

- [Agents](../agents/README.md)
- [Commands](../commands/README.md)
