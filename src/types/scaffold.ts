/**
 * Project scaffold types
 */

import type { PresetName } from './presets.js';

/**
 * Scaffold type options
 */
export type ScaffoldType = 'claude-only' | 'full-project';

/**
 * Supported project types for scaffolding
 */
export type ProjectType =
  | 'node'
  | 'monorepo'
  | 'astro'
  | 'nextjs'
  | 'vite-react'
  | 'hono'
  | 'custom';

/**
 * Supported package managers
 */
export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

/**
 * Scaffold options from user selection
 */
export interface ScaffoldOptions {
  /** Type of scaffold to perform */
  type: ScaffoldType;
  /** Project type (only for full-project) */
  projectType?: ProjectType;
  /** Package manager to use */
  packageManager?: PackageManager;
  /** Initialize git repository */
  initGit?: boolean;
  /** Create README.md */
  createReadme?: boolean;
  /** Create .gitignore */
  createGitignore?: boolean;
}

/**
 * Scaffold operation result
 */
export interface ScaffoldResult {
  /** Files created */
  createdFiles: string[];
  /** Directories created */
  createdDirs: string[];
  /** Post-install instructions */
  instructions: string[];
}

/**
 * Project detection signal
 */
export interface DetectionSignal {
  /** File or pattern that was found */
  file: string;
  /** Whether it exists */
  exists: boolean;
  /** What it indicates */
  indicates: string;
}

/**
 * Project detection result
 */
export interface ProjectDetectionResult {
  /** Whether a project was detected */
  detected: boolean;
  /** Detected project type */
  projectType?: ProjectType;
  /** Detected package manager */
  packageManager?: PackageManager;
  /** Suggested preset based on detection */
  suggestedPreset?: PresetName;
  /** Overall confidence */
  confidence: 'high' | 'medium' | 'low';
  /** Signals that were found */
  signals: DetectionSignal[];
}

/**
 * Existing project action
 */
export type ExistingProjectAction = 'add-config' | 'show-instructions' | 'overwrite';
