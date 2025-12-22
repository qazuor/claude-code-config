/**
 * Scaffold exports
 */

// Detector
export {
  detectProject,
  getProjectName,
  getProjectDescription,
  hasExistingClaudeConfig,
} from './detector.js';

// Generator
export {
  generateScaffold,
  generateScaffoldWithProgress,
} from './generator.js';

// CLAUDE.md generator
export {
  generateClaudeMd,
  generateClaudeMdWithSpinner,
  type ClaudeMdOptions,
  type ClaudeMdResult,
} from './claude-md-generator.js';

// Settings generator
export {
  generateSettings,
  generateSettingsWithSpinner,
  generateSettingsLocal,
  generateSettingsLocalWithSpinner,
  type SettingsGeneratorOptions,
  type SettingsGeneratorResult,
} from './settings-generator.js';
