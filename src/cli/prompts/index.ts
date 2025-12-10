/**
 * Prompts exports
 */

// Project info
export {
  promptProjectInfo,
  confirmProjectInfo,
} from './project-info.js';

// Preferences
export {
  promptPreferences,
  confirmPreferences,
} from './preferences.js';

// Scaffold
export {
  promptScaffoldType,
  promptProjectType,
  promptPackageManager,
  promptScaffoldOptions,
  confirmScaffoldOptions,
} from './scaffold.js';

// Bundle selection
export {
  promptBundleMode,
  promptBundleSelection,
  promptQuickBundleSelection,
  showBundleContents,
  showBundlesSummary,
  showBundlesSummaryWithTotals,
  confirmBundleSelection,
  confirmBundleSelectionWithEdit,
  editBundleSelection,
  calculateModuleTotals,
  createEmptyBundleResult,
  type BundleSelectionMode,
  type BundleConfirmAction,
  type ModuleTotals,
} from './bundle-select.js';

// Item selection (granular)
export {
  promptSingleItem,
  promptBatchAction,
  selectItemsFromCategory,
  showCategorySelectionSummary,
  confirmCategorySelection,
  type ItemAction,
  type BatchAction,
} from './item-select.js';

// Hook configuration
export {
  promptHookConfig,
  showHookSummary,
  confirmHookConfig,
} from './hook-config.js';

// MCP configuration
export {
  promptMcpConfig,
  showMcpSummary,
  confirmMcpConfig,
  showSkippedMcpInstructions,
  type McpConfigResult,
  type SkippedMcpConfig,
  type SkippedField,
} from './mcp-config.js';

// Permissions configuration
export {
  promptPermissionsConfig,
  showPermissionsSummary,
  confirmPermissionsConfig,
  generatePermissionRules,
} from './permissions.js';

// Update prompts
export {
  promptUpdateAction,
  showUpdateReport,
  promptNewModules,
  promptUpdatedModules,
  promptConflictResolution,
  promptReconfigureOptions,
  confirmUpdate,
  promptBackup,
  type UpdateAction,
  type ModuleUpdate,
  type ConflictResolution,
} from './update.js';

// Confirmation prompts
export {
  confirmOverwrite,
  promptExistingProjectAction,
  showFinalSummary,
  confirmFinalConfiguration,
  confirmDestructiveAction,
  showPostInstallInstructions,
  showDependencyInstructions,
} from './confirm.js';

// Code style prompts
export {
  promptCodeStyleConfig,
  showCodeStyleSummary,
  confirmCodeStyleConfig,
} from './code-style.js';

// Folder preferences prompts
export {
  promptTestLocation,
  promptPlanningLocation,
  promptDocsLocation,
  promptGithubWorkflows,
  promptFolderPreferences,
  promptQuickFolderPreferences,
  showFolderPreferencesSummary,
  confirmFolderPreferences,
} from './folder-preferences.js';
