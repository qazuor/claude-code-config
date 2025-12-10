/**
 * Update command - update configuration and modules
 */

import { Command } from 'commander';
import { readConfig, updateConfig } from '../../lib/config/index.js';
import { installHooks } from '../../lib/hooks/index.js';
import { installMcpServers } from '../../lib/mcp/index.js';
import { filterModules, getModule, loadRegistry } from '../../lib/modules/index.js';
import { getInstalledModules, installModules } from '../../lib/modules/installer.js';
import { installPermissions } from '../../lib/permissions/index.js';
import { replacePlaceholders } from '../../lib/placeholders/index.js';
import { resolvePath } from '../../lib/utils/fs.js';
import { logger } from '../../lib/utils/logger.js';
import { getTemplatesPath } from '../../lib/utils/paths.js';
import type { ModuleCategory } from '../../types/modules.js';
import {
  promptHookConfig,
  promptMcpConfig,
  promptPermissionsConfig,
  promptPreferences,
  showSkippedMcpInstructions,
} from '../prompts/index.js';
import {
  type ModuleUpdate,
  promptConflictResolution,
  promptNewModules,
  promptReconfigureOptions,
  promptUpdateAction,
  promptUpdatedModules,
  showUpdateReport,
} from '../prompts/update.js';

interface UpdateOptions {
  check?: boolean;
  modules?: boolean;
  config?: boolean;
  all?: boolean;
  force?: boolean;
  interactive?: boolean;
  verbose?: boolean;
}

/**
 * Create update command
 */
export function createUpdateCommand(): Command {
  const cmd = new Command('update')
    .description('Update configuration and modules')
    .option('--check', 'Only check for updates')
    .option('--modules', 'Update only modules')
    .option('--config', 'Reconfigure settings')
    .option('--all', 'Update everything')
    .option('-f, --force', 'Overwrite files without asking')
    .option('-i, --interactive', 'Ask for each change')
    .option('-v, --verbose', 'Detailed output')
    .action(runUpdate);

  return cmd;
}

/**
 * Run update command
 */
async function runUpdate(options: UpdateOptions): Promise<void> {
  const projectPath = resolvePath('.');

  try {
    // Read current config
    const config = await readConfig(projectPath);
    if (!config) {
      logger.error('No Claude configuration found. Run "claude-config init" first.');
      process.exit(1);
    }

    // Load registry
    const templatesPath = getTemplatesPath();
    const registry = await loadRegistry(templatesPath);

    // Determine action
    let action = options.check
      ? 'check'
      : options.modules
        ? 'modules'
        : options.config
          ? 'config'
          : options.all
            ? 'all'
            : null;

    if (!action) {
      const result = await promptUpdateAction();
      if (result === 'cancel') {
        return;
      }
      action = result;
    }

    // Check for updates
    const updates = await detectUpdates(registry, config, projectPath);

    if (action === 'check') {
      showUpdateReport(updates);
      return;
    }

    // Show update report
    showUpdateReport(updates);

    // Handle module updates
    if (action === 'modules' || action === 'all') {
      await handleModuleUpdates(projectPath, config, registry, updates, options);
    }

    // Handle configuration updates
    if (action === 'config' || action === 'all') {
      await handleConfigUpdates(projectPath, config, options);
    }
  } catch (error) {
    logger.error(`Update failed: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

/**
 * Detect updates
 */
async function detectUpdates(
  registry: Awaited<ReturnType<typeof loadRegistry>>,
  config: Awaited<ReturnType<typeof readConfig>>,
  projectPath: string
): Promise<{
  new: ModuleUpdate[];
  updated: ModuleUpdate[];
  deprecated: ModuleUpdate[];
  conflicts: ModuleUpdate[];
}> {
  const result = {
    new: [] as ModuleUpdate[],
    updated: [] as ModuleUpdate[],
    deprecated: [] as ModuleUpdate[],
    conflicts: [] as ModuleUpdate[],
  };

  if (!config) return result;

  const categories: ModuleCategory[] = ['agents', 'skills', 'commands', 'docs'];

  for (const category of categories) {
    const installed = config.modules[category].selected;
    const installedSet = new Set(installed);
    const available = registry[category];

    // Find new modules
    for (const mod of available) {
      if (!installedSet.has(mod.id)) {
        result.new.push({
          id: mod.id,
          name: mod.name,
          category,
          type: 'new',
        });
      }
    }

    // Find updated/deprecated (would need version tracking)
    // For now, just check if files exist
    await getInstalledModules(category, projectPath);

    for (const id of installed) {
      const mod = available.find((m) => m.id === id);
      if (!mod) {
        // Module was removed from registry
        result.deprecated.push({
          id,
          name: id,
          category,
          type: 'deprecated',
        });
      }
    }
  }

  return result;
}

/**
 * Handle module updates
 */
async function handleModuleUpdates(
  projectPath: string,
  config: NonNullable<Awaited<ReturnType<typeof readConfig>>>,
  registry: Awaited<ReturnType<typeof loadRegistry>>,
  updates: Awaited<ReturnType<typeof detectUpdates>>,
  options: UpdateOptions
): Promise<void> {
  const templatesPath = getTemplatesPath();

  // Handle new modules
  if (updates.new.length > 0) {
    logger.newline();
    const newIds = options.interactive ? await promptNewModules(updates.new) : [];

    if (newIds.length > 0) {
      // Group by category
      const byCategory: Record<ModuleCategory, string[]> = {
        agents: [],
        skills: [],
        commands: [],
        docs: [],
      };

      for (const update of updates.new) {
        if (newIds.includes(update.id)) {
          byCategory[update.category as ModuleCategory].push(update.id);
        }
      }

      // Install new modules
      for (const [category, ids] of Object.entries(byCategory)) {
        if (ids.length === 0) continue;

        const modules = filterModules(registry, category as ModuleCategory, ids);
        await installModules(category as ModuleCategory, modules, {
          templatesPath,
          targetPath: projectPath,
          overwrite: false,
        });

        // Update config
        config.modules[category as ModuleCategory].selected.push(...ids);
      }
    }
  }

  // Handle updated modules
  if (updates.updated.length > 0 && options.interactive) {
    const updateIds = await promptUpdatedModules(updates.updated);

    for (const id of updateIds) {
      const update = updates.updated.find((u) => u.id === id);
      if (!update) continue;

      // Handle conflicts
      if (update.hasLocalChanges && !options.force) {
        const resolution = await promptConflictResolution(update);

        if (resolution === 'keep') continue;
        if (resolution === 'diff') {
          logger.info('Diff display not implemented yet');
          continue;
        }
      }

      // Update module
      const mod = getModule(registry, update.category as ModuleCategory, id);
      if (mod) {
        await installModules(update.category as ModuleCategory, [mod], {
          templatesPath,
          targetPath: projectPath,
          overwrite: true,
        });
      }
    }
  }

  // Replace placeholders in updated files
  const claudePath = resolvePath(projectPath, '.claude');
  await replacePlaceholders(claudePath, config.project, { silent: !options.verbose });

  // Save config
  config.customizations.lastUpdated = new Date().toISOString();
  await updateConfig(projectPath, config);
}

/**
 * Handle configuration updates
 */
async function handleConfigUpdates(
  projectPath: string,
  config: NonNullable<Awaited<ReturnType<typeof readConfig>>>,
  _options: UpdateOptions
): Promise<void> {
  const reconfigureOptions = await promptReconfigureOptions();

  if (reconfigureOptions.includes('preferences')) {
    const preferences = await promptPreferences({
      defaults: config.preferences,
    });
    config.preferences = preferences;
  }

  if (reconfigureOptions.includes('hooks')) {
    const hookConfig = await promptHookConfig({
      defaults: config.extras.hooks,
    });
    config.extras.hooks = hookConfig;
    await installHooks(projectPath, hookConfig);
  }

  if (reconfigureOptions.includes('mcp')) {
    const mcpResult = await promptMcpConfig({
      defaults: config.mcp,
    });
    config.mcp = mcpResult.config;
    await installMcpServers(projectPath, mcpResult.config);

    // Show instructions for skipped configurations
    if (mcpResult.skippedConfigs.length > 0) {
      showSkippedMcpInstructions(mcpResult.skippedConfigs, mcpResult.config.level);
    }
  }

  if (reconfigureOptions.includes('permissions')) {
    const permissionsConfig = await promptPermissionsConfig();
    config.customizations.permissions = permissionsConfig;
    await installPermissions(projectPath, permissionsConfig, 'project');
  }

  // Save config
  config.customizations.lastUpdated = new Date().toISOString();
  await updateConfig(projectPath, config);

  logger.success('Configuration updated');
}
