/**
 * Type exports
 */

// Config types
export type {
  ClaudeConfig,
  TemplateSource,
  ProjectInfo,
  Preferences,
  ModuleSelection,
  HookConfig,
  McpConfig,
  ScaffoldConfig,
  Customizations,
  ModulesConfig,
  ExtrasConfig,
  PartialClaudeConfig,
} from './config.js';

// Module types
export type {
  ModuleCategory,
  ModuleDefinition,
  ModuleRegistry,
  RegistryFile,
  RegistryFileItem,
  ResolvedModule,
  ModuleSelectionResult,
  ModuleInstallResult,
} from './modules.js';

// Preset types
export type { PresetName, PresetDefinition, PresetSelectionResult } from './presets.js';

// MCP types
export type {
  McpCategory,
  McpConfigField,
  McpServerDefinition,
  McpInstallation,
  McpSelectionResult,
} from './mcp.js';

// Scaffold types
export type {
  ScaffoldType,
  ProjectType,
  PackageManager,
  ScaffoldOptions,
  ScaffoldResult,
  DetectionSignal,
  ProjectDetectionResult,
  ExistingProjectAction,
} from './scaffold.js';

// Permission types
export type {
  PermissionPreset,
  FilePermissions,
  GitPermissions,
  BashPermissions,
  WebPermissions,
  CustomPermissions,
  PermissionsConfig,
  PermissionsSelectionResult,
} from './permissions.js';

// Placeholder types
export type {
  PlaceholderTransform,
  PlaceholderDefinition,
  PlaceholderReplacement,
  PlaceholderReport,
} from './placeholders.js';

// Dependency types
export type {
  Platform,
  InstallInstructions,
  DependencyInfo,
  DependencyCheckResult,
  DependencyReport,
} from './dependencies.js';
