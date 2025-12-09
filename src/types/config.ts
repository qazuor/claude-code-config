/**
 * Main configuration types for Claude Code config
 */

import type { McpInstallation } from './mcp.js';
import type { PermissionsConfig } from './permissions.js';

/**
 * Template source configuration
 */
export interface TemplateSource {
  /** Whether using local bundled or remote templates */
  type: 'local' | 'remote';
  /** Git repository URL if remote */
  repository?: string;
  /** Branch or tag if remote */
  ref?: string;
  /** When the template was installed */
  installedAt: string;
}

/**
 * Project information for placeholder replacement
 */
export interface ProjectInfo {
  /** Project name */
  name: string;
  /** Brief project description */
  description: string;
  /** GitHub organization or username */
  org: string;
  /** Repository name */
  repo: string;
  /** Project domain (optional) */
  domain?: string;
  /** Primary entity type (singular) */
  entityType: string;
  /** Primary entity type (plural) */
  entityTypePlural: string;
  /** Location for examples (optional) */
  location?: string;
}

/**
 * User preferences
 */
export interface Preferences {
  /** Working language */
  language: 'es' | 'en';
  /** Language for Claude responses */
  responseLanguage: 'es' | 'en';
  /** Include Claude as commit co-author */
  includeCoAuthor: boolean;
}

/**
 * Module selection state
 */
export interface ModuleSelection {
  /** Selected module IDs */
  selected: string[];
  /** Excluded module IDs */
  excluded: string[];
}

/**
 * Hook configuration
 */
export interface HookConfig {
  /** Whether hooks are enabled */
  enabled: boolean;
  /** Notification hook customizations */
  notification?: {
    /** Enable desktop notifications */
    desktop: boolean;
    /** Enable audio notifications */
    audio: boolean;
    /** Custom notification command */
    customCommand?: string;
  };
  /** Stop hook configuration */
  stop?: {
    /** Play beep sound */
    beep?: boolean;
    /** Custom sound file */
    customSound?: string;
    /** Custom command */
    customCommand?: string;
  };
  /** Subagent stop hook configuration */
  subagentStop?: {
    /** Play beep sound */
    beep?: boolean;
    /** Custom sound file */
    customSound?: string;
    /** Custom command */
    customCommand?: string;
  };
}

/**
 * MCP configuration
 */
export interface McpConfig {
  /** Installation level */
  level: 'user' | 'project';
  /** Installed MCP servers */
  servers: McpInstallation[];
}

/**
 * Scaffold configuration tracking
 */
export interface ScaffoldConfig {
  /** What type of scaffold was performed */
  type: 'claude-only' | 'full-project';
  /** List of created directories/files */
  createdStructure: string[];
}

/**
 * Customization tracking
 */
export interface Customizations {
  /** Whether placeholders were replaced */
  placeholdersReplaced: boolean;
  /** Last update timestamp */
  lastUpdated: string;
  /** Files that were manually modified */
  customFiles: string[];
  /** Permissions configuration (if custom) */
  permissions?: PermissionsConfig;
}

/**
 * Modules configuration
 */
export interface ModulesConfig {
  /** Installed agents */
  agents: ModuleSelection;
  /** Installed skills */
  skills: ModuleSelection;
  /** Installed commands */
  commands: ModuleSelection;
  /** Installed docs */
  docs: ModuleSelection;
}

/**
 * Extra components configuration
 */
export interface ExtrasConfig {
  /** JSON schemas installed */
  schemas: boolean;
  /** Automation scripts installed */
  scripts: boolean;
  /** Hook configuration */
  hooks: HookConfig;
  /** Planning sessions structure */
  sessions: boolean;
}

/**
 * Main Claude configuration stored in .claude/config.json
 */
export interface ClaudeConfig {
  /** CLI version that created this config */
  version: string;

  /** Template source information */
  templateSource: TemplateSource;

  /** Project-specific values */
  project: ProjectInfo;

  /** User preferences */
  preferences: Preferences;

  /** MCP configuration */
  mcp: McpConfig;

  /** Installed modules */
  modules: ModulesConfig;

  /** Extra components */
  extras: ExtrasConfig;

  /** Scaffold tracking */
  scaffold: ScaffoldConfig;

  /** Customization tracking */
  customizations: Customizations;
}

/**
 * Partial config for updates
 */
export type PartialClaudeConfig = Partial<ClaudeConfig>;
