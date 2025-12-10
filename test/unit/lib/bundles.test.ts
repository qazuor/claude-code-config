/**
 * Tests for bundle resolver
 */

import { describe, expect, it } from 'vitest';
import {
  findBundlesContainingModule,
  formatBundleForDisplay,
  getAllBundles,
  getBundleById,
  getBundleCategoryName,
  getBundlesGroupedByCategory,
  getSuggestedBundles,
  mergeBundleSelection,
  resolveBundle,
  resolveBundles,
} from '../../../src/lib/bundles/resolver.js';
import type { BundleDefinition, BundleSelectionResult } from '../../../src/types/bundles.js';
import type { ModuleSelectionResult } from '../../../src/types/modules.js';

describe('bundle resolver', () => {
  describe('getAllBundles', () => {
    it('should return all bundles', () => {
      const bundles = getAllBundles();
      expect(Array.isArray(bundles)).toBe(true);
      expect(bundles.length).toBeGreaterThan(0);
    });

    it('should return bundles with required fields', () => {
      const bundles = getAllBundles();
      for (const bundle of bundles) {
        expect(bundle.id).toBeDefined();
        expect(bundle.name).toBeDefined();
        expect(bundle.description).toBeDefined();
        expect(bundle.category).toBeDefined();
        expect(bundle.modules).toBeDefined();
        expect(Array.isArray(bundle.modules)).toBe(true);
      }
    });
  });

  describe('getBundleById', () => {
    it('should return bundle by ID', () => {
      const bundle = getBundleById('react-tanstack-stack');
      expect(bundle).toBeDefined();
      expect(bundle?.name).toBe('React + TanStack Stack');
    });

    it('should return undefined for unknown ID', () => {
      const bundle = getBundleById('unknown-bundle');
      expect(bundle).toBeUndefined();
    });
  });

  describe('getBundlesGroupedByCategory', () => {
    it('should return bundles grouped by category', () => {
      const grouped = getBundlesGroupedByCategory();
      expect(typeof grouped).toBe('object');

      // Should have some categories
      const categories = Object.keys(grouped);
      expect(categories.length).toBeGreaterThan(0);

      // Each category should have bundles
      for (const category of categories) {
        expect(Array.isArray(grouped[category])).toBe(true);
        expect(grouped[category].length).toBeGreaterThan(0);

        // All bundles in category should have matching category
        for (const bundle of grouped[category]) {
          expect(bundle.category).toBe(category);
        }
      }
    });
  });

  describe('resolveBundle', () => {
    it('should resolve bundle to modules', () => {
      const bundle = getBundleById('react-tanstack-stack');
      expect(bundle).toBeDefined();

      const resolved = resolveBundle(bundle!);
      expect(resolved.bundle).toBe(bundle);
      expect(resolved.modules.agents.length).toBeGreaterThan(0);
      expect(resolved.modules.skills.length).toBeGreaterThan(0);
    });

    it('should categorize modules correctly', () => {
      const bundle: BundleDefinition = {
        id: 'test-bundle',
        name: 'Test Bundle',
        description: 'Test',
        category: 'testing',
        modules: [
          { id: 'agent1', category: 'agents' },
          { id: 'skill1', category: 'skills' },
          { id: 'cmd1', category: 'commands' },
          { id: 'doc1', category: 'docs' },
        ],
      };

      const resolved = resolveBundle(bundle);
      expect(resolved.modules.agents).toEqual(['agent1']);
      expect(resolved.modules.skills).toEqual(['skill1']);
      expect(resolved.modules.commands).toEqual(['cmd1']);
      expect(resolved.modules.docs).toEqual(['doc1']);
    });
  });

  describe('resolveBundles', () => {
    it('should resolve multiple bundles', () => {
      const result = resolveBundles(['testing-minimal', 'git-workflow']);

      expect(result.skills.length).toBeGreaterThan(0);
      expect(result.commands.length).toBeGreaterThan(0);
    });

    it('should deduplicate modules', () => {
      // Both bundles might share some modules
      const result = resolveBundles(['testing-complete', 'quality-complete']);

      // Should not have duplicates
      const uniqueSkills = new Set(result.skills);
      expect(uniqueSkills.size).toBe(result.skills.length);
    });

    it('should handle unknown bundle IDs gracefully', () => {
      const result = resolveBundles(['unknown-bundle', 'testing-minimal']);

      // Should still resolve the valid bundle
      expect(result.skills.length).toBeGreaterThan(0);
    });

    it('should return empty result for empty input', () => {
      const result = resolveBundles([]);

      expect(result.agents).toEqual([]);
      expect(result.skills).toEqual([]);
      expect(result.commands).toEqual([]);
      expect(result.docs).toEqual([]);
    });
  });

  describe('mergeBundleSelection', () => {
    it('should merge bundles with additional modules', () => {
      const selection: BundleSelectionResult = {
        selectedBundles: ['git-workflow'],
        additionalModules: {
          agents: ['tech-lead'],
          skills: ['tdd-methodology'],
          commands: [],
          docs: [],
        },
      };

      const result = mergeBundleSelection(selection);

      // Should have bundle modules
      expect(result.skills).toContain('git-commit-helper');
      expect(result.commands).toContain('commit');

      // Should have additional modules
      expect(result.agents).toContain('tech-lead');
      expect(result.skills).toContain('tdd-methodology');
    });

    it('should not duplicate modules', () => {
      const selection: BundleSelectionResult = {
        selectedBundles: ['git-workflow'],
        additionalModules: {
          agents: [],
          skills: ['git-commit-helper'], // Already in bundle
          commands: [],
          docs: [],
        },
      };

      const result = mergeBundleSelection(selection);

      // Should only have one instance
      const gitCommitCount = result.skills.filter((s) => s === 'git-commit-helper').length;
      expect(gitCommitCount).toBe(1);
    });
  });

  describe('findBundlesContainingModule', () => {
    it('should find bundles containing a module', () => {
      const bundles = findBundlesContainingModule('react-senior-dev', 'agents');

      expect(bundles.length).toBeGreaterThan(0);

      // All returned bundles should contain the module
      for (const bundle of bundles) {
        const hasModule = bundle.modules.some(
          (m) => m.id === 'react-senior-dev' && m.category === 'agents'
        );
        expect(hasModule).toBe(true);
      }
    });

    it('should return empty array for unknown module', () => {
      const bundles = findBundlesContainingModule('unknown-module', 'agents');
      expect(bundles).toEqual([]);
    });
  });

  describe('getSuggestedBundles', () => {
    it('should suggest bundles based on selected modules', () => {
      const selected: ModuleSelectionResult = {
        agents: ['react-senior-dev'],
        skills: ['web-app-testing'],
        commands: [],
        docs: [],
      };

      const suggestions = getSuggestedBundles(selected);

      // Should suggest bundles with partial overlap
      // (not 100% match since that would mean already selected)
      for (const bundle of suggestions) {
        const resolved = resolveBundle(bundle);
        const totalModules =
          resolved.modules.agents.length +
          resolved.modules.skills.length +
          resolved.modules.commands.length +
          resolved.modules.docs.length;

        let matchCount = 0;
        for (const id of resolved.modules.agents) {
          if (selected.agents.includes(id)) matchCount++;
        }
        for (const id of resolved.modules.skills) {
          if (selected.skills.includes(id)) matchCount++;
        }

        const ratio = matchCount / totalModules;
        expect(ratio).toBeGreaterThanOrEqual(0.3);
        expect(ratio).toBeLessThan(1.0);
      }
    });

    it('should return empty for no selection', () => {
      const selected: ModuleSelectionResult = {
        agents: [],
        skills: [],
        commands: [],
        docs: [],
      };

      const suggestions = getSuggestedBundles(selected);
      expect(suggestions).toEqual([]);
    });
  });

  describe('formatBundleForDisplay', () => {
    it('should format bundle with module counts', () => {
      const bundle = getBundleById('react-tanstack-stack');
      expect(bundle).toBeDefined();

      const formatted = formatBundleForDisplay(bundle!);

      expect(formatted).toContain('React + TanStack Stack');
      expect(formatted).toContain('agents');
      expect(formatted).toContain('skills');
    });

    it('should handle bundles with only some module types', () => {
      const bundle: BundleDefinition = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        category: 'testing',
        modules: [{ id: 'skill1', category: 'skills' }],
      };

      const formatted = formatBundleForDisplay(bundle);

      expect(formatted).toContain('1 skills');
      expect(formatted).not.toContain('agents');
    });
  });

  describe('getBundleCategoryName', () => {
    it('should return display name for known category', () => {
      expect(getBundleCategoryName('stack')).toBe('Tech Stacks');
      expect(getBundleCategoryName('testing')).toBe('Testing');
      expect(getBundleCategoryName('quality')).toBe('Quality Assurance');
    });

    it('should return category as-is for unknown category', () => {
      expect(getBundleCategoryName('unknown')).toBe('unknown');
    });
  });
});
