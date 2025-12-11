/**
 * Git hooks module - Husky and related git hook utilities
 */

export {
  deriveHuskyConfigFromCodeStyle,
  getHuskyDependencies,
  getHuskySetupInstructions,
  getLintStagedConfig,
  installHusky,
  installHuskyWithSpinner,
  type HuskyConfig,
  type HuskyInstallResult,
} from './husky-installer.js';
