/**
 * Modules exports
 */

// Registry
export {
  loadRegistry,
  getModule,
  getAllModules,
  getModulesByTag,
  filterModules,
  getModuleIds,
  validateModuleIds,
} from './registry.js';

// Resolver
export {
  resolveModules,
  resolveAllModules,
  getDependents,
  checkRemovalImpact,
  getSuggestedModules,
  sortByDependencies,
  type ResolvedModule,
  type ResolutionResult,
} from './resolver.js';

// Installer
export {
  installModules,
  installAllModules,
  uninstallModule,
  isModuleInstalled,
  getInstalledModules,
  installExtras,
  type InstallOptions,
  type InstallResult,
} from './installer.js';
