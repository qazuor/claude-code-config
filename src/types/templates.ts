/**
 * Template processing types for dynamic content generation
 */

import type { ModuleCategory } from './modules.js';

/**
 * Template directive types
 */
export type TemplateDirectiveType =
  | 'if' // Conditional block
  | 'unless' // Inverse conditional
  | 'each' // Loop over array
  | 'include' // Include partial template
  | 'section' // Named section marker
  | 'transform'; // Value transformation

/**
 * Context for template processing
 */
export interface TemplateContext {
  /** Project info from config */
  project: {
    name?: string;
    description?: string;
    org?: string;
    repo?: string;
    domain?: string;
    entityType?: string;
    location?: string;
  };
  /** Selected modules by category */
  modules: {
    agents: string[];
    skills: string[];
    commands: string[];
    docs: string[];
  };
  /** Code style choices */
  codeStyle: {
    formatter?: 'biome' | 'prettier' | 'none';
    linter?: 'biome' | 'eslint' | 'none';
    editorConfig?: boolean;
    commitlint?: boolean;
  };
  /** Technology stack choices */
  techStack: {
    framework?: string;
    database?: string;
    orm?: string;
    testing?: string;
    deployment?: string;
  };
  /** Bundle selections */
  bundles: string[];
  /** MCP servers enabled */
  mcpServers: string[];
  /** Custom variables */
  custom: Record<string, string | boolean | number | string[]>;
}

/**
 * Template directive definition
 */
export interface TemplateDirective {
  /** Type of directive */
  type: TemplateDirectiveType;
  /** Full match string */
  match: string;
  /** Condition or expression to evaluate */
  expression: string;
  /** Content inside the directive block */
  content?: string;
  /** Start index in source */
  startIndex: number;
  /** End index in source */
  endIndex: number;
  /** Nested directives if any */
  nested?: TemplateDirective[];
}

/**
 * Template processing result
 */
export interface TemplateResult {
  /** Processed content */
  content: string;
  /** Whether any directives were processed */
  modified: boolean;
  /** Directives found and processed */
  directivesProcessed: number;
  /** Any warnings during processing */
  warnings: string[];
  /** Any errors during processing */
  errors: string[];
}

/**
 * Template file processing report
 */
export interface TemplateProcessingReport {
  /** Files scanned */
  totalFiles: number;
  /** Files modified */
  filesModified: number;
  /** Total directives processed */
  totalDirectives: number;
  /** Files with errors */
  filesWithErrors: string[];
  /** All warnings */
  warnings: string[];
}

/**
 * Module reference in templates
 */
export interface TemplateModuleRef {
  id: string;
  category: ModuleCategory;
  name?: string;
  description?: string;
}
