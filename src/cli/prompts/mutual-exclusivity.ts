/**
 * Mutual Exclusivity Handling for Module Selection
 *
 * Handles `alternativeTo` relationships between modules,
 * allowing intelligent enabling/disabling of options based on selections.
 */

import { colors } from '../../lib/utils/logger.js';
import type { ModuleDefinition } from '../../types/modules.js';

/**
 * Result of filtering modules by mutual exclusivity
 */
export interface MutualExclusivityResult {
  /** Modules that are available for selection */
  availableModules: ModuleDefinition[];
  /** Modules that are disabled due to conflicts */
  disabledModules: Array<{
    module: ModuleDefinition;
    /** IDs of selected modules that conflict with this one */
    conflictsWith: string[];
  }>;
}

/**
 * Get all modules that are alternatives to a given module
 */
export function getAlternativesFor(
  moduleId: string,
  allModules: ModuleDefinition[]
): ModuleDefinition[] {
  const module = allModules.find((m) => m.id === moduleId);
  if (!module?.alternativeTo) {
    return [];
  }
  return allModules.filter((m) => module.alternativeTo?.includes(m.id));
}

/**
 * Check if a module conflicts with any selected modules
 */
export function getConflictingSelections(
  module: ModuleDefinition,
  selectedIds: string[]
): string[] {
  if (!module.alternativeTo) {
    return [];
  }
  return module.alternativeTo.filter((altId) => selectedIds.includes(altId));
}

/**
 * Filter modules based on current selection, respecting alternativeTo relationships
 *
 * @param modules - All modules to filter
 * @param selectedIds - Currently selected module IDs
 * @returns Object with available and disabled modules
 */
export function filterByMutualExclusivity(
  modules: ModuleDefinition[],
  selectedIds: string[]
): MutualExclusivityResult {
  const availableModules: ModuleDefinition[] = [];
  const disabledModules: MutualExclusivityResult['disabledModules'] = [];

  for (const module of modules) {
    const conflicts = getConflictingSelections(module, selectedIds);

    if (conflicts.length > 0) {
      disabledModules.push({
        module,
        conflictsWith: conflicts,
      });
    } else {
      availableModules.push(module);
    }
  }

  return { availableModules, disabledModules };
}

/**
 * Build choice options with disabled state for conflicting modules
 */
export interface ChoiceWithExclusivity {
  name: string;
  value: string;
  description?: string;
  disabled?: boolean | string;
  checked?: boolean;
}

/**
 * Create checkbox choices with mutual exclusivity handling
 *
 * @param modules - All modules to create choices for
 * @param selectedIds - Currently selected module IDs
 * @param options - Additional options
 * @returns Array of choices with disabled state for conflicting modules
 */
export function createChoicesWithExclusivity(
  modules: ModuleDefinition[],
  selectedIds: string[],
  options?: {
    preselected?: string[];
    showConflictReason?: boolean;
  }
): ChoiceWithExclusivity[] {
  const choices: ChoiceWithExclusivity[] = [];

  for (const module of modules) {
    const conflicts = getConflictingSelections(module, selectedIds);
    const isConflicting = conflicts.length > 0;
    const isPreselected = options?.preselected?.includes(module.id);
    const isSelected = selectedIds.includes(module.id);

    let name = module.name;
    let description = module.description;
    let disabled: boolean | string = false;

    if (isConflicting) {
      // Show which module(s) it conflicts with
      const conflictNames = conflicts.join(', ');
      disabled = options?.showConflictReason
        ? `Conflicts with: ${conflictNames}`
        : `Alternative to ${conflictNames} (already selected)`;
      name = colors.muted(`${module.name} (incompatible)`);
      description = `${colors.muted('⚠')} ${disabled}`;
    }

    choices.push({
      name,
      value: module.id,
      description,
      disabled: isConflicting ? disabled : false,
      checked: isSelected || (isPreselected && !isConflicting),
    });
  }

  return choices;
}

/**
 * Validate selection doesn't contain mutually exclusive modules
 *
 * @param selectedIds - Selected module IDs
 * @param allModules - All available modules
 * @returns Array of conflict pairs if any exist
 */
export function validateNoConflicts(
  selectedIds: string[],
  allModules: ModuleDefinition[]
): Array<{ selected: string; conflictsWith: string }> {
  const conflicts: Array<{ selected: string; conflictsWith: string }> = [];

  for (const id of selectedIds) {
    const module = allModules.find((m) => m.id === id);
    if (!module?.alternativeTo) continue;

    for (const altId of module.alternativeTo) {
      if (selectedIds.includes(altId)) {
        // Avoid duplicate reports (A conflicts with B, B conflicts with A)
        const existingConflict = conflicts.find(
          (c) =>
            (c.selected === id && c.conflictsWith === altId) ||
            (c.selected === altId && c.conflictsWith === id)
        );
        if (!existingConflict) {
          conflicts.push({ selected: id, conflictsWith: altId });
        }
      }
    }
  }

  return conflicts;
}

/**
 * Group modules by their mutual exclusivity groups
 * Modules that are alternatives to each other are in the same group
 *
 * @param modules - All modules to group
 * @returns Map of group ID to module IDs in that group
 */
export function groupByExclusivity(modules: ModuleDefinition[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  const processedIds = new Set<string>();

  for (const module of modules) {
    if (processedIds.has(module.id)) continue;

    // Start a new group with this module
    const groupMembers = new Set<string>([module.id]);

    // Add all alternatives transitively
    const toProcess = [...(module.alternativeTo || [])];
    while (toProcess.length > 0) {
      const altId = toProcess.pop();
      if (!altId || groupMembers.has(altId)) continue;

      const altModule = modules.find((m) => m.id === altId);
      if (altModule) {
        groupMembers.add(altId);
        // Add this module's alternatives too (transitive)
        for (const transitiveAlt of altModule.alternativeTo || []) {
          if (!groupMembers.has(transitiveAlt)) {
            toProcess.push(transitiveAlt);
          }
        }
      }
    }

    // If group has more than 1 member, it's a real exclusivity group
    if (groupMembers.size > 1) {
      // Use alphabetically first ID as group name
      const sortedMembers = Array.from(groupMembers).sort();
      const groupId = `exclusivity-group-${sortedMembers[0]}`;
      groups.set(groupId, sortedMembers);

      // Mark all as processed
      for (const memberId of groupMembers) {
        processedIds.add(memberId);
      }
    } else {
      processedIds.add(module.id);
    }
  }

  return groups;
}

/**
 * Get a human-readable description of an exclusivity group
 */
export function getExclusivityGroupDescription(
  groupMembers: string[],
  allModules: ModuleDefinition[]
): string {
  const names = groupMembers.map((id) => allModules.find((m) => m.id === id)?.name || id).sort();

  if (names.length === 2) {
    return `${names[0]} and ${names[1]} are alternatives (choose one)`;
  }
  return `Choose one from: ${names.join(', ')}`;
}
