/**
 * Template placeholder configuration types
 */

/**
 * Categories for grouping related placeholders
 */
export type TemplatePlaceholderCategory =
  | 'commands'
  | 'paths'
  | 'targets'
  | 'tracking'
  | 'techStack'
  | 'performance'
  | 'brand'
  | 'environment';

/**
 * Input type for placeholder prompts
 */
export type TemplatePlaceholderInputType = 'text' | 'select' | 'number' | 'path' | 'envVar';

/**
 * Choice option for select inputs
 */
export interface TemplatePlaceholderChoice {
  /** Display name */
  name: string;
  /** Actual value */
  value: string;
  /** Additional description */
  description?: string;
}

/**
 * Context for computing defaults and validation
 */
export interface TemplateConfigContext {
  /** Project directory path */
  projectPath: string;
  /** Detected package manager */
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun';
  /** Has TypeScript configured */
  hasTypeScript?: boolean;
  /** Scripts from package.json */
  scripts?: Record<string, string>;
  /** Dependencies from package.json */
  dependencies?: Record<string, string>;
  /** Already configured values */
  values: Record<string, string>;
  /** Is a git repository */
  isGitRepo?: boolean;
  /** Has GitHub remote */
  hasGitHubRemote?: boolean;
}

/**
 * Definition for a template placeholder
 */
export interface TemplatePlaceholderDefinition {
  /** Placeholder key (e.g., 'TYPECHECK_COMMAND') */
  key: string;
  /** Full pattern (e.g., '{{TYPECHECK_COMMAND}}') */
  pattern: string;
  /** Category for grouping */
  category: TemplatePlaceholderCategory;
  /** Human-readable label */
  label: string;
  /** Description shown during prompts */
  description: string;
  /** Input type */
  inputType: TemplatePlaceholderInputType;
  /** Choices for select inputs */
  choices?: TemplatePlaceholderChoice[];
  /** Default value or function to compute default */
  default?: string | ((context: TemplateConfigContext) => string | undefined);
  /** Validation function */
  validate?: (value: string, context: TemplateConfigContext) => boolean | string;
  /** Whether this placeholder is required */
  required: boolean;
  /** Dependencies - other placeholders that must be set first */
  dependsOn?: string[];
  /** Related placeholders (for grouping in UI) */
  relatedTo?: string[];
  /** Example value */
  example: string;
}

/**
 * User's template configuration - Commands
 */
export interface TemplateConfigCommands {
  typecheck?: string;
  lint?: string;
  test?: string;
  coverage?: string;
  build?: string;
  format?: string;
  securityScan?: string;
  lighthouse?: string;
  bundleAnalyze?: string;
}

/**
 * User's template configuration - Paths
 */
export interface TemplateConfigPaths {
  planningPath?: string;
  refactorPath?: string;
  archivePath?: string;
  schemasPath?: string;
  projectRoot?: string;
}

/**
 * User's template configuration - Targets
 */
export interface TemplateConfigTargets {
  coverageTarget?: number;
  bundleSizeTarget?: number;
  lcpTarget?: number;
  fidTarget?: number;
  clsTarget?: number;
  apiResponseTarget?: number;
  dbQueryTarget?: number;
  wcagLevel?: 'A' | 'AA' | 'AAA';
}

/**
 * User's template configuration - Tracking
 */
export interface TemplateConfigTracking {
  issueTracker?: 'github' | 'linear' | 'jira' | 'none';
  trackingFile?: string;
  registryFile?: string;
  taskCodePattern?: string;
  closedDays?: number;
  staleDays?: number;
}

/**
 * User's template configuration - Tech Stack
 */
export interface TemplateConfigTechStack {
  frontendFramework?: string;
  databaseOrm?: string;
  validationLibrary?: string;
  authPattern?: string;
  stateManagement?: string;
  testFramework?: string;
  bundler?: string;
  apiFramework?: string;
}

/**
 * User's template configuration - Environment Variables
 */
export interface TemplateConfigEnvironment {
  githubTokenEnv?: string;
  githubOwnerEnv?: string;
  githubRepoEnv?: string;
  issueTrackerTokenEnv?: string;
  issueTrackerOwnerEnv?: string;
  issueTrackerRepoEnv?: string;
}

/**
 * User's template configuration - Brand
 */
export interface TemplateConfigBrand {
  brandName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  toneOfVoice?: string;
}

/**
 * Complete template configuration
 */
export interface TemplateConfig {
  /** CLI commands */
  commands: TemplateConfigCommands;
  /** Directory paths */
  paths: TemplateConfigPaths;
  /** Quality targets */
  targets: TemplateConfigTargets;
  /** Issue tracking */
  tracking: TemplateConfigTracking;
  /** Technology stack */
  techStack: TemplateConfigTechStack;
  /** Environment variables */
  environment: TemplateConfigEnvironment;
  /** Brand identity */
  brand: TemplateConfigBrand;
}

/**
 * Scan result for template placeholders
 */
export interface PlaceholderScanResult {
  /** All unique placeholders found */
  placeholders: string[];
  /** Placeholders grouped by category */
  byCategory: Record<TemplatePlaceholderCategory, string[]>;
  /** Files containing each placeholder */
  filesByPlaceholder: Record<string, string[]>;
  /** Count per placeholder */
  counts: Record<string, number>;
}

/**
 * Template placeholder replacement report
 */
export interface TemplatePlaceholderReport {
  /** Total files scanned */
  totalFiles: number;
  /** Files that were modified */
  filesModified: number;
  /** All replacements made */
  replacements: Array<{
    file: string;
    placeholder: string;
    value: string;
  }>;
  /** Placeholders that couldn't be replaced */
  unreplaced: string[];
}

/**
 * Global defaults stored in ~/.claude/defaults.json
 */
export interface GlobalDefaults {
  /** Template configuration defaults */
  templateConfig?: Partial<TemplateConfig>;
  /** Last updated timestamp */
  lastUpdated?: string;
}

/**
 * Setup mode for configuration
 */
export type TemplateConfigSetupMode = 'quick' | 'guided' | 'advanced';
