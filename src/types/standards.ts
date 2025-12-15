/**
 * Standards configuration types for project quality standards
 */

/**
 * Available standards categories
 */
export type StandardsCategory =
  | 'code'
  | 'testing'
  | 'documentation'
  | 'design'
  | 'security'
  | 'performance';

/**
 * Trailing comma options
 */
export type TrailingCommaOption = 'all' | 'es5' | 'none';

/**
 * Test pattern options
 */
export type TestPattern = 'aaa' | 'gwt';

/**
 * Test location options
 */
export type TestLocation = 'colocated' | 'separate';

/**
 * JSDoc detail level
 */
export type JsDocLevel = 'minimal' | 'standard' | 'comprehensive';

/**
 * Changelog format
 */
export type ChangelogFormat = 'keepachangelog' | 'conventional';

/**
 * Inline comment policy
 */
export type InlineCommentPolicy = 'why-not-what' | 'minimal' | 'extensive';

/**
 * CSS framework options
 */
export type CssFramework = 'tailwind' | 'css-modules' | 'styled-components' | 'vanilla';

/**
 * Component library options
 */
export type ComponentLibrary = 'shadcn' | 'radix' | 'headless' | 'none';

/**
 * WCAG accessibility level
 */
export type AccessibilityLevel = 'A' | 'AA' | 'AAA';

/**
 * Authentication pattern options
 */
export type AuthPattern = 'jwt' | 'session' | 'oauth' | 'none';

/**
 * Input validation library options
 */
export type ValidationLibrary = 'zod' | 'yup' | 'joi' | 'manual';

/**
 * Code standards configuration
 */
export interface StandardsConfigCode {
  /** Indent style (space or tab) */
  indentStyle: 'space' | 'tab';
  /** Indent size (number of spaces or tab width) */
  indentSize: number;
  /** Maximum line length */
  maxLineLength: number;
  /** Maximum lines per file (excluding tests, docs, JSON) */
  maxFileLines: number;
  /** Quote style for strings */
  quoteStyle: 'single' | 'double';
  /** Use semicolons */
  semicolons: boolean;
  /** Trailing comma style */
  trailingCommas: TrailingCommaOption;
  /** Allow 'any' type in TypeScript */
  allowAny: boolean;
  /** Require named exports only (no default exports) */
  namedExportsOnly: boolean;
  /** Require RO-RO pattern (Receive Object, Return Object) */
  roroPattern: boolean;
  /** Require JSDoc for all exports */
  jsDocRequired: boolean;
}

/**
 * Testing standards configuration
 */
export interface StandardsConfigTesting {
  /** Minimum code coverage percentage (0-100) */
  coverageTarget: number;
  /** Require TDD methodology */
  tddRequired: boolean;
  /** Test pattern: AAA (Arrange-Act-Assert) or GWT (Given-When-Then) */
  testPattern: TestPattern;
  /** Test file location: colocated (__tests__) or separate (test/) */
  testLocation: TestLocation;
  /** Maximum milliseconds per unit test */
  unitTestMaxMs: number;
  /** Maximum milliseconds per integration test */
  integrationTestMaxMs: number;
}

/**
 * Documentation standards configuration
 */
export interface StandardsConfigDocumentation {
  /** JSDoc detail level */
  jsDocLevel: JsDocLevel;
  /** Require examples in JSDoc */
  requireExamples: boolean;
  /** Changelog format */
  changelogFormat: ChangelogFormat;
  /** Inline comment policy */
  inlineCommentPolicy: InlineCommentPolicy;
}

/**
 * Design standards configuration
 */
export interface StandardsConfigDesign {
  /** CSS framework */
  cssFramework: CssFramework;
  /** Component library */
  componentLibrary: ComponentLibrary;
  /** WCAG accessibility level target */
  accessibilityLevel: AccessibilityLevel;
  /** Support dark mode */
  darkModeSupport: boolean;
}

/**
 * Security standards configuration
 */
export interface StandardsConfigSecurity {
  /** Authentication pattern */
  authPattern: AuthPattern;
  /** Input validation library */
  inputValidation: ValidationLibrary;
  /** Enable CSRF protection */
  csrfProtection: boolean;
  /** Enable rate limiting */
  rateLimiting: boolean;
}

/**
 * Performance standards configuration
 */
export interface StandardsConfigPerformance {
  /** Largest Contentful Paint target (milliseconds) */
  lcpTarget: number;
  /** First Input Delay target (milliseconds) */
  fidTarget: number;
  /** Cumulative Layout Shift target */
  clsTarget: number;
  /** Bundle size target (KB) */
  bundleSizeTargetKb: number;
  /** API response time target (milliseconds) */
  apiResponseTargetMs: number;
}

/**
 * Complete standards configuration
 */
export interface StandardsConfig {
  /** Code standards */
  code: StandardsConfigCode;
  /** Testing standards */
  testing: StandardsConfigTesting;
  /** Documentation standards */
  documentation: StandardsConfigDocumentation;
  /** Design standards */
  design: StandardsConfigDesign;
  /** Security standards */
  security: StandardsConfigSecurity;
  /** Performance standards */
  performance: StandardsConfigPerformance;
}

/**
 * Partial standards config for updates
 */
export type PartialStandardsConfig = {
  [K in keyof StandardsConfig]?: Partial<StandardsConfig[K]>;
};

/**
 * Standard option definition for wizard
 */
export interface StandardOption {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Detailed description */
  description: string;
  /** Type of input */
  type: 'select' | 'number' | 'boolean' | 'text';
  /** Choices for select type */
  choices?: Array<{ name: string; value: string; description?: string }>;
  /** Validation rules */
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  /** Placeholder patterns this affects in templates */
  affectsPlaceholders: string[];
}

/**
 * Category definition with all options
 */
export interface StandardsCategoryDefinition {
  /** Category identifier */
  id: StandardsCategory;
  /** Display name */
  name: string;
  /** Category description */
  description: string;
  /** Icon for display */
  icon: string;
  /** Available options in this category */
  options: StandardOption[];
  /** Template files this category affects */
  targetFiles: string[];
}

/**
 * Standards replacement report
 */
export interface StandardsReplacementReport {
  /** Files that were modified */
  modifiedFiles: string[];
  /** Placeholders that were replaced */
  replacedPlaceholders: string[];
  /** Placeholders that were not found in any file */
  unusedPlaceholders: string[];
  /** Errors encountered */
  errors: string[];
}

/**
 * Standards scan result
 */
export interface StandardsScanResult {
  /** Unconfigured placeholders found */
  unconfiguredPlaceholders: Array<{
    placeholder: string;
    files: string[];
  }>;
  /** Total placeholders found */
  totalPlaceholders: number;
  /** Already configured placeholders */
  configuredPlaceholders: number;
}
