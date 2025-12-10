/**
 * Remove command - remove modules from configuration
 */

import { confirm } from '@inquirer/prompts';
import { Command } from 'commander';
import { readConfig, removeModulesFromConfig, updateConfig } from '../../lib/config/index.js';
import { checkRemovalImpact, getModule, loadRegistry } from '../../lib/modules/index.js';
import { uninstallModule } from '../../lib/modules/installer.js';
import { resolvePath } from '../../lib/utils/fs.js';
import { colors, logger } from '../../lib/utils/logger.js';
import { getTemplatesPath } from '../../lib/utils/paths.js';
import type { ModuleCategory } from '../../types/modules.js';

interface RemoveOptions {
  force?: boolean;
  keepFiles?: boolean;
  verbose?: boolean;
}

/**
 * Create remove command
 */
export function createRemoveCommand(): Command {
  const cmd = new Command('remove')
    .description('Remove a module from the configuration')
    .argument('<module>', 'Module to remove (format: type:id, e.g., agents:tech-lead)')
    .option('-f, --force', 'Remove without confirmation')
    .option('--keep-files', 'Keep module files, only remove from config')
    .option('-v, --verbose', 'Detailed output')
    .action(runRemove);

  return cmd;
}

/**
 * Run remove command
 */
async function runRemove(moduleSpec: string, options: RemoveOptions): Promise<void> {
  const projectPath = resolvePath('.');

  try {
    // Parse module spec
    const [category, moduleId] = parseModuleSpec(moduleSpec);

    if (!category || !moduleId) {
      logger.error('Invalid module format. Use: type:id (e.g., agents:tech-lead)');
      logger.info('Valid types: agents, skills, commands, docs');
      process.exit(1);
    }

    // Read current config
    const config = await readConfig(projectPath);
    if (!config) {
      logger.error('No Claude configuration found. Run "claude-config init" first.');
      process.exit(1);
    }

    // Check if installed
    const isInstalled = config.modules[category].selected.includes(moduleId);
    if (!isInstalled) {
      logger.warn(`Module ${moduleSpec} is not installed`);
      return;
    }

    // Load registry for module info
    const templatesPath = getTemplatesPath();
    const registry = await loadRegistry(templatesPath);
    const module = getModule(registry, category, moduleId);

    // Check for dependents
    const impact = checkRemovalImpact(
      registry,
      category,
      moduleId,
      config.modules[category].selected
    );

    if (!impact.canRemove) {
      logger.warn(`Cannot remove ${moduleSpec}. The following modules depend on it:`);
      for (const dep of impact.blockedBy) {
        logger.item(dep);
      }

      if (!options.force) {
        const forceRemove = await confirm({
          message: 'Remove anyway? (dependent modules may break)',
          default: false,
        });
        if (!forceRemove) {
          return;
        }
      }
    }

    // Confirm removal
    if (!options.force) {
      const moduleName = module?.name || moduleId;
      const confirmed = await confirm({
        message: `Remove ${colors.primary(moduleName)}?`,
        default: false,
      });
      if (!confirmed) {
        return;
      }
    }

    // Remove file unless --keep-files
    if (!options.keepFiles) {
      const result = await uninstallModule(category, moduleId, projectPath);
      if (!result.success) {
        logger.warn(`Could not remove file: ${result.error}`);
      }
    }

    // Update config
    const updatedConfig = removeModulesFromConfig(config, category, [moduleId]);
    await updateConfig(projectPath, updatedConfig);

    logger.success(`Removed ${colors.primary(module?.name || moduleId)}`);

    if (options.keepFiles) {
      logger.info('Files were kept. Module removed from configuration only.');
    }
  } catch (error) {
    logger.error(`Failed to remove module: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

/**
 * Parse module specification
 */
function parseModuleSpec(spec: string): [ModuleCategory | null, string | null] {
  const parts = spec.split(':');

  if (parts.length !== 2) {
    return [null, null];
  }

  const [type, id] = parts;
  const validTypes: ModuleCategory[] = ['agents', 'skills', 'commands', 'docs'];

  if (!validTypes.includes(type as ModuleCategory)) {
    return [null, null];
  }

  return [type as ModuleCategory, id];
}
