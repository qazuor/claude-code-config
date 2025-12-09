/**
 * Placeholder replacer - finds and replaces placeholders in files
 */

import { PLACEHOLDERS, applyTransform } from '../../constants/placeholders.js';
import type { ProjectInfo } from '../../types/config.js';
import type {
  PlaceholderDefinition,
  PlaceholderReplacement,
  PlaceholderReport,
} from '../../types/placeholders.js';
import { joinPath, listFiles, readFile, writeFile } from '../utils/fs.js';
import { logger } from '../utils/logger.js';
import { withSpinner } from '../utils/spinner.js';

/**
 * Replace placeholders in a single file
 */
export async function replaceInFile(
  filePath: string,
  projectInfo: ProjectInfo,
  placeholders: PlaceholderDefinition[] = PLACEHOLDERS
): Promise<PlaceholderReplacement[]> {
  const replacements: PlaceholderReplacement[] = [];
  let content = await readFile(filePath);
  let modified = false;

  for (const placeholder of placeholders) {
    const value = projectInfo[placeholder.configKey];

    if (value === undefined || value === null) {
      continue;
    }

    const transformedValue = applyTransform(String(value), placeholder.transform);
    const pattern = placeholder.pattern;

    if (pattern instanceof RegExp) {
      const matches = content.matchAll(new RegExp(pattern.source, 'g'));

      for (const match of matches) {
        const lineNumber = getLineNumber(content, match.index ?? 0);
        replacements.push({
          file: filePath,
          line: lineNumber,
          original: match[0],
          replacement: transformedValue,
          placeholder,
        });
      }

      if (pattern.test(content)) {
        content = content.replace(pattern, transformedValue);
        modified = true;
      }
    } else {
      // String pattern
      const regex = new RegExp(escapeRegex(pattern), 'g');
      const matches = content.matchAll(regex);

      for (const match of matches) {
        const lineNumber = getLineNumber(content, match.index ?? 0);
        replacements.push({
          file: filePath,
          line: lineNumber,
          original: match[0],
          replacement: transformedValue,
          placeholder,
        });
      }

      if (content.includes(pattern)) {
        content = content.replace(regex, transformedValue);
        modified = true;
      }
    }
  }

  if (modified) {
    await writeFile(filePath, content);
  }

  return replacements;
}

/**
 * Replace placeholders in all files in a directory
 */
export async function replaceInDirectory(
  dirPath: string,
  projectInfo: ProjectInfo,
  options?: {
    extensions?: string[];
    exclude?: string[];
    dryRun?: boolean;
  }
): Promise<PlaceholderReport> {
  const extensions = options?.extensions || ['md', 'json', 'yaml', 'yml', 'ts', 'js', 'tsx', 'jsx'];
  const exclude = options?.exclude || ['node_modules', '.git', 'dist', 'build'];

  const pattern = `**/*.{${extensions.join(',')}}`;
  const files = await listFiles(pattern, {
    cwd: dirPath,
    ignore: exclude.map((e) => `**/${e}/**`),
  });

  const report: PlaceholderReport = {
    totalFiles: files.length,
    filesModified: 0,
    replacements: [],
    unreplacedPlaceholders: [],
  };

  for (const file of files) {
    const filePath = joinPath(dirPath, file);

    try {
      const replacements = options?.dryRun
        ? await scanFile(filePath, projectInfo)
        : await replaceInFile(filePath, projectInfo);

      if (replacements.length > 0) {
        report.filesModified++;
        report.replacements.push(...replacements);
      }
    } catch (error) {
      logger.debug(`Failed to process ${file}: ${error}`);
    }
  }

  // Find unreplaced placeholders
  report.unreplacedPlaceholders = findUnreplacedPlaceholders(projectInfo);

  return report;
}

/**
 * Scan file for placeholders without replacing
 */
async function scanFile(
  filePath: string,
  projectInfo: ProjectInfo
): Promise<PlaceholderReplacement[]> {
  const replacements: PlaceholderReplacement[] = [];
  const content = await readFile(filePath);

  for (const placeholder of PLACEHOLDERS) {
    const value = projectInfo[placeholder.configKey];

    if (value === undefined || value === null) {
      continue;
    }

    const transformedValue = applyTransform(String(value), placeholder.transform);
    const pattern = placeholder.pattern;

    const regex =
      pattern instanceof RegExp
        ? new RegExp(pattern.source, 'g')
        : new RegExp(escapeRegex(pattern), 'g');

    const matches = content.matchAll(regex);

    for (const match of matches) {
      const lineNumber = getLineNumber(content, match.index ?? 0);
      replacements.push({
        file: filePath,
        line: lineNumber,
        original: match[0],
        replacement: transformedValue,
        placeholder,
      });
    }
  }

  return replacements;
}

/**
 * Replace placeholders with spinner
 */
export async function replacePlaceholders(
  dirPath: string,
  projectInfo: ProjectInfo,
  options?: {
    extensions?: string[];
    exclude?: string[];
    dryRun?: boolean;
    silent?: boolean;
  }
): Promise<PlaceholderReport> {
  return withSpinner(
    'Replacing placeholders...',
    () => replaceInDirectory(dirPath, projectInfo, options),
    {
      successText: 'Placeholders replaced',
      silent: options?.silent || options?.dryRun,
    }
  );
}

/**
 * Find placeholders that couldn't be replaced due to missing values
 */
function findUnreplacedPlaceholders(projectInfo: ProjectInfo): string[] {
  const unreplaced: string[] = [];

  for (const placeholder of PLACEHOLDERS) {
    if (!placeholder.required) continue;

    const value = projectInfo[placeholder.configKey];
    if (value === undefined || value === null || value === '') {
      const patternStr =
        placeholder.pattern instanceof RegExp ? placeholder.pattern.source : placeholder.pattern;
      unreplaced.push(patternStr);
    }
  }

  return unreplaced;
}

/**
 * Get line number from string index
 */
function getLineNumber(content: string, index: number): number {
  return content.slice(0, index).split('\n').length;
}

/**
 * Escape regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Show replacement report
 */
export function showReplacementReport(report: PlaceholderReport): void {
  logger.newline();
  logger.subtitle('Placeholder Replacement Report');
  logger.keyValue('Files scanned', String(report.totalFiles));
  logger.keyValue('Files modified', String(report.filesModified));
  logger.keyValue('Replacements', String(report.replacements.length));

  if (report.unreplacedPlaceholders.length > 0) {
    logger.newline();
    logger.warn('Unreplaced placeholders (missing values):');
    for (const p of report.unreplacedPlaceholders) {
      logger.item(p);
    }
  }
}
