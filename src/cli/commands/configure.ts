/**
 * Configure command - configure template placeholders
 */

import { Command } from 'commander';
import {
  formatGlobalDefaults,
  getGlobalDefaultsPath,
  readGlobalDefaults,
} from '../../lib/config/global-defaults.js';
import { readConfig, writeConfig } from '../../lib/config/index.js';
import {
  formatReplacementReport,
  previewReplacements,
  replaceTemplateConfigWithSpinner,
} from '../../lib/templates/config-replacer.js';
import {
  formatScanSummary,
  getUnconfiguredPlaceholders,
  scanForPlaceholders,
} from '../../lib/templates/scanner.js';
import { joinPath, resolvePath } from '../../lib/utils/fs.js';
import { colors, logger } from '../../lib/utils/logger.js';
import type { TemplatePlaceholderCategory } from '../../types/template-config.js';
import {
  buildConfigContext,
  confirmTemplateConfig,
  promptSaveGlobalDefaults,
  promptSetupMode,
  promptTemplateConfig,
} from '../prompts/template-config.js';

interface ConfigureOptions {
  scan?: boolean;
  category?: TemplatePlaceholderCategory;
  preview?: boolean;
  showDefaults?: boolean;
  verbose?: boolean;
}

/**
 * Create configure command
 */
export function createConfigureCommand(): Command {
  const cmd = new Command('configure')
    .description('Configure template placeholders interactively')
    .argument('[path]', 'Project path (default: current directory)')
    .option('--scan', 'Scan for unconfigured placeholders only')
    .option(
      '-c, --category <name>',
      'Configure specific category (commands|paths|targets|tracking|techStack|environment|brand)'
    )
    .option('--preview', 'Preview changes without applying')
    .option('--show-defaults', 'Show global defaults')
    .option('-v, --verbose', 'Detailed output')
    .action(runConfigure);

  return cmd;
}

/**
 * Run configure command
 */
async function runConfigure(path: string | undefined, options: ConfigureOptions): Promise<void> {
  const projectPath = resolvePath(path || '.');
  const claudePath = joinPath(projectPath, '.claude');

  logger.configure({ verbose: options.verbose, silent: false });

  logger.title('Template Configuration');

  try {
    // Show global defaults
    if (options.showDefaults) {
      await showGlobalDefaults();
      return;
    }

    // Scan mode - just show unconfigured placeholders
    if (options.scan) {
      await scanMode(claudePath, projectPath);
      return;
    }

    // Preview mode - show what would be replaced
    if (options.preview) {
      await previewMode(claudePath, projectPath);
      return;
    }

    // Interactive configuration
    await interactiveMode(claudePath, projectPath, options);
  } catch (error) {
    logger.error(`Configuration failed: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

/**
 * Show global defaults
 */
async function showGlobalDefaults(): Promise<void> {
  const defaults = await readGlobalDefaults();
  const formatted = formatGlobalDefaults(defaults);

  logger.info(`Path: ${colors.muted(getGlobalDefaultsPath())}`);
  logger.newline();
  logger.info(formatted);
}

/**
 * Scan mode - show unconfigured placeholders
 */
async function scanMode(claudePath: string, projectPath: string): Promise<void> {
  logger.info(`Scanning ${colors.primary(claudePath)} for placeholders...`);
  logger.newline();

  const scanResult = await scanForPlaceholders(claudePath);

  if (scanResult.placeholders.length === 0) {
    logger.success('No configurable placeholders found');
    return;
  }

  logger.info(formatScanSummary(scanResult));

  // Check for existing config
  const existingConfig = await readConfig(projectPath);

  if (existingConfig?.templateConfig) {
    const unconfigured = await getUnconfiguredPlaceholders(
      claudePath,
      existingConfig.templateConfig
    );

    if (unconfigured.length > 0) {
      logger.newline();
      logger.warn(`${unconfigured.length} placeholders not configured:`);
      for (const p of unconfigured) {
        logger.info(`  ${p}`);
      }
      logger.newline();
      logger.info('Run `claude-config configure` to configure them');
    } else {
      logger.newline();
      logger.success('All placeholders are configured');
    }
  } else {
    logger.newline();
    logger.info('Run `claude-config configure` to configure placeholders');
  }
}

/**
 * Preview mode - show what would be replaced
 */
async function previewMode(claudePath: string, projectPath: string): Promise<void> {
  const existingConfig = await readConfig(projectPath);

  if (!existingConfig?.templateConfig) {
    logger.warn('No template configuration found');
    logger.info('Run `claude-config configure` first to set up configuration');
    return;
  }

  logger.info('Preview of replacements:');
  logger.newline();

  const replacements = await previewReplacements(claudePath, existingConfig.templateConfig);

  if (replacements.length === 0) {
    logger.info('No placeholders to replace');
    return;
  }

  // Group by file
  const byFile: Record<string, Array<{ placeholder: string; value: string }>> = {};
  for (const r of replacements) {
    if (!byFile[r.file]) {
      byFile[r.file] = [];
    }
    byFile[r.file].push({ placeholder: r.placeholder, value: r.value });
  }

  for (const [file, changes] of Object.entries(byFile)) {
    logger.subtitle(file);
    for (const change of changes) {
      logger.info(`  ${change.placeholder} → ${colors.primary(change.value)}`);
    }
    logger.newline();
  }

  logger.success(
    `Total: ${replacements.length} replacements in ${Object.keys(byFile).length} files`
  );
}

/**
 * Interactive configuration mode
 */
async function interactiveMode(
  claudePath: string,
  projectPath: string,
  options: ConfigureOptions
): Promise<void> {
  // Build context
  const context = await buildConfigContext(projectPath);

  // Select mode (unless category specified)
  let mode: 'quick' | 'guided' | 'advanced' = 'quick';
  if (!options.category) {
    mode = await promptSetupMode();
  }

  // Prompt for configuration
  const templateConfig = await promptTemplateConfig({
    context,
    mode,
    category: options.category as TemplatePlaceholderCategory | undefined,
  });

  // Show summary and confirm
  const confirmed = await confirmTemplateConfig(templateConfig, context);
  if (!confirmed) {
    logger.warn('Configuration cancelled');
    return;
  }

  // Apply replacements
  const report = await replaceTemplateConfigWithSpinner(claudePath, templateConfig);

  if (options.verbose) {
    logger.newline();
    logger.info(formatReplacementReport(report));
  }

  // Update project config
  const existingConfig = await readConfig(projectPath);
  if (existingConfig) {
    existingConfig.templateConfig = {
      commands: { ...existingConfig.templateConfig?.commands, ...templateConfig.commands },
      paths: { ...existingConfig.templateConfig?.paths, ...templateConfig.paths },
      targets: { ...existingConfig.templateConfig?.targets, ...templateConfig.targets },
      tracking: { ...existingConfig.templateConfig?.tracking, ...templateConfig.tracking },
      techStack: { ...existingConfig.templateConfig?.techStack, ...templateConfig.techStack },
      environment: {
        ...existingConfig.templateConfig?.environment,
        ...templateConfig.environment,
      },
      brand: { ...existingConfig.templateConfig?.brand, ...templateConfig.brand },
    };
    existingConfig.customizations.lastUpdated = new Date().toISOString();

    await writeConfig(projectPath, existingConfig);
    logger.success('Configuration saved to .claude/config.json');
  }

  // Offer to save as global defaults
  await promptSaveGlobalDefaults(templateConfig);

  logger.newline();
  logger.success('Template configuration complete!');
}
