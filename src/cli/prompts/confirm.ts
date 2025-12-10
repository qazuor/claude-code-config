/**
 * General confirmation prompts
 */

import { colors, logger } from '../../lib/utils/logger.js';
import { confirm, input, select } from '../../lib/utils/prompt-cancel.js';
import type { ClaudeConfig } from '../../types/config.js';

/**
 * Confirm overwrite of existing configuration
 */
export async function confirmOverwrite(existingPath: string): Promise<boolean> {
  logger.warn(`Existing configuration found at ${existingPath}`);

  return confirm({
    message: 'Do you want to overwrite the existing configuration?',
    default: false,
  });
}

/**
 * Prompt for action when existing project detected
 */
export async function promptExistingProjectAction(): Promise<'skip' | 'overwrite' | 'merge'> {
  return select({
    message: 'Existing .claude/ folder detected. What would you like to do?',
    choices: [
      {
        name: 'Skip (keep existing)',
        value: 'skip' as const,
        description: 'Do not modify existing configuration',
      },
      {
        name: 'Overwrite',
        value: 'overwrite' as const,
        description: 'Replace existing configuration',
      },
      {
        name: 'Merge',
        value: 'merge' as const,
        description: 'Add new items, keep existing',
      },
    ],
    default: 'skip',
  });
}

/**
 * Show final configuration summary
 */
export function showFinalSummary(config: ClaudeConfig): void {
  logger.newline();
  logger.title('Configuration Summary');

  // Project info
  logger.subtitle('Project');
  logger.keyValue('Name', config.project.name);
  logger.keyValue('GitHub', `${config.project.org}/${config.project.repo}`);
  if (config.project.domain) {
    logger.keyValue('Domain', config.project.domain);
  }

  // Preferences
  logger.newline();
  logger.subtitle('Preferences');
  logger.keyValue('Language', config.preferences.language === 'en' ? 'English' : 'Español');
  logger.keyValue('Co-author', config.preferences.includeCoAuthor ? 'Yes' : 'No');

  // Modules
  logger.newline();
  logger.subtitle('Modules');

  const moduleCategories = ['agents', 'skills', 'commands', 'docs'] as const;
  for (const category of moduleCategories) {
    const selected = config.modules[category].selected;
    if (selected.length > 0) {
      logger.keyValue(capitalize(category), `${selected.length} selected`);
      logger.note(selected.join(', '));
    }
  }

  // Extras
  logger.newline();
  logger.subtitle('Extras');
  const extras: string[] = [];
  if (config.extras.schemas) extras.push('schemas');
  if (config.extras.scripts) extras.push('scripts');
  if (config.extras.hooks.enabled) extras.push('hooks');
  if (config.extras.sessions) extras.push('sessions');
  logger.keyValue('Included', extras.join(', ') || 'none');

  // Code Style
  if (config.extras.codeStyle?.enabled) {
    const codeStyleTools: string[] = [];
    if (config.extras.codeStyle.editorconfig) codeStyleTools.push('EditorConfig');
    if (config.extras.codeStyle.commitlint) codeStyleTools.push('Commitlint');
    if (config.extras.codeStyle.biome) codeStyleTools.push('Biome');
    if (config.extras.codeStyle.prettier) codeStyleTools.push('Prettier');
    logger.keyValue('Code Style', codeStyleTools.join(', '));
  }

  // MCP
  if (config.mcp.servers.length > 0) {
    logger.newline();
    logger.subtitle('MCP Servers');
    logger.keyValue('Level', config.mcp.level);
    logger.keyValue('Servers', config.mcp.servers.map((s) => s.serverId).join(', '));
  }

  // Scaffold
  logger.newline();
  logger.subtitle('Scaffold');
  logger.keyValue(
    'Type',
    config.scaffold.type === 'claude-only' ? 'Claude config only' : 'Full project'
  );
}

/**
 * Confirm final configuration
 */
export async function confirmFinalConfiguration(config: ClaudeConfig): Promise<boolean> {
  showFinalSummary(config);
  logger.newline();

  return confirm({
    message: 'Proceed with this configuration?',
    default: true,
  });
}

/**
 * Confirm destructive action
 */
export async function confirmDestructiveAction(action: string): Promise<boolean> {
  logger.warn(`⚠️  This action is destructive: ${action}`);

  const firstConfirm = await confirm({
    message: 'Are you sure you want to proceed?',
    default: false,
  });

  if (!firstConfirm) return false;

  const typeConfirm = await input({
    message: 'Type "yes" to confirm:',
  });

  return typeConfirm.toLowerCase() === 'yes';
}

/**
 * Show post-installation instructions
 */
export function showPostInstallInstructions(config: ClaudeConfig): void {
  logger.newline();
  logger.title('Installation Complete!');

  const steps: string[] = [];

  // Git steps
  if (config.scaffold.type === 'full-project') {
    steps.push('Review the generated project structure');
  }

  steps.push('Review .claude/CLAUDE.md for agent instructions');
  steps.push('Customize agents, commands, and skills as needed');

  // MCP steps
  if (config.mcp.servers.length > 0) {
    const mcpFile =
      config.mcp.level === 'user' ? '~/.claude/settings.json' : '.claude/settings.local.json';
    steps.push(`Configure MCP server credentials in ${mcpFile}`);
  }

  // Hook steps
  if (config.extras.hooks.enabled) {
    steps.push('Review hook scripts in .claude/hooks/');
    if (config.extras.hooks.notification?.audio) {
      steps.push('Install Piper TTS for audio notifications (see docs)');
    }
  }

  logger.instructions('Next Steps:', steps);

  // Show useful commands
  logger.subtitle('Useful Commands');
  logger.raw('');
  logger.raw(`  ${colors.primary('claude-config status')}     - Show current configuration`);
  logger.raw(`  ${colors.primary('claude-config list')}       - List available modules`);
  logger.raw(`  ${colors.primary('claude-config add')}        - Add a module`);
  logger.raw(`  ${colors.primary('claude-config update')}     - Update configuration`);
  logger.raw('');
}

/**
 * Show dependency installation instructions
 */
export function showDependencyInstructions(
  dependencies: Array<{ name: string; instructions: string[] }>
): void {
  if (dependencies.length === 0) return;

  logger.newline();
  logger.title('Required Dependencies');
  logger.info('Some features require additional system dependencies:');

  for (const dep of dependencies) {
    logger.newline();
    logger.subtitle(dep.name);
    for (const instruction of dep.instructions) {
      logger.raw(`  ${instruction}`);
    }
  }
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
