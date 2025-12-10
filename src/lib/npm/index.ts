/**
 * NPM package.json management module
 */

export {
  readPackageJson,
  writePackageJson,
  createMinimalPackageJson,
  generatePackageJsonChanges,
  updatePackageJson,
  getInstallCommand,
  formatPackageManagerField,
  deriveToolSelectionFromCodeStyle,
  getSetupInstructions,
} from './package-manager.js';
