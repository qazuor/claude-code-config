/**
 * Template configuration prompts
 *
 * Interactive prompts for configuring template placeholders
 * with auto-detection and smart defaults.
 */

import {
  TEMPLATE_PLACEHOLDERS,
  computeDefaultValue,
  getPlaceholdersByCategory,
} from '../../constants/template-placeholders.js';
import {
  getGlobalTemplateConfig,
  hasGlobalDefaults,
  mergeWithGlobalDefaults,
  updateGlobalDefaults,
} from '../../lib/config/global-defaults.js';
import { logger } from '../../lib/utils/logger.js';
import { confirm, input, select } from '../../lib/utils/prompt-cancel.js';
import type {
  TemplateConfig,
  TemplateConfigContext,
  TemplateConfigSetupMode,
  TemplatePlaceholderCategory,
  TemplatePlaceholderDefinition,
} from '../../types/template-config.js';

/**
 * Category display names and order
 */
const CATEGORY_INFO: Record<TemplatePlaceholderCategory, { name: string; order: number }> = {
  commands: { name: 'CLI Commands', order: 1 },
  paths: { name: 'Directory Paths', order: 2 },
  targets: { name: 'Quality Targets', order: 3 },
  tracking: { name: 'Issue Tracking', order: 4 },
  techStack: { name: 'Technology Stack', order: 5 },
  performance: { name: 'Performance Targets', order: 6 },
  environment: { name: 'Environment Variables', order: 7 },
  brand: { name: 'Brand Identity', order: 8 },
};

/**
 * Options for template config prompts
 */
export interface TemplateConfigPromptOptions {
  /** Context for computing defaults */
  context: TemplateConfigContext;
  /** Setup mode */
  mode?: TemplateConfigSetupMode;
  /** Specific category to configure */
  category?: TemplatePlaceholderCategory;
  /** Only configure required placeholders */
  requiredOnly?: boolean;
  /** Skip confirmation */
  skipConfirm?: boolean;
}

/**
 * Prompt for setup mode selection
 */
export async function promptSetupMode(): Promise<TemplateConfigSetupMode> {
  const mode = await select<TemplateConfigSetupMode>({
    message: 'Configuration mode:',
    choices: [
      {
        name: 'Quick Setup (recommended)',
        value: 'quick',
        description: 'Auto-detect values, confirm all at once',
      },
      {
        name: 'Guided Setup',
        value: 'guided',
        description: 'Step through each category',
      },
      {
        name: 'Advanced Setup',
        value: 'advanced',
        description: 'Configure all options individually',
      },
    ],
    default: 'quick',
  });

  return mode;
}

/**
 * Build context for computing defaults
 */
export async function buildConfigContext(projectPath: string): Promise<TemplateConfigContext> {
  const context: TemplateConfigContext = {
    projectPath,
    values: {},
  };

  try {
    // Read package.json for scripts and dependencies
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const pkgPath = path.join(projectPath, 'package.json');

    const pkgContent = await fs.readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(pkgContent) as {
      scripts?: Record<string, string>;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    context.scripts = pkg.scripts || {};
    context.dependencies = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {}),
    };

    // Detect TypeScript
    context.hasTypeScript =
      Boolean(context.dependencies.typescript) ||
      (await fileExists(path.join(projectPath, 'tsconfig.json')));

    // Detect package manager
    if (await fileExists(path.join(projectPath, 'pnpm-lock.yaml'))) {
      context.packageManager = 'pnpm';
    } else if (await fileExists(path.join(projectPath, 'yarn.lock'))) {
      context.packageManager = 'yarn';
    } else if (await fileExists(path.join(projectPath, 'bun.lockb'))) {
      context.packageManager = 'bun';
    } else {
      context.packageManager = 'npm';
    }

    // Detect git
    context.isGitRepo = await fileExists(path.join(projectPath, '.git'));

    // Detect GitHub remote
    if (context.isGitRepo) {
      try {
        const { execSync } = await import('node:child_process');
        const remotes = execSync('git remote -v', {
          cwd: projectPath,
          encoding: 'utf-8',
        });
        context.hasGitHubRemote = remotes.includes('github.com');
      } catch {
        context.hasGitHubRemote = false;
      }
    }
  } catch {
    // Default context if package.json doesn't exist
  }

  return context;
}

/**
 * Check if a file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    const fs = await import('node:fs/promises');
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Prompt for a single placeholder value
 */
async function promptPlaceholder(
  placeholder: TemplatePlaceholderDefinition,
  context: TemplateConfigContext,
  detectedValue?: string
): Promise<string> {
  const defaultValue = detectedValue || computeDefaultValue(placeholder, context) || '';

  switch (placeholder.inputType) {
    case 'select': {
      if (!placeholder.choices || placeholder.choices.length === 0) {
        // Fall back to text input
        return input({
          message: `${placeholder.label}:`,
          default: defaultValue,
        });
      }

      const choices = placeholder.choices.map((c) => ({
        name: c.name,
        value: c.value,
        description: c.description,
      }));

      return select({
        message: `${placeholder.label}:`,
        choices,
        default: defaultValue || choices[0].value,
      });
    }

    case 'number': {
      const result = await input({
        message: `${placeholder.label}:`,
        default: defaultValue,
        validate: (value) => {
          if (placeholder.validate) {
            return placeholder.validate(value, context);
          }
          const num = Number(value);
          if (Number.isNaN(num)) {
            return 'Please enter a valid number';
          }
          return true;
        },
      });
      return result;
    }

    case 'path': {
      return input({
        message: `${placeholder.label}:`,
        default: defaultValue,
        validate: (value) => {
          if (placeholder.required && !value.trim()) {
            return 'This path is required';
          }
          if (placeholder.validate) {
            return placeholder.validate(value, context);
          }
          return true;
        },
      });
    }

    case 'envVar': {
      return input({
        message: `${placeholder.label}:`,
        default: defaultValue,
        validate: (value) => {
          if (placeholder.required && !value.trim()) {
            return 'This environment variable is required';
          }
          if (value && !/^[A-Z][A-Z0-9_]*$/.test(value)) {
            return 'Environment variable should be UPPER_SNAKE_CASE';
          }
          return true;
        },
      });
    }

    default: {
      return input({
        message: `${placeholder.label}:`,
        default: defaultValue,
        validate: (value) => {
          if (placeholder.required && !value.trim()) {
            return `${placeholder.label} is required`;
          }
          if (placeholder.validate) {
            return placeholder.validate(value, context);
          }
          return true;
        },
      });
    }
  }
}

/**
 * Compute all default values for quick setup
 */
function computeAllDefaults(
  context: TemplateConfigContext,
  globalDefaults?: Partial<TemplateConfig>
): Partial<TemplateConfig> {
  const config: Partial<TemplateConfig> = {
    commands: {},
    paths: {},
    targets: {},
    tracking: {},
    techStack: {},
    environment: {},
    brand: {},
  };

  for (const placeholder of TEMPLATE_PLACEHOLDERS) {
    const defaultValue = computeDefaultValue(placeholder, context);
    if (defaultValue) {
      setConfigValue(config, placeholder, defaultValue);
    }
  }

  // Merge with global defaults (global takes lower priority)
  if (globalDefaults) {
    return mergeWithGlobalDefaults(config, globalDefaults);
  }

  return config;
}

/**
 * Set a value in the config based on placeholder definition
 */
function setConfigValue(
  config: Partial<TemplateConfig>,
  placeholder: TemplatePlaceholderDefinition,
  value: string
): void {
  const key = placeholderKeyToConfigKey(placeholder.key, placeholder.category);

  switch (placeholder.category) {
    case 'commands':
      if (!config.commands) config.commands = {};
      (config.commands as Record<string, string>)[key] = value;
      break;
    case 'paths':
      if (!config.paths) config.paths = {};
      (config.paths as Record<string, string>)[key] = value;
      break;
    case 'targets':
    case 'performance': {
      if (!config.targets) config.targets = {};
      const numValue = Number(value);
      if (!Number.isNaN(numValue)) {
        (config.targets as Record<string, number | string>)[key] = numValue;
      } else {
        (config.targets as Record<string, number | string>)[key] = value;
      }
      break;
    }
    case 'tracking':
      if (!config.tracking) config.tracking = {};
      (config.tracking as Record<string, string | number>)[key] = key.endsWith('Days')
        ? Number(value)
        : value;
      break;
    case 'techStack':
      if (!config.techStack) config.techStack = {};
      (config.techStack as Record<string, string>)[key] = value;
      break;
    case 'environment':
      if (!config.environment) config.environment = {};
      (config.environment as Record<string, string>)[key] = value;
      break;
    case 'brand':
      if (!config.brand) config.brand = {};
      (config.brand as Record<string, string>)[key] = value;
      break;
  }
}

/**
 * Convert PLACEHOLDER_KEY to configKey
 */
function placeholderKeyToConfigKey(key: string, category: string): string {
  let cleanKey = key;

  // Remove common suffixes
  if (category === 'commands' && key.endsWith('_COMMAND')) {
    cleanKey = key.slice(0, -8);
  } else if (category === 'environment' && key.endsWith('_ENV')) {
    cleanKey = key.slice(0, -4);
  } else if (key.endsWith('_TARGET')) {
    cleanKey = key.slice(0, -7);
  }

  // Convert SNAKE_CASE to camelCase
  return cleanKey.toLowerCase().replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

/**
 * Main template configuration prompt
 */
export async function promptTemplateConfig(
  options: TemplateConfigPromptOptions
): Promise<Partial<TemplateConfig>> {
  const { context, mode = 'quick', category, requiredOnly = false } = options;

  logger.section('Template Configuration', '📝');

  // Explain why this is important
  logger.newline();
  logger.info('This step personalizes all Claude Code configuration files for YOUR project.');
  logger.info('Your answers will be used to:');
  logger.newline();
  logger.item('Replace {{PLACEHOLDERS}} in agents, commands, and skills');
  logger.item('Configure CLAUDE.md with your tech stack and commands');
  logger.item('Set up quality targets (coverage, performance, accessibility)');
  logger.item('Customize code examples to match your project structure');
  logger.newline();
  logger.info('Accurate configuration means better AI assistance tailored to your codebase!');
  logger.newline();

  // Get global defaults if available
  const hasDefaults = await hasGlobalDefaults();
  const globalDefaults = hasDefaults ? await getGlobalTemplateConfig() : undefined;

  if (mode === 'quick') {
    return promptQuickSetup(context, globalDefaults);
  }

  if (category) {
    return promptCategory(category, context, requiredOnly);
  }

  if (mode === 'guided') {
    return promptGuidedSetup(context, requiredOnly);
  }

  return promptAdvancedSetup(context);
}

/**
 * Quick setup: auto-detect and confirm
 */
async function promptQuickSetup(
  context: TemplateConfigContext,
  globalDefaults?: Partial<TemplateConfig>
): Promise<Partial<TemplateConfig>> {
  logger.info('Auto-detecting configuration from project...');
  logger.newline();

  const detected = computeAllDefaults(context, globalDefaults);

  // Display detected values by category
  displayDetectedConfig(detected, context);

  // Allow editing
  const wantEdit = await confirm({
    message: 'Would you like to modify any values?',
    default: false,
  });

  let finalConfig = detected;

  if (wantEdit) {
    finalConfig = await promptEditConfig(detected, context);
  }

  return finalConfig;
}

/**
 * Display detected configuration
 */
function displayDetectedConfig(
  config: Partial<TemplateConfig>,
  _context: TemplateConfigContext
): void {
  const categories = Object.entries(CATEGORY_INFO)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([key]) => key as TemplatePlaceholderCategory);

  for (const category of categories) {
    const placeholders = getPlaceholdersByCategory(category);
    if (placeholders.length === 0) continue;

    const values = getCategoryValues(config, category);
    if (Object.keys(values).length === 0) continue;

    logger.subtitle(CATEGORY_INFO[category].name);

    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined) {
        const placeholder = TEMPLATE_PLACEHOLDERS.find(
          (p) => placeholderKeyToConfigKey(p.key, p.category) === key
        );
        const label = placeholder?.label || key;
        logger.keyValue(label, String(value));
      }
    }
    logger.newline();
  }
}

/**
 * Get values for a specific category
 */
function getCategoryValues(
  config: Partial<TemplateConfig>,
  category: TemplatePlaceholderCategory
): Record<string, unknown> {
  switch (category) {
    case 'commands':
      return (config.commands as Record<string, unknown>) || {};
    case 'paths':
      return (config.paths as Record<string, unknown>) || {};
    case 'targets':
    case 'performance':
      return (config.targets as Record<string, unknown>) || {};
    case 'tracking':
      return (config.tracking as Record<string, unknown>) || {};
    case 'techStack':
      return (config.techStack as Record<string, unknown>) || {};
    case 'environment':
      return (config.environment as Record<string, unknown>) || {};
    case 'brand':
      return (config.brand as Record<string, unknown>) || {};
    default:
      return {};
  }
}

/**
 * Prompt to edit specific values
 */
async function promptEditConfig(
  config: Partial<TemplateConfig>,
  context: TemplateConfigContext
): Promise<Partial<TemplateConfig>> {
  const categories = Object.entries(CATEGORY_INFO)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([key]) => key as TemplatePlaceholderCategory);

  const categoryToEdit = await select<TemplatePlaceholderCategory | 'done'>({
    message: 'Which category would you like to edit?',
    choices: [
      ...categories.map((cat) => ({
        name: CATEGORY_INFO[cat].name,
        value: cat,
      })),
      { name: 'Done editing', value: 'done' as const },
    ],
  });

  if (categoryToEdit === 'done') {
    return config;
  }

  const editedCategory = await promptCategory(categoryToEdit, context, false);

  // Merge edited values
  const merged = { ...config };
  switch (categoryToEdit) {
    case 'commands':
      merged.commands = { ...config.commands, ...editedCategory.commands };
      break;
    case 'paths':
      merged.paths = { ...config.paths, ...editedCategory.paths };
      break;
    case 'targets':
    case 'performance':
      merged.targets = { ...config.targets, ...editedCategory.targets };
      break;
    case 'tracking':
      merged.tracking = { ...config.tracking, ...editedCategory.tracking };
      break;
    case 'techStack':
      merged.techStack = { ...config.techStack, ...editedCategory.techStack };
      break;
    case 'environment':
      merged.environment = { ...config.environment, ...editedCategory.environment };
      break;
    case 'brand':
      merged.brand = { ...config.brand, ...editedCategory.brand };
      break;
  }

  // Ask if they want to edit more
  const editMore = await confirm({
    message: 'Edit another category?',
    default: false,
  });

  if (editMore) {
    return promptEditConfig(merged, context);
  }

  return merged;
}

/**
 * Prompt for a specific category
 */
async function promptCategory(
  category: TemplatePlaceholderCategory,
  context: TemplateConfigContext,
  requiredOnly: boolean
): Promise<Partial<TemplateConfig>> {
  const config: Partial<TemplateConfig> = {
    commands: {},
    paths: {},
    targets: {},
    tracking: {},
    techStack: {},
    environment: {},
    brand: {},
  };

  logger.subtitle(CATEGORY_INFO[category].name);

  let placeholders = getPlaceholdersByCategory(category);

  if (requiredOnly) {
    placeholders = placeholders.filter((p) => p.required);
  }

  // Update context with already configured values
  const updatedContext = { ...context };

  for (const placeholder of placeholders) {
    const value = await promptPlaceholder(placeholder, updatedContext);
    if (value) {
      setConfigValue(config, placeholder, value);
      // Update context for dependent placeholders
      updatedContext.values[placeholder.key] = value;
    }
  }

  return config;
}

/**
 * Guided setup: step through each category
 */
async function promptGuidedSetup(
  context: TemplateConfigContext,
  requiredOnly: boolean
): Promise<Partial<TemplateConfig>> {
  const config: Partial<TemplateConfig> = {
    commands: {},
    paths: {},
    targets: {},
    tracking: {},
    techStack: {},
    environment: {},
    brand: {},
  };

  const categories = Object.entries(CATEGORY_INFO)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([key]) => key as TemplatePlaceholderCategory);

  const updatedContext = { ...context };

  for (const category of categories) {
    const placeholders = getPlaceholdersByCategory(category);
    const relevantPlaceholders = requiredOnly
      ? placeholders.filter((p) => p.required)
      : placeholders;

    if (relevantPlaceholders.length === 0) continue;

    const configureCategory = await confirm({
      message: `Configure ${CATEGORY_INFO[category].name}? (${relevantPlaceholders.length} options)`,
      default: true,
    });

    if (!configureCategory) continue;

    const categoryConfig = await promptCategory(category, updatedContext, requiredOnly);

    // Merge into main config
    switch (category) {
      case 'commands':
        config.commands = { ...config.commands, ...categoryConfig.commands };
        break;
      case 'paths':
        config.paths = { ...config.paths, ...categoryConfig.paths };
        break;
      case 'targets':
      case 'performance':
        config.targets = { ...config.targets, ...categoryConfig.targets };
        break;
      case 'tracking':
        config.tracking = { ...config.tracking, ...categoryConfig.tracking };
        break;
      case 'techStack':
        config.techStack = { ...config.techStack, ...categoryConfig.techStack };
        break;
      case 'environment':
        config.environment = { ...config.environment, ...categoryConfig.environment };
        break;
      case 'brand':
        config.brand = { ...config.brand, ...categoryConfig.brand };
        break;
    }

    // Update context
    for (const [key, value] of Object.entries(getCategoryValues(categoryConfig, category))) {
      if (value !== undefined) {
        updatedContext.values[key.toUpperCase()] = String(value);
      }
    }
  }

  return config;
}

/**
 * Advanced setup: configure all options
 */
async function promptAdvancedSetup(
  context: TemplateConfigContext
): Promise<Partial<TemplateConfig>> {
  return promptGuidedSetup(context, false);
}

/**
 * Confirm template configuration
 */
export async function confirmTemplateConfig(
  config: Partial<TemplateConfig>,
  context: TemplateConfigContext
): Promise<boolean> {
  logger.newline();
  logger.subtitle('Configuration Summary');
  displayDetectedConfig(config, context);

  return confirm({
    message: 'Apply this configuration?',
    default: true,
  });
}

/**
 * Prompt to save as global defaults
 */
export async function promptSaveGlobalDefaults(config: Partial<TemplateConfig>): Promise<boolean> {
  const save = await confirm({
    message: 'Save these values as global defaults for future projects?',
    default: false,
  });

  if (save) {
    await updateGlobalDefaults(config);
    logger.success('Global defaults saved to ~/.claude/defaults.json');
  }

  return save;
}
