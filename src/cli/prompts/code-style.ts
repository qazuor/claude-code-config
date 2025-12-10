/**
 * Code style configuration prompts
 */

import { checkbox, confirm, input, select } from '@inquirer/prompts';
import {
  CODE_STYLE_PRESETS,
  type CodeStylePreset,
  DEFAULT_BIOME_OPTIONS,
  DEFAULT_COMMITLINT_OPTIONS,
  DEFAULT_EDITORCONFIG_OPTIONS,
  DEFAULT_PRETTIER_OPTIONS,
} from '../../constants/code-style-defaults.js';
import { colors, logger } from '../../lib/utils/logger.js';
import type {
  BiomeOptions,
  CodeStyleConfig,
  CommitlintOptions,
  EditorConfigOptions,
  IndentStyle,
  PrettierOptions,
  QuoteStyle,
} from '../../types/config.js';

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

  // If no tools selected, return early
  if (selectedTools.length === 0) {
    return {
      enabled: false,
      editorconfig: false,
      commitlint: false,
      biome: false,
      prettier: false,
    };
  }

  // Ask if user wants to customize settings or use defaults
  const customizeSettings = await confirm({
    message: 'Would you like to customize code style settings? (No = use standard defaults)',
    default: false,
  });

  let editorconfigOptions: EditorConfigOptions | undefined;
  let biomeOptions: BiomeOptions | undefined;
  let prettierOptions: PrettierOptions | undefined;
  let commitlintOptions: CommitlintOptions | undefined;

  if (customizeSettings) {
    // First, offer preset selection if editorconfig, biome, or prettier is selected
    const hasFormatter =
      selectedTools.includes('editorconfig') ||
      selectedTools.includes('biome') ||
      selectedTools.includes('prettier');

    if (hasFormatter) {
      const preset = await promptStylePreset();

      if (preset !== 'custom') {
        const presetConfig = CODE_STYLE_PRESETS[preset];
        if (selectedTools.includes('editorconfig')) {
          editorconfigOptions = presetConfig.editorconfig;
        }
        if (selectedTools.includes('biome') && presetConfig.biome) {
          biomeOptions = {
            ...DEFAULT_BIOME_OPTIONS,
            formatter: presetConfig.biome,
          };
        }
        if (selectedTools.includes('prettier') && presetConfig.prettier) {
          prettierOptions = presetConfig.prettier;
        }
      } else {
        // Custom configuration - prompt for each tool
        if (selectedTools.includes('editorconfig')) {
          editorconfigOptions = await promptEditorConfigOptions();
        }
        if (selectedTools.includes('biome')) {
          biomeOptions = await promptBiomeOptions();
        }
        if (selectedTools.includes('prettier')) {
          prettierOptions = await promptPrettierOptions();
        }
      }
    }

    // Commitlint configuration (always separate)
    if (selectedTools.includes('commitlint')) {
      commitlintOptions = await promptCommitlintOptions();
    }
  } else {
    // Use defaults
    if (selectedTools.includes('editorconfig')) {
      editorconfigOptions = DEFAULT_EDITORCONFIG_OPTIONS;
    }
    if (selectedTools.includes('biome')) {
      biomeOptions = DEFAULT_BIOME_OPTIONS;
    }
    if (selectedTools.includes('prettier')) {
      prettierOptions = DEFAULT_PRETTIER_OPTIONS;
    }
    if (selectedTools.includes('commitlint')) {
      commitlintOptions = DEFAULT_COMMITLINT_OPTIONS;
    }
  }

  return {
    enabled: selectedTools.length > 0,
    editorconfig: selectedTools.includes('editorconfig'),
    editorconfigOptions,
    commitlint: selectedTools.includes('commitlint'),
    commitlintOptions,
    biome: selectedTools.includes('biome'),
    biomeOptions,
    prettier: selectedTools.includes('prettier'),
    prettierOptions,
  };
}

/**
 * Prompt for style preset selection
 */
async function promptStylePreset(): Promise<CodeStylePreset> {
  logger.newline();
  logger.info('Choose a code style preset:');

  return select<CodeStylePreset>({
    message: 'Style preset:',
    choices: Object.entries(CODE_STYLE_PRESETS).map(([key, preset]) => ({
      name: `${preset.name} - ${preset.description}`,
      value: key as CodeStylePreset,
    })),
    default: 'standard',
  });
}

/**
 * Prompt for EditorConfig options
 */
async function promptEditorConfigOptions(): Promise<EditorConfigOptions> {
  logger.newline();
  logger.subtitle('EditorConfig Options');

  const indentStyle = await select<IndentStyle>({
    message: 'Indent style:',
    choices: [
      { name: 'Spaces', value: 'space' },
      { name: 'Tabs', value: 'tab' },
    ],
    default: DEFAULT_EDITORCONFIG_OPTIONS.indentStyle,
  });

  const indentSizeStr = await input({
    message: 'Indent size:',
    default: String(DEFAULT_EDITORCONFIG_OPTIONS.indentSize),
    validate: (v) => {
      const num = Number(v);
      if (Number.isNaN(num) || num < 1 || num > 8) return 'Enter a number between 1 and 8';
      return true;
    },
  });
  const indentSize = Number(indentSizeStr);

  const endOfLine = await select<'lf' | 'crlf' | 'cr'>({
    message: 'Line endings:',
    choices: [
      { name: 'LF (Unix/Mac)', value: 'lf' },
      { name: 'CRLF (Windows)', value: 'crlf' },
      { name: 'CR (Old Mac)', value: 'cr' },
    ],
    default: DEFAULT_EDITORCONFIG_OPTIONS.endOfLine,
  });

  const maxLineLengthStr = await input({
    message: 'Max line length (or "off"):',
    default: String(DEFAULT_EDITORCONFIG_OPTIONS.maxLineLength),
    validate: (v) => {
      if (v.toLowerCase() === 'off') return true;
      const num = Number(v);
      if (Number.isNaN(num) || num < 40 || num > 200)
        return 'Enter a number between 40 and 200, or "off"';
      return true;
    },
  });
  const maxLineLength = maxLineLengthStr.toLowerCase() === 'off' ? 'off' : Number(maxLineLengthStr);

  return {
    indentStyle,
    indentSize,
    endOfLine,
    insertFinalNewline: true,
    trimTrailingWhitespace: true,
    charset: 'utf-8',
    maxLineLength,
  };
}

/**
 * Prompt for Biome options
 */
async function promptBiomeOptions(): Promise<BiomeOptions> {
  logger.newline();
  logger.subtitle('Biome Options');

  // Formatter options
  const indentStyle = await select<IndentStyle>({
    message: 'Indent style:',
    choices: [
      { name: 'Spaces', value: 'space' },
      { name: 'Tabs', value: 'tab' },
    ],
    default: DEFAULT_BIOME_OPTIONS.formatter.indentStyle,
  });

  const indentWidthStr = await input({
    message: 'Indent width:',
    default: String(DEFAULT_BIOME_OPTIONS.formatter.indentWidth),
    validate: (v) => {
      const num = Number(v);
      if (Number.isNaN(num) || num < 1 || num > 8) return 'Enter a number between 1 and 8';
      return true;
    },
  });
  const indentWidth = Number(indentWidthStr);

  const lineWidthStr = await input({
    message: 'Line width:',
    default: String(DEFAULT_BIOME_OPTIONS.formatter.lineWidth),
    validate: (v) => {
      const num = Number(v);
      if (Number.isNaN(num) || num < 40 || num > 200) return 'Enter a number between 40 and 200';
      return true;
    },
  });
  const lineWidth = Number(lineWidthStr);

  const quoteStyle = await select<QuoteStyle>({
    message: 'Quote style:',
    choices: [
      { name: 'Single quotes', value: 'single' },
      { name: 'Double quotes', value: 'double' },
    ],
    default: DEFAULT_BIOME_OPTIONS.formatter.quoteStyle,
  });

  const semicolons = await select<'always' | 'asNeeded'>({
    message: 'Semicolons:',
    choices: [
      { name: 'Always', value: 'always' },
      { name: 'As needed (ASI)', value: 'asNeeded' },
    ],
    default: DEFAULT_BIOME_OPTIONS.formatter.semicolons,
  });

  const trailingCommas = await select<'all' | 'es5' | 'none'>({
    message: 'Trailing commas:',
    choices: [
      { name: 'All', value: 'all' },
      { name: 'ES5 (only where valid in ES5)', value: 'es5' },
      { name: 'None', value: 'none' },
    ],
    default: DEFAULT_BIOME_OPTIONS.formatter.trailingCommas,
  });

  // Linter options (simplified)
  const enableRecommended = await confirm({
    message: 'Enable recommended linter rules?',
    default: true,
  });

  return {
    formatter: {
      indentStyle,
      indentWidth,
      lineWidth,
      quoteStyle,
      semicolons,
      trailingCommas,
      quoteProperties: 'asNeeded',
      bracketSpacing: true,
      bracketSameLine: false,
      arrowParentheses: 'always',
    },
    linter: {
      recommended: enableRecommended,
      correctness: enableRecommended,
      suspicious: enableRecommended,
      style: enableRecommended,
      complexity: enableRecommended,
      security: enableRecommended,
      performance: enableRecommended,
      a11y: enableRecommended,
    },
    organizeImports: true,
    ignorePatterns: DEFAULT_BIOME_OPTIONS.ignorePatterns,
  };
}

/**
 * Prompt for Prettier options
 */
async function promptPrettierOptions(): Promise<PrettierOptions> {
  logger.newline();
  logger.subtitle('Prettier Options');

  const printWidthStr = await input({
    message: 'Print width:',
    default: String(DEFAULT_PRETTIER_OPTIONS.printWidth),
    validate: (v) => {
      const num = Number(v);
      if (Number.isNaN(num) || num < 40 || num > 200) return 'Enter a number between 40 and 200';
      return true;
    },
  });
  const printWidth = Number(printWidthStr);

  const tabWidthStr = await input({
    message: 'Tab width:',
    default: String(DEFAULT_PRETTIER_OPTIONS.tabWidth),
    validate: (v) => {
      const num = Number(v);
      if (Number.isNaN(num) || num < 1 || num > 8) return 'Enter a number between 1 and 8';
      return true;
    },
  });
  const tabWidth = Number(tabWidthStr);

  const useTabs = await confirm({
    message: 'Use tabs instead of spaces?',
    default: DEFAULT_PRETTIER_OPTIONS.useTabs,
  });

  const semi = await confirm({
    message: 'Use semicolons?',
    default: DEFAULT_PRETTIER_OPTIONS.semi,
  });

  const singleQuote = await confirm({
    message: 'Use single quotes?',
    default: DEFAULT_PRETTIER_OPTIONS.singleQuote,
  });

  const trailingComma = await select<'all' | 'es5' | 'none'>({
    message: 'Trailing commas:',
    choices: [
      { name: 'All', value: 'all' },
      { name: 'ES5', value: 'es5' },
      { name: 'None', value: 'none' },
    ],
    default: DEFAULT_PRETTIER_OPTIONS.trailingComma,
  });

  const bracketSpacing = await confirm({
    message: 'Bracket spacing? ({ foo: bar })',
    default: DEFAULT_PRETTIER_OPTIONS.bracketSpacing,
  });

  const arrowParens = await select<'always' | 'avoid'>({
    message: 'Arrow function parentheses:',
    choices: [
      { name: 'Always (x) => x', value: 'always' },
      { name: 'Avoid x => x', value: 'avoid' },
    ],
    default: DEFAULT_PRETTIER_OPTIONS.arrowParens,
  });

  return {
    printWidth,
    tabWidth,
    useTabs,
    semi,
    singleQuote,
    jsxSingleQuote: false,
    trailingComma,
    bracketSpacing,
    bracketSameLine: false,
    arrowParens,
    endOfLine: 'lf',
    proseWrap: 'preserve',
    htmlWhitespaceSensitivity: 'css',
    singleAttributePerLine: false,
  };
}

/**
 * Prompt for Commitlint options
 */
async function promptCommitlintOptions(): Promise<CommitlintOptions> {
  logger.newline();
  logger.subtitle('Commitlint Options');

  const useDefaults = await confirm({
    message: 'Use conventional commits defaults?',
    default: true,
  });

  if (useDefaults) {
    const huskyIntegration = await confirm({
      message: 'Enable Husky integration (git hooks)?',
      default: true,
    });

    return {
      ...DEFAULT_COMMITLINT_OPTIONS,
      huskyIntegration,
    };
  }

  // Custom commit types
  const typesInput = await input({
    message: 'Commit types (comma-separated):',
    default: DEFAULT_COMMITLINT_OPTIONS.types.join(', '),
  });
  const types = typesInput
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  // Custom scopes
  const scopesInput = await input({
    message: 'Allowed scopes (comma-separated, empty for any):',
    default: '',
  });
  const scopes = scopesInput
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const headerMaxLengthStr = await input({
    message: 'Maximum header length:',
    default: String(DEFAULT_COMMITLINT_OPTIONS.headerMaxLength),
    validate: (v) => {
      const num = Number(v);
      if (Number.isNaN(num) || num < 20 || num > 200) return 'Enter a number between 20 and 200';
      return true;
    },
  });
  const headerMaxLength = Number(headerMaxLengthStr);

  const scopeRequired = await confirm({
    message: 'Require scope in commit messages?',
    default: false,
  });

  const huskyIntegration = await confirm({
    message: 'Enable Husky integration (git hooks)?',
    default: true,
  });

  return {
    extends: ['@commitlint/config-conventional'],
    types,
    scopes,
    headerMaxLength,
    scopeRequired,
    bodyRequired: false,
    bodyMaxLineLength: 100,
    huskyIntegration,
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

  // Show key settings
  if (config.editorconfigOptions) {
    const ec = config.editorconfigOptions;
    logger.info(
      colors.muted(
        `  EditorConfig: ${ec.indentStyle === 'space' ? `${ec.indentSize} spaces` : 'tabs'}, ${ec.endOfLine.toUpperCase()}`
      )
    );
  }

  if (config.biomeOptions) {
    const bf = config.biomeOptions.formatter;
    logger.info(
      colors.muted(
        `  Biome: ${bf.indentStyle === 'space' ? `${bf.indentWidth} spaces` : 'tabs'}, ${bf.quoteStyle} quotes, ${bf.semicolons === 'always' ? 'semicolons' : 'no semicolons'}`
      )
    );
  }

  if (config.prettierOptions) {
    const pr = config.prettierOptions;
    logger.info(
      colors.muted(
        `  Prettier: ${pr.useTabs ? 'tabs' : `${pr.tabWidth} spaces`}, ${pr.singleQuote ? 'single' : 'double'} quotes, ${pr.semi ? 'semicolons' : 'no semicolons'}`
      )
    );
  }

  if (config.commitlintOptions) {
    const cl = config.commitlintOptions;
    logger.info(
      colors.muted(
        `  Commitlint: ${cl.types.length} types, ${cl.huskyIntegration ? 'Husky enabled' : 'no Husky'}`
      )
    );
  }
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
