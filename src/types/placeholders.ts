/**
 * Placeholder replacement types
 */

import type { ProjectInfo } from './config.js';

/**
 * Transformation to apply to placeholder value
 */
export type PlaceholderTransform = 'none' | 'lowercase' | 'uppercase' | 'capitalize' | 'pluralize';

/**
 * Placeholder definition
 */
export interface PlaceholderDefinition {
  /** Pattern to find (string or regex) */
  pattern: string | RegExp;
  /** Config key to get replacement value */
  configKey: keyof ProjectInfo;
  /** Transformation to apply */
  transform: PlaceholderTransform;
  /** Description for documentation */
  description: string;
  /** Example value */
  example: string;
  /** Whether this placeholder is required */
  required: boolean;
}

/**
 * Single placeholder replacement record
 */
export interface PlaceholderReplacement {
  /** File where replacement was made */
  file: string;
  /** Line number */
  line: number;
  /** Original text */
  original: string;
  /** Replacement text */
  replacement: string;
  /** Placeholder definition used */
  placeholder: PlaceholderDefinition;
}

/**
 * Placeholder replacement report
 */
export interface PlaceholderReport {
  /** Total files scanned */
  totalFiles: number;
  /** Files that were modified */
  filesModified: number;
  /** All replacements made */
  replacements: PlaceholderReplacement[];
  /** Placeholders that couldn't be replaced (missing values) */
  unreplacedPlaceholders: string[];
}
