/**
 * Claude Code settings.json generator
 */

import {
  ATTRIBUTION_NO_COAUTHOR,
  ATTRIBUTION_WITH_COAUTHOR,
  BEEP_COMMAND,
  DEFAULT_CLAUDE_SETTINGS,
} from '../../constants/claude-settings-defaults.js';
import type { ClaudeSettingsConfig } from '../../types/claude-settings.js';
import { joinPath, pathExists, writeJson } from '../utils/fs.js';
import { withSpinner } from '../utils/spinner.js';

export interface SettingsGeneratorOptions {
  /** Claude settings configuration */
  claudeSettings?: ClaudeSettingsConfig;
  /** Include co-author in commits */
  includeCoAuthor?: boolean;
  /** Additional permissions to allow */
  additionalAllow?: string[];
  /** Additional permissions to deny */
  additionalDeny?: string[];
  /** Overwrite existing file */
  overwrite?: boolean;
}

export interface SettingsGeneratorResult {
  /** Whether file was created */
  created: boolean;
  /** Whether file was skipped (already exists) */
  skipped: boolean;
  /** Path to the file */
  path: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Generate settings.json file
 */
export async function generateSettings(
  projectPath: string,
  options?: SettingsGeneratorOptions
): Promise<SettingsGeneratorResult> {
  const settingsPath = joinPath(projectPath, '.claude', 'settings.json');

  // Check if file exists
  const exists = await pathExists(settingsPath);
  if (exists && !options?.overwrite) {
    return {
      created: false,
      skipped: true,
      path: settingsPath,
    };
  }

  try {
    const settings = buildSettingsJson(options);
    await writeJson(settingsPath, settings, { spaces: 2 });

    return {
      created: true,
      skipped: false,
      path: settingsPath,
    };
  } catch (error) {
    return {
      created: false,
      skipped: false,
      path: settingsPath,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Generate settings.json with spinner
 */
export async function generateSettingsWithSpinner(
  projectPath: string,
  options?: SettingsGeneratorOptions
): Promise<SettingsGeneratorResult> {
  return withSpinner('Generating settings.json...', () => generateSettings(projectPath, options), {
    successText: 'Created settings.json',
  });
}

/**
 * Generate settings.local.json file
 */
export async function generateSettingsLocal(
  projectPath: string,
  options?: SettingsGeneratorOptions
): Promise<SettingsGeneratorResult> {
  const settingsPath = joinPath(projectPath, '.claude', 'settings.local.json');

  // Check if file exists
  const exists = await pathExists(settingsPath);
  if (exists && !options?.overwrite) {
    return {
      created: false,
      skipped: true,
      path: settingsPath,
    };
  }

  try {
    const settings = buildSettingsLocalJson(options);
    await writeJson(settingsPath, settings, { spaces: 2 });

    return {
      created: true,
      skipped: false,
      path: settingsPath,
    };
  } catch (error) {
    return {
      created: false,
      skipped: false,
      path: settingsPath,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Generate settings.local.json with spinner
 */
export async function generateSettingsLocalWithSpinner(
  projectPath: string,
  options?: SettingsGeneratorOptions
): Promise<SettingsGeneratorResult> {
  return withSpinner(
    'Generating settings.local.json...',
    () => generateSettingsLocal(projectPath, options),
    {
      successText: 'Created settings.local.json',
    }
  );
}

/**
 * Build settings.json content
 */
function buildSettingsJson(options?: SettingsGeneratorOptions): Record<string, unknown> {
  const claudeSettings = options?.claudeSettings || DEFAULT_CLAUDE_SETTINGS;
  const includeCoAuthor = options?.includeCoAuthor ?? true;

  const settings: Record<string, unknown> = {
    $schema: 'https://json.schemastore.org/claude-code-settings.json',
  };

  // Model
  if (claudeSettings.model && claudeSettings.model !== 'default') {
    settings.model = claudeSettings.model;
  }

  // Extended thinking
  if (claudeSettings.alwaysThinkingEnabled) {
    settings.alwaysThinkingEnabled = true;
  }

  // Cleanup period (only if different from default)
  if (claudeSettings.cleanupPeriodDays !== 30) {
    settings.cleanupPeriodDays = claudeSettings.cleanupPeriodDays;
  }

  // Attribution
  settings.attribution = includeCoAuthor ? ATTRIBUTION_WITH_COAUTHOR : ATTRIBUTION_NO_COAUTHOR;

  // Permissions (basic structure - will be extended in settings.local.json)
  settings.permissions = {
    allow: [],
    deny: [],
  };

  // Sandbox
  if (claudeSettings.sandbox?.enabled) {
    settings.sandbox = {
      enabled: true,
      autoAllowBashIfSandboxed: claudeSettings.sandbox.autoAllowBashIfSandboxed ?? true,
    };
  }

  return settings;
}

/**
 * Build settings.local.json content (personal settings, not committed)
 */
function buildSettingsLocalJson(options?: SettingsGeneratorOptions): Record<string, unknown> {
  const claudeSettings = options?.claudeSettings || DEFAULT_CLAUDE_SETTINGS;

  const settings: Record<string, unknown> = {};

  // Permissions
  const allow = [...(options?.additionalAllow || [])];
  const deny = [...(options?.additionalDeny || [])];

  // Add user's existing permissions if provided
  if (claudeSettings.permissions?.allow) {
    allow.push(...claudeSettings.permissions.allow);
  }
  if (claudeSettings.permissions?.deny) {
    deny.push(...claudeSettings.permissions.deny);
  }

  settings.permissions = {
    allow: [...new Set(allow)], // Deduplicate
    deny: [...new Set(deny)],
    ask: claudeSettings.permissions?.ask || [],
    defaultMode: claudeSettings.permissions?.defaultMode || 'acceptEdits',
  };

  // Hooks
  if (claudeSettings.stopNotification && claudeSettings.stopNotification !== 'none') {
    const command =
      claudeSettings.stopNotification === 'custom' && claudeSettings.customStopCommand
        ? claudeSettings.customStopCommand
        : BEEP_COMMAND;

    settings.hooks = {
      Stop: [
        {
          hooks: [
            {
              type: 'command',
              command,
              timeout: 5,
            },
          ],
        },
      ],
      SubagentStop: [
        {
          hooks: [
            {
              type: 'command',
              command,
              timeout: 5,
            },
          ],
        },
      ],
    };
  }

  return settings;
}
