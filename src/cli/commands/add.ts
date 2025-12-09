/**
 * Add command - add modules to configuration
 */

import { confirm } from '@inquirer/prompts';
import { Command } from 'commander';
import { addModulesToConfig, readConfig, updateConfig } from '../../lib/config/index.js';
import { getModule, loadRegistry, resolveModules } from '../../lib/modules/index.js';
import { installModules, isModuleInstalled } from '../../lib/modules/installer.js';
import { replacePlaceholders } from '../../lib/placeholders/index.js';
import { joinPath, resolvePath } from '../../lib/utils/fs.js';
import { colors, logger } from '../../lib/utils/logger.js';
import type { ModuleCategory } from '../../types/modules.js';

interface AddOptions {
  force?: boolean;
  noDeps?: boolean;
  verbose?: boolean;
}

/**
 * Create add command
 */
export function createAddCommand(): Command {
  const cmd = new Command('add')
    .description('Add a module to the configuration')
    .argument('<module>', 'Module to add (format: type:id, e.g., agents:tech-lead)')
    .option('-f, --force', 'Overwrite if already installed')
    .option('--no-deps', 'Skip dependency installation')
    .option('-v, --verbose', 'Detailed output')
    .action(runAdd);

  return cmd;
}

/**
 * Run add command
 */
async function runAdd(moduleSpec: string, options: AddOptions): Promise<void> {
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

    // Load registry
    const templatesPath = resolvePath(process.cwd(), 'templates');
    const registry = await loadRegistry(templatesPath);

    // Find module
    const module = getModule(registry, category, moduleId);
    if (!module) {
      logger.error(`Module not found: ${moduleSpec}`);
      logger.info(`Run "claude-config list ${category}" to see available modules`);
      process.exit(1);
    }

    // Check if already installed
    const alreadyInstalled = config.modules[category].selected.includes(moduleId);
    if (alreadyInstalled && !options.force) {
      logger.warn(`Module ${colors.primary(module.name)} is already installed`);
      const overwrite = await confirm({
        message: 'Reinstall anyway?',
        default: false,
      });
      if (!overwrite) {
        return;
      }
    }

    // Resolve dependencies
    const modulesToInstall = [moduleId];
    if (!options.noDeps && module.dependencies && module.dependencies.length > 0) {
      const resolution = resolveModules(registry, category, [moduleId]);

      if (resolution.unresolved.length > 0) {
        logger.warn(`Some dependencies not found: ${resolution.unresolved.join(', ')}`);
      }

      // Add dependencies that aren't installed
      for (const dep of resolution.resolved) {
        if (dep.id !== moduleId && !config.modules[category].selected.includes(dep.id)) {
          modulesToInstall.push(dep.id);
        }
      }

      if (modulesToInstall.length > 1) {
        logger.info(`Will also install dependencies: ${modulesToInstall.slice(1).join(', ')}`);
        const proceed = await confirm({
          message: 'Continue?',
          default: true,
        });
        if (!proceed) {
          return;
        }
      }
    }

    // Install modules
    logger.newline();
    const moduleDefs = modulesToInstall
      .map((id) => getModule(registry, category, id))
      .filter(Boolean) as (typeof module)[];

    const result = await installModules(category, moduleDefs, {
      templatesPath,
      targetPath: projectPath,
      overwrite: options.force,
    });

    // Update config
    const updatedConfig = addModulesToConfig(config, category, modulesToInstall);
    await updateConfig(projectPath, updatedConfig);

    // Replace placeholders in new files
    const claudePath = joinPath(projectPath, '.claude');
    await replacePlaceholders(claudePath, config.project, {
      silent: !options.verbose,
    });

    // Show results
    if (result.installed.length > 0) {
      logger.success(`Installed: ${result.installed.join(', ')}`);
    }
    if (result.skipped.length > 0) {
      logger.info(`Skipped (already exists): ${result.skipped.join(', ')}`);
    }
    if (result.failed.length > 0) {
      logger.error(`Failed: ${result.failed.map((f) => `${f.id} (${f.error})`).join(', ')}`);
    }
  } catch (error) {
    logger.error(`Failed to add module: ${error instanceof Error ? error.message : error}`);
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
