/**
 * Bundle resolver - resolves bundles to individual modules
 */

import {
  BUNDLE_CATEGORY_NAMES,
  getAllBundles,
  getBundleById,
  getBundlesGroupedByCategory,
} from '../../constants/bundles.js';
import type {
  BundleDefinition,
  BundleSelectionResult,
  ResolvedBundle,
} from '../../types/bundles.js';
import type { ModuleSelectionResult } from '../../types/modules.js';

/**
 * Resolve a bundle to its constituent modules
 */
export function resolveBundle(bundle: BundleDefinition): ResolvedBundle {
  const modules: ResolvedBundle['modules'] = {
    agents: [],
    skills: [],
    commands: [],
    docs: [],
  };

  for (const moduleRef of bundle.modules) {
    switch (moduleRef.category) {
      case 'agents':
        modules.agents.push(moduleRef.id);
        break;
      case 'skills':
        modules.skills.push(moduleRef.id);
        break;
      case 'commands':
        modules.commands.push(moduleRef.id);
        break;
      case 'docs':
        modules.docs.push(moduleRef.id);
        break;
    }
  }

  return {
    bundle,
    modules,
  };
}

/**
 * Resolve multiple bundles to a combined module selection
 */
export function resolveBundles(bundleIds: string[]): ModuleSelectionResult {
  const result: ModuleSelectionResult = {
    agents: [],
    skills: [],
    commands: [],
    docs: [],
  };

  const seenModules = {
    agents: new Set<string>(),
    skills: new Set<string>(),
    commands: new Set<string>(),
    docs: new Set<string>(),
  };

  for (const bundleId of bundleIds) {
    const bundle = getBundleById(bundleId);
    if (!bundle) continue;

    const resolved = resolveBundle(bundle);

    // Add modules without duplicates
    for (const id of resolved.modules.agents) {
      if (!seenModules.agents.has(id)) {
        seenModules.agents.add(id);
        result.agents.push(id);
      }
    }
    for (const id of resolved.modules.skills) {
      if (!seenModules.skills.has(id)) {
        seenModules.skills.add(id);
        result.skills.push(id);
      }
    }
    for (const id of resolved.modules.commands) {
      if (!seenModules.commands.has(id)) {
        seenModules.commands.add(id);
        result.commands.push(id);
      }
    }
    for (const id of resolved.modules.docs) {
      if (!seenModules.docs.has(id)) {
        seenModules.docs.add(id);
        result.docs.push(id);
      }
    }
  }

  return result;
}

/**
 * Merge bundle selection with additional individual modules
 */
export function mergeBundleSelection(
  bundleResult: BundleSelectionResult
): ModuleSelectionResult {
  // Start with resolved bundles
  const result = resolveBundles(bundleResult.selectedBundles);

  // Track what we have
  const seenModules = {
    agents: new Set(result.agents),
    skills: new Set(result.skills),
    commands: new Set(result.commands),
    docs: new Set(result.docs),
  };

  // Add additional modules without duplicates
  for (const id of bundleResult.additionalModules.agents) {
    if (!seenModules.agents.has(id)) {
      result.agents.push(id);
    }
  }
  for (const id of bundleResult.additionalModules.skills) {
    if (!seenModules.skills.has(id)) {
      result.skills.push(id);
    }
  }
  for (const id of bundleResult.additionalModules.commands) {
    if (!seenModules.commands.has(id)) {
      result.commands.push(id);
    }
  }
  for (const id of bundleResult.additionalModules.docs) {
    if (!seenModules.docs.has(id)) {
      result.docs.push(id);
    }
  }

  return result;
}

/**
 * Find bundles that contain a specific module
 */
export function findBundlesContainingModule(
  moduleId: string,
  category: 'agents' | 'skills' | 'commands' | 'docs'
): BundleDefinition[] {
  return getAllBundles().filter((bundle) =>
    bundle.modules.some((m) => m.id === moduleId && m.category === category)
  );
}

/**
 * Get suggested bundles based on selected modules
 */
export function getSuggestedBundles(selectedModules: ModuleSelectionResult): BundleDefinition[] {
  const allBundles = getAllBundles();
  const suggestions: BundleDefinition[] = [];

  for (const bundle of allBundles) {
    const resolved = resolveBundle(bundle);

    // Check overlap with selected modules
    let matchCount = 0;
    let totalInBundle = 0;

    for (const agentId of resolved.modules.agents) {
      totalInBundle++;
      if (selectedModules.agents.includes(agentId)) matchCount++;
    }
    for (const skillId of resolved.modules.skills) {
      totalInBundle++;
      if (selectedModules.skills.includes(skillId)) matchCount++;
    }
    for (const commandId of resolved.modules.commands) {
      totalInBundle++;
      if (selectedModules.commands.includes(commandId)) matchCount++;
    }
    for (const docId of resolved.modules.docs) {
      totalInBundle++;
      if (selectedModules.docs.includes(docId)) matchCount++;
    }

    // Suggest if at least 30% overlap but not 100%
    const overlapRatio = totalInBundle > 0 ? matchCount / totalInBundle : 0;
    if (overlapRatio >= 0.3 && overlapRatio < 1.0) {
      suggestions.push(bundle);
    }
  }

  return suggestions;
}

/**
 * Format bundle for display
 */
export function formatBundleForDisplay(bundle: BundleDefinition): string {
  const resolved = resolveBundle(bundle);
  const parts: string[] = [];

  if (resolved.modules.agents.length > 0) {
    parts.push(`${resolved.modules.agents.length} agents`);
  }
  if (resolved.modules.skills.length > 0) {
    parts.push(`${resolved.modules.skills.length} skills`);
  }
  if (resolved.modules.commands.length > 0) {
    parts.push(`${resolved.modules.commands.length} commands`);
  }
  if (resolved.modules.docs.length > 0) {
    parts.push(`${resolved.modules.docs.length} docs`);
  }

  return `${bundle.name} (${parts.join(', ')})`;
}

/**
 * Get bundle category display name
 */
export function getBundleCategoryName(category: string): string {
  return BUNDLE_CATEGORY_NAMES[category] ?? category;
}

/**
 * Export convenience access to constants
 */
export { getAllBundles, getBundleById, getBundlesGroupedByCategory, BUNDLE_CATEGORY_NAMES };
