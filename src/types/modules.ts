/**
 * Module registry and definition types
 */

import type { PresetName } from './presets.js';

/**
 * Module categories
 */
export type ModuleCategory = 'agents' | 'skills' | 'commands' | 'docs';

/**
 * Module definition in registry
 */
export interface ModuleDefinition {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Category this module belongs to */
  category: ModuleCategory;
  /** File path relative to category directory */
  file: string;
  /** Other modules this depends on */
  dependencies?: string[];
  /** Categorization tags */
  tags?: string[];
  /** Whether this is a core module (always installed) */
  isCore?: boolean;
  /** Presets that include this module (optional, can be computed) */
  includedInPresets?: PresetName[];
  /** Placeholders used in this module's files */
  placeholders?: string[];
}

/**
 * Registry file structure (_registry.json) - as stored on disk
 */
export interface RegistryFile {
  /** Category of modules in this registry */
  category: ModuleCategory;
  /** Available modules */
  modules: RegistryFileItem[];
}

/**
 * Registry item as stored in _registry.json
 */
export interface RegistryFileItem {
  id: string;
  name: string;
  description?: string;
  file: string;
  dependencies?: string[];
  tags?: string[];
}

/**
 * Full module registry - all categories combined
 */
export interface ModuleRegistry {
  /** Agent modules */
  agents: ModuleDefinition[];
  /** Skill modules */
  skills: ModuleDefinition[];
  /** Command modules */
  commands: ModuleDefinition[];
  /** Documentation modules */
  docs: ModuleDefinition[];
}

/**
 * Resolved module ready for installation
 */
export interface ResolvedModule {
  /** Module category */
  category: ModuleCategory;
  /** Module identifier */
  id: string;
  /** Module definition */
  definition: ModuleDefinition;
  /** Source path (in templates) */
  sourcePath: string;
  /** Target path (in .claude) */
  targetPath: string;
}

/**
 * Module selection result from prompts
 */
export interface ModuleSelectionResult {
  /** Selected agents by id */
  agents: string[];
  /** Selected skills by id */
  skills: string[];
  /** Selected commands by id */
  commands: string[];
  /** Selected docs by id */
  docs: string[];
}

/**
 * Module installation result
 */
export interface ModuleInstallResult {
  /** Successfully installed modules */
  installed: ResolvedModule[];
  /** Modules that failed to install */
  failed: Array<{ module: ResolvedModule; error: string }>;
  /** Total files copied */
  filesCopied: number;
}
