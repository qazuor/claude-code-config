/**
 * Constants exports
 */

// Bundles
export {
  BUNDLES,
  getAllBundles,
  getBundleById,
  getBundlesByCategory,
  getBundlesGroupedByCategory,
  BUNDLE_CATEGORY_NAMES,
} from './bundles.js';

// MCP Servers
export {
  MCP_SERVERS,
  getMcpServer,
  getMcpServersByCategory,
  getMcpServerIds,
} from './mcp-servers.js';

// Dependencies
export {
  DEPENDENCIES,
  getDependency,
  getDependenciesForFeature,
  getDependencyIds,
} from './dependencies.js';

// Placeholders
export {
  PLACEHOLDERS,
  getPlaceholder,
  getRequiredPlaceholders,
  getOptionalPlaceholders,
  applyTransform,
} from './placeholders.js';

// Permissions
export {
  PERMISSION_PRESETS,
  DEFAULT_DENY_RULES,
  getPresetPermissions,
  generateAllowRules,
  generateDenyRules,
  PRESET_DESCRIPTIONS,
} from './permissions.js';

// Template Placeholders
export {
  TEMPLATE_PLACEHOLDERS,
  getPlaceholderByKey,
  getPlaceholderByPattern,
  getPlaceholdersByCategory,
  getRequiredPlaceholders as getRequiredTemplatePlaceholders,
  getAllPlaceholderKeys,
  getAllPlaceholderPatterns,
  isConfigurablePlaceholder,
  computeDefaultValue,
} from './template-placeholders.js';

// Folder Preferences
export {
  DEFAULT_FOLDER_PREFERENCES,
  TEST_LOCATION_OPTIONS,
  PLANNING_LOCATION_OPTIONS,
  DOCS_LOCATION_OPTIONS,
  TEST_PATTERN_OPTIONS,
  GITHUB_WORKFLOW_TEMPLATES,
  BUNDLE_FOLDER_RECOMMENDATIONS,
  getWorkflowsByCategory,
  getRecommendedWorkflows,
  getFolderRecommendationsForBundles,
  mergeFolderPreferences,
} from './folder-preferences.js';

// NPM Dependencies
export {
  LINTER_DEPENDENCIES,
  FORMATTER_DEPENDENCIES,
  TEST_RUNNER_DEPENDENCIES,
  COMMITLINT_DEPENDENCIES,
  HUSKY_DEPENDENCIES,
  TYPESCRIPT_DEPENDENCIES,
  getLinterDependencies,
  getFormatterDependencies,
  getTestRunnerDependencies,
  mergeToolDependencies,
  formatInstallCommand,
} from './npm-dependencies.js';

export type {
  NpmPackage,
  PackageScript,
  ToolDependencies,
} from './npm-dependencies.js';

// Claude Settings Defaults
export {
  DEFAULT_CLAUDE_SETTINGS,
  ATTRIBUTION_NO_COAUTHOR,
  ATTRIBUTION_WITH_COAUTHOR,
  BEEP_COMMAND,
  MODEL_DESCRIPTIONS,
  PERMISSION_MODE_DESCRIPTIONS,
  STOP_NOTIFICATION_DESCRIPTIONS,
  CLAUDE_SETTINGS_PRESETS,
  PRESET_DESCRIPTIONS as CLAUDE_PRESET_DESCRIPTIONS,
} from './claude-settings-defaults.js';
