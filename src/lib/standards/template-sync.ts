/**
 * Standards template synchronization
 *
 * Syncs standards templates from the package to the project
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import ora from 'ora';
import { getTemplatesPath } from '../utils/paths.js';

/**
 * Standards template files to sync
 */
const STANDARDS_TEMPLATES = [
  'code-standards.md',
  'testing-standards.md',
  'documentation-standards.md',
  'design-standards.md',
  'security-standards.md',
  'performance-standards.md',
];

export interface TemplateSyncResult {
  created: string[];
  updated: string[];
  skipped: string[];
  errors: string[];
}

export interface TemplateSyncOptions {
  overwrite?: boolean;
  backup?: boolean;
}

/**
 * Check if a file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create backup of a file
 */
async function createBackup(filePath: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${filePath}.backup-${timestamp}`;
  await fs.copyFile(filePath, backupPath);
  return backupPath;
}

/**
 * Check if file has standard placeholders (is a new-style template)
 */
async function hasPlaceholders(filePath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    // Check for configuration section with placeholders
    return content.includes('AUTO-GENERATED: Configured values') || /\{\{[A-Z_]+\}\}/.test(content);
  } catch {
    return false;
  }
}

/**
 * Sync a single template file
 */
async function syncTemplate(
  templateName: string,
  sourcePath: string,
  targetPath: string,
  options: TemplateSyncOptions
): Promise<{ status: 'created' | 'updated' | 'skipped'; backup?: string }> {
  const sourceFile = path.join(sourcePath, templateName);
  const targetFile = path.join(targetPath, templateName);

  // Check if source exists
  if (!(await fileExists(sourceFile))) {
    return { status: 'skipped' };
  }

  // Check if target exists
  const targetExists = await fileExists(targetFile);

  if (targetExists) {
    // Check if target already has placeholders
    const alreadyHasPlaceholders = await hasPlaceholders(targetFile);

    if (alreadyHasPlaceholders && !options.overwrite) {
      return { status: 'skipped' };
    }

    // Create backup if requested
    let backupPath: string | undefined;
    if (options.backup) {
      backupPath = await createBackup(targetFile);
    }

    // Copy new template
    await fs.copyFile(sourceFile, targetFile);
    return { status: 'updated', backup: backupPath };
  }

  // Create target directory if needed
  await fs.mkdir(path.dirname(targetFile), { recursive: true });

  // Copy template
  await fs.copyFile(sourceFile, targetFile);
  return { status: 'created' };
}

/**
 * Sync all standards templates from package to project
 */
export async function syncStandardsTemplates(
  claudePath: string,
  options: TemplateSyncOptions = {}
): Promise<TemplateSyncResult> {
  const result: TemplateSyncResult = {
    created: [],
    updated: [],
    skipped: [],
    errors: [],
  };

  const packagesTemplatesPath = path.join(getTemplatesPath(), 'docs', 'standards');
  const projectTemplatesPath = path.join(claudePath, 'docs', 'standards');

  // Ensure target directory exists
  await fs.mkdir(projectTemplatesPath, { recursive: true });

  for (const template of STANDARDS_TEMPLATES) {
    try {
      const syncResult = await syncTemplate(
        template,
        packagesTemplatesPath,
        projectTemplatesPath,
        options
      );

      switch (syncResult.status) {
        case 'created':
          result.created.push(template);
          break;
        case 'updated':
          result.updated.push(template);
          break;
        case 'skipped':
          result.skipped.push(template);
          break;
      }
    } catch (error) {
      result.errors.push(`${template}: ${String(error)}`);
    }
  }

  return result;
}

/**
 * Sync standards templates with spinner UI
 */
export async function syncStandardsTemplatesWithSpinner(
  claudePath: string,
  options: TemplateSyncOptions = {}
): Promise<TemplateSyncResult> {
  const spinner = ora('Syncing standards templates...').start();

  try {
    const result = await syncStandardsTemplates(claudePath, options);

    const total = result.created.length + result.updated.length;
    if (total > 0) {
      spinner.succeed(
        `Synced ${total} template${total !== 1 ? 's' : ''} (${result.created.length} created, ${result.updated.length} updated)`
      );
    } else if (result.skipped.length > 0) {
      spinner.info('All templates already up to date');
    } else {
      spinner.warn('No templates to sync');
    }

    return result;
  } catch (error) {
    spinner.fail('Failed to sync templates');
    throw error;
  }
}

/**
 * Check if templates need updating
 */
export async function checkTemplatesNeedUpdate(claudePath: string): Promise<{
  needsUpdate: boolean;
  missing: string[];
  outdated: string[];
}> {
  const projectTemplatesPath = path.join(claudePath, 'docs', 'standards');

  const missing: string[] = [];
  const outdated: string[] = [];

  for (const template of STANDARDS_TEMPLATES) {
    const targetFile = path.join(projectTemplatesPath, template);

    if (!(await fileExists(targetFile))) {
      missing.push(template);
    } else if (!(await hasPlaceholders(targetFile))) {
      outdated.push(template);
    }
  }

  return {
    needsUpdate: missing.length > 0 || outdated.length > 0,
    missing,
    outdated,
  };
}

/**
 * Format sync result for display
 */
export function formatSyncResult(result: TemplateSyncResult): string {
  const lines: string[] = [];

  lines.push('Template Sync Results');
  lines.push('─'.repeat(40));

  if (result.created.length > 0) {
    lines.push(`Created: ${result.created.length}`);
    for (const f of result.created) {
      lines.push(`  ✓ ${f}`);
    }
  }

  if (result.updated.length > 0) {
    lines.push(`Updated: ${result.updated.length}`);
    for (const f of result.updated) {
      lines.push(`  ✓ ${f}`);
    }
  }

  if (result.skipped.length > 0) {
    lines.push(`Skipped (already up to date): ${result.skipped.length}`);
  }

  if (result.errors.length > 0) {
    lines.push(`Errors: ${result.errors.length}`);
    for (const e of result.errors) {
      lines.push(`  ✗ ${e}`);
    }
  }

  return lines.join('\n');
}
