/**
 * Permission configuration types for Claude Code
 */

/**
 * Permission preset names
 */
export type PermissionPreset = 'default' | 'trust' | 'restrictive' | 'custom';

/**
 * File operation permissions
 */
export interface FilePermissions {
  /** Allow Read on all files */
  readAll: boolean;
  /** Allow Write on code files (*.ts, *.js, *.tsx, *.jsx) */
  writeCode: boolean;
  /** Allow Write on config files (*.json, *.yaml, *.toml) */
  writeConfig: boolean;
  /** Allow Write on markdown files (*.md) */
  writeMarkdown: boolean;
  /** Allow Write on other file types */
  writeOther: boolean;
  /** Allow Edit tool */
  editTool: boolean;
}

/**
 * Git operation permissions
 */
export interface GitPermissions {
  /** Allow read-only operations (status, diff, log) */
  readOnly: boolean;
  /** Allow staging (git add) */
  staging: boolean;
  /** Allow commit */
  commit: boolean;
  /** Allow push (dangerous) */
  push: boolean;
  /** Allow branching (checkout, branch) */
  branching: boolean;
}

/**
 * Bash/Terminal permissions
 */
export interface BashPermissions {
  /** Allow package manager commands (pnpm, npm, yarn) */
  packageManager: boolean;
  /** Allow test commands (vitest, jest) */
  testing: boolean;
  /** Allow build commands */
  building: boolean;
  /** Allow docker commands */
  docker: boolean;
  /** Allow arbitrary bash commands (dangerous) */
  arbitrary: boolean;
}

/**
 * Web operation permissions
 */
export interface WebPermissions {
  /** Allow WebFetch tool */
  fetch: boolean;
  /** Allow WebSearch tool */
  search: boolean;
}

/**
 * Custom permission rules
 */
export interface CustomPermissions {
  /** Additional allow patterns */
  allow: string[];
  /** Additional deny patterns */
  deny: string[];
}

/**
 * Full permissions configuration
 */
export interface PermissionsConfig {
  /** Selected preset */
  preset: PermissionPreset;
  /** File operation permissions */
  files: FilePermissions;
  /** Git operation permissions */
  git: GitPermissions;
  /** Bash/Terminal permissions */
  bash: BashPermissions;
  /** Web operation permissions */
  web: WebPermissions;
  /** Custom rules */
  custom: CustomPermissions;
}

/**
 * Permissions selection result from prompts
 */
export interface PermissionsSelectionResult {
  /** Selected preset */
  preset: PermissionPreset;
  /** Whether to customize after preset */
  customize: boolean;
  /** Full config if customized */
  config?: PermissionsConfig;
}
