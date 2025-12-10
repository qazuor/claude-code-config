/**
 * Bundle selection prompts
 */

import {
  formatBundleCompact,
  printBundleDisplay,
  printValidationWarnings,
} from '../../lib/bundles/display.js';
import {
  formatBundleDetailedDescription,
  formatBundleForDisplay,
  getAllBundles,
  getBundleById,
  getBundleCategoryName,
  getBundlesGroupedByCategory,
} from '../../lib/bundles/resolver.js';
import { validateModuleDependencies } from '../../lib/bundles/validator.js';
import { colors, logger } from '../../lib/utils/logger.js';
import { checkbox, confirm, select } from '../../lib/utils/prompt-cancel.js';
import type {
  BundleDefinition,
  BundleSelectionResult,
  BundleValidationResult,
} from '../../types/bundles.js';
import type { ModuleSelectionResult } from '../../types/modules.js';

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
 * Description shows detailed info when hovering over each choice
 */
export async function promptBundleSelection(): Promise<string[]> {
  const grouped = getBundlesGroupedByCategory();
  const categories = Object.keys(grouped);

  logger.newline();
  logger.subtitle('Bundle Selection');
  logger.info('Select bundles to install. Use arrow keys to see details for each bundle.');
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
      description: formatBundleDetailedDescription(bundle),
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

// Special values for checkbox options
const BROWSE_ALL_VALUE = '__browse_all__';
const SKIP_VALUE = '__skip__';

/**
 * Prompt for quick bundle selection (multi-select from popular bundles)
 * Description shows detailed info when hovering over each choice
 */
export async function promptQuickBundleSelection(): Promise<string[]> {
  const allBundles = getAllBundles();

  // Top 6 most common bundles
  const featuredBundleIds = [
    'react-tanstack-stack',
    'hono-drizzle-stack',
    'nextjs-prisma-stack',
    'testing-complete',
    'quality-complete',
    'planning-complete',
  ];

  const featuredBundles = featuredBundleIds
    .map((id) => allBundles.find((b) => b.id === id))
    .filter((b): b is BundleDefinition => b !== undefined);

  logger.newline();
  logger.subtitle('Bundle Selection');
  logger.info('Use arrow keys to navigate, Space to select, Enter to confirm.');
  logger.info(
    colors.muted(
      `Showing ${featuredBundles.length} popular bundles. ${allBundles.length} total available.`
    )
  );
  logger.newline();

  const choices = [
    // Featured bundles
    ...featuredBundles.map((bundle) => ({
      name: formatBundleForDisplay(bundle),
      value: bundle.id,
      description: formatBundleDetailedDescription(bundle),
    })),
    // Actions
    {
      name: colors.primary(`Ver todos (${allBundles.length} bundles)`),
      value: BROWSE_ALL_VALUE,
      description:
        'Browse all bundles organized by category: Stacks, Testing, Database, API, Frontend, Workflow',
    },
    {
      name: colors.muted('Omitir'),
      value: SKIP_VALUE,
      description: 'Continue without bundles - you can select individual modules later',
    },
  ];

  const selected = await checkbox({
    message: 'Select bundles (Space to toggle, Enter to confirm):',
    choices,
    required: false,
  });

  // Check if user selected "Browse all"
  if (selected.includes(BROWSE_ALL_VALUE)) {
    // Remove special values and keep any real bundles selected
    const realBundles = selected.filter((id) => id !== BROWSE_ALL_VALUE && id !== SKIP_VALUE);
    const additional = await promptBundleSelection();
    // Merge without duplicates
    return [...realBundles, ...additional.filter((id) => !realBundles.includes(id))];
  }

  // Check if user selected "Skip"
  if (selected.includes(SKIP_VALUE)) {
    // If only skip was selected, return empty
    const realBundles = selected.filter((id) => id !== BROWSE_ALL_VALUE && id !== SKIP_VALUE);
    if (realBundles.length === 0) {
      return [];
    }
    // If they selected bundles AND skip, just use the bundles
    return realBundles;
  }

  // If nothing selected, ask what to do
  if (selected.length === 0) {
    const action = await select<'browse' | 'skip'>({
      message: 'No bundles selected. What would you like to do?',
      choices: [
        {
          name: 'Browse all bundles by category',
          value: 'browse',
          description: `See all ${allBundles.length} available bundles organized by category`,
        },
        {
          name: 'Skip bundles',
          value: 'skip',
          description: 'Continue without selecting any bundles',
        },
      ],
    });

    if (action === 'browse') {
      return promptBundleSelection();
    }
    return [];
  }

  // Ask if they want to add more from other categories
  const addMore = await confirm({
    message: 'Would you like to browse additional bundles by category?',
    default: false,
  });

  if (addMore) {
    const additional = await promptBundleSelection();
    // Merge without duplicates
    const allSelected = [...selected, ...additional.filter((id) => !selected.includes(id))];
    return allSelected;
  }

  return selected;
}

/**
 * Show bundle contents preview using visual display
 */
export function showBundleContents(bundle: BundleDefinition): void {
  logger.newline();
  printBundleDisplay(bundle);
}

/**
 * Show detailed bundle information for a specific bundle by ID
 */
export async function showBundleDetails(bundleId: string): Promise<void> {
  const bundle = getBundleById(bundleId);
  if (!bundle) {
    logger.error(`Bundle not found: ${bundleId}`);
    return;
  }

  showBundleContents(bundle);
}

/**
 * Show validation warnings and auto-included modules
 */
export function showValidationResults(validation: BundleValidationResult): void {
  if (validation.errors.length === 0 && validation.warnings.length === 0) {
    return;
  }

  logger.newline();
  printValidationWarnings(validation);

  if (validation.autoIncluded.length > 0) {
    logger.newline();
    logger.info(colors.primary('Auto-included modules:'));
    for (const module of validation.autoIncluded) {
      logger.info(`  ${colors.muted('•')} ${module.id} (${module.category})`);
    }
  }
}

/**
 * Show selected bundles summary with compact format
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
    logger.success(`• ${formatBundleCompact(bundle)}`);
  }
}

/**
 * Show detailed summary of all selected bundles with visual display
 */
export function showBundlesDetailedSummary(bundleIds: string[]): void {
  if (bundleIds.length === 0) {
    logger.info('No bundles selected');
    return;
  }

  const allBundles = getAllBundles();
  const selectedBundles = bundleIds
    .map((id) => allBundles.find((b) => b.id === id))
    .filter((b): b is BundleDefinition => b !== undefined);

  logger.newline();
  logger.subtitle(`Selected Bundles (${selectedBundles.length})`);

  for (const bundle of selectedBundles) {
    showBundleContents(bundle);
  }
}

/**
 * Validate bundle selection and show any dependency issues
 */
export function validateAndShowDependencies(
  bundleIds: string[],
  selectedModules: ModuleSelectionResult
): BundleValidationResult {
  const allBundles = getAllBundles();
  const selectedBundles = bundleIds
    .map((id) => allBundles.find((b) => b.id === id))
    .filter((b): b is BundleDefinition => b !== undefined);

  const validation = validateModuleDependencies(selectedModules, selectedBundles);
  showValidationResults(validation);

  return validation;
}

/**
 * Confirm bundle selection with validation
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
 * Confirm bundle selection with detailed view and validation
 */
export async function confirmBundleSelectionDetailed(
  bundleIds: string[],
  selectedModules: ModuleSelectionResult
): Promise<{ confirmed: boolean; validation: BundleValidationResult }> {
  // Show compact summary first
  showBundlesSummary(bundleIds);

  // Validate and show any dependency issues
  const validation = validateAndShowDependencies(bundleIds, selectedModules);

  // Ask if user wants to see detailed view
  if (bundleIds.length > 0) {
    const showDetails = await confirm({
      message: 'Would you like to see detailed bundle information?',
      default: false,
    });

    if (showDetails) {
      showBundlesDetailedSummary(bundleIds);
    }
  }

  logger.newline();
  const confirmed = await confirm({
    message: 'Is this selection correct?',
    default: true,
  });

  return { confirmed, validation };
}

/**
 * Prompt user to view bundle details during selection
 */
export async function promptBundlePreview(bundleIds: string[]): Promise<void> {
  if (bundleIds.length === 0) {
    return;
  }

  const allBundles = getAllBundles();
  const selectedBundles = bundleIds
    .map((id) => allBundles.find((b) => b.id === id))
    .filter((b): b is BundleDefinition => b !== undefined);

  if (selectedBundles.length === 0) {
    return;
  }

  const choices = [
    ...selectedBundles.map((bundle) => ({
      name: formatBundleCompact(bundle),
      value: bundle.id,
      description: 'View detailed information',
    })),
    {
      name: 'Done viewing',
      value: 'done',
      description: 'Continue with selection',
    },
  ];

  let viewing = true;
  while (viewing) {
    const selected = await select<string>({
      message: 'Select a bundle to view details (or Done to continue):',
      choices,
      default: 'done',
    });

    if (selected === 'done') {
      viewing = false;
    } else {
      const bundle = selectedBundles.find((b) => b.id === selected);
      if (bundle) {
        showBundleContents(bundle);
      }
    }
  }
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
