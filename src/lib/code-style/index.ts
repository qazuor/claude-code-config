/**
 * Code style module exports
 */

export {
  installCodeStyle,
  getCodeStyleDependencies,
  showCodeStyleInstructions,
} from './installer.js';

export {
  generateVSCodeExtensions,
  generateVSCodeSettings,
  installVSCodeConfig,
  installVSCodeExtensions,
  installVSCodeSettings,
  type VSCodeInstallResult,
  type VSCodeSettings,
} from './vscode-installer.js';
