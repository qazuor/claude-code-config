/**
 * Code style configuration prompts
 */

import { checkbox, confirm, select } from '@inquirer/prompts';
import { logger } from '../../lib/utils/logger.js';
import type { CodeStyleConfig } from '../../types/config.js';

type CodeStyleTool = 'editorconfig' | 'commitlint' | 'biome' | 'prettier';

interface CodeStyleChoice {
  name: string;
  value: CodeStyleTool;
  description: string;
  checked: boolean;
}

const CODE_STYLE_TOOLS: CodeStyleChoice[] = [
  {
    name: 'EditorConfig',
    value: 'editorconfig',
    description: 'Consistent coding styles across editors',
    checked: true,
  },
  {
    name: 'Commitlint',
    value: 'commitlint',
    description: 'Lint commit messages (conventional commits)',
    checked: true,
  },
  {
    name: 'Biome',
    value: 'biome',
    description: 'Fast linter and formatter (ESLint + Prettier alternative)',
    checked: false,
  },
  {
    name: 'Prettier',
    value: 'prettier',
    description: 'Code formatter (use if not using Biome)',
    checked: false,
  },
];

/**
 * Prompt for code style configuration
 */
export async function promptCodeStyleConfig(options?: {
  defaults?: Partial<CodeStyleConfig>;
}): Promise<CodeStyleConfig> {
  logger.subtitle('Code Style Configuration');
  logger.info('Configure code formatting and linting tools');
  logger.newline();

  // First, ask if user wants to install code style tools
  const enableCodeStyle = await confirm({
    message: 'Would you like to install code style configuration files?',
    default: true,
  });

  if (!enableCodeStyle) {
    return {
      enabled: false,
      editorconfig: false,
      commitlint: false,
      biome: false,
      prettier: false,
    };
  }

  // Select which tools to install
  const selectedTools = await checkbox<CodeStyleTool>({
    message: 'Select the tools to configure:',
    choices: CODE_STYLE_TOOLS.map((tool) => ({
      name: `${tool.name} - ${tool.description}`,
      value: tool.value,
      checked: options?.defaults?.[tool.value] ?? tool.checked,
    })),
  });

  // Warn if both Biome and Prettier are selected
  if (selectedTools.includes('biome') && selectedTools.includes('prettier')) {
    logger.warn('Note: Both Biome and Prettier selected. Biome can replace Prettier.');

    const keepBoth = await confirm({
      message: 'Keep both? (Prettier may conflict with Biome)',
      default: false,
    });

    if (!keepBoth) {
      const preferred = await select<'biome' | 'prettier'>({
        message: 'Which formatter would you prefer?',
        choices: [
          { name: 'Biome (faster, all-in-one)', value: 'biome' },
          { name: 'Prettier (more plugins)', value: 'prettier' },
        ],
      });

      // Remove the non-preferred one
      const indexToRemove =
        preferred === 'biome' ? selectedTools.indexOf('prettier') : selectedTools.indexOf('biome');
      if (indexToRemove > -1) {
        selectedTools.splice(indexToRemove, 1);
      }
    }
  }

  return {
    enabled: selectedTools.length > 0,
    editorconfig: selectedTools.includes('editorconfig'),
    commitlint: selectedTools.includes('commitlint'),
    biome: selectedTools.includes('biome'),
    prettier: selectedTools.includes('prettier'),
  };
}

/**
 * Show code style configuration summary
 */
export function showCodeStyleSummary(config: CodeStyleConfig): void {
  if (!config.enabled) {
    logger.item('Code style: Not configured');
    return;
  }

  const tools: string[] = [];
  if (config.editorconfig) tools.push('EditorConfig');
  if (config.commitlint) tools.push('Commitlint');
  if (config.biome) tools.push('Biome');
  if (config.prettier) tools.push('Prettier');

  logger.item(`Code style: ${tools.join(', ')}`);
}

/**
 * Confirm code style configuration
 */
export async function confirmCodeStyleConfig(config: CodeStyleConfig): Promise<boolean> {
  if (!config.enabled) {
    return true;
  }

  showCodeStyleSummary(config);
  logger.newline();

  return confirm({
    message: 'Install these code style configurations?',
    default: true,
  });
}
