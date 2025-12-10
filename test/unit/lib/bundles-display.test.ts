/**
 * Tests for bundle display utilities
 */

import { describe, expect, it } from 'vitest';
import {
  formatBundleCompact,
  formatBundleVisualDisplay,
  formatValidationWarnings,
} from '../../../src/lib/bundles/display.js';
import { getBundleById } from '../../../src/lib/bundles/resolver.js';
import type { BundleDefinition, BundleValidationResult } from '../../../src/types/bundles.js';

describe('bundle display', () => {
  describe('formatBundleVisualDisplay', () => {
    it('should format planning-complete bundle with full details', () => {
      const bundle = getBundleById('planning-complete');
      expect(bundle).toBeDefined();
      if (!bundle) return;

      const lines = formatBundleVisualDisplay(bundle);

      // Should have box borders
      expect(lines[0]).toContain('┌');
      expect(lines[lines.length - 1]).toContain('└');

      // Should include bundle name
      const content = lines.join('\n');
      expect(content).toContain('Complete Planning Workflow');

      // Should include responsibilities if defined
      expect(content).toContain('RESPONSIBILITIES');
      expect(content).toContain('Feature planning from requirements');

      // Should include use cases
      expect(content).toContain('USE CASES');

      // Should include agents with roles
      expect(content).toContain('AGENTS');
      expect(content).toContain('product-functional');
      expect(content).toContain('Product Requirements');

      // Should include commands with usage
      expect(content).toContain('COMMANDS');
      expect(content).toContain('/start-feature-plan');

      // Should include docs
      expect(content).toContain('DOCS');
      expect(content).toContain('decision-tree');

      // Should include complexity
      expect(content).toContain('Complexity');
      expect(content).toContain('Comprehensive');
    });

    it('should format testing-complete bundle with skills details', () => {
      const bundle = getBundleById('testing-complete');
      expect(bundle).toBeDefined();
      if (!bundle) return;

      const lines = formatBundleVisualDisplay(bundle);
      const content = lines.join('\n');

      // Should include skills with purposes
      expect(content).toContain('SKILLS');
      expect(content).toContain('tdd-methodology');
      expect(content).toContain('TDD workflow');

      // Should include tech stack
      expect(content).toContain('Tech:');
      expect(content).toContain('Vitest');
    });

    it('should format minimal bundle without moduleDetails', () => {
      const bundle: BundleDefinition = {
        id: 'test-bundle',
        name: 'Test Bundle',
        description: 'A test bundle for display testing',
        category: 'testing',
        modules: [
          { id: 'agent1', category: 'agents' },
          { id: 'skill1', category: 'skills' },
        ],
        tags: ['test'],
      };

      const lines = formatBundleVisualDisplay(bundle);
      const content = lines.join('\n');

      // Should still work without moduleDetails
      expect(content).toContain('Test Bundle');
      expect(content).toContain('A test bundle');
      expect(content).toContain('AGENTS');
      expect(content).toContain('agent1');
    });

    it('should respect custom width', () => {
      const bundle = getBundleById('git-workflow');
      expect(bundle).toBeDefined();
      if (!bundle) return;

      const narrowLines = formatBundleVisualDisplay(bundle, 50);
      const wideLines = formatBundleVisualDisplay(bundle, 100);

      // Narrow should have shorter lines
      expect(narrowLines[0].length).toBeLessThan(wideLines[0].length);
    });
  });

  describe('formatBundleCompact', () => {
    it('should format bundle with module counts', () => {
      const bundle = getBundleById('planning-complete');
      expect(bundle).toBeDefined();
      if (!bundle) return;

      const compact = formatBundleCompact(bundle);

      expect(compact).toContain('Complete Planning Workflow');
      expect(compact).toContain('agents');
      expect(compact).toContain('commands');
      expect(compact).toContain('docs');
    });

    it('should only show categories with modules', () => {
      const bundle: BundleDefinition = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        category: 'testing',
        modules: [{ id: 'skill1', category: 'skills' }],
      };

      const compact = formatBundleCompact(bundle);

      expect(compact).toContain('1 skills');
      expect(compact).not.toContain('agents');
      expect(compact).not.toContain('commands');
    });
  });

  describe('formatValidationWarnings', () => {
    it('should return empty array when no warnings or errors', () => {
      const validation: BundleValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
        autoIncluded: [],
      };

      const lines = formatValidationWarnings(validation);
      expect(lines).toHaveLength(0);
    });

    it('should format errors as required dependencies', () => {
      const validation: BundleValidationResult = {
        valid: false,
        errors: [
          {
            moduleId: 'qa-engineer',
            moduleCategory: 'agents',
            dependencyId: 'testing-standards',
            dependencyCategory: 'docs',
            message: 'qa-engineer requires testing-standards',
          },
        ],
        warnings: [],
        autoIncluded: [{ id: 'testing-standards', category: 'docs' }],
      };

      const lines = formatValidationWarnings(validation);
      const content = lines.join('\n');

      expect(content).toContain('REQUIRED');
      expect(content).toContain('qa-engineer requires testing-standards');
    });

    it('should format warnings as recommended', () => {
      const validation: BundleValidationResult = {
        valid: true,
        errors: [],
        warnings: [
          {
            moduleId: 'tech-lead',
            moduleCategory: 'agents',
            dependencyId: 'architecture-patterns',
            dependencyCategory: 'docs',
            message: 'tech-lead works better with architecture-patterns',
          },
        ],
        autoIncluded: [],
      };

      const lines = formatValidationWarnings(validation);
      const content = lines.join('\n');

      expect(content).toContain('RECOMMENDED');
      expect(content).toContain('tech-lead works better with architecture-patterns');
    });

    it('should show both errors and warnings', () => {
      const validation: BundleValidationResult = {
        valid: false,
        errors: [
          {
            moduleId: 'qa-engineer',
            moduleCategory: 'agents',
            dependencyId: 'testing-standards',
            dependencyCategory: 'docs',
            message: 'qa-engineer requires testing-standards',
          },
        ],
        warnings: [
          {
            moduleId: 'tech-lead',
            moduleCategory: 'agents',
            dependencyId: 'glossary',
            dependencyCategory: 'docs',
            message: 'tech-lead works better with glossary',
          },
        ],
        autoIncluded: [{ id: 'testing-standards', category: 'docs' }],
      };

      const lines = formatValidationWarnings(validation);
      const content = lines.join('\n');

      expect(content).toContain('REQUIRED');
      expect(content).toContain('RECOMMENDED');
    });
  });
});
