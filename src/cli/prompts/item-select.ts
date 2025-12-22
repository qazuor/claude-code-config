/**
 * Granular item-by-item selection prompts
 */

import { colors, logger } from '../../lib/utils/logger.js';
import { checkbox, confirm, select } from '../../lib/utils/prompt-cancel.js';
import type { ModuleCategory, ModuleDefinition } from '../../types/modules.js';
import {
  createChoicesWithExclusivity,
  groupByExclusivity,
  validateNoConflicts,
} from './mutual-exclusivity.js';

export type ItemAction = 'install' | 'skip';
export type BatchAction = 'all' | 'none' | 'preset' | 'continue' | 'smart';

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
  const defaultValue = options?.defaultInstall ?? true;

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
  options?: {
    hasPreset?: boolean;
    hasExclusivityGroups?: boolean;
    exclusivityGroupCount?: number;
  }
): Promise<BatchAction> {
  const choices: Array<{ name: string; value: BatchAction; description: string }> = [
    {
      name: 'Install all (recommended)',
      value: 'all',
      description: `Install all ${totalItems} ${category}`,
    },
    {
      name: 'Select one by one',
      value: 'continue',
      description: `Review each of the ${totalItems} items`,
    },
    {
      name: 'Skip all',
      value: 'none',
      description: `Skip all ${category}`,
    },
  ];

  // Add smart selection when there are exclusivity groups
  if (options?.hasExclusivityGroups && options.exclusivityGroupCount) {
    choices.splice(1, 0, {
      name: colors.primary('Smart selection (handles conflicts)'),
      value: 'smart',
      description: `Intelligent selection with ${options.exclusivityGroupCount} mutually exclusive group(s)`,
    });
  }

  if (options?.hasPreset) {
    choices.splice(1, 0, {
      name: 'Use preset for this category',
      value: 'preset',
      description: 'Use the preset selection for this category',
    });
  }

  return select<BatchAction>({
    message: `${capitalize(category)} selection (${totalItems} available):`,
    choices,
    default: options?.hasExclusivityGroups ? 'smart' : 'all',
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
  logger.newline();
  logger.subtitle(`${capitalize(category)} Selection`);
  logger.info(`${items.length} ${category} available`);

  // Check for mutual exclusivity groups
  const exclusivityGroups = groupByExclusivity(items);
  const hasExclusivityGroups = exclusivityGroups.size > 0;

  if (hasExclusivityGroups) {
    logger.info(
      colors.warning(
        `${exclusivityGroups.size} group(s) of mutually exclusive ${category} detected`
      )
    );
  }
  logger.newline();

  // Check for batch action first
  const batchAction = await promptBatchAction(category, items.length, {
    hasPreset: options?.preselected && options.preselected.length > 0,
    hasExclusivityGroups,
    exclusivityGroupCount: exclusivityGroups.size,
  });

  if (batchAction === 'all') {
    // When installing all, validate for conflicts
    const conflicts = validateNoConflicts(
      items.map((i) => i.id),
      items
    );

    if (conflicts.length > 0) {
      logger.warn('Cannot install all: some modules are mutually exclusive.');
      logger.info('Switching to smart selection mode...');
      // Fall through to smart mode
    } else {
      return {
        category,
        selectedItems: items.map((i) => i.id),
        skippedItems: [],
      };
    }
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
    // Validate preset for conflicts
    const preselectedIds = items.filter((i) => preselectedSet.has(i.id)).map((i) => i.id);
    const conflicts = validateNoConflicts(preselectedIds, items);

    if (conflicts.length > 0) {
      logger.warn('Preset contains conflicting modules. Switching to smart selection...');
      // Fall through to smart mode
    } else {
      return {
        category,
        selectedItems: preselectedIds,
        skippedItems: items.filter((i) => !preselectedSet.has(i.id)).map((i) => i.id),
      };
    }
  }

  // Smart selection mode - use checkbox with mutual exclusivity handling
  if (batchAction === 'smart' || batchAction === 'all' || batchAction === 'preset') {
    return selectItemsWithExclusivity(category, items, options);
  }

  // One by one selection (continue mode)
  return selectItemsOneByOne(category, items, options);
}

/**
 * Smart selection with mutual exclusivity handling
 * Uses checkbox with disabled options for conflicting modules
 */
async function selectItemsWithExclusivity(
  category: ModuleCategory,
  items: ModuleDefinition[],
  options?: {
    preselected?: string[];
    showDescriptions?: boolean;
  }
): Promise<CategorySelectionResult> {
  let selectedIds: string[] =
    options?.preselected?.filter((id) => items.some((i) => i.id === id)) || [];
  let confirmed = false;

  while (!confirmed) {
    // Create choices with exclusivity handling
    const choices = createChoicesWithExclusivity(items, selectedIds, {
      preselected: options?.preselected,
      showConflictReason: true,
    });

    logger.newline();
    logger.info(
      colors.muted('Items marked as incompatible are disabled based on your selections.')
    );
    logger.info(colors.muted('Uncheck items to enable their alternatives.'));
    logger.newline();

    // Use checkbox for selection
    const newSelection = await checkbox({
      message: `Select ${category} (Space to toggle, Enter to confirm):`,
      choices: choices.map((c) => ({
        name: c.name,
        value: c.value,
        description: c.description,
        disabled: c.disabled,
        checked: c.checked,
      })),
      required: false,
    });

    // Check for conflicts in new selection
    const conflicts = validateNoConflicts(newSelection, items);

    if (conflicts.length > 0) {
      logger.warn('Your selection contains conflicts:');
      for (const conflict of conflicts) {
        const module1 = items.find((i) => i.id === conflict.selected)?.name || conflict.selected;
        const module2 =
          items.find((i) => i.id === conflict.conflictsWith)?.name || conflict.conflictsWith;
        logger.info(`  ${colors.error('•')} ${module1} and ${module2} are mutually exclusive`);
      }
      logger.info('Please adjust your selection.');
      selectedIds = newSelection;
      continue;
    }

    selectedIds = newSelection;

    // Ask for confirmation
    showCategorySelectionSummary({
      category,
      selectedItems: selectedIds,
      skippedItems: items.filter((i) => !selectedIds.includes(i.id)).map((i) => i.id),
    });

    confirmed = await confirm({
      message: 'Is this selection correct?',
      default: true,
    });
  }

  return {
    category,
    selectedItems: selectedIds,
    skippedItems: items.filter((i) => !selectedIds.includes(i.id)).map((i) => i.id),
  };
}

/**
 * One-by-one selection mode
 */
async function selectItemsOneByOne(
  category: ModuleCategory,
  items: ModuleDefinition[],
  options?: {
    preselected?: string[];
    showDescriptions?: boolean;
  }
): Promise<CategorySelectionResult> {
  const selectedItems: string[] = [];
  const skippedItems: string[] = [];

  const remainingItems = [...items];
  let currentIndex = 0;

  while (currentIndex < remainingItems.length) {
    const item = remainingItems[currentIndex];
    const remaining = remainingItems.length - currentIndex - 1;
    const isPreselected = options?.preselected?.includes(item.id);

    // Check if this item conflicts with already selected items
    const conflicts = item.alternativeTo?.filter((altId) => selectedItems.includes(altId)) || [];

    if (conflicts.length > 0) {
      // Auto-skip conflicting items
      const conflictNames = conflicts
        .map((id) => items.find((i) => i.id === id)?.name || id)
        .join(', ');
      logger.info(
        colors.muted(`Skipping ${item.name} (conflicts with selected: ${conflictNames})`)
      );
      skippedItems.push(item.id);
      currentIndex++;
      continue;
    }

    // Show progress
    const progress = colors.muted(`[${currentIndex + 1}/${remainingItems.length}]`);
    console.log(`\n${progress} ${colors.bold(item.name)}`);

    if (options?.showDescriptions && item.description) {
      logger.note(item.description);
    }

    // Show alternatives warning if applicable
    if (item.alternativeTo && item.alternativeTo.length > 0) {
      const altNames = item.alternativeTo
        .map((id) => items.find((i) => i.id === id)?.name || id)
        .join(', ');
      logger.info(colors.warning(`⚠ Selecting this will disable: ${altNames}`));
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
        // Install all remaining (excluding conflicts)
        for (let i = currentIndex + 1; i < remainingItems.length; i++) {
          const nextItem = remainingItems[i];
          const nextConflicts =
            nextItem.alternativeTo?.filter((altId) => selectedItems.includes(altId)) || [];
          if (nextConflicts.length === 0) {
            selectedItems.push(nextItem.id);
          } else {
            skippedItems.push(nextItem.id);
          }
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
    default: options.defaultInstall !== false ? 'install' : 'skip',
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
