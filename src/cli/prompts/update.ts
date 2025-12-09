/**
 * Update prompts
 */

import { checkbox, confirm, select } from '@inquirer/prompts';
import { colors, logger } from '../../lib/utils/logger.js';

export type UpdateAction = 'check' | 'modules' | 'config' | 'all' | 'cancel';

export interface ModuleUpdate {
  id: string;
  name: string;
  category: string;
  type: 'new' | 'updated' | 'deprecated';
  hasLocalChanges?: boolean;
}

export type ConflictResolution = 'keep' | 'update' | 'merge' | 'diff';

/**
 * Prompt for update action
 */
export async function promptUpdateAction(): Promise<UpdateAction> {
  logger.subtitle('Update Options');

  return select({
    message: 'What would you like to update?',
    choices: [
      {
        name: 'Check for updates',
        value: 'check' as const,
        description: 'Show what has changed without modifying files',
      },
      {
        name: 'Update modules only',
        value: 'modules' as const,
        description: 'Update agents, skills, commands, docs',
      },
      {
        name: 'Reconfigure settings',
        value: 'config' as const,
        description: 'Re-run configuration for MCP, hooks, preferences',
      },
      {
        name: 'Full update',
        value: 'all' as const,
        description: 'Update everything',
      },
      {
        name: 'Cancel',
        value: 'cancel' as const,
      },
    ],
    default: 'check',
  });
}

/**
 * Show update report
 */
export function showUpdateReport(updates: {
  new: ModuleUpdate[];
  updated: ModuleUpdate[];
  deprecated: ModuleUpdate[];
  conflicts: ModuleUpdate[];
}): void {
  logger.newline();
  logger.title('Update Report');

  if (updates.new.length === 0 && updates.updated.length === 0 && updates.deprecated.length === 0) {
    logger.success('Everything is up to date!');
    return;
  }

  if (updates.new.length > 0) {
    logger.newline();
    logger.info(colors.bold(`✚ New modules available (${updates.new.length}):`));
    for (const mod of updates.new) {
      logger.item(`${mod.category}: ${colors.primary(mod.name)}`);
    }
  }

  if (updates.updated.length > 0) {
    logger.newline();
    logger.info(colors.bold(`↻ Updated modules (${updates.updated.length}):`));
    for (const mod of updates.updated) {
      const conflict = mod.hasLocalChanges ? colors.warning(' (local changes)') : '';
      logger.item(`${mod.category}: ${colors.primary(mod.name)}${conflict}`);
    }
  }

  if (updates.deprecated.length > 0) {
    logger.newline();
    logger.info(colors.bold(`✗ Deprecated modules (${updates.deprecated.length}):`));
    for (const mod of updates.deprecated) {
      logger.item(`${mod.category}: ${colors.muted(mod.name)}`);
    }
  }

  if (updates.conflicts.length > 0) {
    logger.newline();
    logger.warn(`⚠ Modules with conflicts (${updates.conflicts.length}):`);
    for (const mod of updates.conflicts) {
      logger.item(`${mod.category}: ${colors.warning(mod.name)} - has local modifications`);
    }
  }
}

/**
 * Prompt for new module installation
 */
export async function promptNewModules(modules: ModuleUpdate[]): Promise<string[]> {
  if (modules.length === 0) return [];

  logger.newline();
  const choices = modules.map((mod) => ({
    name: `${mod.category}: ${mod.name}`,
    value: mod.id,
    checked: false,
  }));

  return checkbox({
    message: 'Select new modules to install:',
    choices,
  });
}

/**
 * Prompt for updating existing modules
 */
export async function promptUpdatedModules(modules: ModuleUpdate[]): Promise<string[]> {
  if (modules.length === 0) return [];

  logger.newline();
  const choices = modules.map((mod) => ({
    name: `${mod.category}: ${mod.name}${mod.hasLocalChanges ? ' ⚠️' : ''}`,
    value: mod.id,
    checked: !mod.hasLocalChanges, // Don't check by default if has local changes
  }));

  return checkbox({
    message: 'Select modules to update:',
    choices,
  });
}

/**
 * Prompt for conflict resolution
 */
export async function promptConflictResolution(module: ModuleUpdate): Promise<ConflictResolution> {
  logger.newline();
  logger.warn(`Conflict: ${module.category}/${module.name} has local modifications`);

  return select({
    message: 'How do you want to resolve this conflict?',
    choices: [
      {
        name: 'Keep local version',
        value: 'keep' as const,
        description: 'Do not update this module',
      },
      {
        name: 'Use updated version',
        value: 'update' as const,
        description: 'Replace with new version (lose local changes)',
      },
      {
        name: 'Show diff',
        value: 'diff' as const,
        description: 'See what changed before deciding',
      },
    ],
    default: 'keep',
  });
}

/**
 * Prompt for reconfiguration options
 */
export async function promptReconfigureOptions(): Promise<string[]> {
  logger.newline();

  return checkbox({
    message: 'What would you like to reconfigure?',
    choices: [
      { name: 'MCP servers', value: 'mcp', checked: false },
      { name: 'Hooks', value: 'hooks', checked: false },
      { name: 'Preferences (language, co-author)', value: 'preferences', checked: false },
      { name: 'Permissions', value: 'permissions', checked: false },
      { name: 'Add/remove modules', value: 'modules', checked: false },
    ],
  });
}

/**
 * Confirm update
 */
export async function confirmUpdate(summary: {
  newModules: number;
  updatedModules: number;
  removedModules: number;
  reconfigurations: string[];
}): Promise<boolean> {
  logger.newline();
  logger.subtitle('Update Summary');

  if (summary.newModules > 0) {
    logger.keyValue('New modules', String(summary.newModules));
  }
  if (summary.updatedModules > 0) {
    logger.keyValue('Updated modules', String(summary.updatedModules));
  }
  if (summary.removedModules > 0) {
    logger.keyValue('Removed modules', String(summary.removedModules));
  }
  if (summary.reconfigurations.length > 0) {
    logger.keyValue('Reconfigured', summary.reconfigurations.join(', '));
  }

  logger.newline();

  return confirm({
    message: 'Apply these updates?',
    default: true,
  });
}

/**
 * Prompt to create backup before update
 */
export async function promptBackup(): Promise<boolean> {
  return confirm({
    message: 'Create backup before updating?',
    default: true,
  });
}
