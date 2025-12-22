/**
 * Claude Code settings prompts
 */

import {
  BEEP_COMMAND,
  CLAUDE_SETTINGS_PRESETS,
  DEFAULT_CLAUDE_SETTINGS,
  MODEL_DESCRIPTIONS,
  PERMISSION_MODE_DESCRIPTIONS,
  PRESET_DESCRIPTIONS,
  STOP_NOTIFICATION_DESCRIPTIONS,
} from '../../constants/claude-settings-defaults.js';
import { logger } from '../../lib/utils/logger.js';
import { confirm, input, select } from '../../lib/utils/prompt-cancel.js';
import type {
  ClaudeModel,
  ClaudeSettingsConfig,
  PermissionMode,
  StopNotificationType,
} from '../../types/claude-settings.js';

interface ClaudeSettingsOptions {
  defaults?: Partial<ClaudeSettingsConfig>;
  includeCoAuthor?: boolean;
}

/**
 * Prompt for Claude Code settings configuration
 */
export async function promptClaudeSettings(
  options?: ClaudeSettingsOptions
): Promise<ClaudeSettingsConfig> {
  logger.section('Claude Code Settings', '🤖');

  const wantToConfigure = await confirm({
    message: 'Would you like to configure Claude Code settings?',
    default: true,
  });

  if (!wantToConfigure) {
    return {
      ...DEFAULT_CLAUDE_SETTINGS,
      attribution: options?.includeCoAuthor
        ? DEFAULT_CLAUDE_SETTINGS.attribution
        : {
            commit: '🤖 Generated with [Claude Code](https://claude.com/claude-code)',
            pr: '🤖 Generated with [Claude Code](https://claude.com/claude-code)',
          },
    };
  }

  // Ask if user wants to use a preset or customize
  const setupMode = await select({
    message: 'How would you like to configure?',
    choices: [
      { name: 'Use a preset', value: 'preset' },
      { name: 'Customize settings', value: 'custom' },
    ],
    default: 'preset',
  });

  if (setupMode === 'preset') {
    return promptClaudeSettingsPreset(options);
  }

  return promptClaudeSettingsCustom(options);
}

/**
 * Prompt for preset selection
 */
async function promptClaudeSettingsPreset(
  options?: ClaudeSettingsOptions
): Promise<ClaudeSettingsConfig> {
  const preset = await select({
    message: 'Choose a settings preset:',
    choices: Object.entries(PRESET_DESCRIPTIONS).map(([key, description]) => ({
      name: `${key.charAt(0).toUpperCase() + key.slice(1)} - ${description}`,
      value: key as keyof typeof CLAUDE_SETTINGS_PRESETS,
    })),
    default: 'default',
  });

  const config = { ...CLAUDE_SETTINGS_PRESETS[preset] };

  // Apply co-author preference
  if (options?.includeCoAuthor === false) {
    config.attribution = {
      commit: '🤖 Generated with [Claude Code](https://claude.com/claude-code)',
      pr: '🤖 Generated with [Claude Code](https://claude.com/claude-code)',
    };
  }

  return config;
}

/**
 * Prompt for custom settings
 */
async function promptClaudeSettingsCustom(
  options?: ClaudeSettingsOptions
): Promise<ClaudeSettingsConfig> {
  const defaults = options?.defaults || DEFAULT_CLAUDE_SETTINGS;

  // Model selection
  const model = await select({
    message: 'Default Claude model:',
    choices: Object.entries(MODEL_DESCRIPTIONS).map(([key, description]) => ({
      name: description,
      value: key as ClaudeModel,
    })),
    default: defaults.model || 'sonnet',
  });

  // Extended thinking
  const alwaysThinkingEnabled = await confirm({
    message: 'Enable extended thinking by default? (better for complex tasks)',
    default: defaults.alwaysThinkingEnabled ?? false,
  });

  // Sandbox
  const sandboxEnabled = await confirm({
    message: 'Enable bash sandboxing? (isolates shell commands for security)',
    default: defaults.sandbox?.enabled ?? false,
  });

  // Permission mode
  const permissionMode = await select({
    message: 'Default permission mode:',
    choices: Object.entries(PERMISSION_MODE_DESCRIPTIONS).map(([key, description]) => ({
      name: description,
      value: key as PermissionMode,
    })),
    default: defaults.permissions?.defaultMode || 'acceptEdits',
  });

  // Cleanup period
  const cleanupPeriodStr = await input({
    message: 'Session cleanup period (days, 0 = delete all immediately):',
    default: String(defaults.cleanupPeriodDays ?? 30),
    validate: (value) => {
      const num = Number.parseInt(value, 10);
      if (Number.isNaN(num) || num < 0 || num > 365) {
        return 'Please enter a number between 0 and 365';
      }
      return true;
    },
  });
  const cleanupPeriodDays = Number.parseInt(cleanupPeriodStr, 10);

  // Stop notification
  const stopNotification = await select({
    message: 'Notification when task completes:',
    choices: Object.entries(STOP_NOTIFICATION_DESCRIPTIONS).map(([key, description]) => ({
      name: description,
      value: key as StopNotificationType,
    })),
    default: defaults.stopNotification || 'beep',
  });

  let customStopCommand: string | undefined;
  if (stopNotification === 'custom') {
    customStopCommand = await input({
      message: 'Custom command to run on task completion:',
      default: defaults.customStopCommand || '',
    });
  }

  // Build config
  const config: ClaudeSettingsConfig = {
    model,
    alwaysThinkingEnabled,
    sandbox: {
      enabled: sandboxEnabled,
      autoAllowBashIfSandboxed: true,
    },
    permissions: {
      allow: defaults.permissions?.allow || [],
      deny: defaults.permissions?.deny || [],
      ask: defaults.permissions?.ask || [],
      defaultMode: permissionMode,
    },
    attribution:
      options?.includeCoAuthor === false
        ? {
            commit: '🤖 Generated with [Claude Code](https://claude.com/claude-code)',
            pr: '🤖 Generated with [Claude Code](https://claude.com/claude-code)',
          }
        : DEFAULT_CLAUDE_SETTINGS.attribution,
    cleanupPeriodDays,
    stopNotification,
    customStopCommand,
  };

  // Build hooks based on notification preference
  if (stopNotification === 'beep') {
    config.hooks = {
      Stop: [{ hooks: [{ type: 'command', command: BEEP_COMMAND, timeout: 5 }] }],
      SubagentStop: [{ hooks: [{ type: 'command', command: BEEP_COMMAND, timeout: 5 }] }],
    };
  } else if (stopNotification === 'custom' && customStopCommand) {
    config.hooks = {
      Stop: [{ hooks: [{ type: 'command', command: customStopCommand, timeout: 10 }] }],
      SubagentStop: [{ hooks: [{ type: 'command', command: customStopCommand, timeout: 10 }] }],
    };
  }

  return config;
}

/**
 * Show settings summary
 */
export function showClaudeSettingsSummary(config: ClaudeSettingsConfig): void {
  logger.newline();
  logger.subtitle('Claude Code Settings Summary');
  logger.keyValue('Model', config.model);
  logger.keyValue('Extended Thinking', config.alwaysThinkingEnabled ? 'Enabled' : 'Disabled');
  logger.keyValue('Sandbox', config.sandbox.enabled ? 'Enabled' : 'Disabled');
  logger.keyValue('Permission Mode', config.permissions.defaultMode || 'acceptEdits');
  logger.keyValue('Cleanup Period', `${config.cleanupPeriodDays} days`);
  logger.keyValue(
    'Stop Notification',
    config.stopNotification === 'custom'
      ? `Custom: ${config.customStopCommand}`
      : config.stopNotification
  );
  logger.newline();
}

/**
 * Confirm settings
 */
export async function confirmClaudeSettings(config: ClaudeSettingsConfig): Promise<boolean> {
  showClaudeSettingsSummary(config);

  return confirm({
    message: 'Apply these Claude Code settings?',
    default: true,
  });
}
