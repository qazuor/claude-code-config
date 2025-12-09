/**
 * @qazuor/claude-code-config
 *
 * CLI tool to install and manage Claude Code configurations
 */

// Export types
export type {
  ClaudeConfig,
  ModuleSelection,
  HookConfig,
  TemplateSource,
  Preferences,
  ScaffoldConfig,
  Customizations,
} from './types/config.js';

export type {
  ModuleRegistry,
  ModuleDefinition,
  ModuleCategory,
  ResolvedModule,
} from './types/modules.js';

export type { PresetName, PresetDefinition } from './types/presets.js';

export type {
  McpServerDefinition,
  McpCategory,
  McpConfigField,
  McpInstallation,
} from './types/mcp.js';

export type {
  ScaffoldType,
  ProjectType,
  ScaffoldOptions,
  ScaffoldResult,
  ProjectDetectionResult,
} from './types/scaffold.js';

export type { PermissionPreset, PermissionsConfig } from './types/permissions.js';

// Export constants
export { PRESETS } from './constants/presets.js';
export { MCP_SERVERS } from './constants/mcp-servers.js';
export { DEPENDENCIES } from './constants/dependencies.js';
export { PLACEHOLDERS } from './constants/placeholders.js';
export { PERMISSION_PRESETS } from './constants/permissions.js';

// Export programmatic API
export { readConfig, writeConfig, hasConfig, createDefaultConfig } from './lib/config/index.js';
export { loadRegistry, resolveModules, installModules } from './lib/modules/index.js';
export { replacePlaceholders } from './lib/placeholders/index.js';
export { detectProject } from './lib/scaffold/detector.js';
