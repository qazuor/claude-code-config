/**
 * Standards configuration module
 *
 * Provides functionality for:
 * - Defining standards categories and options
 * - Replacing placeholders in standards documents
 * - Scanning for unconfigured placeholders
 */

// Definitions
export {
  CODE_STANDARDS_DEFINITION,
  DESIGN_STANDARDS_DEFINITION,
  DOCUMENTATION_STANDARDS_DEFINITION,
  getAllStandardsPlaceholders,
  getAllStandardsTargetFiles,
  PERFORMANCE_STANDARDS_DEFINITION,
  SECURITY_STANDARDS_DEFINITION,
  STANDARDS_DEFINITIONS,
  TESTING_STANDARDS_DEFINITION,
} from './definitions.js';

// Replacer
export {
  flattenStandardsConfig,
  formatStandardsReport,
  previewStandardsReplacements,
  replaceStandardsPlaceholders,
  replaceStandardsWithSpinner,
} from './replacer.js';

// Scanner
export {
  formatScanResult,
  hasUnconfiguredPlaceholders,
  scanStandardsPlaceholders,
} from './scanner.js';
