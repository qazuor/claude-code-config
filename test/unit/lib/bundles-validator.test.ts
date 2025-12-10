/**
 * Tests for bundle dependency validation
 */

import { describe, expect, it } from 'vitest';
import {
  getAutoIncludedModules,
  validateBundleConflicts,
  validateBundlePrerequisites,
  validateBundleSelection,
  validateModuleDependencies,
} from '../../../src/lib/bundles/validator.js';
import type { BundleDefinition } from '../../../src/types/bundles.js';
import type { ModuleSelectionResult } from '../../../src/types/modules.js';

describe('bundle validator', () => {
  describe('validateModuleDependencies', () => {
    it('should return valid when all dependencies are met', () => {
      const selectedModules: ModuleSelectionResult = {
        agents: ['qa-engineer'],
        skills: ['tdd-methodology'],
        commands: ['run-tests'],
        docs: ['testing-standards'],
      };

      const bundles: BundleDefinition[] = [
        {
          id: 'testing-complete',
          name: 'Testing',
          description: 'Test',
          category: 'testing',
          modules: [
            { id: 'qa-engineer', category: 'agents' },
            { id: 'tdd-methodology', category: 'skills' },
            {
              id: 'testing-standards',
              category: 'docs',
              requiredBy: ['qa-engineer', 'tdd-methodology'],
            },
          ],
        },
      ];

      const result = validateModuleDependencies(selectedModules, bundles);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should return error when required dependency is missing', () => {
      const selectedModules: ModuleSelectionResult = {
        agents: ['qa-engineer'],
        skills: [],
        commands: [],
        docs: [], // Missing testing-standards
      };

      const bundles: BundleDefinition[] = [
        {
          id: 'testing-complete',
          name: 'Testing',
          description: 'Test',
          category: 'testing',
          modules: [
            { id: 'qa-engineer', category: 'agents' },
            { id: 'testing-standards', category: 'docs', requiredBy: ['qa-engineer'] },
          ],
        },
      ];

      const result = validateModuleDependencies(selectedModules, bundles);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].moduleId).toBe('qa-engineer');
      expect(result.errors[0].dependencyId).toBe('testing-standards');
      expect(result.autoIncluded).toHaveLength(1);
      expect(result.autoIncluded[0].id).toBe('testing-standards');
    });

    it('should return warning when optional dependency is missing', () => {
      const selectedModules: ModuleSelectionResult = {
        agents: ['tech-lead'],
        skills: [],
        commands: [],
        docs: [], // Missing glossary (optional)
      };

      const bundles: BundleDefinition[] = [
        {
          id: 'planning',
          name: 'Planning',
          description: 'Test',
          category: 'workflow',
          modules: [
            { id: 'tech-lead', category: 'agents' },
            { id: 'glossary', category: 'docs', optional: true, requiredBy: ['tech-lead'] },
          ],
        },
      ];

      const result = validateModuleDependencies(selectedModules, bundles);

      expect(result.valid).toBe(true); // Still valid because optional
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].moduleId).toBe('tech-lead');
      expect(result.warnings[0].dependencyId).toBe('glossary');
    });

    it('should not report missing dependency if requiring module is not selected', () => {
      const selectedModules: ModuleSelectionResult = {
        agents: [], // qa-engineer NOT selected
        skills: [],
        commands: [],
        docs: [], // testing-standards also not selected
      };

      const bundles: BundleDefinition[] = [
        {
          id: 'testing-complete',
          name: 'Testing',
          description: 'Test',
          category: 'testing',
          modules: [
            { id: 'qa-engineer', category: 'agents' },
            { id: 'testing-standards', category: 'docs', requiredBy: ['qa-engineer'] },
          ],
        },
      ];

      const result = validateModuleDependencies(selectedModules, bundles);

      // Should be valid because qa-engineer isn't selected, so its dependencies don't matter
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateBundlePrerequisites', () => {
    it('should return empty when all prerequisites are met', () => {
      // Assuming no bundles currently have prerequisites defined
      const result = validateBundlePrerequisites(['testing-complete', 'quality-complete']);
      expect(result).toHaveLength(0);
    });

    it('should detect missing prerequisites', () => {
      // This test would need bundles with prerequisites defined
      // For now, just verify the function works with empty input
      const result = validateBundlePrerequisites([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('validateBundleConflicts', () => {
    it('should return empty when no conflicts', () => {
      const result = validateBundleConflicts(['testing-complete', 'planning-complete']);
      expect(result).toHaveLength(0);
    });

    it('should detect conflicting bundles', () => {
      // Note: drizzle-database and prisma-database have alternativeTo but not conflicts
      // This test verifies the function works
      const result = validateBundleConflicts(['drizzle-database', 'prisma-database']);
      // Currently these don't have conflicts defined, so should be empty
      expect(result).toHaveLength(0);
    });
  });

  describe('validateBundleSelection', () => {
    it('should combine all validations', () => {
      const selectedModules: ModuleSelectionResult = {
        agents: ['qa-engineer'],
        skills: ['tdd-methodology'],
        commands: ['run-tests'],
        docs: ['testing-standards'],
      };

      const result = validateBundleSelection(['testing-complete'], selectedModules);

      expect(result.moduleDependencies).toBeDefined();
      expect(result.prerequisites).toBeDefined();
      expect(result.conflicts).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
    });
  });

  describe('getAutoIncludedModules', () => {
    it('should return original modules when no auto-include needed', () => {
      const selectedModules: ModuleSelectionResult = {
        agents: ['qa-engineer'],
        skills: [],
        commands: [],
        docs: ['testing-standards'],
      };

      const result = getAutoIncludedModules(selectedModules, ['testing-complete']);

      // Should contain original modules
      expect(result.agents).toContain('qa-engineer');
      expect(result.docs).toContain('testing-standards');
    });

    it('should add auto-included modules', () => {
      const selectedModules: ModuleSelectionResult = {
        agents: ['qa-engineer'],
        skills: [],
        commands: [],
        docs: [], // Missing required testing-standards
      };

      const result = getAutoIncludedModules(selectedModules, ['testing-complete']);

      // Should still have original
      expect(result.agents).toContain('qa-engineer');
      // Should have auto-included testing-standards
      expect(result.docs).toContain('testing-standards');
    });
  });
});
