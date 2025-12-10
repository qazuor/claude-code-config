/**
 * Bundle dependency validation system
 * Validates module dependencies and bundle prerequisites/conflicts
 */

import type {
  BundleConflict,
  BundleDefinition,
  BundleModuleRef,
  BundlePrerequisiteMissing,
  BundleValidationResult,
  DependencyError,
  DependencyWarning,
} from '../../types/bundles.js';
import type { ModuleSelectionResult } from '../../types/modules.js';
import { getBundleById } from './resolver.js';

/**
 * Validate module dependencies within a bundle selection
 * Checks that all required modules are present and warns about optional ones
 */
export function validateModuleDependencies(
  selectedModules: ModuleSelectionResult,
  bundles: BundleDefinition[]
): BundleValidationResult {
  const errors: DependencyError[] = [];
  const warnings: DependencyWarning[] = [];
  const autoIncluded: BundleModuleRef[] = [];

  // Build a set of all selected module IDs for quick lookup
  const selectedIds = new Set([
    ...selectedModules.agents,
    ...selectedModules.skills,
    ...selectedModules.commands,
    ...selectedModules.docs,
  ]);

  // Check each bundle's module dependencies
  for (const bundle of bundles) {
    for (const moduleRef of bundle.modules) {
      // Skip if this module has no requiredBy dependencies
      if (!moduleRef.requiredBy || moduleRef.requiredBy.length === 0) {
        continue;
      }

      // Check if any module that requires this one is selected
      for (const requiringModuleId of moduleRef.requiredBy) {
        if (!selectedIds.has(requiringModuleId)) {
          continue; // The requiring module isn't selected, so no dependency issue
        }

        // The requiring module is selected - check if the dependency is also selected
        if (!selectedIds.has(moduleRef.id)) {
          if (moduleRef.optional) {
            // Optional dependency - just warn
            warnings.push({
              moduleId: requiringModuleId,
              moduleCategory: findModuleCategory(requiringModuleId, bundle),
              dependencyId: moduleRef.id,
              dependencyCategory: moduleRef.category,
              message: `${requiringModuleId} works better with ${moduleRef.id}`,
            });
          } else {
            // Required dependency - error and auto-include
            errors.push({
              moduleId: requiringModuleId,
              moduleCategory: findModuleCategory(requiringModuleId, bundle),
              dependencyId: moduleRef.id,
              dependencyCategory: moduleRef.category,
              message: `${requiringModuleId} requires ${moduleRef.id}`,
            });

            // Auto-include the missing required module
            if (!autoIncluded.some((m) => m.id === moduleRef.id)) {
              autoIncluded.push({
                id: moduleRef.id,
                category: moduleRef.category,
              });
            }
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    autoIncluded,
  };
}

/**
 * Find the category of a module within a bundle
 */
function findModuleCategory(
  moduleId: string,
  bundle: BundleDefinition
): 'agents' | 'skills' | 'commands' | 'docs' {
  const moduleRef = bundle.modules.find((m) => m.id === moduleId);
  return moduleRef?.category ?? 'agents';
}

/**
 * Validate bundle prerequisites
 * Checks that all prerequisite bundles are selected
 */
export function validateBundlePrerequisites(
  selectedBundleIds: string[]
): BundlePrerequisiteMissing[] {
  const missing: BundlePrerequisiteMissing[] = [];
  const selectedSet = new Set(selectedBundleIds);

  for (const bundleId of selectedBundleIds) {
    const bundle = getBundleById(bundleId);
    if (!bundle?.prerequisites) continue;

    for (const prereqId of bundle.prerequisites) {
      if (!selectedSet.has(prereqId)) {
        missing.push({
          bundleId,
          prerequisiteId: prereqId,
          message: `${bundle.name} requires ${prereqId} bundle`,
        });
      }
    }
  }

  return missing;
}

/**
 * Validate bundle conflicts
 * Checks for mutually exclusive bundles
 */
export function validateBundleConflicts(selectedBundleIds: string[]): BundleConflict[] {
  const conflicts: BundleConflict[] = [];
  const selectedSet = new Set(selectedBundleIds);

  for (const bundleId of selectedBundleIds) {
    const bundle = getBundleById(bundleId);
    if (!bundle?.conflicts) continue;

    for (const conflictId of bundle.conflicts) {
      if (selectedSet.has(conflictId)) {
        // Avoid duplicate conflicts (A conflicts with B, B conflicts with A)
        const existingConflict = conflicts.find(
          (c) =>
            (c.bundleId === bundleId && c.conflictsWith === conflictId) ||
            (c.bundleId === conflictId && c.conflictsWith === bundleId)
        );

        if (!existingConflict) {
          const conflictingBundle = getBundleById(conflictId);
          conflicts.push({
            bundleId,
            conflictsWith: conflictId,
            reason: `${bundle.name} and ${conflictingBundle?.name ?? conflictId} are mutually exclusive`,
          });
        }
      }
    }
  }

  return conflicts;
}

/**
 * Full validation of bundle selection
 * Combines prerequisite, conflict, and dependency validation
 */
export function validateBundleSelection(
  selectedBundleIds: string[],
  selectedModules: ModuleSelectionResult
): {
  moduleDependencies: BundleValidationResult;
  prerequisites: BundlePrerequisiteMissing[];
  conflicts: BundleConflict[];
  isValid: boolean;
} {
  const selectedBundles = selectedBundleIds
    .map((id) => getBundleById(id))
    .filter((b): b is BundleDefinition => b !== undefined);

  const moduleDependencies = validateModuleDependencies(selectedModules, selectedBundles);
  const prerequisites = validateBundlePrerequisites(selectedBundleIds);
  const conflicts = validateBundleConflicts(selectedBundleIds);

  return {
    moduleDependencies,
    prerequisites,
    conflicts,
    isValid: moduleDependencies.valid && prerequisites.length === 0 && conflicts.length === 0,
  };
}

/**
 * Get all modules that should be auto-included based on dependencies
 */
export function getAutoIncludedModules(
  selectedModules: ModuleSelectionResult,
  selectedBundleIds: string[]
): ModuleSelectionResult {
  const selectedBundles = selectedBundleIds
    .map((id) => getBundleById(id))
    .filter((b): b is BundleDefinition => b !== undefined);

  const validation = validateModuleDependencies(selectedModules, selectedBundles);

  const result: ModuleSelectionResult = {
    agents: [...selectedModules.agents],
    skills: [...selectedModules.skills],
    commands: [...selectedModules.commands],
    docs: [...selectedModules.docs],
  };

  // Add auto-included modules
  for (const module of validation.autoIncluded) {
    const targetArray = result[module.category];
    if (!targetArray.includes(module.id)) {
      targetArray.push(module.id);
    }
  }

  return result;
}
