/**
 * Pre-commit configuration prompts
 */

import {
  DEFAULT_PRECOMMIT_CONFIG,
  PRECOMMIT_PRESETS,
  type PreCommitPreset,
} from '../../constants/code-style-defaults.js';
import { colors, logger } from '../../lib/utils/logger.js';
import { checkbox, confirm, input, select } from '../../lib/utils/prompt-cancel.js';
import type {
  PreCommitConfig,
  PreCommitCustomCommand,
  PreCommitTestMode,
} from '../../types/config.js';

type PreCommitValidation = 'lint' | 'typecheck' | 'tests' | 'formatCheck';

/**
 * Prompt for pre-commit configuration
 */
export async function promptPreCommitConfig(options?: {
  defaults?: Partial<PreCommitConfig>;
  codeStyleConfig?: { biome?: boolean; prettier?: boolean };
}): Promise<PreCommitConfig> {
  logger.section('Pre-commit Hooks', '🔒');
  logger.info('Configure validations to run before each commit');
  logger.newline();

  // Ask if user wants pre-commit hooks
  const enablePreCommit = await confirm({
    message: 'Would you like to configure pre-commit hooks?',
    default: true,
  });

  if (!enablePreCommit) {
    return { ...DEFAULT_PRECOMMIT_CONFIG, enabled: false };
  }

  // Offer preset selection
  const preset = await promptPreCommitPreset();

  if (preset !== 'custom') {
    const presetConfig = PRECOMMIT_PRESETS[preset];
    logger.success(`Using "${presetConfig.name}" preset`);
    return presetConfig.config;
  }

  // Custom configuration
  logger.newline();
  logger.info('Configure each validation:');

  // Select which validations to enable
  const validations = await checkbox<PreCommitValidation>({
    message: 'Which validations should run on pre-commit?',
    choices: [
      { name: 'Linting (check code quality)', value: 'lint', checked: true },
      { name: 'Type checking (TypeScript)', value: 'typecheck', checked: true },
      { name: 'Tests', value: 'tests', checked: false },
      { name: 'Format check (verify formatting)', value: 'formatCheck', checked: false },
    ],
  });

  // Configure lint
  const lintEnabled = validations.includes('lint');
  let lintConfig = DEFAULT_PRECOMMIT_CONFIG.lint;

  if (lintEnabled) {
    const lintStagedOnly = await confirm({
      message: 'Lint only staged files (faster)?',
      default: true,
    });

    // Auto-detect tool from codeStyleConfig
    let lintTool: 'biome' | 'eslint' | 'custom' = 'biome';
    if (options?.codeStyleConfig?.biome) {
      lintTool = 'biome';
    } else if (!options?.codeStyleConfig?.biome && !options?.codeStyleConfig?.prettier) {
      lintTool = await select<'biome' | 'eslint' | 'custom'>({
        message: 'Which linter?',
        choices: [
          { name: 'Biome', value: 'biome' },
          { name: 'ESLint', value: 'eslint' },
          { name: 'Custom command', value: 'custom' },
        ],
      });
    }

    let lintCommand: string | undefined;
    if (lintTool === 'custom') {
      lintCommand = await input({
        message: 'Custom lint command:',
        default: 'pnpm lint',
      });
    }

    lintConfig = {
      enabled: true,
      stagedOnly: lintStagedOnly,
      tool: lintTool,
      command: lintCommand,
      allowFailure: false,
    };
  }

  // Configure typecheck
  const typecheckEnabled = validations.includes('typecheck');
  let typecheckConfig = DEFAULT_PRECOMMIT_CONFIG.typecheck;

  if (typecheckEnabled) {
    const customTypecheck = await confirm({
      message: 'Use custom typecheck command?',
      default: false,
    });

    let typecheckCommand: string | undefined;
    if (customTypecheck) {
      typecheckCommand = await input({
        message: 'Typecheck command:',
        default: 'pnpm typecheck',
      });
    }

    typecheckConfig = {
      enabled: true,
      command: typecheckCommand,
      allowFailure: false,
    };
  }

  // Configure tests
  const testsEnabled = validations.includes('tests');
  let testsConfig = DEFAULT_PRECOMMIT_CONFIG.tests;

  if (testsEnabled) {
    const testMode = await select<PreCommitTestMode>({
      message: 'Which tests should run?',
      choices: [
        { name: 'Affected files only (fast)', value: 'affected' },
        { name: 'All tests', value: 'all' },
      ],
      default: 'affected',
    });

    const enableCoverageThreshold = await confirm({
      message: 'Enforce coverage threshold?',
      default: false,
    });

    let coverageThreshold = 0;
    if (enableCoverageThreshold) {
      const thresholdStr = await input({
        message: 'Minimum coverage percentage (0-100):',
        default: '80',
        validate: (v) => {
          const num = Number(v);
          if (Number.isNaN(num) || num < 0 || num > 100) {
            return 'Enter a number between 0 and 100';
          }
          return true;
        },
      });
      coverageThreshold = Number(thresholdStr);
    }

    testsConfig = {
      enabled: true,
      mode: testMode,
      coverageThreshold,
      allowFailure: false,
    };
  }

  // Configure format check
  const formatCheckEnabled = validations.includes('formatCheck');
  let formatCheckConfig = DEFAULT_PRECOMMIT_CONFIG.formatCheck;

  if (formatCheckEnabled) {
    let formatTool: 'biome' | 'prettier' | 'custom' = 'biome';
    if (options?.codeStyleConfig?.biome) {
      formatTool = 'biome';
    } else if (options?.codeStyleConfig?.prettier) {
      formatTool = 'prettier';
    } else {
      formatTool = await select<'biome' | 'prettier' | 'custom'>({
        message: 'Which formatter?',
        choices: [
          { name: 'Biome', value: 'biome' },
          { name: 'Prettier', value: 'prettier' },
          { name: 'Custom command', value: 'custom' },
        ],
      });
    }

    let formatCommand: string | undefined;
    if (formatTool === 'custom') {
      formatCommand = await input({
        message: 'Custom format check command:',
        default: 'pnpm format:check',
      });
    }

    formatCheckConfig = {
      enabled: true,
      tool: formatTool,
      command: formatCommand,
      allowFailure: false,
    };
  }

  // Custom commands
  const addCustom = await confirm({
    message: 'Add custom pre-commit commands?',
    default: false,
  });

  let customCommands: PreCommitCustomCommand[] = [];
  if (addCustom) {
    customCommands = await promptCustomCommands();
  }

  // Advanced options
  const configureAdvanced = await confirm({
    message: 'Configure advanced options?',
    default: false,
  });

  let showTiming = true;
  let continueOnFailure = false;

  if (configureAdvanced) {
    showTiming = await confirm({
      message: 'Show timing for each step?',
      default: true,
    });

    continueOnFailure = await confirm({
      message: 'Continue running checks after first failure?',
      default: false,
    });
  }

  return {
    enabled: true,
    lint: lintConfig,
    typecheck: typecheckConfig,
    tests: testsConfig,
    formatCheck: formatCheckConfig,
    customCommands,
    showTiming,
    continueOnFailure,
  };
}

/**
 * Prompt for pre-commit preset selection
 */
async function promptPreCommitPreset(): Promise<PreCommitPreset> {
  return select<PreCommitPreset>({
    message: 'Choose a pre-commit preset:',
    choices: Object.entries(PRECOMMIT_PRESETS).map(([key, preset]) => ({
      name: `${preset.name} - ${preset.description}`,
      value: key as PreCommitPreset,
    })),
    default: 'standard',
  });
}

/**
 * Prompt for custom commands
 */
async function promptCustomCommands(): Promise<PreCommitCustomCommand[]> {
  const commands: PreCommitCustomCommand[] = [];
  let addMore = true;

  while (addMore) {
    const name = await input({
      message: 'Command name (display):',
      validate: (v) => (v.length > 0 ? true : 'Name is required'),
    });

    const command = await input({
      message: 'Command to run:',
      validate: (v) => (v.length > 0 ? true : 'Command is required'),
    });

    const allowFailure = await confirm({
      message: 'Allow this command to fail without blocking commit?',
      default: false,
    });

    commands.push({ name, command, allowFailure });

    addMore = await confirm({
      message: 'Add another custom command?',
      default: false,
    });
  }

  return commands;
}

/**
 * Show pre-commit configuration summary
 */
export function showPreCommitSummary(config: PreCommitConfig): void {
  if (!config.enabled) {
    logger.item('Pre-commit hooks: Disabled');
    return;
  }

  const checks: string[] = [];
  if (config.lint.enabled) {
    checks.push(`lint${config.lint.stagedOnly ? ' (staged)' : ''}`);
  }
  if (config.typecheck.enabled) {
    checks.push('typecheck');
  }
  if (config.tests.enabled && config.tests.mode !== 'none') {
    checks.push(
      `tests (${config.tests.mode}${config.tests.coverageThreshold > 0 ? `, ${config.tests.coverageThreshold}% cov` : ''})`
    );
  }
  if (config.formatCheck.enabled) {
    checks.push('format');
  }
  if (config.customCommands.length > 0) {
    checks.push(`${config.customCommands.length} custom`);
  }

  logger.item(`Pre-commit hooks: ${checks.join(', ')}`);

  if (config.showTiming) {
    logger.info(colors.muted('  Timing: enabled'));
  }
  if (config.continueOnFailure) {
    logger.info(colors.muted('  Continue on failure: enabled'));
  }
}

/**
 * Confirm pre-commit configuration
 */
export async function confirmPreCommitConfig(config: PreCommitConfig): Promise<boolean> {
  if (!config.enabled) {
    return true;
  }

  showPreCommitSummary(config);
  logger.newline();

  return confirm({
    message: 'Install these pre-commit hooks?',
    default: true,
  });
}
