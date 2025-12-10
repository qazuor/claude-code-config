/**
 * Bundle selection prompts
 */

import { checkbox, confirm, select } from '@inquirer/prompts';
import {
  formatBundleForDisplay,
  getAllBundles,
  getBundleCategoryName,
  getBundlesGroupedByCategory,
  resolveBundle,
} from '../../lib/bundles/resolver.js';
import { colors, logger } from '../../lib/utils/logger.js';
import type { BundleDefinition, BundleSelectionResult } from '../../types/bundles.js';

export type BundleSelectionMode = 'bundles' | 'individual' | 'both';

/**
 * Prompt for bundle selection mode
 */
export async function promptBundleMode(): Promise<BundleSelectionMode> {
  const choice = await select<BundleSelectionMode>({
    message: 'How would you like to select modules?',
    choices: [
      {
        name: 'Use bundles (recommended)',
        value: 'bundles',
        description: 'Select pre-configured module bundles for common use cases',
      },
      {
        name: 'Select individual modules',
        value: 'individual',
        description: 'Choose modules one by one',
      },
      {
        name: 'Bundles + individual customization',
        value: 'both',
        description: 'Start with bundles, then add/remove individual modules',
      },
    ],
    default: 'bundles',
  });

  return choice;
}

/**
 * Prompt for bundle selection
 */
export async function promptBundleSelection(): Promise<string[]> {
  const grouped = getBundlesGroupedByCategory();
  const categories = Object.keys(grouped);

  logger.newline();
  logger.subtitle('Bundle Selection');
  logger.info('Select bundles to install. Bundles group related modules together.');
  logger.newline();

  const selectedBundles: string[] = [];

  for (const category of categories) {
    const bundles = grouped[category];
    const categoryName = getBundleCategoryName(category);

    logger.newline();
    logger.info(colors.primary(`${categoryName}:`));

    const choices = bundles.map((bundle) => ({
      name: formatBundleForDisplay(bundle),
      value: bundle.id,
      description: bundle.description,
    }));

    const selected = await checkbox({
      message: `Select ${categoryName.toLowerCase()} bundles:`,
      choices,
      required: false,
    });

    selectedBundles.push(...selected);
  }

  return selectedBundles;
}

/**
 * Prompt for quick bundle selection (single select from popular bundles)
 */
export async function promptQuickBundleSelection(): Promise<string[]> {
  const allBundles = getAllBundles();

  // Popular bundles for quick selection
  const popularBundleIds = [
    'react-tanstack-stack',
    'hono-drizzle-stack',
    'testing-complete',
    'quality-complete',
    'planning-complete',
  ];

  const popularBundles = popularBundleIds
    .map((id) => allBundles.find((b) => b.id === id))
    .filter((b): b is BundleDefinition => b !== undefined);

  logger.newline();
  logger.subtitle('Quick Bundle Selection');
  logger.info('Choose a starting bundle or select "Custom" for more options.');
  logger.newline();

  const choices = [
    ...popularBundles.map((bundle) => ({
      name: formatBundleForDisplay(bundle),
      value: bundle.id,
      description: bundle.description,
    })),
    {
      name: 'Custom selection...',
      value: 'custom',
      description: 'Browse all bundles by category',
    },
    {
      name: 'Skip bundles',
      value: 'skip',
      description: 'Select individual modules instead',
    },
  ];

  const selected = await select<string>({
    message: 'Choose a bundle:',
    choices,
    default: popularBundles[0]?.id ?? 'custom',
  });

  if (selected === 'skip') {
    return [];
  }

  if (selected === 'custom') {
    return promptBundleSelection();
  }

  // Ask if they want to add more bundles
  const addMore = await confirm({
    message: 'Would you like to add more bundles?',
    default: false,
  });

  if (addMore) {
    const additional = await promptBundleSelection();
    return [selected, ...additional.filter((id) => id !== selected)];
  }

  return [selected];
}

/**
 * Show bundle contents preview
 */
export function showBundleContents(bundle: BundleDefinition): void {
  const resolved = resolveBundle(bundle);

  logger.newline();
  logger.subtitle(`Bundle: ${bundle.name}`);
  logger.info(bundle.description);

  if (bundle.longDescription) {
    logger.newline();
    logger.note(bundle.longDescription);
  }

  logger.newline();

  if (resolved.modules.agents.length > 0) {
    logger.info(`${colors.primary('Agents:')} ${resolved.modules.agents.join(', ')}`);
  }
  if (resolved.modules.skills.length > 0) {
    logger.info(`${colors.primary('Skills:')} ${resolved.modules.skills.join(', ')}`);
  }
  if (resolved.modules.commands.length > 0) {
    logger.info(`${colors.primary('Commands:')} ${resolved.modules.commands.join(', ')}`);
  }
  if (resolved.modules.docs.length > 0) {
    logger.info(`${colors.primary('Docs:')} ${resolved.modules.docs.join(', ')}`);
  }

  if (bundle.techStack && bundle.techStack.length > 0) {
    logger.newline();
    logger.info(`${colors.muted('Tech stack:')} ${bundle.techStack.join(', ')}`);
  }
}

/**
 * Show selected bundles summary
 */
export function showBundlesSummary(bundleIds: string[]): void {
  if (bundleIds.length === 0) {
    logger.info('No bundles selected');
    return;
  }

  const allBundles = getAllBundles();
  const selectedBundles = bundleIds
    .map((id) => allBundles.find((b) => b.id === id))
    .filter((b): b is BundleDefinition => b !== undefined);

  logger.newline();
  logger.subtitle('Selected Bundles');

  for (const bundle of selectedBundles) {
    logger.success(`• ${formatBundleForDisplay(bundle)}`);
  }
}

/**
 * Confirm bundle selection
 */
export async function confirmBundleSelection(bundleIds: string[]): Promise<boolean> {
  showBundlesSummary(bundleIds);
  logger.newline();

  return confirm({
    message: 'Is this selection correct?',
    default: true,
  });
}

/**
 * Create empty bundle selection result
 */
export function createEmptyBundleResult(): BundleSelectionResult {
  return {
    selectedBundles: [],
    additionalModules: {
      agents: [],
      skills: [],
      commands: [],
      docs: [],
    },
  };
}
