/**
 * CLAUDE.md generator - creates the main Claude instructions file in project root
 */

import type { ClaudeConfig, ProjectInfo } from '../../types/config.js';
import type { StandardsConfig } from '../../types/standards.js';
import type {
  TemplateConfig,
  TemplateConfigCommands,
  TemplateConfigTechStack,
} from '../../types/template-config.js';
import { joinPath, pathExists, readFile, writeFile } from '../utils/fs.js';
import { getTemplatesPath } from '../utils/paths.js';
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
    // Get template content
    let template: string;
    if (options?.customTemplate) {
      template = options.customTemplate;
    } else {
      const templatePath = joinPath(getTemplatesPath(), 'CLAUDE.md.template');
      if (await pathExists(templatePath)) {
        template = await readFile(templatePath);
      } else {
        // Fallback to minimal template
        template = getMinimalTemplate();
      }
    }

    // Process template with all available data
    const content = processTemplate(template, projectInfo, options);

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
 * Process template with all available data
 */
function processTemplate(
  template: string,
  projectInfo: ProjectInfo,
  options?: ClaudeMdOptions
): string {
  let content = template;
  const techStack = options?.templateConfig?.techStack;
  const commands = options?.templateConfig?.commands;
  const targets = options?.templateConfig?.targets;
  const preferences = options?.claudeConfig?.preferences;
  const standards = options?.claudeConfig?.extras?.standards;

  // Basic project info replacements
  content = content
    .replace(/\{\{PROJECT_NAME\}\}/g, projectInfo.name)
    .replace(/\{\{PROJECT_DESCRIPTION\}\}/g, projectInfo.description)
    .replace(/\{\{ORG\}\}/g, projectInfo.org)
    .replace(/\{\{REPO\}\}/g, projectInfo.repo)
    .replace(/\{\{ENTITY_TYPE\}\}/g, projectInfo.entityType)
    .replace(/\{\{ENTITY_TYPE_PLURAL\}\}/g, projectInfo.entityTypePlural)
    .replace(/\{\{LOCATION\}\}/g, projectInfo.location || '');

  // Package manager
  const packageManager = preferences?.packageManager || 'pnpm';
  content = content.replace(/\{\{PACKAGE_MANAGER\}\}/g, packageManager);

  // Coverage target - from standards or targets
  const coverageTarget = standards?.testing?.coverageTarget
    ? String(standards.testing.coverageTarget)
    : targets && 'coverage' in targets
      ? String(targets.coverage)
      : '90';
  content = content.replace(/\{\{COVERAGE_TARGET\}\}/g, coverageTarget);

  // Process standards-based placeholders
  content = processStandardsPlaceholders(content, standards, preferences);

  // Domain handling with conditional
  if (projectInfo.domain) {
    content = content
      .replace(/\{\{#if DOMAIN\}\}/g, '')
      .replace(/\{\{\/if\}\}/g, '')
      .replace(/\{\{DOMAIN\}\}/g, projectInfo.domain);
  } else {
    // Remove domain section if not provided
    content = content.replace(/\{\{#if DOMAIN\}\}[\s\S]*?\{\{\/if\}\}/g, '');
  }

  // Generate tech stack section
  if (techStack && Object.keys(techStack).length > 0) {
    const techStackContent = generateTechStackSection(techStack);
    content = content
      .replace(/\{\{#if TECH_STACK\}\}/g, '')
      .replace(/\{\{TECH_STACK\}\}\n\{\{else\}\}[\s\S]*?\{\{\/if\}\}/g, techStackContent);
  } else {
    // Use default tech stack section
    content = content
      .replace(/\{\{#if TECH_STACK\}\}[\s\S]*?\{\{else\}\}/g, '')
      .replace(/\{\{\/if\}\}/g, '');
  }

  // Generate commands section
  if (commands && Object.keys(commands).length > 0) {
    const commandsContent = generateCommandsSection(commands, packageManager);
    content = content
      .replace(/\{\{#if COMMANDS\}\}/g, '')
      .replace(/\{\{COMMANDS\}\}\n\{\{else\}\}[\s\S]*?\{\{\/if\}\}/g, commandsContent);
  } else {
    // Use default commands section
    content = content
      .replace(/\{\{#if COMMANDS\}\}[\s\S]*?\{\{else\}\}/g, '')
      .replace(/\{\{\/if\}\}/g, '');
  }

  // Handle project structure conditional (use default for now)
  content = content
    .replace(/\{\{#if PROJECT_STRUCTURE\}\}[\s\S]*?\{\{else\}\}/g, '')
    .replace(/\{\{\/if\}\}/g, '');

  return content;
}

/**
 * Generate tech stack section content
 */
function generateTechStackSection(techStack: TemplateConfigTechStack): string {
  const lines: string[] = [];

  // Frontend
  if (techStack.frontendFramework && techStack.frontendFramework !== 'None') {
    lines.push('**Frontend:**');
    lines.push(`- Framework: ${techStack.frontendFramework}`);
    if (techStack.stateManagement && techStack.stateManagement !== 'None') {
      lines.push(`- State: ${techStack.stateManagement}`);
    }
    lines.push('');
  }

  // Backend
  if (techStack.apiFramework && techStack.apiFramework !== 'None') {
    lines.push('**Backend:**');
    lines.push(`- API: ${techStack.apiFramework}`);
    if (techStack.validationLibrary && techStack.validationLibrary !== 'None') {
      lines.push(`- Validation: ${techStack.validationLibrary}`);
    }
    lines.push('');
  }

  // Database
  if (techStack.databaseOrm && techStack.databaseOrm !== 'None') {
    lines.push('**Database:**');
    lines.push(`- ORM: ${techStack.databaseOrm}`);
    lines.push('');
  }

  // Auth
  if (techStack.authPattern && techStack.authPattern !== 'None') {
    lines.push('**Authentication:**');
    lines.push(`- Provider: ${techStack.authPattern}`);
    lines.push('');
  }

  // Testing
  if (techStack.testFramework && techStack.testFramework !== 'None') {
    lines.push('**Testing:**');
    lines.push(`- Framework: ${techStack.testFramework}`);
    lines.push('');
  }

  // Bundler
  if (techStack.bundler && techStack.bundler !== 'None') {
    lines.push('**Build:**');
    lines.push(`- Bundler: ${techStack.bundler}`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generate commands section content
 */
function generateCommandsSection(commands: TemplateConfigCommands, packageManager: string): string {
  const lines: string[] = ['```bash'];

  // Development commands
  lines.push('# Development');
  lines.push(`${packageManager} dev              # Start development server`);
  lines.push('');

  // Testing commands
  lines.push('# Testing');
  if (commands.test) {
    lines.push(`${commands.test}           # Run tests`);
  } else {
    lines.push(`${packageManager} test             # Run tests`);
  }
  if (commands.coverage) {
    lines.push(`${commands.coverage}  # Run tests with coverage`);
  } else {
    lines.push(`${packageManager} test:coverage    # Run tests with coverage`);
  }
  lines.push('');

  // Quality commands
  lines.push('# Quality');
  if (commands.lint) {
    lines.push(`${commands.lint}           # Run linter`);
  } else {
    lines.push(`${packageManager} lint             # Run linter`);
  }
  if (commands.typecheck) {
    lines.push(`${commands.typecheck}      # Type checking`);
  } else {
    lines.push(`${packageManager} typecheck        # Type checking`);
  }

  // Build command
  if (commands.build) {
    lines.push('');
    lines.push('# Build');
    lines.push(`${commands.build}          # Build for production`);
  }

  lines.push('```');

  return lines.join('\n');
}

/**
 * Process standards-based placeholders
 */
function processStandardsPlaceholders(
  content: string,
  standards?: StandardsConfig,
  preferences?: { language?: string; responseLanguage?: string; includeCoAuthor?: boolean }
): string {
  let result = content;

  // Primary language (default to TypeScript)
  const primaryLanguage = 'TypeScript'; // Could be extended to detect from project
  result = result.replace(/\{\{PRIMARY_LANGUAGE\}\}/g, primaryLanguage);

  // Max file lines
  const maxFileLines = standards?.code?.maxFileLines?.toString() || '500';
  result = result.replace(/\{\{MAX_FILE_LINES\}\}/g, maxFileLines);

  // Test pattern
  const testPattern =
    standards?.testing?.testPattern === 'gwt'
      ? 'GWT (Given-When-Then)'
      : 'AAA (Arrange, Act, Assert)';
  result = result.replace(/\{\{TEST_PATTERN\}\}/g, testPattern);

  // Response language
  const responseLanguage =
    preferences?.responseLanguage === 'es'
      ? 'Spanish'
      : preferences?.responseLanguage === 'en'
        ? 'English'
        : 'Spanish';
  result = result.replace(/\{\{RESPONSE_LANGUAGE\}\}/g, responseLanguage);

  // Boolean conditionals
  // NAMED_EXPORTS_ONLY
  if (standards?.code?.namedExportsOnly) {
    result = result.replace(/\{\{#if NAMED_EXPORTS_ONLY\}\}/g, '').replace(/\{\{\/if\}\}/g, '');
  } else {
    result = result.replace(/\{\{#if NAMED_EXPORTS_ONLY\}\}[\s\S]*?\{\{\/if\}\}/g, '');
  }

  // JSDOC_REQUIRED
  if (standards?.code?.jsDocRequired) {
    result = result.replace(/\{\{#if JSDOC_REQUIRED\}\}/g, '').replace(/\{\{\/if\}\}/g, '');
  } else {
    result = result.replace(/\{\{#if JSDOC_REQUIRED\}\}[\s\S]*?\{\{\/if\}\}/g, '');
  }

  // RORO_PATTERN
  if (standards?.code?.roroPattern) {
    result = result.replace(/\{\{#if RORO_PATTERN\}\}/g, '').replace(/\{\{\/if\}\}/g, '');
  } else {
    result = result.replace(/\{\{#if RORO_PATTERN\}\}[\s\S]*?\{\{\/if\}\}/g, '');
  }

  // TDD_REQUIRED
  if (standards?.testing?.tddRequired) {
    result = result
      .replace(/\{\{#if TDD_REQUIRED\}\}/g, '')
      .replace(/\{\{else\}\}[\s\S]*?\{\{\/if\}\}/g, '');
  } else {
    result = result
      .replace(/\{\{#if TDD_REQUIRED\}\}[\s\S]*?\{\{else\}\}/g, '')
      .replace(/\{\{\/if\}\}/g, '');
  }

  // TEST_LOCATION
  const testLocation = standards?.testing?.testLocation;
  if (testLocation) {
    const testLocationText =
      testLocation === 'colocated' ? 'Co-located with source' : 'Separate test directory';
    result = result
      .replace(/\{\{#if TEST_LOCATION\}\}/g, '')
      .replace(/\{\{\/if\}\}/g, '')
      .replace(/\{\{TEST_LOCATION\}\}/g, testLocationText);
  } else {
    result = result.replace(/\{\{#if TEST_LOCATION\}\}[\s\S]*?\{\{\/if\}\}/g, '');
  }

  // INCLUDE_CO_AUTHOR
  if (preferences?.includeCoAuthor) {
    result = result.replace(/\{\{#if INCLUDE_CO_AUTHOR\}\}/g, '').replace(/\{\{\/if\}\}/g, '');
  } else {
    result = result.replace(/\{\{#if INCLUDE_CO_AUTHOR\}\}[\s\S]*?\{\{\/if\}\}/g, '');
  }

  // RESPONSE_LANGUAGE conditional
  if (preferences?.responseLanguage) {
    result = result.replace(/\{\{#if RESPONSE_LANGUAGE\}\}/g, '').replace(/\{\{\/if\}\}/g, '');
  } else {
    result = result.replace(/\{\{#if RESPONSE_LANGUAGE\}\}[\s\S]*?\{\{\/if\}\}/g, '');
  }

  return result;
}

/**
 * Get minimal fallback template
 */
function getMinimalTemplate(): string {
  return `# CLAUDE.md

## Project Overview

**{{PROJECT_NAME}}** - {{PROJECT_DESCRIPTION}}

## Repository

- **GitHub:** https://github.com/{{ORG}}/{{REPO}}

## Quick Commands

\`\`\`bash
{{PACKAGE_MANAGER}} dev        # Start development
{{PACKAGE_MANAGER}} test       # Run tests
{{PACKAGE_MANAGER}} lint       # Run linter
{{PACKAGE_MANAGER}} build      # Build project
\`\`\`

## Claude Configuration

This project uses \`@qazuor/claude-code-config\` for AI-assisted development.

See \`.claude/docs/quick-start.md\` for getting started.

---

*Generated by [@qazuor/claude-code-config](https://github.com/qazuor/claude-code-config)*
`;
}
