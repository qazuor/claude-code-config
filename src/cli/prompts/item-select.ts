/**
 * Granular item-by-item selection prompts
 */

import { confirm, select } from '@inquirer/prompts';
import { colors, logger } from '../../lib/utils/logger.js';
import type { ModuleCategory, ModuleDefinition } from '../../types/modules.js';

export type ItemAction = 'install' | 'skip';
export type BatchAction = 'all' | 'none' | 'preset' | 'continue';

interface CategorySelectionResult {
  category: ModuleCategory;
  selectedItems: string[];
  skippedItems: string[];
}

/**
 * Prompt for a single item installation
 */
export async function promptSingleItem(
  item: ModuleDefinition,
  options?: {
    defaultInstall?: boolean;
    showDescription?: boolean;
  }
): Promise<ItemAction> {
  const defaultValue = options?.defaultInstall ?? false;

  if (options?.showDescription && item.description) {
    logger.note(item.description);
  }

  const install = await confirm({
    message: `Install ${colors.primary(item.name)}?`,
    default: defaultValue,
  });

  return install ? 'install' : 'skip';
}

/**
 * Prompt for batch action before starting category selection
 */
export async function promptBatchAction(
  category: ModuleCategory,
  totalItems: number,
  hasPreset?: boolean
): Promise<BatchAction> {
  const choices: Array<{ name: string; value: BatchAction; description: string }> = [
    {
      name: 'Select one by one',
      value: 'continue',
      description: `Review each of the ${totalItems} items`,
    },
    {
      name: 'Install all',
      value: 'all',
      description: `Install all ${totalItems} ${category}`,
    },
    {
      name: 'Skip all',
      value: 'none',
      description: `Skip all ${category}`,
    },
  ];

  if (hasPreset) {
    choices.push({
      name: 'Use preset for this category',
      value: 'preset',
      description: 'Use the preset selection for this category',
    });
  }

  return select<BatchAction>({
    message: `${capitalize(category)} selection (${totalItems} available):`,
    choices,
    default: 'continue',
  });
}

/**
 * Select items from a category one by one
 */
export async function selectItemsFromCategory(
  category: ModuleCategory,
  items: ModuleDefinition[],
  options?: {
    preselected?: string[];
    showDescriptions?: boolean;
  }
): Promise<CategorySelectionResult> {
  const selectedItems: string[] = [];
  const skippedItems: string[] = [];

  logger.newline();
  logger.subtitle(`${capitalize(category)} Selection`);
  logger.info(`${items.length} ${category} available`);
  logger.newline();

  // Check for batch action first
  const batchAction = await promptBatchAction(
    category,
    items.length,
    options?.preselected && options.preselected.length > 0
  );

  if (batchAction === 'all') {
    return {
      category,
      selectedItems: items.map((i) => i.id),
      skippedItems: [],
    };
  }

  if (batchAction === 'none') {
    return {
      category,
      selectedItems: [],
      skippedItems: items.map((i) => i.id),
    };
  }

  if (batchAction === 'preset' && options?.preselected) {
    const preselectedSet = new Set(options.preselected);
    return {
      category,
      selectedItems: items.filter((i) => preselectedSet.has(i.id)).map((i) => i.id),
      skippedItems: items.filter((i) => !preselectedSet.has(i.id)).map((i) => i.id),
    };
  }

  // One by one selection
  const remainingItems = [...items];
  let currentIndex = 0;

  while (currentIndex < remainingItems.length) {
    const item = remainingItems[currentIndex];
    const remaining = remainingItems.length - currentIndex - 1;
    const isPreselected = options?.preselected?.includes(item.id);

    // Show progress
    const progress = colors.muted(`[${currentIndex + 1}/${remainingItems.length}]`);
    console.log(`\n${progress} ${colors.bold(item.name)}`);

    if (options?.showDescriptions && item.description) {
      logger.note(item.description);
    }

    // Ask with shortcuts
    const action = await promptItemWithShortcuts(item, {
      defaultInstall: isPreselected,
      remainingCount: remaining,
    });

    switch (action) {
      case 'install':
        selectedItems.push(item.id);
        currentIndex++;
        break;

      case 'skip':
        skippedItems.push(item.id);
        currentIndex++;
        break;

      case 'install-rest':
        selectedItems.push(item.id);
        // Install all remaining
        for (let i = currentIndex + 1; i < remainingItems.length; i++) {
          selectedItems.push(remainingItems[i].id);
        }
        currentIndex = remainingItems.length;
        break;

      case 'skip-rest':
        skippedItems.push(item.id);
        // Skip all remaining
        for (let i = currentIndex + 1; i < remainingItems.length; i++) {
          skippedItems.push(remainingItems[i].id);
        }
        currentIndex = remainingItems.length;
        break;
    }
  }

  return {
    category,
    selectedItems,
    skippedItems,
  };
}

type ItemActionExtended = 'install' | 'skip' | 'install-rest' | 'skip-rest';

/**
 * Prompt for item with keyboard shortcuts
 */
async function promptItemWithShortcuts(
  item: ModuleDefinition,
  options: {
    defaultInstall?: boolean;
    remainingCount: number;
  }
): Promise<ItemActionExtended> {
  const choices: Array<{ name: string; value: ItemActionExtended }> = [
    { name: 'Yes, install', value: 'install' },
    { name: 'No, skip', value: 'skip' },
  ];

  if (options.remainingCount > 0) {
    choices.push(
      {
        name: `Install all remaining (${options.remainingCount + 1} items)`,
        value: 'install-rest',
      },
      {
        name: `Skip all remaining (${options.remainingCount + 1} items)`,
        value: 'skip-rest',
      }
    );
  }

  return select<ItemActionExtended>({
    message: `Install ${item.name}?`,
    choices,
    default: options.defaultInstall ? 'install' : 'skip',
  });
}

/**
 * Show selection summary for a category
 */
export function showCategorySelectionSummary(result: CategorySelectionResult): void {
  const { category, selectedItems, skippedItems } = result;

  logger.newline();
  logger.subtitle(`${capitalize(category)} Summary`);

  if (selectedItems.length > 0) {
    logger.success(`Selected (${selectedItems.length}): ${selectedItems.join(', ')}`);
  }

  if (skippedItems.length > 0) {
    logger.info(`Skipped (${skippedItems.length}): ${colors.muted(skippedItems.join(', '))}`);
  }
}

/**
 * Confirm category selection
 */
export async function confirmCategorySelection(result: CategorySelectionResult): Promise<boolean> {
  showCategorySelectionSummary(result);
  logger.newline();

  return confirm({
    message: 'Is this selection correct?',
    default: true,
  });
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
