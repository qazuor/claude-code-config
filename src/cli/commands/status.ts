/**
 * Status command - show current configuration status
 */

import { Command } from 'commander';
import { hasClaudeDir, readConfig } from '../../lib/config/index.js';
import { getHooksStatus } from '../../lib/hooks/index.js';
import { getInstalledMcpServers } from '../../lib/mcp/index.js';
import { getCurrentPermissions } from '../../lib/permissions/index.js';
import { resolvePath } from '../../lib/utils/fs.js';
import { colors, logger } from '../../lib/utils/logger.js';

interface StatusOptions {
  json?: boolean;
  verbose?: boolean;
}

/**
 * Create status command
 */
export function createStatusCommand(): Command {
  const cmd = new Command('status')
    .description('Show current Claude configuration status')
    .option('--json', 'Output as JSON')
    .option('-v, --verbose', 'Show detailed information')
    .action(runStatus);

  return cmd;
}

/**
 * Run status command
 */
async function runStatus(options: StatusOptions): Promise<void> {
  const projectPath = resolvePath('.');

  try {
    // Check for .claude directory
    if (!(await hasClaudeDir(projectPath))) {
      logger.warn('No Claude configuration found in this directory');
      logger.info('Run "claude-config init" to initialize');
      process.exit(0);
    }

    // Read config
    const config = await readConfig(projectPath);

    if (!config) {
      logger.warn('.claude directory exists but qazuor-claude-config.json is missing');
      logger.info('Run "claude-config init" to initialize properly');
      process.exit(0);
    }

    // Get additional status info
    const hooksStatus = await getHooksStatus(projectPath);
    const mcpServers = await getInstalledMcpServers(projectPath);
    const permissions = await getCurrentPermissions(projectPath);

    if (options.json) {
      const status = {
        version: config.version,
        project: config.project,
        preferences: config.preferences,
        modules: {
          agents: config.modules.agents.selected,
          skills: config.modules.skills.selected,
          commands: config.modules.commands.selected,
          docs: config.modules.docs.selected,
        },
        extras: {
          schemas: config.extras.schemas,
          scripts: config.extras.scripts,
          hooks: hooksStatus,
          sessions: config.extras.sessions,
        },
        mcp: {
          level: config.mcp.level,
          project: mcpServers.project,
          user: mcpServers.user,
        },
        permissions: {
          project: permissions.project,
          user: permissions.user,
        },
        scaffold: config.scaffold,
        lastUpdated: config.customizations.lastUpdated,
      };
      console.log(JSON.stringify(status, null, 2));
      return;
    }

    // Display status
    logger.title('Claude Configuration Status');

    // Project info
    logger.newline();
    logger.subtitle('Project');
    logger.keyValue('Name', config.project.name);
    logger.keyValue('Description', config.project.description);
    logger.keyValue('GitHub', `${config.project.org}/${config.project.repo}`);
    if (config.project.domain) {
      logger.keyValue('Domain', config.project.domain);
    }
    logger.keyValue('Entity', `${config.project.entityType} / ${config.project.entityTypePlural}`);

    // Preferences
    logger.newline();
    logger.subtitle('Preferences');
    logger.keyValue('Language', config.preferences.language === 'en' ? 'English' : 'Español');
    logger.keyValue(
      'Response Language',
      config.preferences.responseLanguage === 'en' ? 'English' : 'Español'
    );
    logger.keyValue('Co-author', config.preferences.includeCoAuthor ? 'Yes' : 'No');

    // Modules
    logger.newline();
    logger.subtitle('Modules');
    showModuleStatus('Agents', config.modules.agents.selected, options.verbose);
    showModuleStatus('Skills', config.modules.skills.selected, options.verbose);
    showModuleStatus('Commands', config.modules.commands.selected, options.verbose);
    showModuleStatus('Docs', config.modules.docs.selected, options.verbose);

    // Extras
    logger.newline();
    logger.subtitle('Extras');
    logger.keyValue(
      'Schemas',
      config.extras.schemas ? colors.success('enabled') : colors.muted('disabled')
    );
    logger.keyValue(
      'Scripts',
      config.extras.scripts ? colors.success('enabled') : colors.muted('disabled')
    );
    logger.keyValue(
      'Sessions',
      config.extras.sessions ? colors.success('enabled') : colors.muted('disabled')
    );

    // Hooks
    logger.newline();
    logger.keyValue(
      'Hooks',
      hooksStatus.enabled ? colors.success('enabled') : colors.muted('disabled')
    );
    if (hooksStatus.enabled && options.verbose) {
      for (const hook of hooksStatus.hooks) {
        if (hook.exists) {
          const status = hook.executable ? colors.success('✔') : colors.warning('⚠ not executable');
          logger.item(`${hook.name}: ${status}`, 1);
        }
      }
    }

    // MCP Servers
    logger.newline();
    logger.subtitle('MCP Servers');
    logger.keyValue('Level', config.mcp.level);

    if (mcpServers.project.length > 0) {
      logger.keyValue('Project', mcpServers.project.join(', '));
    }
    if (mcpServers.user.length > 0) {
      logger.keyValue('User', mcpServers.user.join(', '));
    }
    if (mcpServers.project.length === 0 && mcpServers.user.length === 0) {
      logger.info('No MCP servers configured');
    }

    // Permissions
    if (options.verbose && (permissions.project || permissions.user)) {
      logger.newline();
      logger.subtitle('Permissions');
      if (permissions.project?.allow) {
        logger.keyValue('Project Allow', `${permissions.project.allow.length} rules`);
      }
      if (permissions.project?.deny) {
        logger.keyValue('Project Deny', `${permissions.project.deny.length} rules`);
      }
      if (permissions.user?.allow) {
        logger.keyValue('User Allow', `${permissions.user.allow.length} rules`);
      }
      if (permissions.user?.deny) {
        logger.keyValue('User Deny', `${permissions.user.deny.length} rules`);
      }
    }

    // Meta
    logger.newline();
    logger.subtitle('Configuration');
    logger.keyValue('Version', config.version);
    logger.keyValue('Template', config.templateSource.type);
    logger.keyValue('Last Updated', formatDate(config.customizations.lastUpdated));
    logger.keyValue(
      'Placeholders',
      config.customizations.placeholdersReplaced ? 'Replaced' : 'Not replaced'
    );

    if (config.customizations.customFiles.length > 0) {
      logger.keyValue('Custom Files', String(config.customizations.customFiles.length));
      if (options.verbose) {
        for (const file of config.customizations.customFiles) {
          logger.item(file, 1);
        }
      }
    }
  } catch (error) {
    logger.error(`Failed to get status: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

/**
 * Show module status
 */
function showModuleStatus(label: string, modules: string[], verbose?: boolean): void {
  const count = modules.length;
  const status = count > 0 ? colors.success(`${count} installed`) : colors.muted('none');
  logger.keyValue(label, status);

  if (verbose && count > 0) {
    logger.note(`  ${modules.join(', ')}`);
  }
}

/**
 * Format date
 */
function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  } catch {
    return isoString;
  }
}
