/**
 * Module resolver - resolves module dependencies and order
 */

import type { ModuleCategory, ModuleDefinition, ModuleRegistry } from '../../types/modules.js';
import { getAllModules, getModule } from './registry.js';

export interface ResolvedModule extends ModuleDefinition {
  resolvedDependencies: string[];
  installOrder: number;
}

export interface ResolutionResult {
  resolved: ResolvedModule[];
  unresolved: string[];
  circular: string[];
}

/**
 * Resolve dependencies for selected modules
 */
export function resolveModules(
  registry: ModuleRegistry,
  category: ModuleCategory,
  selectedIds: string[]
): ResolutionResult {
  const resolved: Map<string, ResolvedModule> = new Map();
  const unresolved: string[] = [];
  const circular: string[] = [];
  const visiting = new Set<string>();
  let order = 0;

  function visit(id: string): boolean {
    if (resolved.has(id)) return true;

    if (visiting.has(id)) {
      circular.push(id);
      return false;
    }

    const module = getModule(registry, category, id);
    if (!module) {
      unresolved.push(id);
      return false;
    }

    visiting.add(id);

    // Resolve dependencies first
    const resolvedDeps: string[] = [];
    for (const depId of module.dependencies || []) {
      if (visit(depId)) {
        resolvedDeps.push(depId);
      }
    }

    visiting.delete(id);

    // Add this module
    resolved.set(id, {
      ...module,
      resolvedDependencies: resolvedDeps,
      installOrder: order++,
    });

    return true;
  }

  // Visit all selected modules
  for (const id of selectedIds) {
    visit(id);
  }

  return {
    resolved: Array.from(resolved.values()).sort((a, b) => a.installOrder - b.installOrder),
    unresolved,
    circular,
  };
}

/**
 * Resolve all dependencies for a set of modules across all categories
 */
export function resolveAllModules(
  registry: ModuleRegistry,
  selection: Record<ModuleCategory, string[]>
): Record<ModuleCategory, ResolutionResult> {
  const categories: ModuleCategory[] = ['agents', 'skills', 'commands', 'docs'];
  const results: Record<ModuleCategory, ResolutionResult> = {} as Record<
    ModuleCategory,
    ResolutionResult
  >;

  for (const category of categories) {
    results[category] = resolveModules(registry, category, selection[category] || []);
  }

  return results;
}

/**
 * Get modules that depend on a given module
 */
export function getDependents(
  registry: ModuleRegistry,
  category: ModuleCategory,
  moduleId: string
): ModuleDefinition[] {
  return registry[category].filter((m) => m.dependencies?.includes(moduleId));
}

/**
 * Check if removing a module would break dependencies
 */
export function checkRemovalImpact(
  registry: ModuleRegistry,
  category: ModuleCategory,
  moduleId: string,
  installedIds: string[]
): { canRemove: boolean; blockedBy: string[] } {
  const dependents = getDependents(registry, category, moduleId);
  const blockedBy = dependents.filter((d) => installedIds.includes(d.id)).map((d) => d.id);

  return {
    canRemove: blockedBy.length === 0,
    blockedBy,
  };
}

/**
 * Get suggested modules based on installed ones
 */
export function getSuggestedModules(
  registry: ModuleRegistry,
  installedModules: Record<ModuleCategory, string[]>
): ModuleDefinition[] {
  const suggestions: ModuleDefinition[] = [];
  const allInstalled = new Set<string>();

  // Collect all installed module IDs
  for (const ids of Object.values(installedModules)) {
    for (const id of ids) {
      allInstalled.add(id);
    }
  }

  // Find modules with tags that match installed modules
  const allModules = getAllModules(registry);
  const installedTags = new Set<string>();

  for (const module of allModules) {
    if (allInstalled.has(module.id)) {
      for (const tag of module.tags || []) {
        installedTags.add(tag);
      }
    }
  }

  // Suggest modules with matching tags that aren't installed
  for (const module of allModules) {
    if (allInstalled.has(module.id)) continue;

    const hasMatchingTag = (module.tags || []).some((tag) => installedTags.has(tag));
    if (hasMatchingTag) {
      suggestions.push(module);
    }
  }

  return suggestions;
}

/**
 * Sort modules by install order (dependencies first)
 */
export function sortByDependencies(modules: ModuleDefinition[]): ModuleDefinition[] {
  const sorted: ModuleDefinition[] = [];
  const visited = new Set<string>();
  const moduleMap = new Map(modules.map((m) => [m.id, m]));

  function visit(module: ModuleDefinition): void {
    if (visited.has(module.id)) return;
    visited.add(module.id);

    // Visit dependencies first
    for (const depId of module.dependencies || []) {
      const dep = moduleMap.get(depId);
      if (dep) {
        visit(dep);
      }
    }

    sorted.push(module);
  }

  for (const module of modules) {
    visit(module);
  }

  return sorted;
}
