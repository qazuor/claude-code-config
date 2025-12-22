/**
 * Types for Claude Code settings.json and settings.local.json configuration
 */

/**
 * Claude model options
 */
export type ClaudeModel = 'sonnet' | 'opus' | 'haiku' | 'default';

/**
 * Permission mode options
 */
export type PermissionMode = 'acceptEdits' | 'askAlways' | 'viewOnly';

/**
 * Stop notification type
 */
export type StopNotificationType = 'beep' | 'custom' | 'none';

/**
 * Hook configuration for events
 */
export interface HookEntry {
  type: 'command';
  command: string;
  timeout?: number;
}

/**
 * Hook event configuration
 */
export interface HookEventConfig {
  hooks: HookEntry[];
}

/**
 * Hooks configuration
 */
export interface HooksConfig {
  Stop?: HookEventConfig[];
  SubagentStop?: HookEventConfig[];
  Notification?: HookEventConfig[];
}

/**
 * Sandbox network configuration
 */
export interface SandboxNetworkConfig {
  allowUnixSockets?: string[];
  allowLocalBinding?: boolean;
  httpProxyPort?: number;
  socksProxyPort?: number;
}

/**
 * Sandbox configuration
 */
export interface SandboxConfig {
  enabled: boolean;
  autoAllowBashIfSandboxed?: boolean;
  excludedCommands?: string[];
  allowUnsandboxedCommands?: boolean;
  network?: SandboxNetworkConfig;
}

/**
 * Attribution configuration for commits and PRs
 */
export interface AttributionConfig {
  commit?: string;
  pr?: string;
}

/**
 * Environment variables configuration
 */
export interface EnvConfig {
  [key: string]: string;
}

/**
 * Permissions configuration
 */
export interface PermissionsSettingsConfig {
  allow?: string[];
  deny?: string[];
  ask?: string[];
  additionalDirectories?: string[];
  defaultMode?: PermissionMode;
}

/**
 * Main Claude settings configuration
 */
export interface ClaudeSettingsConfig {
  /** Default model to use */
  model: ClaudeModel;
  /** Enable extended thinking by default */
  alwaysThinkingEnabled: boolean;
  /** Sandbox configuration */
  sandbox: SandboxConfig;
  /** Permissions configuration */
  permissions: PermissionsSettingsConfig;
  /** Attribution for commits and PRs */
  attribution: AttributionConfig;
  /** Session cleanup period in days */
  cleanupPeriodDays: number;
  /** Stop notification configuration */
  stopNotification: StopNotificationType;
  /** Custom stop command (if stopNotification is 'custom') */
  customStopCommand?: string;
  /** Environment variables */
  env?: EnvConfig;
  /** Hooks configuration */
  hooks?: HooksConfig;
}

/**
 * Partial settings for updates
 */
export type PartialClaudeSettingsConfig = Partial<ClaudeSettingsConfig>;
