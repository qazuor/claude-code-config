/**
 * Config exports
 */

// Reader
export {
  readConfig,
  hasConfig,
  hasClaudeDir,
  getConfigPath,
  getClaudeDirPath,
  readPartialConfig,
  getInstalledModulesFromConfig,
  getConfigVersion,
  needsMigration,
} from './reader.js';

// Writer
export {
  writeConfig,
  updateConfig,
  mergeConfig,
  createDefaultConfig,
  addModulesToConfig,
  removeModulesFromConfig,
  updateMcpConfig,
  updateExtrasConfig,
} from './writer.js';
