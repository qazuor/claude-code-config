/**
 * Standards placeholder scanner
 *
 * Scans template files for unconfigured placeholders
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { StandardsConfig, StandardsScanResult } from '../../types/standards.js';
import { flattenStandardsConfig } from './replacer.js';

/**
 * File extensions to scan
 */
const SCANNABLE_EXTENSIONS = ['.md', '.json', '.yaml', '.yml', '.txt'];

/**
 * Placeholder pattern regex
 */
const PLACEHOLDER_PATTERN = /\{\{([A-Z_]+)\}\}/g;

/**
 * Get all scannable files in directory
 */
async function getScanableFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await getScanableFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SCANNABLE_EXTENSIONS.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch {
    // Directory doesn't exist
  }

  return files;
}

/**
 * Extract placeholders from file content
 */
function extractPlaceholders(content: string): string[] {
  const matches = content.match(PLACEHOLDER_PATTERN);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Scan for unconfigured placeholders in standards files
 */
export async function scanStandardsPlaceholders(
  claudePath: string,
  config?: StandardsConfig
): Promise<StandardsScanResult> {
  const standardsDir = path.join(claudePath, 'docs', 'standards');
  const files = await getScanableFiles(standardsDir);

  const placeholdersByFile: Map<string, string[]> = new Map();
  const allPlaceholders = new Set<string>();

  // Scan all files for placeholders
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      const placeholders = extractPlaceholders(content);

      if (placeholders.length > 0) {
        const relPath = path.relative(claudePath, file);
        placeholdersByFile.set(relPath, placeholders);

        for (const p of placeholders) {
          allPlaceholders.add(p);
        }
      }
    } catch {
      // Skip unreadable files
    }
  }

  // Get configured placeholders if config provided
  const configuredPlaceholders = config
    ? new Set(Object.keys(flattenStandardsConfig(config)))
    : new Set<string>();

  // Build result
  const unconfigured: Map<string, string[]> = new Map();

  for (const placeholder of allPlaceholders) {
    if (!configuredPlaceholders.has(placeholder)) {
      const filesWithPlaceholder: string[] = [];

      for (const [file, placeholders] of placeholdersByFile) {
        if (placeholders.includes(placeholder)) {
          filesWithPlaceholder.push(file);
        }
      }

      unconfigured.set(placeholder, filesWithPlaceholder);
    }
  }

  return {
    unconfiguredPlaceholders: Array.from(unconfigured.entries()).map(([placeholder, files]) => ({
      placeholder,
      files,
    })),
    totalPlaceholders: allPlaceholders.size,
    configuredPlaceholders: configuredPlaceholders.size,
  };
}

/**
 * Format scan result for display
 */
export function formatScanResult(result: StandardsScanResult): string {
  const lines: string[] = [];

  lines.push('Standards Placeholder Scan');
  lines.push('─'.repeat(40));
  lines.push(`Total placeholders found: ${result.totalPlaceholders}`);
  lines.push(`Already configured: ${result.configuredPlaceholders}`);
  lines.push(`Unconfigured: ${result.unconfiguredPlaceholders.length}`);

  if (result.unconfiguredPlaceholders.length > 0) {
    lines.push('');
    lines.push('Unconfigured placeholders:');

    for (const { placeholder, files } of result.unconfiguredPlaceholders) {
      lines.push(`  ${placeholder}`);
      for (const file of files.slice(0, 3)) {
        lines.push(`    └─ ${file}`);
      }
      if (files.length > 3) {
        lines.push(`    └─ ... and ${files.length - 3} more files`);
      }
    }
  } else {
    lines.push('');
    lines.push('✓ All placeholders are configured!');
  }

  return lines.join('\n');
}

/**
 * Check if any placeholders are unconfigured
 */
export async function hasUnconfiguredPlaceholders(
  claudePath: string,
  config: StandardsConfig
): Promise<boolean> {
  const result = await scanStandardsPlaceholders(claudePath, config);
  return result.unconfiguredPlaceholders.length > 0;
}
