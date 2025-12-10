/**
 * Template placeholder scanner
 *
 * Scans template files to discover {{PLACEHOLDER}} patterns
 * and returns information about which placeholders are used.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type {
  PlaceholderScanResult,
  TemplateConfig,
  TemplatePlaceholderCategory,
} from '../../types/template-config.js';
import {
  getAllPlaceholderPatterns,
  getPlaceholderByPattern,
  isConfigurablePlaceholder,
  TEMPLATE_PLACEHOLDERS,
} from '../../constants/template-placeholders.js';

/**
 * Regex to match {{PLACEHOLDER}} patterns
 */
const PLACEHOLDER_REGEX = /\{\{([A-Z][A-Z0-9_]*)\}\}/g;

/**
 * File extensions to scan
 */
const SCANNABLE_EXTENSIONS = ['.md', '.json', '.yaml', '.yml', '.txt'];

/**
 * Directories to skip during scanning
 */
const SKIP_DIRECTORIES = ['node_modules', '.git', 'dist', 'build', '.next', '.turbo'];

/**
 * Check if a path should be scanned
 */
function shouldScanPath(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return SCANNABLE_EXTENSIONS.includes(ext);
}

/**
 * Check if a directory should be skipped
 */
function shouldSkipDirectory(dirName: string): boolean {
  return SKIP_DIRECTORIES.includes(dirName) || dirName.startsWith('.');
}

/**
 * Extract all placeholder patterns from content
 */
export function extractPlaceholders(content: string): string[] {
  const matches = content.matchAll(PLACEHOLDER_REGEX);
  const placeholders = new Set<string>();

  for (const match of matches) {
    placeholders.add(`{{${match[1]}}}`);
  }

  return Array.from(placeholders);
}

/**
 * Recursively get all files in a directory
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
      } else if (entry.isFile() && shouldScanPath(entry.name)) {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return files;
}

/**
 * Scan a directory for template placeholders
 */
export async function scanForPlaceholders(
  dir: string
): Promise<PlaceholderScanResult> {
  const allPlaceholders = new Set<string>();
  const filesByPlaceholder: Record<string, string[]> = {};
  const counts: Record<string, number> = {};
  const byCategory: Record<TemplatePlaceholderCategory, string[]> = {
    commands: [],
    paths: [],
    targets: [],
    tracking: [],
    techStack: [],
    performance: [],
    brand: [],
    environment: [],
  };

  const files = await getAllFiles(dir);

  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      const placeholders = extractPlaceholders(content);

      for (const placeholder of placeholders) {
        // Only track configurable placeholders
        if (!isConfigurablePlaceholder(placeholder)) continue;

        allPlaceholders.add(placeholder);

        // Track files
        if (!filesByPlaceholder[placeholder]) {
          filesByPlaceholder[placeholder] = [];
        }
        filesByPlaceholder[placeholder].push(path.relative(dir, file));

        // Count occurrences
        const regex = new RegExp(
          placeholder.replace(/[{}]/g, '\\$&'),
          'g'
        );
        const matchCount = (content.match(regex) || []).length;
        counts[placeholder] = (counts[placeholder] || 0) + matchCount;
      }
    } catch {
      // File can't be read, skip
    }
  }

  // Group by category
  for (const placeholder of allPlaceholders) {
    const def = getPlaceholderByPattern(placeholder);
    if (def) {
      byCategory[def.category].push(placeholder);
    }
  }

  return {
    placeholders: Array.from(allPlaceholders).sort(),
    byCategory,
    filesByPlaceholder,
    counts,
  };
}

/**
 * Get unconfigured placeholders (placeholders found but not in config)
 */
export async function getUnconfiguredPlaceholders(
  dir: string,
  config: Partial<TemplateConfig>
): Promise<string[]> {
  const scanResult = await scanForPlaceholders(dir);
  const unconfigured: string[] = [];

  // Flatten config to get configured keys
  const configuredKeys = new Set<string>();

  if (config.commands) {
    for (const [key] of Object.entries(config.commands)) {
      configuredKeys.add(key.toUpperCase() + '_COMMAND');
    }
  }
  if (config.paths) {
    for (const [key] of Object.entries(config.paths)) {
      configuredKeys.add(key.toUpperCase());
    }
  }
  if (config.targets) {
    for (const [key] of Object.entries(config.targets)) {
      configuredKeys.add(key.toUpperCase());
    }
  }
  if (config.tracking) {
    for (const [key] of Object.entries(config.tracking)) {
      configuredKeys.add(key.toUpperCase());
    }
  }
  if (config.techStack) {
    for (const [key] of Object.entries(config.techStack)) {
      configuredKeys.add(key.toUpperCase());
    }
  }
  if (config.environment) {
    for (const [key] of Object.entries(config.environment)) {
      configuredKeys.add(key.toUpperCase());
    }
  }
  if (config.brand) {
    for (const [key] of Object.entries(config.brand)) {
      configuredKeys.add(key.toUpperCase());
    }
  }

  // Check each found placeholder
  for (const placeholder of scanResult.placeholders) {
    const def = getPlaceholderByPattern(placeholder);
    if (def && !configuredKeys.has(def.key)) {
      unconfigured.push(placeholder);
    }
  }

  return unconfigured;
}

/**
 * Get placeholders that are required but not configured
 */
export async function getMissingRequiredPlaceholders(
  dir: string,
  config: Partial<TemplateConfig>
): Promise<string[]> {
  const scanResult = await scanForPlaceholders(dir);
  const missing: string[] = [];

  for (const placeholder of scanResult.placeholders) {
    const def = getPlaceholderByPattern(placeholder);
    if (def?.required) {
      // Check if configured
      const isConfigured = isPlaceholderConfigured(def.key, config);
      if (!isConfigured) {
        missing.push(placeholder);
      }
    }
  }

  return missing;
}

/**
 * Check if a specific placeholder key is configured
 */
function isPlaceholderConfigured(
  key: string,
  config: Partial<TemplateConfig>
): boolean {
  const def = TEMPLATE_PLACEHOLDERS.find((p) => p.key === key);
  if (!def) return false;

  switch (def.category) {
    case 'commands': {
      const cmdKey = keyToConfigKey(key, 'commands');
      return Boolean(
        config.commands?.[cmdKey as keyof typeof config.commands]
      );
    }
    case 'paths': {
      const pathKey = keyToConfigKey(key, 'paths');
      return Boolean(config.paths?.[pathKey as keyof typeof config.paths]);
    }
    case 'targets':
    case 'performance': {
      const targetKey = keyToConfigKey(key, 'targets');
      return config.targets?.[targetKey as keyof typeof config.targets] !== undefined;
    }
    case 'tracking': {
      const trackKey = keyToConfigKey(key, 'tracking');
      return Boolean(
        config.tracking?.[trackKey as keyof typeof config.tracking]
      );
    }
    case 'techStack': {
      const techKey = keyToConfigKey(key, 'techStack');
      return Boolean(
        config.techStack?.[techKey as keyof typeof config.techStack]
      );
    }
    case 'environment': {
      const envKey = keyToConfigKey(key, 'environment');
      return Boolean(
        config.environment?.[envKey as keyof typeof config.environment]
      );
    }
    case 'brand': {
      const brandKey = keyToConfigKey(key, 'brand');
      return Boolean(config.brand?.[brandKey as keyof typeof config.brand]);
    }
    default:
      return false;
  }
}

/**
 * Convert placeholder key to config object key
 * e.g., TYPECHECK_COMMAND -> typecheck
 *       COVERAGE_TARGET -> coverageTarget
 */
function keyToConfigKey(key: string, category: string): string {
  // Remove category suffix if present
  let cleanKey = key;

  if (category === 'commands' && key.endsWith('_COMMAND')) {
    cleanKey = key.slice(0, -8);
  } else if (category === 'environment' && key.endsWith('_ENV')) {
    cleanKey = key.slice(0, -4);
  }

  // Convert SNAKE_CASE to camelCase
  return cleanKey
    .toLowerCase()
    .replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

/**
 * Get scan summary as formatted string
 */
export function formatScanSummary(result: PlaceholderScanResult): string {
  const lines: string[] = [];

  lines.push(`Found ${result.placeholders.length} configurable placeholders:\n`);

  const categories = Object.entries(result.byCategory).filter(
    ([, placeholders]) => placeholders.length > 0
  );

  for (const [category, placeholders] of categories) {
    lines.push(`  ${category} (${placeholders.length}):`);
    for (const placeholder of placeholders) {
      const count = result.counts[placeholder] || 0;
      const files = result.filesByPlaceholder[placeholder]?.length || 0;
      lines.push(`    ${placeholder} - ${count} uses in ${files} files`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * List all known configurable placeholder patterns
 */
export function listAllConfigurablePlaceholders(): string[] {
  return getAllPlaceholderPatterns();
}
