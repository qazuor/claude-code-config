/**
 * Standards configuration replacer
 *
 * Replaces {{PLACEHOLDER}} patterns in standards template files
 * with configured values from StandardsConfig.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import ora from 'ora';
import type { StandardsConfig, StandardsReplacementReport } from '../../types/standards.js';

/**
 * File extensions to process
 */
const PROCESSABLE_EXTENSIONS = ['.md', '.json', '.yaml', '.yml', '.txt'];

/**
 * Directories to skip
 */
const SKIP_DIRECTORIES = ['node_modules', '.git', 'dist', 'build', '.next', '.turbo'];

/**
 * Flatten StandardsConfig into a key-value map for replacement
 */
export function flattenStandardsConfig(config: StandardsConfig): Record<string, string> {
  const flattened: Record<string, string> = {};

  // Code standards
  if (config.code) {
    flattened['{{INDENT_STYLE}}'] = config.code.indentStyle;
    flattened['{{INDENT_SIZE}}'] = String(config.code.indentSize);
    flattened['{{MAX_LINE_LENGTH}}'] = String(config.code.maxLineLength);
    flattened['{{MAX_FILE_LINES}}'] = String(config.code.maxFileLines);
    flattened['{{QUOTE_STYLE}}'] = config.code.quoteStyle;
    flattened['{{USE_SEMICOLONS}}'] = config.code.semicolons ? 'yes' : 'no';
    flattened['{{TRAILING_COMMAS}}'] = config.code.trailingCommas;
    flattened['{{ALLOW_ANY}}'] = config.code.allowAny ? 'yes' : 'no';
    flattened['{{NAMED_EXPORTS_ONLY}}'] = config.code.namedExportsOnly ? 'yes' : 'no';
    flattened['{{RORO_PATTERN}}'] = config.code.roroPattern ? 'yes' : 'no';
    flattened['{{JSDOC_REQUIRED}}'] = config.code.jsDocRequired ? 'yes' : 'no';
  }

  // Testing standards
  if (config.testing) {
    flattened['{{COVERAGE_TARGET}}'] = String(config.testing.coverageTarget);
    flattened['{{TDD_REQUIRED}}'] = config.testing.tddRequired ? 'yes' : 'no';
    flattened['{{TEST_PATTERN}}'] = config.testing.testPattern.toUpperCase();
    flattened['{{TEST_LOCATION}}'] = config.testing.testLocation;
    flattened['{{UNIT_TEST_MAX_MS}}'] = String(config.testing.unitTestMaxMs);
    flattened['{{INTEGRATION_TEST_MAX_MS}}'] = String(config.testing.integrationTestMaxMs);
  }

  // Documentation standards
  if (config.documentation) {
    flattened['{{JSDOC_LEVEL}}'] = config.documentation.jsDocLevel;
    flattened['{{REQUIRE_EXAMPLES}}'] = config.documentation.requireExamples ? 'yes' : 'no';
    flattened['{{CHANGELOG_FORMAT}}'] = config.documentation.changelogFormat;
    flattened['{{INLINE_COMMENT_POLICY}}'] = config.documentation.inlineCommentPolicy;
  }

  // Design standards
  if (config.design) {
    flattened['{{CSS_FRAMEWORK}}'] = config.design.cssFramework;
    flattened['{{COMPONENT_LIBRARY}}'] = config.design.componentLibrary;
    flattened['{{WCAG_LEVEL}}'] = config.design.accessibilityLevel;
    flattened['{{ACCESSIBILITY_LEVEL}}'] = config.design.accessibilityLevel;
    flattened['{{DARK_MODE_SUPPORT}}'] = config.design.darkModeSupport ? 'yes' : 'no';
  }

  // Security standards
  if (config.security) {
    flattened['{{AUTH_PATTERN}}'] = config.security.authPattern;
    flattened['{{VALIDATION_LIBRARY}}'] = config.security.inputValidation;
    flattened['{{INPUT_VALIDATION}}'] = config.security.inputValidation;
    flattened['{{CSRF_PROTECTION}}'] = config.security.csrfProtection ? 'yes' : 'no';
    flattened['{{RATE_LIMITING}}'] = config.security.rateLimiting ? 'yes' : 'no';
  }

  // Performance standards
  if (config.performance) {
    flattened['{{LCP_TARGET}}'] = String(config.performance.lcpTarget);
    flattened['{{FID_TARGET}}'] = String(config.performance.fidTarget);
    flattened['{{CLS_TARGET}}'] = String(config.performance.clsTarget);
    flattened['{{BUNDLE_SIZE_TARGET}}'] = String(config.performance.bundleSizeTargetKb);
    flattened['{{API_RESPONSE_TARGET}}'] = String(config.performance.apiResponseTargetMs);
  }

  return flattened;
}

/**
 * Check if file should be processed
 */
function shouldProcessFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return PROCESSABLE_EXTENSIONS.includes(ext);
}

/**
 * Check if directory should be skipped
 */
function shouldSkipDirectory(dirName: string): boolean {
  return SKIP_DIRECTORIES.includes(dirName) || dirName.startsWith('.');
}

/**
 * Get all files in directory recursively
 */
async function getAllFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!shouldSkipDirectory(entry.name)) {
          const subFiles = await getAllFiles(fullPath);
          files.push(...subFiles);
        }
      } else if (entry.isFile() && shouldProcessFile(entry.name)) {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return files;
}

/**
 * Replace placeholders in a single file
 */
async function replaceInFile(
  filePath: string,
  replacements: Record<string, string>
): Promise<Array<{ placeholder: string; value: string }>> {
  const changes: Array<{ placeholder: string; value: string }> = [];

  try {
    let content = await fs.readFile(filePath, 'utf-8');
    let modified = false;

    for (const [placeholder, value] of Object.entries(replacements)) {
      if (content.includes(placeholder)) {
        content = content.split(placeholder).join(value);
        changes.push({ placeholder, value });
        modified = true;
      }
    }

    if (modified) {
      await fs.writeFile(filePath, content, 'utf-8');
    }
  } catch {
    // File can't be read/written, skip
  }

  return changes;
}

/**
 * Replace standards placeholders in directory
 */
export async function replaceStandardsPlaceholders(
  claudePath: string,
  config: StandardsConfig
): Promise<StandardsReplacementReport> {
  const replacements = flattenStandardsConfig(config);
  const standardsDir = path.join(claudePath, 'docs', 'standards');
  const files = await getAllFiles(standardsDir);

  const report: StandardsReplacementReport = {
    modifiedFiles: [],
    replacedPlaceholders: [],
    unusedPlaceholders: [],
    errors: [],
  };

  const usedPlaceholders = new Set<string>();

  for (const file of files) {
    try {
      const changes = await replaceInFile(file, replacements);
      if (changes.length > 0) {
        report.modifiedFiles.push(path.relative(claudePath, file));
        for (const change of changes) {
          if (!report.replacedPlaceholders.includes(change.placeholder)) {
            report.replacedPlaceholders.push(change.placeholder);
          }
          usedPlaceholders.add(change.placeholder);
        }
      }
    } catch (error) {
      report.errors.push(`Error processing ${file}: ${String(error)}`);
    }
  }

  // Find unused placeholders
  for (const placeholder of Object.keys(replacements)) {
    if (!usedPlaceholders.has(placeholder)) {
      report.unusedPlaceholders.push(placeholder);
    }
  }

  return report;
}

/**
 * Replace standards placeholders with spinner UI
 */
export async function replaceStandardsWithSpinner(
  claudePath: string,
  config: StandardsConfig
): Promise<StandardsReplacementReport> {
  const spinner = ora('Applying standards configuration...').start();

  try {
    const report = await replaceStandardsPlaceholders(claudePath, config);

    if (report.modifiedFiles.length > 0) {
      spinner.succeed(
        `Applied ${report.replacedPlaceholders.length} standards to ${report.modifiedFiles.length} files`
      );
    } else {
      spinner.info('No standards placeholders found to replace');
    }

    return report;
  } catch (error) {
    spinner.fail('Failed to apply standards configuration');
    throw error;
  }
}

/**
 * Preview standards replacements without making changes
 */
export async function previewStandardsReplacements(
  claudePath: string,
  config: StandardsConfig
): Promise<Array<{ file: string; placeholder: string; value: string }>> {
  const replacements = flattenStandardsConfig(config);
  const standardsDir = path.join(claudePath, 'docs', 'standards');
  const files = await getAllFiles(standardsDir);
  const preview: Array<{ file: string; placeholder: string; value: string }> = [];

  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf-8');

      for (const [placeholder, value] of Object.entries(replacements)) {
        if (content.includes(placeholder)) {
          preview.push({
            file: path.relative(claudePath, file),
            placeholder,
            value,
          });
        }
      }
    } catch {
      // Skip unreadable files
    }
  }

  return preview;
}

/**
 * Format replacement report for display
 */
export function formatStandardsReport(report: StandardsReplacementReport): string {
  const lines: string[] = [];

  lines.push('Standards Configuration Applied');
  lines.push('─'.repeat(40));
  lines.push(`Files modified: ${report.modifiedFiles.length}`);
  lines.push(`Placeholders replaced: ${report.replacedPlaceholders.length}`);

  if (report.modifiedFiles.length > 0) {
    lines.push('');
    lines.push('Modified files:');
    for (const file of report.modifiedFiles) {
      lines.push(`  ✓ ${file}`);
    }
  }

  if (report.unusedPlaceholders.length > 0) {
    lines.push('');
    lines.push('Unused placeholders (no matching templates):');
    for (const p of report.unusedPlaceholders.slice(0, 5)) {
      lines.push(`  - ${p}`);
    }
    if (report.unusedPlaceholders.length > 5) {
      lines.push(`  ... and ${report.unusedPlaceholders.length - 5} more`);
    }
  }

  if (report.errors.length > 0) {
    lines.push('');
    lines.push('Errors:');
    for (const error of report.errors) {
      lines.push(`  ✗ ${error}`);
    }
  }

  return lines.join('\n');
}
