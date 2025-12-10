/**
 * Package.json types and interfaces
 */

import type { PackageManager } from './scaffold.js';

/**
 * Person object (for author, contributors, maintainers)
 */
export interface PackageJsonPerson {
  name: string;
  email?: string;
  url?: string;
}

/**
 * Repository configuration
 */
export interface PackageJsonRepository {
  type: string;
  url: string;
  directory?: string;
}

/**
 * Bugs configuration
 */
export interface PackageJsonBugs {
  url?: string;
  email?: string;
}

/**
 * Funding configuration
 */
export interface PackageJsonFunding {
  type: string;
  url: string;
}

/**
 * Package.json structure
 */
export interface PackageJson {
  /** Package name */
  name?: string;
  /** Package version */
  version?: string;
  /** Package description */
  description?: string;
  /** Main entry point */
  main?: string;
  /** ES module entry point */
  module?: string;
  /** Type declarations */
  types?: string;
  /** Package type (module or commonjs) */
  type?: 'module' | 'commonjs';
  /** Export map */
  exports?: Record<string, unknown>;
  /** Binary executables */
  bin?: string | Record<string, string>;
  /** Keywords for npm search */
  keywords?: string[];
  /** Author information */
  author?: string | PackageJsonPerson;
  /** License */
  license?: string;
  /** Homepage URL */
  homepage?: string;
  /** Repository information */
  repository?: string | PackageJsonRepository;
  /** Bug tracker */
  bugs?: string | PackageJsonBugs;
  /** Funding information */
  funding?: string | PackageJsonFunding | Array<string | PackageJsonFunding>;
  /** Files to include in package */
  files?: string[];
  /** Scripts */
  scripts?: Record<string, string>;
  /** Production dependencies */
  dependencies?: Record<string, string>;
  /** Development dependencies */
  devDependencies?: Record<string, string>;
  /** Peer dependencies */
  peerDependencies?: Record<string, string>;
  /** Optional dependencies */
  optionalDependencies?: Record<string, string>;
  /** Engine requirements */
  engines?: Record<string, string>;
  /** Workspaces (for monorepos) */
  workspaces?: string[] | { packages: string[] };
  /** Private package flag */
  private?: boolean;
  /** Package manager */
  packageManager?: string;
  /** Side effects for bundlers */
  sideEffects?: boolean | string[];
  /** Additional fields */
  [key: string]: unknown;
}

/**
 * Package.json update options
 */
export interface PackageJsonUpdateOptions {
  /** Merge strategy for scripts */
  scriptsMerge?: 'replace' | 'skip-existing' | 'overwrite';
  /** Merge strategy for dependencies */
  dependenciesMerge?: 'replace' | 'skip-existing' | 'overwrite';
  /** Create package.json if it doesn't exist */
  createIfMissing?: boolean;
  /** Backup existing package.json before modifying */
  backup?: boolean;
  /** Dry run - return what would change without writing */
  dryRun?: boolean;
}

/**
 * Package.json update result
 */
export interface PackageJsonUpdateResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Path to the package.json file */
  path: string;
  /** Whether file was created */
  created: boolean;
  /** Whether file was modified */
  modified: boolean;
  /** Scripts that were added */
  addedScripts: string[];
  /** Scripts that were skipped (already existed) */
  skippedScripts: string[];
  /** Dependencies that were added */
  addedDependencies: string[];
  /** Dependencies that were skipped (already existed) */
  skippedDependencies: string[];
  /** Dev dependencies that were added */
  addedDevDependencies: string[];
  /** Dev dependencies that were skipped */
  skippedDevDependencies: string[];
  /** Error message if failed */
  error?: string;
}

/**
 * Proposed package.json changes
 */
export interface PackageJsonChanges {
  /** Scripts to add/update */
  scripts?: Record<string, string>;
  /** Dependencies to add/update */
  dependencies?: Record<string, string>;
  /** Dev dependencies to add/update */
  devDependencies?: Record<string, string>;
  /** Other fields to set */
  metadata?: {
    name?: string;
    version?: string;
    description?: string;
    author?: string | PackageJsonPerson;
    license?: string;
    repository?: string | PackageJsonRepository;
    homepage?: string;
    bugs?: string | PackageJsonBugs;
    keywords?: string[];
    type?: 'module' | 'commonjs';
    engines?: Record<string, string>;
    packageManager?: string;
  };
}

/**
 * Tool selection for dependency generation
 */
export interface ToolSelection {
  /** Linter choice */
  linter?: 'biome' | 'eslint' | 'oxlint' | 'none';
  /** Formatter choice */
  formatter?: 'biome' | 'prettier' | 'none';
  /** Test runner choice */
  testRunner?: 'vitest' | 'jest' | 'playwright' | 'none';
  /** Enable commitlint */
  commitlint?: boolean;
  /** Enable husky */
  husky?: boolean;
  /** Enable TypeScript */
  typescript?: boolean;
}

/**
 * Configuration for generating package.json changes
 */
export interface DependencyGenerationConfig {
  /** Tool selection */
  tools: ToolSelection;
  /** Package manager to use */
  packageManager: PackageManager;
  /** Project metadata */
  project?: {
    name?: string;
    description?: string;
    author?: string;
    license?: string;
    repository?: string;
  };
}
