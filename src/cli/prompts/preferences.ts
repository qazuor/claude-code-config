/**
 * User preferences prompts
 */

import { logger } from '../../lib/utils/logger.js';
import { confirm, select } from '../../lib/utils/prompt-cancel.js';
import type { Preferences } from '../../types/config.js';
import type { PackageManager } from '../../types/scaffold.js';

interface PreferencesOptions {
  defaults?: Partial<Preferences>;
  detectedPackageManager?: PackageManager;
}

/**
 * Prompt for user preferences
 */
export async function promptPreferences(options?: PreferencesOptions): Promise<Preferences> {
  logger.section('Preferences', '⚙️');

  const language = await select({
    message: 'Working language (for documentation and comments):',
    choices: [
      { name: 'English', value: 'en' as const },
      { name: 'Español', value: 'es' as const },
    ],
    default: options?.defaults?.language || 'en',
  });

  const responseLanguage = await select({
    message: 'Claude response language:',
    choices: [
      { name: 'English', value: 'en' as const },
      { name: 'Español', value: 'es' as const },
    ],
    default: options?.defaults?.responseLanguage || language,
  });

  const includeCoAuthor = await confirm({
    message: 'Include Claude as commit co-author?',
    default: options?.defaults?.includeCoAuthor ?? true,
  });

  // Package manager selection
  const packageManager = await promptPackageManagerPreference(options?.detectedPackageManager);

  return {
    language,
    responseLanguage,
    includeCoAuthor,
    packageManager,
  };
}

/**
 * Prompt for package manager preference
 */
export async function promptPackageManagerPreference(
  detected?: PackageManager
): Promise<PackageManager> {
  const choices = [
    {
      name: 'pnpm (recommended)',
      value: 'pnpm' as const,
      description: 'Fast, disk space efficient package manager',
    },
    {
      name: 'npm',
      value: 'npm' as const,
      description: 'Node.js default package manager',
    },
    {
      name: 'yarn',
      value: 'yarn' as const,
      description: 'Fast, reliable dependency management',
    },
    {
      name: 'bun',
      value: 'bun' as const,
      description: 'All-in-one JavaScript runtime & toolkit',
    },
  ];

  // Mark detected package manager
  if (detected) {
    const detectedChoice = choices.find((c) => c.value === detected);
    if (detectedChoice) {
      detectedChoice.name = `${detectedChoice.name} (detected)`;
    }
  }

  return select({
    message: 'Preferred package manager:',
    choices,
    default: detected || 'pnpm',
  });
}

/**
 * Confirm preferences summary
 */
export async function confirmPreferences(prefs: Preferences): Promise<boolean> {
  logger.newline();
  logger.subtitle('Preferences Summary');
  logger.keyValue('Working language', prefs.language === 'en' ? 'English' : 'Español');
  logger.keyValue('Response language', prefs.responseLanguage === 'en' ? 'English' : 'Español');
  logger.keyValue('Co-author', prefs.includeCoAuthor ? 'Yes' : 'No');
  logger.keyValue('Package manager', prefs.packageManager || 'pnpm');
  logger.newline();

  return confirm({
    message: 'Are these preferences correct?',
    default: true,
  });
}
