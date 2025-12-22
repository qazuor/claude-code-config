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

// Claude settings types
export type {
  ClaudeModel,
  PermissionMode,
  StopNotificationType,
  SandboxConfig,
  SandboxNetworkConfig,
  PermissionsSettingsConfig,
  AttributionConfig,
  EnvConfig,
  HookEntry,
  HookEventConfig,
  HooksConfig,
  ClaudeSettingsConfig,
  PartialClaudeSettingsConfig,
} from './claude-settings.js';

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

// Bundle types
export type {
  BundleCategory,
  BundleModuleRef,
  BundleDefinition,
  BundleRegistry,
  BundleSelectionResult,
  ResolvedBundle,
} from './bundles.js';

// Template types
export type {
  TemplateDirectiveType,
  TemplateContext,
  TemplateDirective,
  TemplateResult,
  TemplateProcessingReport,
  TemplateModuleRef,
} from './templates.js';

// Template config types
export type {
  TemplatePlaceholderCategory,
  TemplatePlaceholderInputType,
  TemplatePlaceholderChoice,
  TemplateConfigContext,
  TemplatePlaceholderDefinition,
  TemplateConfigCommands,
  TemplateConfigPaths,
  TemplateConfigTargets,
  TemplateConfigTracking,
  TemplateConfigTechStack,
  TemplateConfigEnvironment,
  TemplateConfigBrand,
  TemplateConfig,
  PlaceholderScanResult,
  TemplatePlaceholderReport,
  GlobalDefaults,
  TemplateConfigSetupMode,
} from './template-config.js';

// Folder preferences types
export type {
  TestFileLocation,
  PlanningFileLocation,
  DocsFileLocation,
  CiCdLocation,
  GithubWorkflowTemplate,
  FolderPreferences,
  BundleFolderRecommendations,
} from './folder-preferences.js';

// Package.json types
export type {
  PackageJson,
  PackageJsonPerson,
  PackageJsonRepository,
  PackageJsonBugs,
  PackageJsonFunding,
  PackageJsonUpdateOptions,
  PackageJsonUpdateResult,
  PackageJsonChanges,
  ToolSelection,
  DependencyGenerationConfig,
} from './package-json.js';
