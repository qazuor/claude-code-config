/**
 * Default values for Claude Code settings
 */

import type { ClaudeSettingsConfig } from '../types/claude-settings.js';

/**
 * Default Claude settings configuration
 */
export const DEFAULT_CLAUDE_SETTINGS: ClaudeSettingsConfig = {
  model: 'sonnet',
  alwaysThinkingEnabled: false,
  sandbox: {
    enabled: false,
    autoAllowBashIfSandboxed: true,
  },
  permissions: {
    allow: [],
    deny: [],
    ask: [],
    defaultMode: 'acceptEdits',
  },
  attribution: {
    commit:
      '🤖 Generated with [Claude Code](https://claude.com/claude-code)\n\n   Co-Authored-By: Claude <noreply@anthropic.com>',
    pr: '🤖 Generated with [Claude Code](https://claude.com/claude-code)',
  },
  cleanupPeriodDays: 30,
  stopNotification: 'beep',
};

/**
 * Attribution without co-author
 */
export const ATTRIBUTION_NO_COAUTHOR = {
  commit: '🤖 Generated with [Claude Code](https://claude.com/claude-code)',
  pr: '🤖 Generated with [Claude Code](https://claude.com/claude-code)',
};

/**
 * Attribution with co-author
 */
export const ATTRIBUTION_WITH_COAUTHOR = {
  commit:
    '🤖 Generated with [Claude Code](https://claude.com/claude-code)\n\n   Co-Authored-By: Claude <noreply@anthropic.com>',
  pr: '🤖 Generated with [Claude Code](https://claude.com/claude-code)',
};

/**
 * Beep command for stop notification
 */
export const BEEP_COMMAND = "echo -ne '\\007'";

/**
 * Model descriptions for display
 */
export const MODEL_DESCRIPTIONS: Record<string, string> = {
  sonnet: 'Claude Sonnet - Balanced performance and speed (recommended)',
  opus: 'Claude Opus - Most capable, best for complex tasks',
  haiku: 'Claude Haiku - Fastest, best for simple tasks',
  default: 'Default - Let Claude Code decide based on task',
};

/**
 * Permission mode descriptions
 */
export const PERMISSION_MODE_DESCRIPTIONS: Record<string, string> = {
  acceptEdits: 'Accept edits automatically, ask for other operations',
  askAlways: 'Ask for confirmation on all operations',
  viewOnly: 'Read-only mode, no modifications allowed',
};

/**
 * Stop notification descriptions
 */
export const STOP_NOTIFICATION_DESCRIPTIONS: Record<string, string> = {
  beep: 'Play a beep sound when task completes',
  custom: 'Run a custom command when task completes',
  none: 'No notification',
};

/**
 * Settings presets
 */
export const CLAUDE_SETTINGS_PRESETS = {
  /** Default preset - balanced settings */
  default: {
    ...DEFAULT_CLAUDE_SETTINGS,
  },

  /** Performance preset - faster model, less confirmations */
  performance: {
    ...DEFAULT_CLAUDE_SETTINGS,
    model: 'haiku' as const,
    permissions: {
      ...DEFAULT_CLAUDE_SETTINGS.permissions,
      defaultMode: 'acceptEdits' as const,
    },
  },

  /** Quality preset - best model, extended thinking */
  quality: {
    ...DEFAULT_CLAUDE_SETTINGS,
    model: 'opus' as const,
    alwaysThinkingEnabled: true,
  },

  /** Secure preset - sandbox enabled, more confirmations */
  secure: {
    ...DEFAULT_CLAUDE_SETTINGS,
    sandbox: {
      enabled: true,
      autoAllowBashIfSandboxed: true,
    },
    permissions: {
      ...DEFAULT_CLAUDE_SETTINGS.permissions,
      defaultMode: 'askAlways' as const,
    },
  },
};

/**
 * Preset descriptions
 */
export const PRESET_DESCRIPTIONS: Record<string, string> = {
  default: 'Balanced settings for most projects',
  performance: 'Faster responses with Haiku model',
  quality: 'Best quality with Opus model and extended thinking',
  secure: 'Enhanced security with sandbox and confirmations',
};
