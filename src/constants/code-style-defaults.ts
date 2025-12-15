/**
 * Default values for code style configurations
 */

import type {
  BiomeFormatterOptions,
  BiomeLinterOptions,
  BiomeOptions,
  CommitlintOptions,
  EditorConfigOptions,
  PreCommitConfig,
  PrettierOptions,
} from '../types/config.js';

/**
 * Default EditorConfig options
 */
export const DEFAULT_EDITORCONFIG_OPTIONS: EditorConfigOptions = {
  indentStyle: 'space',
  indentSize: 2,
  endOfLine: 'lf',
  insertFinalNewline: true,
  trimTrailingWhitespace: true,
  charset: 'utf-8',
  maxLineLength: 100,
};

/**
 * Default Biome formatter options
 */
export const DEFAULT_BIOME_FORMATTER_OPTIONS: BiomeFormatterOptions = {
  indentStyle: 'space',
  indentWidth: 2,
  lineWidth: 100,
  quoteStyle: 'single',
  semicolons: 'always',
  trailingCommas: 'all',
  quoteProperties: 'asNeeded',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParentheses: 'always',
};

/**
 * Default Biome linter options
 */
export const DEFAULT_BIOME_LINTER_OPTIONS: BiomeLinterOptions = {
  recommended: true,
  correctness: true,
  suspicious: true,
  style: true,
  complexity: true,
  security: true,
  performance: true,
  a11y: true,
};

/**
 * Default Biome options
 */
export const DEFAULT_BIOME_OPTIONS: BiomeOptions = {
  formatter: DEFAULT_BIOME_FORMATTER_OPTIONS,
  linter: DEFAULT_BIOME_LINTER_OPTIONS,
  organizeImports: true,
  ignorePatterns: ['node_modules', 'dist', 'build', '.next', '.nuxt', 'coverage'],
};

/**
 * Default Prettier options
 */
export const DEFAULT_PRETTIER_OPTIONS: PrettierOptions = {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  jsxSingleQuote: false,
  trailingComma: 'es5',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',
  endOfLine: 'lf',
  proseWrap: 'preserve',
  htmlWhitespaceSensitivity: 'css',
  singleAttributePerLine: false,
};

/**
 * Default commit types for conventional commits
 */
export const DEFAULT_COMMIT_TYPES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
];

/**
 * Default Commitlint options
 */
export const DEFAULT_COMMITLINT_OPTIONS: CommitlintOptions = {
  extends: ['@commitlint/config-conventional'],
  types: DEFAULT_COMMIT_TYPES,
  scopes: [], // Empty = any scope allowed
  headerMaxLength: 100,
  scopeRequired: false,
  bodyRequired: false,
  bodyMaxLineLength: 100,
  huskyIntegration: true,
};

/**
 * Style presets for quick selection
 */
export type CodeStylePreset = 'standard' | 'airbnb' | 'google' | 'minimal' | 'custom';

export interface CodeStylePresetConfig {
  name: string;
  description: string;
  editorconfig: EditorConfigOptions;
  biome?: BiomeFormatterOptions;
  prettier?: PrettierOptions;
}

export const CODE_STYLE_PRESETS: Record<CodeStylePreset, CodeStylePresetConfig> = {
  standard: {
    name: 'Standard',
    description: '2 spaces, single quotes, semicolons, LF line endings',
    editorconfig: DEFAULT_EDITORCONFIG_OPTIONS,
    biome: DEFAULT_BIOME_FORMATTER_OPTIONS,
    prettier: DEFAULT_PRETTIER_OPTIONS,
  },
  airbnb: {
    name: 'Airbnb',
    description: '2 spaces, single quotes, semicolons, trailing commas',
    editorconfig: {
      ...DEFAULT_EDITORCONFIG_OPTIONS,
      maxLineLength: 100,
    },
    biome: {
      ...DEFAULT_BIOME_FORMATTER_OPTIONS,
      trailingCommas: 'all',
    },
    prettier: {
      ...DEFAULT_PRETTIER_OPTIONS,
      trailingComma: 'all',
    },
  },
  google: {
    name: 'Google',
    description: '2 spaces, single quotes, semicolons, 80 char lines',
    editorconfig: {
      ...DEFAULT_EDITORCONFIG_OPTIONS,
      maxLineLength: 80,
    },
    biome: {
      ...DEFAULT_BIOME_FORMATTER_OPTIONS,
      lineWidth: 80,
    },
    prettier: {
      ...DEFAULT_PRETTIER_OPTIONS,
      printWidth: 80,
    },
  },
  minimal: {
    name: 'Minimal',
    description: '2 spaces, double quotes, no semicolons',
    editorconfig: {
      ...DEFAULT_EDITORCONFIG_OPTIONS,
    },
    biome: {
      ...DEFAULT_BIOME_FORMATTER_OPTIONS,
      quoteStyle: 'double',
      semicolons: 'asNeeded',
    },
    prettier: {
      ...DEFAULT_PRETTIER_OPTIONS,
      singleQuote: false,
      semi: false,
    },
  },
  custom: {
    name: 'Custom',
    description: 'Configure each option manually',
    editorconfig: DEFAULT_EDITORCONFIG_OPTIONS,
    biome: DEFAULT_BIOME_FORMATTER_OPTIONS,
    prettier: DEFAULT_PRETTIER_OPTIONS,
  },
};

/**
 * Default pre-commit hook configuration
 */
export const DEFAULT_PRECOMMIT_CONFIG: PreCommitConfig = {
  enabled: true,
  lint: {
    enabled: true,
    stagedOnly: true,
    tool: 'biome',
    allowFailure: false,
  },
  typecheck: {
    enabled: true,
    allowFailure: false,
  },
  tests: {
    enabled: false,
    mode: 'none',
    coverageThreshold: 0,
    allowFailure: false,
  },
  formatCheck: {
    enabled: false,
    tool: 'biome',
    allowFailure: false,
  },
  customCommands: [],
  showTiming: true,
  continueOnFailure: false,
};

/**
 * Pre-commit presets for quick selection
 */
export type PreCommitPreset = 'minimal' | 'standard' | 'strict' | 'custom';

export interface PreCommitPresetConfig {
  name: string;
  description: string;
  config: PreCommitConfig;
}

export const PRECOMMIT_PRESETS: Record<PreCommitPreset, PreCommitPresetConfig> = {
  minimal: {
    name: 'Minimal',
    description: 'Only lint staged files (fastest)',
    config: {
      enabled: true,
      lint: {
        enabled: true,
        stagedOnly: true,
        tool: 'biome',
        allowFailure: false,
      },
      typecheck: {
        enabled: false,
        allowFailure: false,
      },
      tests: {
        enabled: false,
        mode: 'none',
        coverageThreshold: 0,
        allowFailure: false,
      },
      formatCheck: {
        enabled: false,
        tool: 'biome',
        allowFailure: false,
      },
      customCommands: [],
      showTiming: false,
      continueOnFailure: false,
    },
  },
  standard: {
    name: 'Standard',
    description: 'Lint + typecheck (recommended)',
    config: DEFAULT_PRECOMMIT_CONFIG,
  },
  strict: {
    name: 'Strict',
    description: 'Lint + typecheck + tests + format check',
    config: {
      enabled: true,
      lint: {
        enabled: true,
        stagedOnly: true,
        tool: 'biome',
        allowFailure: false,
      },
      typecheck: {
        enabled: true,
        allowFailure: false,
      },
      tests: {
        enabled: true,
        mode: 'affected',
        coverageThreshold: 80,
        allowFailure: false,
      },
      formatCheck: {
        enabled: true,
        tool: 'biome',
        allowFailure: false,
      },
      customCommands: [],
      showTiming: true,
      continueOnFailure: false,
    },
  },
  custom: {
    name: 'Custom',
    description: 'Configure each validation manually',
    config: DEFAULT_PRECOMMIT_CONFIG,
  },
};
