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
