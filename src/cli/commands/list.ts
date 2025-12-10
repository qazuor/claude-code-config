/**
 * List command - list available and installed modules
 */

import { Command } from 'commander';
import {
  BUNDLE_CATEGORY_NAMES,
  getAllBundles,
  getBundlesGroupedByCategory,
} from '../../constants/bundles.js';
import { MCP_SERVERS } from '../../constants/mcp-servers.js';
import { formatBundleForDisplay, resolveBundle } from '../../lib/bundles/resolver.js';
import { readConfig } from '../../lib/config/index.js';
import { loadRegistry } from '../../lib/modules/index.js';
import { resolvePath } from '../../lib/utils/fs.js';
import { colors, logger } from '../../lib/utils/logger.js';
import { getTemplatesPath } from '../../lib/utils/paths.js';
import type { ModuleCategory } from '../../types/modules.js';

interface ListOptions {
  installed?: boolean;
  available?: boolean;
  bundles?: boolean;
  mcp?: boolean;
  verbose?: boolean;
}

/**
 * Create list command
 */
export function createListCommand(): Command {
  const cmd = new Command('list')
    .description('List available modules, bundles, or MCP servers')
    .argument('[type]', 'Type to list (agents|skills|commands|docs|bundles|mcp)')
    .option('-i, --installed', 'Show only installed modules')
    .option('-a, --available', 'Show all available modules')
    .option('--bundles', 'List all bundles')
    .option('--mcp', 'List MCP servers')
    .option('-v, --verbose', 'Show detailed information')
    .action(runList);

  return cmd;
}

/**
 * Run list command
 */
async function runList(type: string | undefined, options: ListOptions): Promise<void> {
  const projectPath = resolvePath('.');

  try {
    // List bundles
    if (options.bundles || type === 'bundles') {
      listBundles(options.verbose);
      return;
    }

    // List MCP servers
    if (options.mcp || type === 'mcp') {
      listMcpServers(options.verbose);
      return;
    }

    // Get templates path (bundled with package)
    const templatesPath = getTemplatesPath();

    // Load registry
    const registry = await loadRegistry(templatesPath);

    // Read current config
    const config = await readConfig(projectPath);

    // Determine what to list
    const categories: ModuleCategory[] = type
      ? [type as ModuleCategory]
      : ['agents', 'skills', 'commands', 'docs'];

    for (const category of categories) {
      if (!registry[category]) continue;

      logger.newline();
      logger.title(capitalize(category));

      const allModules = registry[category];
      const installedIds = config?.modules[category].selected || [];
      const installedSet = new Set(installedIds);

      if (options.installed) {
        // Show only installed
        const installed = allModules.filter((m) => installedSet.has(m.id));
        if (installed.length === 0) {
          logger.info(`No ${category} installed`);
        } else {
          for (const mod of installed) {
            showModule(mod, true, options.verbose);
          }
        }
      } else {
        // Show all with installation status
        for (const mod of allModules) {
          const isInstalled = installedSet.has(mod.id);
          showModule(mod, isInstalled, options.verbose);
        }
      }

      logger.newline();
      logger.info(`Total: ${allModules.length} | Installed: ${installedIds.length}`);
    }
  } catch (error) {
    logger.error(`Failed to list modules: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

/**
 * Show module info
 */
function showModule(
  mod: { id: string; name: string; description?: string; tags?: string[] },
  isInstalled: boolean,
  verbose?: boolean
): void {
  const status = isInstalled ? colors.success('✔') : colors.muted('○');
  const name = isInstalled ? colors.primary(mod.name) : mod.name;

  console.log(`  ${status} ${name} ${colors.muted(`(${mod.id})`)}`);

  if (verbose && mod.description) {
    logger.note(`    ${mod.description}`);
  }

  if (verbose && mod.tags && mod.tags.length > 0) {
    logger.note(`    Tags: ${mod.tags.join(', ')}`);
  }
}

/**
 * List bundles
 */
function listBundles(verbose?: boolean): void {
  logger.title('Available Bundles');
  logger.newline();

  const grouped = getBundlesGroupedByCategory();

  for (const [category, bundles] of Object.entries(grouped)) {
    const categoryName = BUNDLE_CATEGORY_NAMES[category] || category;
    logger.subtitle(categoryName);

    for (const bundle of bundles) {
      console.log(
        `  ${colors.primary(formatBundleForDisplay(bundle))} ${colors.muted(`(${bundle.id})`)}`
      );
      logger.note(`    ${bundle.description}`);

      if (verbose) {
        const resolved = resolveBundle(bundle);

        if (bundle.longDescription) {
          logger.newline();
          logger.note(`    ${bundle.longDescription}`);
        }

        logger.newline();
        logger.info('    Modules:');
        if (resolved.modules.agents.length > 0) {
          logger.note(`      Agents: ${resolved.modules.agents.join(', ')}`);
        }
        if (resolved.modules.skills.length > 0) {
          logger.note(`      Skills: ${resolved.modules.skills.join(', ')}`);
        }
        if (resolved.modules.commands.length > 0) {
          logger.note(`      Commands: ${resolved.modules.commands.join(', ')}`);
        }
        if (resolved.modules.docs.length > 0) {
          logger.note(`      Docs: ${resolved.modules.docs.join(', ')}`);
        }

        if (bundle.techStack && bundle.techStack.length > 0) {
          logger.newline();
          logger.note(`    Tech stack: ${bundle.techStack.join(', ')}`);
        }

        if (bundle.alternativeTo && bundle.alternativeTo.length > 0) {
          logger.note(`    Alternative to: ${bundle.alternativeTo.join(', ')}`);
        }
      }
      logger.newline();
    }
  }

  const allBundles = getAllBundles();
  logger.info(`Total bundles: ${allBundles.length}`);
}

/**
 * List MCP servers
 */
function listMcpServers(verbose?: boolean): void {
  logger.title('Available MCP Servers');
  logger.newline();

  // Group by category
  const byCategory: Record<string, typeof MCP_SERVERS> = {};
  for (const server of MCP_SERVERS) {
    if (!byCategory[server.category]) {
      byCategory[server.category] = [];
    }
    byCategory[server.category].push(server);
  }

  for (const [category, servers] of Object.entries(byCategory)) {
    logger.subtitle(formatCategory(category));

    for (const server of servers) {
      console.log(`  ${colors.primary(server.name)} ${colors.muted(`(${server.id})`)}`);
      logger.note(`    ${server.description}`);

      if (verbose) {
        logger.note(`    Package: ${server.package}`);
        if (server.requiresConfig) {
          logger.note('    Requires config: Yes');
          if (server.configFields) {
            const required = server.configFields.filter((f) => f.required).map((f) => f.name);
            if (required.length > 0) {
              logger.note(`    Required fields: ${required.join(', ')}`);
            }
          }
        }
      }
    }
    logger.newline();
  }
}

/**
 * Format category name
 */
function formatCategory(category: string): string {
  const labels: Record<string, string> = {
    documentation: 'Documentation',
    database: 'Database',
    'version-control': 'Version Control',
    deployment: 'Deployment',
    infrastructure: 'Infrastructure',
    'project-mgmt': 'Project Management',
    monitoring: 'Monitoring',
  };
  return labels[category] || category;
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
