/**
 * Template processor
 * Processes templates by evaluating directives and replacing variables
 */

import type {
  TemplateContext,
  TemplateDirective,
  TemplateResult,
  TemplateProcessingReport,
} from '../../types/templates.js';
import { parseDirectives, findVariables, hasDirectives, validateTemplate } from './parser.js';
import {
  evaluateCondition,
  getIterable,
  getContextValue,
  applyTemplateTransform,
  createLoopContext,
} from './evaluator.js';
import { joinPath, listFiles, readFile, writeFile } from '../utils/fs.js';
import { logger } from '../utils/logger.js';
import { withSpinner } from '../utils/spinner.js';

/**
 * Process a single template string
 */
export function processTemplate(content: string, context: TemplateContext): TemplateResult {
  const result: TemplateResult = {
    content,
    modified: false,
    directivesProcessed: 0,
    warnings: [],
    errors: [],
  };

  // Validate first
  const validation = validateTemplate(content);
  if (!validation.valid) {
    result.errors.push(...validation.errors);
    return result;
  }

  // Check if there are any directives to process
  if (!hasDirectives(content)) {
    return result;
  }

  try {
    // Process block directives (if, unless, each, section)
    result.content = processBlockDirectives(result.content, context, result);

    // Process variable replacements
    result.content = processVariables(result.content, context, result);

    // Remove empty lines left by removed blocks (but preserve intentional blank lines)
    result.content = cleanupEmptyLines(result.content);

    result.modified = result.content !== content;
  } catch (error) {
    result.errors.push(`Template processing error: ${error}`);
  }

  return result;
}

/**
 * Process block directives
 */
function processBlockDirectives(
  content: string,
  context: TemplateContext,
  result: TemplateResult
): string {
  const directives = parseDirectives(content);

  // Process from last to first to maintain correct indexes
  const sortedDirectives = [...directives].sort((a, b) => b.startIndex - a.startIndex);

  for (const directive of sortedDirectives) {
    const replacement = processDirective(directive, context, result);
    content =
      content.slice(0, directive.startIndex) + replacement + content.slice(directive.endIndex);
    result.directivesProcessed++;
  }

  return content;
}

/**
 * Process a single directive
 */
function processDirective(
  directive: TemplateDirective,
  context: TemplateContext,
  result: TemplateResult
): string {
  switch (directive.type) {
    case 'if':
      return processIfDirective(directive, context, result);

    case 'unless':
      return processUnlessDirective(directive, context, result);

    case 'each':
      return processEachDirective(directive, context, result);

    case 'section':
      return processSectionDirective(directive, context, result);

    case 'include':
      result.warnings.push(`Include directive not yet supported: ${directive.expression}`);
      return directive.match;

    default:
      result.warnings.push(`Unknown directive type: ${directive.type}`);
      return directive.match;
  }
}

/**
 * Process if directive
 */
function processIfDirective(
  directive: TemplateDirective,
  context: TemplateContext,
  result: TemplateResult
): string {
  const condition = evaluateCondition(directive.expression, context);

  if (condition) {
    // Process nested content
    const innerContent = directive.content ?? '';
    const innerResult = processTemplate(innerContent, context);
    result.warnings.push(...innerResult.warnings);
    result.errors.push(...innerResult.errors);
    return innerResult.content;
  }

  return '';
}

/**
 * Process unless directive
 */
function processUnlessDirective(
  directive: TemplateDirective,
  context: TemplateContext,
  result: TemplateResult
): string {
  const condition = evaluateCondition(directive.expression, context);

  if (!condition) {
    const innerContent = directive.content ?? '';
    const innerResult = processTemplate(innerContent, context);
    result.warnings.push(...innerResult.warnings);
    result.errors.push(...innerResult.errors);
    return innerResult.content;
  }

  return '';
}

/**
 * Process each directive
 */
function processEachDirective(
  directive: TemplateDirective,
  context: TemplateContext,
  result: TemplateResult
): string {
  const items = getIterable(directive.expression, context);

  if (items.length === 0) {
    return '';
  }

  const outputs: string[] = [];

  for (const { item, index, key } of items) {
    const loopContext = createLoopContext(context, item, index, key);
    const innerContent = directive.content ?? '';
    const innerResult = processTemplate(innerContent, loopContext as unknown as TemplateContext);
    result.warnings.push(...innerResult.warnings);
    result.errors.push(...innerResult.errors);
    outputs.push(innerResult.content);
  }

  return outputs.join('');
}

/**
 * Process section directive (just returns content, used for marking sections)
 */
function processSectionDirective(
  directive: TemplateDirective,
  context: TemplateContext,
  result: TemplateResult
): string {
  const innerContent = directive.content ?? '';
  const innerResult = processTemplate(innerContent, context);
  result.warnings.push(...innerResult.warnings);
  result.errors.push(...innerResult.errors);
  return innerResult.content;
}

/**
 * Process variable replacements
 */
function processVariables(
  content: string,
  context: TemplateContext,
  result: TemplateResult
): string {
  const variables = findVariables(content);

  // Process from last to first to maintain correct indexes
  const sortedVariables = [...variables].sort((a, b) => b.index - a.index);

  for (const { match, variable, transform, index } of sortedVariables) {
    const value = getContextValue(context, variable);

    if (value !== undefined) {
      const replacement = transform ? applyTemplateTransform(value, transform) : String(value);

      content = content.slice(0, index) + replacement + content.slice(index + match.length);
      result.directivesProcessed++;
    } else {
      result.warnings.push(`Variable not found: ${variable}`);
    }
  }

  return content;
}

/**
 * Clean up empty lines left by removed blocks
 */
function cleanupEmptyLines(content: string): string {
  // Remove lines that only contain whitespace after a removed block
  // But preserve intentional blank lines (max 2 consecutive)
  return content.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Process a template file
 */
export async function processTemplateFile(
  filePath: string,
  context: TemplateContext
): Promise<TemplateResult> {
  const content = await readFile(filePath);
  const result = processTemplate(content, context);

  if (result.modified && result.errors.length === 0) {
    await writeFile(filePath, result.content);
  }

  return result;
}

/**
 * Process all template files in a directory
 */
export async function processTemplatesInDirectory(
  dirPath: string,
  context: TemplateContext,
  options?: {
    extensions?: string[];
    exclude?: string[];
    dryRun?: boolean;
  }
): Promise<TemplateProcessingReport> {
  const extensions = options?.extensions ?? ['md', 'json', 'yaml', 'yml'];
  const exclude = options?.exclude ?? ['node_modules', '.git', 'dist', 'build'];

  const pattern = `**/*.{${extensions.join(',')}}`;
  const files = await listFiles(pattern, {
    cwd: dirPath,
    ignore: exclude.map((e) => `**/${e}/**`),
  });

  const report: TemplateProcessingReport = {
    totalFiles: files.length,
    filesModified: 0,
    totalDirectives: 0,
    filesWithErrors: [],
    warnings: [],
  };

  for (const file of files) {
    const filePath = joinPath(dirPath, file);

    try {
      const content = await readFile(filePath);

      // Skip files without directives
      if (!hasDirectives(content)) {
        continue;
      }

      const result = processTemplate(content, context);

      if (result.errors.length > 0) {
        report.filesWithErrors.push(file);
        report.warnings.push(`${file}: ${result.errors.join(', ')}`);
        continue;
      }

      if (result.modified) {
        if (!options?.dryRun) {
          await writeFile(filePath, result.content);
        }
        report.filesModified++;
      }

      report.totalDirectives += result.directivesProcessed;
      report.warnings.push(...result.warnings.map((w) => `${file}: ${w}`));
    } catch (error) {
      logger.debug(`Failed to process template ${file}: ${error}`);
      report.filesWithErrors.push(file);
    }
  }

  return report;
}

/**
 * Process templates with spinner
 */
export async function processTemplates(
  dirPath: string,
  context: TemplateContext,
  options?: {
    extensions?: string[];
    exclude?: string[];
    dryRun?: boolean;
    silent?: boolean;
  }
): Promise<TemplateProcessingReport> {
  return withSpinner(
    'Processing templates...',
    () => processTemplatesInDirectory(dirPath, context, options),
    {
      successText: 'Templates processed',
      silent: options?.silent ?? options?.dryRun,
    }
  );
}

/**
 * Show template processing report
 */
export function showTemplateReport(report: TemplateProcessingReport): void {
  logger.newline();
  logger.subtitle('Template Processing Report');
  logger.keyValue('Files scanned', String(report.totalFiles));
  logger.keyValue('Files modified', String(report.filesModified));
  logger.keyValue('Directives processed', String(report.totalDirectives));

  if (report.filesWithErrors.length > 0) {
    logger.newline();
    logger.warn('Files with errors:');
    for (const file of report.filesWithErrors) {
      logger.item(file);
    }
  }

  if (report.warnings.length > 0 && report.warnings.length <= 5) {
    logger.newline();
    logger.warn('Warnings:');
    for (const warning of report.warnings) {
      logger.item(warning);
    }
  } else if (report.warnings.length > 5) {
    logger.newline();
    logger.warn(`${report.warnings.length} warnings (showing first 5):`);
    for (const warning of report.warnings.slice(0, 5)) {
      logger.item(warning);
    }
  }
}
