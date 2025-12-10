/**
 * Constants exports
 */

// Presets
export {
  PRESETS,
  getPreset,
  getPresetNames,
  isModuleInPreset,
} from './presets.js';

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
