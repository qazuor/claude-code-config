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
  | 'workflow'; // Workflow and planning bundles

/**
 * Module reference within a bundle
 */
export interface BundleModuleRef {
  /** Module ID */
  id: string;
  /** Module category (agents, skills, commands, docs) */
  category: ModuleCategory;
  /** Whether this module is optional in the bundle */
  optional?: boolean;
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
