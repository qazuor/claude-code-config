/**
 * CLAUDE.md generator - creates the main Claude instructions file in project root
 *
 * This generator builds the content directly instead of using template regex processing
 * for more reliable output.
 */

import type { ClaudeConfig, ProjectInfo } from '../../types/config.js';
import type {
  TemplateConfig,
  TemplateConfigCommands,
  TemplateConfigTechStack,
} from '../../types/template-config.js';
import { joinPath, pathExists, writeFile } from '../utils/fs.js';
import { withSpinner } from '../utils/spinner.js';

export interface ClaudeMdOptions {
  /** Whether to overwrite existing file */
  overwrite?: boolean;
  /** Custom template content (optional) */
  customTemplate?: string;
  /** Template configuration with tech stack info */
  templateConfig?: Partial<TemplateConfig>;
  /** Full claude config for additional context */
  claudeConfig?: ClaudeConfig;
}

export interface ClaudeMdResult {
  /** Whether file was created */
  created: boolean;
  /** Whether file was skipped (already exists) */
  skipped: boolean;
  /** Path to the file */
  path: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Generate CLAUDE.md file in project root
 */
export async function generateClaudeMd(
  projectPath: string,
  projectInfo: ProjectInfo,
  options?: ClaudeMdOptions
): Promise<ClaudeMdResult> {
  const claudeMdPath = joinPath(projectPath, 'CLAUDE.md');

  // Check if file exists
  const exists = await pathExists(claudeMdPath);
  if (exists && !options?.overwrite) {
    return {
      created: false,
      skipped: true,
      path: claudeMdPath,
    };
  }

  try {
    let content: string;

    // If custom template provided, use it with basic placeholder replacement
    if (options?.customTemplate) {
      content = processCustomTemplate(options.customTemplate, projectInfo);
    } else {
      // Generate content directly (more reliable than regex templates)
      content = generateClaudeMdContent(projectInfo, options);
    }

    // Write file
    await writeFile(claudeMdPath, content);

    return {
      created: true,
      skipped: false,
      path: claudeMdPath,
    };
  } catch (error) {
    return {
      created: false,
      skipped: false,
      path: claudeMdPath,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Generate CLAUDE.md with spinner
 */
export async function generateClaudeMdWithSpinner(
  projectPath: string,
  projectInfo: ProjectInfo,
  options?: ClaudeMdOptions
): Promise<ClaudeMdResult> {
  return withSpinner(
    'Generating CLAUDE.md...',
    () => generateClaudeMd(projectPath, projectInfo, options),
    {
      successText: 'Created CLAUDE.md',
    }
  );
}

/**
 * Process a custom template with basic placeholder replacement
 * Only handles simple {{PLACEHOLDER}} patterns, no conditionals
 */
function processCustomTemplate(template: string, projectInfo: ProjectInfo): string {
  return template
    .replace(/\{\{PROJECT_NAME\}\}/g, projectInfo.name)
    .replace(/\{\{PROJECT_DESCRIPTION\}\}/g, projectInfo.description)
    .replace(/\{\{ORG\}\}/g, projectInfo.org)
    .replace(/\{\{REPO\}\}/g, projectInfo.repo)
    .replace(/\{\{ENTITY_TYPE\}\}/g, projectInfo.entityType)
    .replace(/\{\{ENTITY_TYPE_PLURAL\}\}/g, projectInfo.entityTypePlural)
    .replace(/\{\{DOMAIN\}\}/g, projectInfo.domain || '')
    .replace(/\{\{LOCATION\}\}/g, projectInfo.location || '');
}

/**
 * Generate CLAUDE.md content directly (no regex template processing)
 */
function generateClaudeMdContent(projectInfo: ProjectInfo, options?: ClaudeMdOptions): string {
  const techStack = options?.templateConfig?.techStack;
  const commands = options?.templateConfig?.commands;
  const targets = options?.templateConfig?.targets;
  const preferences = options?.claudeConfig?.preferences;
  const standards = options?.claudeConfig?.extras?.standards;

  const packageManager = preferences?.packageManager || 'pnpm';
  const lines: string[] = [];

  // Header
  lines.push('# CLAUDE.md');
  lines.push('');

  // Project Overview
  lines.push('## Project Overview');
  lines.push('');
  lines.push(`**${projectInfo.name}** - ${projectInfo.description}`);
  lines.push('');

  // Repository
  lines.push('## Repository');
  lines.push('');
  lines.push(`- **Organization:** ${projectInfo.org}`);
  lines.push(`- **Repository:** ${projectInfo.repo}`);
  lines.push(`- **GitHub:** https://github.com/${projectInfo.org}/${projectInfo.repo}`);
  if (projectInfo.domain) {
    lines.push(`- **Domain:** ${projectInfo.domain}`);
  }
  lines.push('');

  // Tech Stack
  lines.push('## Tech Stack');
  lines.push('');
  lines.push(generateTechStackSection(techStack));

  // Project Structure
  lines.push('## Project Structure');
  lines.push('');
  lines.push('```text');
  lines.push(`${projectInfo.name}/`);
  lines.push('├── src/              # Source code');
  lines.push('├── tests/            # Test files');
  lines.push('├── docs/             # Documentation');
  lines.push('└── .claude/          # Claude configuration');
  lines.push('    ├── agents/       # AI agent definitions');
  lines.push('    ├── commands/     # Custom slash commands');
  lines.push('    ├── skills/       # Specialized skills');
  lines.push('    └── docs/         # AI-specific documentation');
  lines.push('```');
  lines.push('');

  // Quick Commands
  lines.push('## Quick Commands');
  lines.push('');
  lines.push(generateCommandsSection(commands, packageManager));

  // Development Guidelines
  lines.push('## Development Guidelines');
  lines.push('');

  // Code Standards
  lines.push('### Code Standards');
  lines.push('');
  lines.push('- Primary language: TypeScript');
  lines.push('- Follow TypeScript best practices');
  if (standards?.code?.namedExportsOnly) {
    lines.push('- Use named exports only (no default exports)');
  }
  const maxLines = standards?.code?.maxFileLines || 500;
  lines.push(`- Maximum ${maxLines} lines per file`);
  if (standards?.code?.jsDocRequired) {
    lines.push('- Document all exports with JSDoc');
  }
  if (standards?.code?.roroPattern) {
    lines.push('- Use RO-RO pattern (Receive Object, Return Object)');
  }
  lines.push('');

  // Testing
  lines.push('### Testing');
  lines.push('');
  if (standards?.testing?.tddRequired) {
    lines.push('- Methodology: TDD (Test-Driven Development)');
    lines.push('- Write tests first: Red -> Green -> Refactor');
  } else {
    lines.push('- Write comprehensive tests for all features');
  }
  const coverageTarget =
    standards?.testing?.coverageTarget ||
    (targets && 'coverage' in targets ? targets.coverage : 90);
  lines.push(`- Maintain ${coverageTarget}%+ code coverage`);
  const testPattern =
    standards?.testing?.testPattern === 'gwt'
      ? 'GWT (Given-When-Then)'
      : 'AAA (Arrange, Act, Assert)';
  lines.push(`- Test pattern: ${testPattern}`);
  if (standards?.testing?.testLocation) {
    const testLocationText =
      standards.testing.testLocation === 'colocated'
        ? 'Co-located with source'
        : 'Separate test directory';
    lines.push(`- Test location: ${testLocationText}`);
  }
  lines.push('');

  // Git Workflow
  lines.push('### Git Workflow');
  lines.push('');
  lines.push('- Use conventional commits: `type(scope): description`');
  lines.push('- Types: feat, fix, docs, style, refactor, test, chore');
  lines.push('- Keep commits atomic and focused');
  if (preferences?.includeCoAuthor) {
    lines.push('');
    lines.push('#### Commit Attribution');
    lines.push('');
    lines.push('Include the following in commit messages:');
    lines.push('```');
    lines.push('🤖 Generated with [Claude Code](https://claude.com/claude-code)');
    lines.push('');
    lines.push('Co-Authored-By: Claude <noreply@anthropic.com>');
    lines.push('```');
  }
  lines.push('');

  // Claude Behavior Guidelines
  lines.push('## Claude Behavior Guidelines');
  lines.push('');

  // Critical Thinking
  lines.push('### Critical Thinking');
  lines.push('');
  lines.push('- You are an expert who double-checks things, you are skeptical and do research');
  lines.push('- Neither the user nor you are always right, but both strive for accuracy');
  lines.push('- When the user asks something, reason with these questions:');
  lines.push('  - "Why might the user be wrong?"');
  lines.push('  - "What arguments exist against what the user thinks?"');
  lines.push('  - "Act as devil\'s advocate - why might this proposal fail?"');
  lines.push('  - "Imagine you\'re in a debate - how would you refute this?"');
  lines.push(
    '- Always ask to better understand the context of the requested change before implementing'
  );
  lines.push('');

  // Communication Style
  lines.push('### Communication Style');
  lines.push('');
  if (preferences?.responseLanguage) {
    const langDisplay =
      preferences.responseLanguage === 'es'
        ? 'Spanish'
        : preferences.responseLanguage === 'en'
          ? 'English'
          : preferences.responseLanguage;
    lines.push(`- Respond in ${langDisplay}`);
  }
  lines.push('- Code and comments should always be in English');
  lines.push('- Be direct and concise');
  lines.push('- Explain the "why" behind decisions when relevant');
  lines.push('');

  // Writing Style
  lines.push('### Writing Style');
  lines.push('');
  lines.push(
    '- Systematically replace em-dashes ("—") with a period (".") to start a new sentence, or a comma (",") to continue the sentence'
  );
  lines.push('- Avoid unnecessary filler words');
  lines.push('- Use clear, technical language');
  lines.push('');

  // Claude Configuration
  lines.push('## Claude Configuration');
  lines.push('');
  lines.push('This project uses `@qazuor/claude-code-config` for AI-assisted development.');
  lines.push('');
  lines.push('### Available Commands');
  lines.push('');
  lines.push('Run `/help` in Claude to see all available commands.');
  lines.push('');
  lines.push('### Documentation');
  lines.push('');
  lines.push('- Quick Start: `.claude/docs/quick-start.md`');
  lines.push('- Workflows: `.claude/docs/workflows/README.md`');
  lines.push('- Standards: `.claude/docs/standards/`');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(
    '*Generated by [@qazuor/claude-code-config](https://github.com/qazuor/claude-code-config)*'
  );
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate tech stack section content
 */
function generateTechStackSection(techStack?: TemplateConfigTechStack): string {
  if (!techStack) {
    return getDefaultTechStack();
  }

  const lines: string[] = [];
  let hasContent = false;

  // Frontend
  if (techStack.frontendFramework && techStack.frontendFramework !== 'None') {
    lines.push('**Frontend:**');
    lines.push(`- Framework: ${techStack.frontendFramework}`);
    if (techStack.stateManagement && techStack.stateManagement !== 'None') {
      lines.push(`- State: ${techStack.stateManagement}`);
    }
    lines.push('');
    hasContent = true;
  }

  // Backend
  if (techStack.apiFramework && techStack.apiFramework !== 'None') {
    lines.push('**Backend:**');
    lines.push(`- API: ${techStack.apiFramework}`);
    if (techStack.validationLibrary && techStack.validationLibrary !== 'None') {
      lines.push(`- Validation: ${techStack.validationLibrary}`);
    }
    lines.push('');
    hasContent = true;
  }

  // Database
  if (techStack.databaseOrm && techStack.databaseOrm !== 'None') {
    lines.push('**Database:**');
    lines.push(`- ORM: ${techStack.databaseOrm}`);
    lines.push('');
    hasContent = true;
  }

  // Auth
  if (techStack.authPattern && techStack.authPattern !== 'None') {
    lines.push('**Authentication:**');
    lines.push(`- Provider: ${techStack.authPattern}`);
    lines.push('');
    hasContent = true;
  }

  // Testing
  if (techStack.testFramework && techStack.testFramework !== 'None') {
    lines.push('**Testing:**');
    lines.push(`- Framework: ${techStack.testFramework}`);
    lines.push('');
    hasContent = true;
  }

  // Bundler
  if (techStack.bundler && techStack.bundler !== 'None') {
    lines.push('**Build:**');
    lines.push(`- Bundler: ${techStack.bundler}`);
    lines.push('');
    hasContent = true;
  }

  if (!hasContent) {
    return getDefaultTechStack();
  }

  return lines.join('\n');
}

/**
 * Get default tech stack when nothing is configured
 */
function getDefaultTechStack(): string {
  return `**Frontend:**
- Framework: Not configured

**Backend:**
- API: Not configured

**Database:**
- ORM: Not configured

**Testing:**
- Framework: Not configured

`;
}

/**
 * Generate commands section content
 */
function generateCommandsSection(
  commands?: TemplateConfigCommands,
  packageManager = 'pnpm'
): string {
  const lines: string[] = ['```bash'];

  // Development commands
  lines.push('# Development');
  lines.push(`${packageManager} dev              # Start development server`);
  lines.push('');

  // Testing commands
  lines.push('# Testing');
  if (commands?.test) {
    lines.push(`${commands.test}           # Run tests`);
  } else {
    lines.push(`${packageManager} test             # Run tests`);
  }
  if (commands?.coverage) {
    lines.push(`${commands.coverage}  # Run tests with coverage`);
  } else {
    lines.push(`${packageManager} test:coverage    # Run tests with coverage`);
  }
  lines.push('');

  // Quality commands
  lines.push('# Quality');
  if (commands?.lint) {
    lines.push(`${commands.lint}           # Run linter`);
  } else {
    lines.push(`${packageManager} lint             # Run linter`);
  }
  if (commands?.typecheck) {
    lines.push(`${commands.typecheck}      # Type checking`);
  } else {
    lines.push(`${packageManager} typecheck        # Type checking`);
  }

  // Build command
  if (commands?.build) {
    lines.push('');
    lines.push('# Build');
    lines.push(`${commands.build}          # Build for production`);
  }

  lines.push('```');
  lines.push('');

  return lines.join('\n');
}
