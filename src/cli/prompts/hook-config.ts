/**
 * Hook configuration prompts
 */

import { checkbox, confirm, input, select } from '@inquirer/prompts';
import { logger } from '../../lib/utils/logger.js';
import type { HookConfig } from '../../types/config.js';

type HookType = 'notification' | 'stop' | 'subagentStop' | 'custom';

interface HookPromptOptions {
  defaults?: Partial<HookConfig>;
}

/**
 * Prompt for hook configuration
 */
export async function promptHookConfig(options?: HookPromptOptions): Promise<HookConfig> {
  logger.subtitle('Hook Configuration');

  const enableHooks = await confirm({
    message: 'Do you want to configure hooks?',
    default: true,
  });

  if (!enableHooks) {
    return {
      enabled: false,
    };
  }

  // Select which hooks to configure
  const selectedHooks = await checkbox({
    message: 'Which hooks do you want to configure?',
    choices: [
      {
        name: 'Notification hook (alerts when Claude needs attention)',
        value: 'notification' as HookType,
        checked: true,
      },
      {
        name: 'Stop hook (plays sound when Claude stops)',
        value: 'stop' as HookType,
        checked: false,
      },
      {
        name: 'Subagent stop hook (plays sound when subagent completes)',
        value: 'subagentStop' as HookType,
        checked: false,
      },
    ],
  });

  const config: HookConfig = {
    enabled: true,
  };

  // Configure notification hook
  if (selectedHooks.includes('notification')) {
    config.notification = await promptNotificationHook(options?.defaults?.notification);
  }

  // Configure stop hook
  if (selectedHooks.includes('stop')) {
    config.stop = await promptStopHook();
  }

  // Configure subagent stop hook
  if (selectedHooks.includes('subagentStop')) {
    config.subagentStop = await promptSubagentStopHook();
  }

  return config;
}

/**
 * Prompt for notification hook configuration
 */
async function promptNotificationHook(
  defaults?: HookConfig['notification']
): Promise<HookConfig['notification']> {
  logger.newline();
  logger.info('Notification Hook Configuration');

  const notificationTypes = await checkbox({
    message: 'Select notification types:',
    choices: [
      {
        name: 'Desktop notifications (notify-send / terminal-notifier)',
        value: 'desktop',
        checked: defaults?.desktop ?? true,
      },
      {
        name: 'Audio notifications (text-to-speech)',
        value: 'audio',
        checked: defaults?.audio ?? false,
      },
    ],
  });

  let customCommand: string | undefined;
  const wantCustom = await confirm({
    message: 'Do you want to add a custom notification command?',
    default: false,
  });

  if (wantCustom) {
    customCommand = await input({
      message: 'Custom command (receives notification text as argument):',
      default: defaults?.customCommand,
    });
  }

  return {
    desktop: notificationTypes.includes('desktop'),
    audio: notificationTypes.includes('audio'),
    customCommand: customCommand || undefined,
  };
}

/**
 * Prompt for stop hook configuration
 */
async function promptStopHook(): Promise<HookConfig['stop']> {
  logger.newline();
  logger.info('Stop Hook Configuration');

  const soundType = await select({
    message: 'What should happen when Claude stops?',
    choices: [
      { name: 'Play beep sound', value: 'beep' },
      { name: 'Play custom sound', value: 'custom' },
      { name: 'Run custom command', value: 'command' },
    ],
    default: 'beep',
  });

  if (soundType === 'beep') {
    return { beep: true };
  }

  if (soundType === 'custom') {
    const soundPath = await input({
      message: 'Path to sound file:',
      validate: (v) => (v.trim() ? true : 'Please enter a valid path'),
    });
    return { customSound: soundPath };
  }

  const customCommand = await input({
    message: 'Custom command to run:',
    validate: (v) => (v.trim() ? true : 'Please enter a command'),
  });
  return { customCommand };
}

/**
 * Prompt for subagent stop hook configuration
 */
async function promptSubagentStopHook(): Promise<HookConfig['subagentStop']> {
  logger.newline();
  logger.info('Subagent Stop Hook Configuration');

  const soundType = await select({
    message: 'What should happen when a subagent completes?',
    choices: [
      { name: 'Play short beep', value: 'beep' },
      { name: 'Play custom sound', value: 'custom' },
      { name: 'Run custom command', value: 'command' },
    ],
    default: 'beep',
  });

  if (soundType === 'beep') {
    return { beep: true };
  }

  if (soundType === 'custom') {
    const soundPath = await input({
      message: 'Path to sound file:',
      validate: (v) => (v.trim() ? true : 'Please enter a valid path'),
    });
    return { customSound: soundPath };
  }

  const customCommand = await input({
    message: 'Custom command to run:',
    validate: (v) => (v.trim() ? true : 'Please enter a command'),
  });
  return { customCommand };
}

/**
 * Show hook configuration summary
 */
export function showHookSummary(config: HookConfig): void {
  logger.newline();
  logger.subtitle('Hook Configuration Summary');

  if (!config.enabled) {
    logger.info('Hooks: Disabled');
    return;
  }

  if (config.notification) {
    const notifTypes: string[] = [];
    if (config.notification.desktop) notifTypes.push('desktop');
    if (config.notification.audio) notifTypes.push('audio');
    if (config.notification.customCommand) notifTypes.push('custom');
    logger.keyValue('Notification', notifTypes.join(', ') || 'none');
  }

  if (config.stop) {
    if (config.stop.beep) logger.keyValue('Stop', 'beep');
    else if (config.stop.customSound) logger.keyValue('Stop', `sound: ${config.stop.customSound}`);
    else if (config.stop.customCommand)
      logger.keyValue('Stop', `command: ${config.stop.customCommand}`);
  }

  if (config.subagentStop) {
    if (config.subagentStop.beep) logger.keyValue('Subagent Stop', 'beep');
    else if (config.subagentStop.customSound)
      logger.keyValue('Subagent Stop', `sound: ${config.subagentStop.customSound}`);
    else if (config.subagentStop.customCommand)
      logger.keyValue('Subagent Stop', `command: ${config.subagentStop.customCommand}`);
  }
}

/**
 * Confirm hook configuration
 */
export async function confirmHookConfig(config: HookConfig): Promise<boolean> {
  showHookSummary(config);
  logger.newline();

  return confirm({
    message: 'Is this hook configuration correct?',
    default: true,
  });
}
