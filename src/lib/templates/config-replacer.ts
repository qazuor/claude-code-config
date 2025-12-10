/**
 * Template configuration replacer
 *
 * Replaces {{PLACEHOLDER}} patterns in template files
 * with configured values from TemplateConfig.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import ora from 'ora';
import type {
  TemplateConfig,
  TemplatePlaceholderReport,
} from '../../types/template-config.js';
import { TEMPLATE_PLACEHOLDERS } from '../../constants/template-placeholders.js';

/**
 * File extensions to process
 */
const PROCESSABLE_EXTENSIONS = ['.md', '.json', '.yaml', '.yml', '.txt'];

/**
 * Directories to skip
 */
const SKIP_DIRECTORIES = ['node_modules', '.git', 'dist', 'build', '.next', '.turbo'];

/**
 * Flatten TemplateConfig into a key-value map for replacement
 */
export function flattenTemplateConfig(
  config: Partial<TemplateConfig>
): Record<string, string> {
  const flattened: Record<string, string> = {};

  // Commands
  if (config.commands) {
    if (config.commands.typecheck)
      flattened['{{TYPECHECK_COMMAND}}'] = config.commands.typecheck;
    if (config.commands.lint)
      flattened['{{LINT_COMMAND}}'] = config.commands.lint;
    if (config.commands.test)
      flattened['{{TEST_COMMAND}}'] = config.commands.test;
    if (config.commands.coverage)
      flattened['{{COVERAGE_COMMAND}}'] = config.commands.coverage;
    if (config.commands.build)
      flattened['{{BUILD_COMMAND}}'] = config.commands.build;
    if (config.commands.format)
      flattened['{{FORMAT_COMMAND}}'] = config.commands.format;
    if (config.commands.securityScan)
      flattened['{{SECURITY_SCAN_COMMAND}}'] = config.commands.securityScan;
    if (config.commands.lighthouse)
      flattened['{{LIGHTHOUSE_COMMAND}}'] = config.commands.lighthouse;
    if (config.commands.bundleAnalyze)
      flattened['{{BUNDLE_ANALYZE_COMMAND}}'] = config.commands.bundleAnalyze;
  }

  // Paths
  if (config.paths) {
    if (config.paths.planningPath)
      flattened['{{PLANNING_PATH}}'] = config.paths.planningPath;
    if (config.paths.refactorPath)
      flattened['{{REFACTOR_PATH}}'] = config.paths.refactorPath;
    if (config.paths.archivePath)
      flattened['{{ARCHIVE_PATH}}'] = config.paths.archivePath;
    if (config.paths.schemasPath)
      flattened['{{SCHEMAS_PATH}}'] = config.paths.schemasPath;
    if (config.paths.projectRoot)
      flattened['{{PROJECT_ROOT}}'] = config.paths.projectRoot;
  }

  // Targets
  if (config.targets) {
    if (config.targets.coverageTarget !== undefined)
      flattened['{{COVERAGE_TARGET}}'] = String(config.targets.coverageTarget);
    if (config.targets.bundleSizeTarget !== undefined)
      flattened['{{BUNDLE_SIZE_TARGET}}'] = String(config.targets.bundleSizeTarget);
    if (config.targets.lcpTarget !== undefined)
      flattened['{{LCP_TARGET}}'] = String(config.targets.lcpTarget);
    if (config.targets.fidTarget !== undefined)
      flattened['{{FID_TARGET}}'] = String(config.targets.fidTarget);
    if (config.targets.clsTarget !== undefined)
      flattened['{{CLS_TARGET}}'] = String(config.targets.clsTarget);
    if (config.targets.apiResponseTarget !== undefined)
      flattened['{{API_RESPONSE_TARGET}}'] = String(config.targets.apiResponseTarget);
    if (config.targets.dbQueryTarget !== undefined)
      flattened['{{DB_QUERY_TARGET}}'] = String(config.targets.dbQueryTarget);
    if (config.targets.wcagLevel)
      flattened['{{WCAG_LEVEL}}'] = config.targets.wcagLevel;
  }

  // Tracking
  if (config.tracking) {
    if (config.tracking.issueTracker)
      flattened['{{ISSUE_TRACKER}}'] = config.tracking.issueTracker;
    if (config.tracking.trackingFile)
      flattened['{{TRACKING_FILE}}'] = config.tracking.trackingFile;
    if (config.tracking.registryFile)
      flattened['{{REGISTRY_FILE}}'] = config.tracking.registryFile;
    if (config.tracking.taskCodePattern)
      flattened['{{TASK_CODE_PATTERN}}'] = config.tracking.taskCodePattern;
    if (config.tracking.closedDays !== undefined)
      flattened['{{CLOSED_DAYS}}'] = String(config.tracking.closedDays);
    if (config.tracking.staleDays !== undefined)
      flattened['{{STALE_DAYS}}'] = String(config.tracking.staleDays);
  }

  // Tech Stack
  if (config.techStack) {
    if (config.techStack.frontendFramework)
      flattened['{{FRONTEND_FRAMEWORK}}'] = config.techStack.frontendFramework;
    if (config.techStack.databaseOrm)
      flattened['{{DATABASE_ORM}}'] = config.techStack.databaseOrm;
    if (config.techStack.validationLibrary)
      flattened['{{VALIDATION_LIBRARY}}'] = config.techStack.validationLibrary;
    if (config.techStack.authPattern)
      flattened['{{AUTH_PATTERN}}'] = config.techStack.authPattern;
    if (config.techStack.stateManagement)
      flattened['{{STATE_MANAGEMENT}}'] = config.techStack.stateManagement;
    if (config.techStack.testFramework)
      flattened['{{TEST_FRAMEWORK}}'] = config.techStack.testFramework;
    if (config.techStack.bundler)
      flattened['{{BUNDLER}}'] = config.techStack.bundler;
    if (config.techStack.apiFramework)
      flattened['{{API_FRAMEWORK}}'] = config.techStack.apiFramework;
  }

  // Environment
  if (config.environment) {
    if (config.environment.githubTokenEnv)
      flattened['{{GITHUB_TOKEN_ENV}}'] = config.environment.githubTokenEnv;
    if (config.environment.githubOwnerEnv)
      flattened['{{GITHUB_OWNER_ENV}}'] = config.environment.githubOwnerEnv;
    if (config.environment.githubRepoEnv)
      flattened['{{GITHUB_REPO_ENV}}'] = config.environment.githubRepoEnv;
    if (config.environment.issueTrackerTokenEnv)
      flattened['{{ISSUE_TRACKER_TOKEN_ENV}}'] = config.environment.issueTrackerTokenEnv;
  }

  // Brand
  if (config.brand) {
    if (config.brand.brandName)
      flattened['{{BRAND_NAME}}'] = config.brand.brandName;
    if (config.brand.primaryColor)
      flattened['{{PRIMARY_COLOR}}'] = config.brand.primaryColor;
    if (config.brand.secondaryColor)
      flattened['{{SECONDARY_COLOR}}'] = config.brand.secondaryColor;
    if (config.brand.fontFamily)
      flattened['{{FONT_FAMILY}}'] = config.brand.fontFamily;
    if (config.brand.toneOfVoice)
      flattened['{{TONE_OF_VOICE}}'] = config.brand.toneOfVoice;
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
 * Replace template placeholders in directory
 */
export async function replaceTemplatePlaceholders(
  dir: string,
  config: Partial<TemplateConfig>
): Promise<TemplatePlaceholderReport> {
  const replacements = flattenTemplateConfig(config);
  const files = await getAllFiles(dir);
  const report: TemplatePlaceholderReport = {
    totalFiles: files.length,
    filesModified: 0,
    replacements: [],
    unreplaced: [],
  };

  for (const file of files) {
    const changes = await replaceInFile(file, replacements);
    if (changes.length > 0) {
      report.filesModified++;
      for (const change of changes) {
        report.replacements.push({
          file: path.relative(dir, file),
          placeholder: change.placeholder,
          value: change.value,
        });
      }
    }
  }

  // Find unreplaced placeholders
  const allPatterns = TEMPLATE_PLACEHOLDERS.map((p) => p.pattern);
  const replacedPatterns = new Set(Object.keys(replacements));
  report.unreplaced = allPatterns.filter((p) => !replacedPatterns.has(p));

  return report;
}

/**
 * Replace template placeholders with spinner UI
 */
export async function replaceTemplateConfigWithSpinner(
  dir: string,
  config: Partial<TemplateConfig>
): Promise<TemplatePlaceholderReport> {
  const spinner = ora('Applying template configuration...').start();

  try {
    const report = await replaceTemplatePlaceholders(dir, config);

    if (report.filesModified > 0) {
      spinner.succeed(
        `Applied ${report.replacements.length} replacements in ${report.filesModified} files`
      );
    } else {
      spinner.info('No template placeholders found to replace');
    }

    return report;
  } catch (error) {
    spinner.fail('Failed to apply template configuration');
    throw error;
  }
}

/**
 * Get a summary of the replacement report
 */
export function formatReplacementReport(
  report: TemplatePlaceholderReport
): string {
  const lines: string[] = [];

  lines.push(`Template Configuration Applied`);
  lines.push(`${'─'.repeat(40)}`);
  lines.push(`Total files scanned: ${report.totalFiles}`);
  lines.push(`Files modified: ${report.filesModified}`);
  lines.push(`Total replacements: ${report.replacements.length}`);

  if (report.replacements.length > 0) {
    lines.push('');
    lines.push('Replacements:');

    // Group by file
    const byFile: Record<string, string[]> = {};
    for (const r of report.replacements) {
      if (!byFile[r.file]) {
        byFile[r.file] = [];
      }
      byFile[r.file].push(`  ${r.placeholder} → ${r.value}`);
    }

    for (const [file, changes] of Object.entries(byFile)) {
      lines.push(`  ${file}:`);
      for (const change of changes) {
        lines.push(change);
      }
    }
  }

  if (report.unreplaced.length > 0) {
    lines.push('');
    lines.push('Not configured (using defaults or runtime values):');
    for (const p of report.unreplaced.slice(0, 10)) {
      lines.push(`  ${p}`);
    }
    if (report.unreplaced.length > 10) {
      lines.push(`  ... and ${report.unreplaced.length - 10} more`);
    }
  }

  return lines.join('\n');
}

/**
 * Preview replacements without making changes
 */
export async function previewReplacements(
  dir: string,
  config: Partial<TemplateConfig>
): Promise<{ file: string; placeholder: string; value: string }[]> {
  const replacements = flattenTemplateConfig(config);
  const files = await getAllFiles(dir);
  const preview: Array<{ file: string; placeholder: string; value: string }> = [];

  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf-8');

      for (const [placeholder, value] of Object.entries(replacements)) {
        if (content.includes(placeholder)) {
          preview.push({
            file: path.relative(dir, file),
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
