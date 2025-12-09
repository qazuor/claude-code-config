/**
 * Module selection prompts (preset vs custom)
 */

import { confirm, select } from '@inquirer/prompts';
import { PRESETS, getPresetNames } from '../../constants/presets.js';
import { logger } from '../../lib/utils/logger.js';
import type { ModuleCategory } from '../../types/modules.js';
import type { PresetName } from '../../types/presets.js';

export type ModuleSelectionMode = 'preset' | 'custom';

interface ModuleSelectionResult {
  mode: ModuleSelectionMode;
  preset?: PresetName;
  adjustAfterPreset?: boolean;
}

/**
 * Prompt for module selection mode
 */
export async function promptModuleSelectionMode(): Promise<ModuleSelectionResult> {
  logger.subtitle('Module Selection');

  const mode = await select<ModuleSelectionMode>({
    message: 'How would you like to select modules?',
    choices: [
      {
        name: 'Use a preset',
        value: 'preset',
        description: 'Start with a predefined configuration, optionally adjust',
      },
      {
        name: 'Custom selection',
        value: 'custom',
        description: 'Select each agent, skill, and command individually',
      },
    ],
    default: 'preset',
  });

  if (mode === 'custom') {
    return { mode };
  }

  const preset = await promptPresetSelection();
  const adjustAfterPreset = await confirm({
    message: 'Would you like to adjust the preset selection (add/remove items)?',
    default: false,
  });

  return { mode, preset, adjustAfterPreset };
}

/**
 * Prompt for preset selection
 */
export async function promptPresetSelection(): Promise<PresetName> {
  const presetNames = getPresetNames();

  const choices = presetNames.map((name) => {
    const preset = PRESETS[name];
    return {
      name: `${preset.displayName}`,
      value: name,
      description: preset.description,
    };
  });

  return select({
    message: 'Select a preset:',
    choices,
    default: 'fullstack',
  });
}

/**
 * Show preset details
 */
export function showPresetDetails(presetName: PresetName): void {
  const preset = PRESETS[presetName];

  logger.newline();
  logger.box(preset.displayName, [
    preset.description,
    '',
    `Agents: ${preset.modules.agents.join(', ')}`,
    `Skills: ${preset.modules.skills.join(', ')}`,
    `Commands: ${preset.modules.commands.join(', ')}`,
    `Docs: ${preset.modules.docs.join(', ')}`,
    '',
    `Extras: ${formatExtras(preset.extras)}`,
  ]);
}

/**
 * Format extras for display
 */
function formatExtras(extras: {
  schemas: boolean;
  scripts: boolean;
  hooks: boolean;
  sessions: boolean;
}): string {
  const enabled: string[] = [];
  if (extras.schemas) enabled.push('schemas');
  if (extras.scripts) enabled.push('scripts');
  if (extras.hooks) enabled.push('hooks');
  if (extras.sessions) enabled.push('sessions');
  return enabled.length > 0 ? enabled.join(', ') : 'none';
}

/**
 * Confirm preset selection
 */
export async function confirmPresetSelection(presetName: PresetName): Promise<boolean> {
  showPresetDetails(presetName);

  return confirm({
    message: 'Use this preset?',
    default: true,
  });
}

/**
 * Prompt for category-specific preset application
 */
export async function promptCategoryPreset(
  category: ModuleCategory,
  presetName: PresetName
): Promise<'use' | 'skip' | 'custom'> {
  const preset = PRESETS[presetName];
  const items = preset.modules[category as keyof typeof preset.modules];

  if (!items || items.length === 0) {
    return 'skip';
  }

  logger.newline();
  logger.subtitle(`${capitalize(category)} (${items.length} items in preset)`);
  logger.item(`Preset includes: ${items.join(', ')}`);
  logger.newline();

  return select({
    message: `What to do with ${category}?`,
    choices: [
      { name: 'Use preset selection', value: 'use' as const },
      { name: 'Skip all', value: 'skip' as const },
      { name: 'Select individually', value: 'custom' as const },
    ],
    default: 'use',
  });
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
