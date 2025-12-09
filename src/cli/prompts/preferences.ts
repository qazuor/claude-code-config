/**
 * User preferences prompts
 */

import { confirm, select } from '@inquirer/prompts';
import { logger } from '../../lib/utils/logger.js';
import type { Preferences } from '../../types/config.js';

interface PreferencesOptions {
  defaults?: Partial<Preferences>;
}

/**
 * Prompt for user preferences
 */
export async function promptPreferences(options?: PreferencesOptions): Promise<Preferences> {
  logger.subtitle('Preferences');

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

  return {
    language,
    responseLanguage,
    includeCoAuthor,
  };
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
  logger.newline();

  return confirm({
    message: 'Are these preferences correct?',
    default: true,
  });
}
