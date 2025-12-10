/**
 * Bundle configuration types for grouping related modules
 */

import type { ModuleCategory } from './modules.js';

/**
 * Bundle categories for organizing bundles
 */
export type BundleCategory =
  | 'stack' // Full tech stacks (React + TanStack, Astro + React)
  | 'testing' // Testing-related bundles
  | 'quality' // Quality assurance bundles
  | 'database' // Database-related bundles
  | 'api' // API framework bundles
  | 'frontend' // Frontend framework bundles
  | 'workflow' // Workflow and planning bundles
  | 'cicd'; // CI/CD and DevOps bundles

/**
 * Bundle complexity level
 */
export type BundleComplexity = 'minimal' | 'standard' | 'comprehensive';

/**
 * Module reference within a bundle
 */
export interface BundleModuleRef {
  /** Module ID */
  id: string;
  /** Module category (agents, skills, commands, docs) */
  category: ModuleCategory;
  /** Whether this module is optional in the bundle (nice to have) */
  optional?: boolean;
  /** IDs of modules that require this module to function properly */
  requiredBy?: string[];
}

/**
 * Detailed agent information for display
 */
export interface AgentDetail {
  /** Agent module ID */
  id: string;
  /** Primary role of the agent */
  role: string;
  /** Key responsibilities */
  responsibilities: string[];
}

/**
 * Detailed skill information for display
 */
export interface SkillDetail {
  /** Skill module ID */
  id: string;
  /** Purpose of the skill */
  purpose: string;
}

/**
 * Detailed command information for display
 */
export interface CommandDetail {
  /** Command module ID */
  id: string;
  /** Example usage */
  usage: string;
}

/**
 * Detailed doc information for display
 */
export interface DocDetail {
  /** Doc module ID */
  id: string;
  /** Topic the doc covers */
  topic: string;
}

/**
 * Detailed module information for rich display
 */
export interface BundleModuleDetails {
  /** Agent details with roles and responsibilities */
  agents: AgentDetail[];
  /** Skill details with purposes */
  skills: SkillDetail[];
  /** Command details with usage examples */
  commands: CommandDetail[];
  /** Doc details with topics */
  docs: DocDetail[];
}

/**
 * Bundle definition
 */
export interface BundleDefinition {
  /** Unique bundle identifier */
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Bundle category */
  category: BundleCategory;
  /** Modules included in this bundle */
  modules: BundleModuleRef[];
  /** Long description explaining what this bundle provides */
  longDescription?: string;
  /** Technology stack this bundle is designed for */
  techStack?: string[];
  /** Alternative bundles (e.g., "prisma-bundle" is alternative to "drizzle-bundle") */
  alternativeTo?: string[];
  /** Tags for filtering */
  tags?: string[];

  // === NEW ENRICHED FIELDS ===

  /** What problems this bundle solves */
  responsibilities?: string[];
  /** Scope/reach of the bundle */
  scope?: string;
  /** When to use this bundle */
  useCases?: string[];
  /** Bundles that should be installed before this one */
  prerequisites?: string[];
  /** Bundles that conflict with this one (mutually exclusive) */
  conflicts?: string[];
  /** Complexity level of the bundle */
  complexity?: BundleComplexity;
  /** Detailed information about each module for rich display */
  moduleDetails?: BundleModuleDetails;
}

/**
 * Bundle registry file structure
 */
export interface BundleRegistry {
  /** Bundle definitions */
  bundles: BundleDefinition[];
}

/**
 * Bundle selection result
 */
export interface BundleSelectionResult {
  /** Selected bundle IDs */
  selectedBundles: string[];
  /** Individual modules selected outside bundles */
  additionalModules: {
    agents: string[];
    skills: string[];
    commands: string[];
    docs: string[];
  };
}

/**
 * Resolved bundle with full module definitions
 */
export interface ResolvedBundle {
  /** Bundle definition */
  bundle: BundleDefinition;
  /** Resolved modules from the bundle */
  modules: {
    agents: string[];
    skills: string[];
    commands: string[];
    docs: string[];
  };
}

/**
 * Dependency warning for optional modules
 */
export interface DependencyWarning {
  /** Module that would benefit from the dependency */
  moduleId: string;
  /** Module category */
  moduleCategory: ModuleCategory;
  /** Missing dependency ID */
  dependencyId: string;
  /** Dependency category */
  dependencyCategory: ModuleCategory;
  /** Human-readable message */
  message: string;
}

/**
 * Dependency error for required modules
 */
export interface DependencyError {
  /** Module that requires the dependency */
  moduleId: string;
  /** Module category */
  moduleCategory: ModuleCategory;
  /** Missing required dependency ID */
  dependencyId: string;
  /** Dependency category */
  dependencyCategory: ModuleCategory;
  /** Human-readable message */
  message: string;
}

/**
 * Result of validating bundle selection dependencies
 */
export interface BundleValidationResult {
  /** Whether the selection is valid (no required dependencies missing) */
  valid: boolean;
  /** Required dependencies that are missing (will be auto-included) */
  errors: DependencyError[];
  /** Optional dependencies that would improve the setup */
  warnings: DependencyWarning[];
  /** Modules that will be auto-included due to requirements */
  autoIncluded: BundleModuleRef[];
}

/**
 * Bundle prerequisite conflict
 */
export interface BundleConflict {
  /** Bundle that has the conflict */
  bundleId: string;
  /** Conflicting bundle ID */
  conflictsWith: string;
  /** Reason for the conflict */
  reason: string;
}

/**
 * Bundle prerequisite missing
 */
export interface BundlePrerequisiteMissing {
  /** Bundle that needs the prerequisite */
  bundleId: string;
  /** Required prerequisite bundle ID */
  prerequisiteId: string;
  /** Human-readable message */
  message: string;
}
