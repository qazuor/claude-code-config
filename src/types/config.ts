/**
 * Main configuration types for Claude Code config
 */

import type { FolderPreferences } from './folder-preferences.js';
import type { McpInstallation } from './mcp.js';
import type { PermissionsConfig } from './permissions.js';
import type { TemplateConfig } from './template-config.js';

/**
 * Template source configuration
 */
export interface TemplateSource {
  /** Whether using local bundled or remote templates */
  type: 'local' | 'remote';
  /** Git repository URL if remote */
  repository?: string;
  /** Branch or tag if remote */
  ref?: string;
  /** When the template was installed */
  installedAt: string;
}

/**
 * Project information for placeholder replacement
 */
export interface ProjectInfo {
  /** Project name */
  name: string;
  /** Brief project description */
  description: string;
  /** GitHub organization or username */
  org: string;
  /** Repository name */
  repo: string;
  /** Project domain (optional) */
  domain?: string;
  /** Primary entity type (singular) */
  entityType: string;
  /** Primary entity type (plural) */
  entityTypePlural: string;
  /** Location for examples (optional) */
  location?: string;
}

/**
 * User preferences
 */
export interface Preferences {
  /** Working language */
  language: 'es' | 'en';
  /** Language for Claude responses */
  responseLanguage: 'es' | 'en';
  /** Include Claude as commit co-author */
  includeCoAuthor: boolean;
}

/**
 * Module selection state
 */
export interface ModuleSelection {
  /** Selected module IDs */
  selected: string[];
  /** Excluded module IDs */
  excluded: string[];
}

/**
 * Hook configuration
 */
export interface HookConfig {
  /** Whether hooks are enabled */
  enabled: boolean;
  /** Notification hook customizations */
  notification?: {
    /** Enable desktop notifications */
    desktop: boolean;
    /** Enable audio notifications */
    audio: boolean;
    /** Custom notification command */
    customCommand?: string;
  };
  /** Stop hook configuration */
  stop?: {
    /** Play beep sound */
    beep?: boolean;
    /** Custom sound file */
    customSound?: string;
    /** Custom command */
    customCommand?: string;
  };
  /** Subagent stop hook configuration */
  subagentStop?: {
    /** Play beep sound */
    beep?: boolean;
    /** Custom sound file */
    customSound?: string;
    /** Custom command */
    customCommand?: string;
  };
}

/**
 * MCP configuration
 */
export interface McpConfig {
  /** Installation level */
  level: 'user' | 'project';
  /** Installed MCP servers */
  servers: McpInstallation[];
}

/**
 * Scaffold configuration tracking
 */
export interface ScaffoldConfig {
  /** What type of scaffold was performed */
  type: 'claude-only' | 'full-project';
  /** List of created directories/files */
  createdStructure: string[];
}

/**
 * Customization tracking
 */
export interface Customizations {
  /** Whether placeholders were replaced */
  placeholdersReplaced: boolean;
  /** Last update timestamp */
  lastUpdated: string;
  /** Files that were manually modified */
  customFiles: string[];
  /** Permissions configuration (if custom) */
  permissions?: PermissionsConfig;
  /** Selected bundle IDs used during installation */
  selectedBundles?: string[];
}

/**
 * Modules configuration
 */
export interface ModulesConfig {
  /** Installed agents */
  agents: ModuleSelection;
  /** Installed skills */
  skills: ModuleSelection;
  /** Installed commands */
  commands: ModuleSelection;
  /** Installed docs */
  docs: ModuleSelection;
}

/**
 * Indent style options
 */
export type IndentStyle = 'space' | 'tab';

/**
 * Quote style options
 */
export type QuoteStyle = 'single' | 'double';

/**
 * EditorConfig options
 */
export interface EditorConfigOptions {
  /** Indent style (tabs or spaces) */
  indentStyle: IndentStyle;
  /** Indent size (number of spaces or tab width) */
  indentSize: number;
  /** Line ending style */
  endOfLine: 'lf' | 'crlf' | 'cr';
  /** Insert final newline */
  insertFinalNewline: boolean;
  /** Trim trailing whitespace */
  trimTrailingWhitespace: boolean;
  /** Character set */
  charset: 'utf-8' | 'utf-8-bom' | 'latin1';
  /** Max line length */
  maxLineLength: number | 'off';
}

/**
 * Biome formatter options
 */
export interface BiomeFormatterOptions {
  /** Indent style */
  indentStyle: IndentStyle;
  /** Indent width */
  indentWidth: number;
  /** Line width */
  lineWidth: number;
  /** Quote style for JS/TS */
  quoteStyle: QuoteStyle;
  /** Use semicolons */
  semicolons: 'always' | 'asNeeded';
  /** Trailing commas */
  trailingCommas: 'all' | 'es5' | 'none';
  /** Quote properties */
  quoteProperties: 'asNeeded' | 'preserve';
  /** Bracket spacing */
  bracketSpacing: boolean;
  /** Bracket same line (JSX) */
  bracketSameLine: boolean;
  /** Arrow function parentheses */
  arrowParentheses: 'always' | 'asNeeded';
}

/**
 * Biome linter options
 */
export interface BiomeLinterOptions {
  /** Enable recommended rules */
  recommended: boolean;
  /** Enable correctness rules */
  correctness: boolean;
  /** Enable suspicious code rules */
  suspicious: boolean;
  /** Enable style rules */
  style: boolean;
  /** Enable complexity rules */
  complexity: boolean;
  /** Enable security rules */
  security: boolean;
  /** Enable performance rules */
  performance: boolean;
  /** Enable accessibility rules */
  a11y: boolean;
}

/**
 * Biome configuration options
 */
export interface BiomeOptions {
  /** Formatter options */
  formatter: BiomeFormatterOptions;
  /** Linter options */
  linter: BiomeLinterOptions;
  /** Organize imports */
  organizeImports: boolean;
  /** Files to ignore */
  ignorePatterns: string[];
}

/**
 * Prettier options
 */
export interface PrettierOptions {
  /** Print width */
  printWidth: number;
  /** Tab width */
  tabWidth: number;
  /** Use tabs instead of spaces */
  useTabs: boolean;
  /** Use semicolons */
  semi: boolean;
  /** Use single quotes */
  singleQuote: boolean;
  /** JSX single quotes */
  jsxSingleQuote: boolean;
  /** Trailing commas */
  trailingComma: 'all' | 'es5' | 'none';
  /** Bracket spacing */
  bracketSpacing: boolean;
  /** Bracket same line (JSX) */
  bracketSameLine: boolean;
  /** Arrow function parentheses */
  arrowParens: 'always' | 'avoid';
  /** End of line */
  endOfLine: 'lf' | 'crlf' | 'cr' | 'auto';
  /** Prose wrap (for markdown) */
  proseWrap: 'always' | 'never' | 'preserve';
  /** HTML whitespace sensitivity */
  htmlWhitespaceSensitivity: 'css' | 'strict' | 'ignore';
  /** Single attribute per line (HTML/JSX) */
  singleAttributePerLine: boolean;
}

/**
 * Commitlint configuration options
 */
export interface CommitlintOptions {
  /** Extends base config */
  extends: string[];
  /** Commit types allowed */
  types: string[];
  /** Scopes allowed (empty for any) */
  scopes: string[];
  /** Maximum header length */
  headerMaxLength: number;
  /** Require scope */
  scopeRequired: boolean;
  /** Require body */
  bodyRequired: boolean;
  /** Body max line length */
  bodyMaxLineLength: number;
  /** Enable Husky integration */
  huskyIntegration: boolean;
}

/**
 * Code style configuration
 */
export interface CodeStyleConfig {
  /** Whether code style tools are enabled */
  enabled: boolean;
  /** EditorConfig file installed */
  editorconfig: boolean;
  /** EditorConfig options */
  editorconfigOptions?: EditorConfigOptions;
  /** Commitlint configuration installed */
  commitlint: boolean;
  /** Commitlint options */
  commitlintOptions?: CommitlintOptions;
  /** Biome configuration installed */
  biome: boolean;
  /** Biome options */
  biomeOptions?: BiomeOptions;
  /** Prettier configuration installed */
  prettier: boolean;
  /** Prettier options */
  prettierOptions?: PrettierOptions;
}

/**
 * Extra components configuration
 */
export interface ExtrasConfig {
  /** JSON schemas installed */
  schemas: boolean;
  /** Automation scripts installed */
  scripts: boolean;
  /** Hook configuration */
  hooks: HookConfig;
  /** Planning sessions structure */
  sessions: boolean;
  /** Code style configuration */
  codeStyle?: CodeStyleConfig;
  /** Folder structure preferences */
  folderPreferences?: FolderPreferences;
}

/**
 * Main Claude configuration stored in .claude/config.json
 */
export interface ClaudeConfig {
  /** CLI version that created this config */
  version: string;

  /** Template source information */
  templateSource: TemplateSource;

  /** Project-specific values */
  project: ProjectInfo;

  /** User preferences */
  preferences: Preferences;

  /** MCP configuration */
  mcp: McpConfig;

  /** Installed modules */
  modules: ModulesConfig;

  /** Extra components */
  extras: ExtrasConfig;

  /** Scaffold tracking */
  scaffold: ScaffoldConfig;

  /** Customization tracking */
  customizations: Customizations;

  /** Template placeholder configuration */
  templateConfig?: Partial<TemplateConfig>;
}

/**
 * Partial config for updates
 */
export type PartialClaudeConfig = Partial<ClaudeConfig>;
