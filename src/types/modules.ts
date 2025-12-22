/**
 * Module registry and definition types
 */

/**
 * Module categories
 */
export type ModuleCategory = 'agents' | 'skills' | 'commands' | 'docs';

/**
 * Extended description for better user understanding
 */
export interface ModuleExtendedInfo {
  /** Detailed explanation of what this module does */
  longDescription?: string;
  /** List of specific capabilities or features */
  whatItDoes?: string[];
  /** When/why to use this module */
  whenToUse?: string;
  /** Technology stack this module is designed for */
  techStack?: string[];
  /** Alternative modules (e.g., "prisma" is alternative to "drizzle") */
  alternativeTo?: string[];
  /** Related modules that work well together */
  relatedModules?: string[];
  /** Skill level (beginner, intermediate, advanced) */
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
  /** Author or source of this module */
  author?: string;
  /** Version of the module */
  version?: string;
}

/**
 * Module definition in registry
 */
export interface ModuleDefinition extends ModuleExtendedInfo {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Short description (shown in selection lists) */
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
  /** Bundle IDs that include this module (optional, can be computed) */
  includedInBundles?: string[];
  /** Placeholders used in this module's files */
  placeholders?: string[];
  /** Related skills that should be prompted when this agent is selected (agents only) */
  relatedSkills?: string[];
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
export interface RegistryFileItem extends Partial<ModuleExtendedInfo> {
  id: string;
  name: string;
  description?: string;
  file: string;
  dependencies?: string[];
  tags?: string[];
  /** Related skills that should be prompted when this agent is selected (agents only) */
  relatedSkills?: string[];
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
