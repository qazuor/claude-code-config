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
  resolveBundles,
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
 * Prompt for bundle selection by category (internal, doesn't show summary)
 */
async function promptBundleSelectionByCategory(): Promise<string[]> {
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

/**
 * Prompt for bundle selection
 * Description shows detailed info when hovering over each choice
 * Shows summary with totals at the end with option to edit
 */
export async function promptBundleSelection(): Promise<string[]> {
  let selectedBundles = await promptBundleSelectionByCategory();

  // Show summary with totals and allow editing
  if (selectedBundles.length > 0) {
    let confirmed = false;
    while (!confirmed) {
      const action = await confirmBundleSelectionWithEdit(selectedBundles);

      if (action === 'confirm') {
        confirmed = true;
      } else if (action === 'edit') {
        selectedBundles = await editBundleSelection(selectedBundles);
        // If all bundles were removed, break the loop
        if (selectedBundles.length === 0) {
          break;
        }
      } else {
        // cancel
        return [];
      }
    }
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

  let finalSelection = selected;
  if (addMore) {
    const additional = await promptBundleSelection();
    // Merge without duplicates
    finalSelection = [...selected, ...additional.filter((id) => !selected.includes(id))];
  }

  // Show summary with totals and allow editing
  if (finalSelection.length > 0) {
    let confirmed = false;
    while (!confirmed) {
      const action = await confirmBundleSelectionWithEdit(finalSelection);

      if (action === 'confirm') {
        confirmed = true;
      } else if (action === 'edit') {
        finalSelection = await editBundleSelection(finalSelection);
        // If all bundles were removed, break the loop
        if (finalSelection.length === 0) {
          break;
        }
      } else {
        // cancel
        return [];
      }
    }
  }

  return finalSelection;
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
 * Module totals from resolved bundles
 */
export interface ModuleTotals {
  agents: number;
  skills: number;
  commands: number;
  docs: number;
  total: number;
}

/**
 * Calculate module totals from bundle selection
 */
export function calculateModuleTotals(bundleIds: string[]): ModuleTotals {
  const resolved = resolveBundles(bundleIds);
  return {
    agents: resolved.agents.length,
    skills: resolved.skills.length,
    commands: resolved.commands.length,
    docs: resolved.docs.length,
    total:
      resolved.agents.length +
      resolved.skills.length +
      resolved.commands.length +
      resolved.docs.length,
  };
}

/**
 * Show selected bundles summary with compact format and module totals
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
 * Show selected bundles summary with totals
 */
export function showBundlesSummaryWithTotals(bundleIds: string[]): void {
  if (bundleIds.length === 0) {
    logger.info('No bundles selected');
    return;
  }

  const allBundles = getAllBundles();
  const selectedBundles = bundleIds
    .map((id) => allBundles.find((b) => b.id === id))
    .filter((b): b is BundleDefinition => b !== undefined);

  const totals = calculateModuleTotals(bundleIds);

  logger.newline();
  logger.subtitle(`Selected Bundles (${selectedBundles.length})`);

  for (const bundle of selectedBundles) {
    logger.success(`  • ${formatBundleCompact(bundle)}`);
  }

  // Show totals box
  const border = colors.primary('│');
  logger.newline();
  logger.info(colors.primary('┌─────────────────────────────────────┐'));
  logger.info(`${border}         Module Totals              ${border}`);
  logger.info(colors.primary('├─────────────────────────────────────┤'));
  logger.info(
    `${border}  🤖 Agents:   ${String(totals.agents).padStart(3)}                   ${border}`
  );
  logger.info(
    `${border}  ⚡ Skills:   ${String(totals.skills).padStart(3)}                   ${border}`
  );
  logger.info(
    `${border}  💻 Commands: ${String(totals.commands).padStart(3)}                   ${border}`
  );
  logger.info(
    `${border}  📚 Docs:     ${String(totals.docs).padStart(3)}                   ${border}`
  );
  logger.info(colors.primary('├─────────────────────────────────────┤'));
  logger.info(
    `${border}${colors.success(`  Total:       ${String(totals.total).padStart(3)} modules            `)}${border}`
  );
  logger.info(colors.primary('└─────────────────────────────────────┘'));
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
 * Action options for bundle selection confirmation
 */
export type BundleConfirmAction = 'confirm' | 'edit' | 'cancel';

/**
 * Confirm bundle selection with option to edit
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
 * Confirm bundle selection with totals and option to go back and edit
 * Returns the action the user wants to take
 */
export async function confirmBundleSelectionWithEdit(
  bundleIds: string[]
): Promise<BundleConfirmAction> {
  showBundlesSummaryWithTotals(bundleIds);
  logger.newline();

  const action = await select<BundleConfirmAction>({
    message: 'What would you like to do?',
    choices: [
      {
        name: colors.success('✓ Confirm selection'),
        value: 'confirm',
        description: 'Continue with the selected bundles',
      },
      {
        name: colors.warning('← Edit selection'),
        value: 'edit',
        description: 'Go back and modify your bundle selection',
      },
      {
        name: colors.muted('✕ Cancel'),
        value: 'cancel',
        description: 'Cancel and start over',
      },
    ],
    default: 'confirm',
  });

  return action;
}

/**
 * Edit bundle selection - allows removing bundles from current selection
 */
export async function editBundleSelection(currentBundleIds: string[]): Promise<string[]> {
  const allBundles = getAllBundles();
  const selectedBundles = currentBundleIds
    .map((id) => allBundles.find((b) => b.id === id))
    .filter((b): b is BundleDefinition => b !== undefined);

  logger.newline();
  logger.subtitle('Edit Bundle Selection');
  logger.info('Uncheck bundles you want to remove, or add new ones.');
  logger.newline();

  const choices = selectedBundles.map((bundle) => ({
    name: formatBundleForDisplay(bundle),
    value: bundle.id,
    description: formatBundleDetailedDescription(bundle),
    checked: true, // All currently selected bundles are checked
  }));

  // Add option to browse more bundles
  choices.push({
    name: colors.primary('+ Add more bundles...'),
    value: BROWSE_ALL_VALUE,
    description: 'Browse all available bundles to add more',
    checked: false,
  });

  const selected = await checkbox({
    message: 'Current bundles (uncheck to remove):',
    choices,
    required: false,
  });

  // Check if user wants to add more
  if (selected.includes(BROWSE_ALL_VALUE)) {
    const realBundles = selected.filter((id) => id !== BROWSE_ALL_VALUE);
    const additional = await promptBundleSelection();
    // Merge without duplicates
    return [...realBundles, ...additional.filter((id) => !realBundles.includes(id))];
  }

  return selected;
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
