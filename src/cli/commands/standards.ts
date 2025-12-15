/**
 * Standards command - configure project standards
 */

import { Command } from 'commander';
import { DEFAULT_STANDARDS_CONFIG } from '../../constants/standards-defaults.js';
import { readConfig, writeConfig } from '../../lib/config/index.js';
import {
  formatScanResult,
  formatStandardsReport,
  previewStandardsReplacements,
  replaceStandardsWithSpinner,
  scanStandardsPlaceholders,
} from '../../lib/standards/index.js';
import { joinPath, resolvePath } from '../../lib/utils/fs.js';
import { colors, logger } from '../../lib/utils/logger.js';
import type { StandardsCategory } from '../../types/standards.js';
import {
  confirmStandardsConfig,
  promptStandardsConfig,
  showStandardsSummary,
} from '../prompts/standards.js';

interface StandardsOptions {
  scan?: boolean;
  category?: StandardsCategory;
  preview?: boolean;
  yes?: boolean;
  verbose?: boolean;
}

/**
 * Create standards command
 */
export function createStandardsCommand(): Command {
  const cmd = new Command('standards')
    .description('Configure project standards interactively')
    .argument('[path]', 'Project path (default: current directory)')
    .option('--scan', 'Scan for unconfigured standard placeholders')
    .option(
      '-c, --category <name>',
      'Configure specific category (code|testing|documentation|design|security|performance)'
    )
    .option('--preview', 'Preview changes without applying')
    .option('-y, --yes', 'Accept defaults without prompts')
    .option('-v, --verbose', 'Detailed output')
    .action(runStandards);

  return cmd;
}

/**
 * Run standards command
 */
async function runStandards(path: string | undefined, options: StandardsOptions): Promise<void> {
  const projectPath = resolvePath(path || '.');
  const claudePath = joinPath(projectPath, '.claude');

  logger.configure({ verbose: options.verbose, silent: false });

  logger.title('Project Standards Configuration');

  try {
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

    // Yes mode - use defaults without prompts
    if (options.yes) {
      await defaultsMode(claudePath, projectPath, options);
      return;
    }

    // Interactive configuration
    await interactiveMode(claudePath, projectPath, options);
  } catch (error) {
    logger.error(
      `Standards configuration failed: ${error instanceof Error ? error.message : error}`
    );
    process.exit(1);
  }
}

/**
 * Scan mode - show unconfigured placeholders
 */
async function scanMode(claudePath: string, projectPath: string): Promise<void> {
  logger.info(`Scanning ${colors.primary(claudePath)} for standard placeholders...`);
  logger.newline();

  // Get existing config
  const existingConfig = await readConfig(projectPath);
  const standardsConfig = existingConfig?.extras?.standards;

  const scanResult = await scanStandardsPlaceholders(claudePath, standardsConfig);

  logger.info(formatScanResult(scanResult));

  if (scanResult.unconfiguredPlaceholders.length > 0) {
    logger.newline();
    logger.info('Run `claude-config standards` to configure them');
  }
}

/**
 * Preview mode - show what would be replaced
 */
async function previewMode(claudePath: string, projectPath: string): Promise<void> {
  const existingConfig = await readConfig(projectPath);

  if (!existingConfig?.extras?.standards) {
    logger.warn('No standards configuration found');
    logger.info('Run `claude-config standards` first to set up configuration');
    return;
  }

  logger.info('Preview of replacements:');
  logger.newline();

  const replacements = await previewStandardsReplacements(
    claudePath,
    existingConfig.extras.standards
  );

  if (replacements.length === 0) {
    logger.info('No standard placeholders to replace');
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
 * Defaults mode - apply defaults without prompts
 */
async function defaultsMode(
  claudePath: string,
  projectPath: string,
  options: StandardsOptions
): Promise<void> {
  logger.info('Applying default standards configuration...');
  logger.newline();

  const standardsConfig = DEFAULT_STANDARDS_CONFIG;

  // Show summary
  showStandardsSummary(standardsConfig);
  logger.newline();

  // Apply replacements
  const report = await replaceStandardsWithSpinner(claudePath, standardsConfig);

  if (options.verbose) {
    logger.newline();
    logger.info(formatStandardsReport(report));
  }

  // Update project config
  await saveStandardsConfig(projectPath, standardsConfig);

  logger.newline();
  logger.success('Standards configuration complete!');
}

/**
 * Interactive configuration mode
 */
async function interactiveMode(
  claudePath: string,
  projectPath: string,
  options: StandardsOptions
): Promise<void> {
  // Get existing config
  const existingConfig = await readConfig(projectPath);
  const existingStandards = existingConfig?.extras?.standards;

  // Prompt for configuration
  const standardsConfig = await promptStandardsConfig({
    defaults: existingStandards,
    category: options.category as StandardsCategory | undefined,
  });

  // Show summary and confirm
  const confirmed = await confirmStandardsConfig(standardsConfig);
  if (!confirmed) {
    logger.warn('Configuration cancelled');
    return;
  }

  // Apply replacements
  const report = await replaceStandardsWithSpinner(claudePath, standardsConfig);

  if (options.verbose) {
    logger.newline();
    logger.info(formatStandardsReport(report));
  }

  // Update project config
  await saveStandardsConfig(projectPath, standardsConfig);

  logger.newline();
  logger.success('Standards configuration complete!');
}

/**
 * Save standards configuration to project config
 */
async function saveStandardsConfig(
  projectPath: string,
  standardsConfig: import('../../types/standards.js').StandardsConfig
): Promise<void> {
  const existingConfig = await readConfig(projectPath);

  if (existingConfig) {
    existingConfig.extras = {
      ...existingConfig.extras,
      standards: standardsConfig,
    };
    existingConfig.customizations.lastUpdated = new Date().toISOString();

    await writeConfig(projectPath, existingConfig);
    logger.success('Configuration saved to .claude/config.json');
  } else {
    logger.warn('No existing config found - standards not saved');
    logger.info('Run `claude-config init` first to initialize the project');
  }
}
