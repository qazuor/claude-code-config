/**
 * Global defaults management
 *
 * Manages global defaults stored in ~/.claude/defaults.json
 * These defaults are used as fallbacks for new projects.
 */

import * as fs from 'node:fs/promises';
import { homedir } from 'node:os';
import * as path from 'node:path';
import type { GlobalDefaults, TemplateConfig } from '../../types/template-config.js';

/**
 * Get the path to the global defaults file
 */
export function getGlobalDefaultsPath(): string {
  return path.join(homedir(), '.claude', 'defaults.json');
}

/**
 * Ensure the ~/.claude directory exists
 */
async function ensureClaudeDir(): Promise<void> {
  const claudeDir = path.join(homedir(), '.claude');
  try {
    await fs.mkdir(claudeDir, { recursive: true });
  } catch {
    // Directory exists or can't be created
  }
}

/**
 * Read global defaults from ~/.claude/defaults.json
 */
export async function readGlobalDefaults(): Promise<GlobalDefaults> {
  const defaultsPath = getGlobalDefaultsPath();

  try {
    const content = await fs.readFile(defaultsPath, 'utf-8');
    return JSON.parse(content) as GlobalDefaults;
  } catch {
    // File doesn't exist or is invalid
    return {};
  }
}

/**
 * Write global defaults to ~/.claude/defaults.json
 */
export async function writeGlobalDefaults(defaults: GlobalDefaults): Promise<void> {
  await ensureClaudeDir();
  const defaultsPath = getGlobalDefaultsPath();

  const dataToWrite: GlobalDefaults = {
    ...defaults,
    lastUpdated: new Date().toISOString(),
  };

  await fs.writeFile(defaultsPath, JSON.stringify(dataToWrite, null, 2), 'utf-8');
}

/**
 * Update global defaults with new template config
 */
export async function updateGlobalDefaults(templateConfig: Partial<TemplateConfig>): Promise<void> {
  const existing = await readGlobalDefaults();

  const updated: GlobalDefaults = {
    ...existing,
    templateConfig: mergeTemplateConfigs(existing.templateConfig || {}, templateConfig),
    lastUpdated: new Date().toISOString(),
  };

  await writeGlobalDefaults(updated);
}

/**
 * Merge two template configs, with source taking precedence
 */
function mergeTemplateConfigs(
  target: Partial<TemplateConfig>,
  source: Partial<TemplateConfig>
): Partial<TemplateConfig> {
  return {
    commands: { ...target.commands, ...source.commands },
    paths: { ...target.paths, ...source.paths },
    targets: { ...target.targets, ...source.targets },
    tracking: { ...target.tracking, ...source.tracking },
    techStack: { ...target.techStack, ...source.techStack },
    environment: { ...target.environment, ...source.environment },
    brand: { ...target.brand, ...source.brand },
  };
}

/**
 * Merge detected values with global defaults
 * Priority: detected > global > hardcoded defaults
 */
export function mergeWithGlobalDefaults(
  detected: Partial<TemplateConfig>,
  globalDefaults: Partial<TemplateConfig>
): Partial<TemplateConfig> {
  return {
    commands: {
      ...globalDefaults.commands,
      ...filterUndefined(detected.commands || {}),
    },
    paths: {
      ...globalDefaults.paths,
      ...filterUndefined(detected.paths || {}),
    },
    targets: {
      ...globalDefaults.targets,
      ...filterUndefined(detected.targets || {}),
    },
    tracking: {
      ...globalDefaults.tracking,
      ...filterUndefined(detected.tracking || {}),
    },
    techStack: {
      ...globalDefaults.techStack,
      ...filterUndefined(detected.techStack || {}),
    },
    environment: {
      ...globalDefaults.environment,
      ...filterUndefined(detected.environment || {}),
    },
    brand: {
      ...globalDefaults.brand,
      ...filterUndefined(detected.brand || {}),
    },
  };
}

/**
 * Filter out undefined values from an object
 */
function filterUndefined<T extends object>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      (result as Record<string, unknown>)[key] = value;
    }
  }
  return result;
}

/**
 * Check if global defaults exist
 */
export async function hasGlobalDefaults(): Promise<boolean> {
  try {
    const defaults = await readGlobalDefaults();
    return defaults.templateConfig !== undefined && Object.keys(defaults.templateConfig).length > 0;
  } catch {
    return false;
  }
}

/**
 * Clear global defaults
 */
export async function clearGlobalDefaults(): Promise<void> {
  const defaultsPath = getGlobalDefaultsPath();
  try {
    await fs.unlink(defaultsPath);
  } catch {
    // File doesn't exist
  }
}

/**
 * Get template config from global defaults
 */
export async function getGlobalTemplateConfig(): Promise<Partial<TemplateConfig>> {
  const defaults = await readGlobalDefaults();
  return defaults.templateConfig || {};
}

/**
 * Format global defaults for display
 */
export function formatGlobalDefaults(defaults: GlobalDefaults): string {
  const lines: string[] = [];

  lines.push('Global Defaults');
  lines.push('─'.repeat(40));

  if (defaults.lastUpdated) {
    lines.push(`Last updated: ${new Date(defaults.lastUpdated).toLocaleString()}`);
    lines.push('');
  }

  if (!defaults.templateConfig || Object.keys(defaults.templateConfig).length === 0) {
    lines.push('No template configuration saved');
    return lines.join('\n');
  }

  const config = defaults.templateConfig;

  if (config.commands && Object.keys(config.commands).length > 0) {
    lines.push('Commands:');
    for (const [key, value] of Object.entries(config.commands)) {
      if (value) lines.push(`  ${key}: ${value}`);
    }
    lines.push('');
  }

  if (config.paths && Object.keys(config.paths).length > 0) {
    lines.push('Paths:');
    for (const [key, value] of Object.entries(config.paths)) {
      if (value) lines.push(`  ${key}: ${value}`);
    }
    lines.push('');
  }

  if (config.targets && Object.keys(config.targets).length > 0) {
    lines.push('Targets:');
    for (const [key, value] of Object.entries(config.targets)) {
      if (value !== undefined) lines.push(`  ${key}: ${value}`);
    }
    lines.push('');
  }

  if (config.tracking && Object.keys(config.tracking).length > 0) {
    lines.push('Tracking:');
    for (const [key, value] of Object.entries(config.tracking)) {
      if (value !== undefined) lines.push(`  ${key}: ${value}`);
    }
    lines.push('');
  }

  if (config.techStack && Object.keys(config.techStack).length > 0) {
    lines.push('Tech Stack:');
    for (const [key, value] of Object.entries(config.techStack)) {
      if (value) lines.push(`  ${key}: ${value}`);
    }
    lines.push('');
  }

  if (config.environment && Object.keys(config.environment).length > 0) {
    lines.push('Environment:');
    for (const [key, value] of Object.entries(config.environment)) {
      if (value) lines.push(`  ${key}: ${value}`);
    }
    lines.push('');
  }

  if (config.brand && Object.keys(config.brand).length > 0) {
    lines.push('Brand:');
    for (const [key, value] of Object.entries(config.brand)) {
      if (value) lines.push(`  ${key}: ${value}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
