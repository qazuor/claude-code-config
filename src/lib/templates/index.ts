/**
 * Template processing module
 *
 * Provides template directive parsing and processing for dynamic content generation.
 *
 * Supported directives:
 * - {{#if condition}}...{{/if}} - Conditional blocks
 * - {{#unless condition}}...{{/unless}} - Inverse conditionals
 * - {{#each items}}...{{/each}} - Loops over arrays
 * - {{#section name}}...{{/section}} - Named sections
 * - {{variable}} - Variable replacement
 * - {{variable | transform}} - Variable with transform
 *
 * Available transforms:
 * - lowercase, upper - Case transforms
 * - capitalize, title - Title case
 * - kebab, snake, camel, pascal - Naming conventions
 * - json - JSON stringify
 * - count - Array/string length
 * - first, last - First/last element
 * - join, joinlines - Join arrays
 * - bullet, numbered - List formatting
 */

// Parser exports
export { parseDirectives, parseExpression, parseVariable, findVariables, hasDirectives, validateTemplate } from './parser.js';

// Evaluator exports
export {
  getContextValue,
  evaluateCondition,
  isTruthy,
  getIterable,
  applyTemplateTransform,
  createLoopContext,
} from './evaluator.js';

// Processor exports
export {
  processTemplate,
  processTemplateFile,
  processTemplatesInDirectory,
  processTemplates,
  showTemplateReport,
} from './processor.js';

// Context exports
export {
  buildTemplateContext,
  extendContext,
  addCustomVariable,
  hasModule,
  hasAnyModule,
  hasAllModules,
  getAllModules,
} from './context.js';

// Scanner exports
export {
  extractPlaceholders,
  scanForPlaceholders,
  getUnconfiguredPlaceholders,
  getMissingRequiredPlaceholders,
  formatScanSummary,
  listAllConfigurablePlaceholders,
} from './scanner.js';

// Config replacer exports
export {
  flattenTemplateConfig,
  replaceTemplatePlaceholders,
  replaceTemplateConfigWithSpinner,
  formatReplacementReport,
  previewReplacements,
} from './config-replacer.js';
