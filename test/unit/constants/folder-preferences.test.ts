import { describe, expect, it } from 'vitest';
import {
  BUNDLE_FOLDER_RECOMMENDATIONS,
  DEFAULT_FOLDER_PREFERENCES,
  DOCS_LOCATION_OPTIONS,
  GITHUB_WORKFLOW_TEMPLATES,
  PLANNING_LOCATION_OPTIONS,
  TEST_LOCATION_OPTIONS,
  TEST_PATTERN_OPTIONS,
  getFolderRecommendationsForBundles,
  getRecommendedWorkflows,
  getWorkflowsByCategory,
  mergeFolderPreferences,
} from '../../../src/constants/folder-preferences.js';

describe('folder-preferences constants', () => {
  describe('DEFAULT_FOLDER_PREFERENCES', () => {
    it('should have default test preferences', () => {
      expect(DEFAULT_FOLDER_PREFERENCES.tests).toBeDefined();
      expect(DEFAULT_FOLDER_PREFERENCES.tests?.location).toBe('test-folder-root');
      expect(DEFAULT_FOLDER_PREFERENCES.tests?.pattern).toBe('*.test.ts');
    });

    it('should have default planning preferences', () => {
      expect(DEFAULT_FOLDER_PREFERENCES.planning).toBeDefined();
      expect(DEFAULT_FOLDER_PREFERENCES.planning?.location).toBe('claude-sessions');
      expect(DEFAULT_FOLDER_PREFERENCES.planning?.commitToGit).toBe(false);
    });

    it('should have default docs preferences', () => {
      expect(DEFAULT_FOLDER_PREFERENCES.docs).toBeDefined();
      expect(DEFAULT_FOLDER_PREFERENCES.docs?.location).toBe('docs-root');
    });

    it('should have default cicd preferences', () => {
      expect(DEFAULT_FOLDER_PREFERENCES.cicd).toBeDefined();
      expect(DEFAULT_FOLDER_PREFERENCES.cicd?.location).toBe('github-workflows');
      expect(DEFAULT_FOLDER_PREFERENCES.cicd?.workflows).toEqual([]);
    });
  });

  describe('location options', () => {
    it('TEST_LOCATION_OPTIONS should have all valid locations', () => {
      expect(TEST_LOCATION_OPTIONS).toHaveLength(3);
      const values = TEST_LOCATION_OPTIONS.map((o) => o.value);
      expect(values).toContain('colocated');
      expect(values).toContain('test-folder-root');
      expect(values).toContain('test-folder-src');
    });

    it('PLANNING_LOCATION_OPTIONS should have all valid locations', () => {
      expect(PLANNING_LOCATION_OPTIONS).toHaveLength(3);
      const values = PLANNING_LOCATION_OPTIONS.map((o) => o.value);
      expect(values).toContain('claude-sessions');
      expect(values).toContain('docs-planning');
      expect(values).toContain('root-planning');
    });

    it('DOCS_LOCATION_OPTIONS should have all valid locations', () => {
      expect(DOCS_LOCATION_OPTIONS).toHaveLength(3);
      const values = DOCS_LOCATION_OPTIONS.map((o) => o.value);
      expect(values).toContain('docs-root');
      expect(values).toContain('claude-docs');
      expect(values).toContain('readme-only');
    });

    it('TEST_PATTERN_OPTIONS should have valid patterns', () => {
      expect(TEST_PATTERN_OPTIONS.length).toBeGreaterThan(0);
      for (const option of TEST_PATTERN_OPTIONS) {
        expect(option.value).toMatch(/\*\.(test|spec)\.(ts|tsx)/);
      }
    });
  });

  describe('GITHUB_WORKFLOW_TEMPLATES', () => {
    it('should have workflows in each category', () => {
      const categories = ['ci', 'cd', 'quality', 'security', 'release'];
      for (const category of categories) {
        const workflows = GITHUB_WORKFLOW_TEMPLATES.filter((w) => w.category === category);
        expect(workflows.length).toBeGreaterThan(0);
      }
    });

    it('should have valid workflow structure', () => {
      for (const workflow of GITHUB_WORKFLOW_TEMPLATES) {
        expect(workflow.id).toBeDefined();
        expect(workflow.name).toBeDefined();
        expect(workflow.description).toBeDefined();
        expect(workflow.filename).toBeDefined();
        expect(workflow.category).toMatch(/^(ci|cd|quality|security|release)$/);
      }
    });

    it('should have unique IDs', () => {
      const ids = GITHUB_WORKFLOW_TEMPLATES.map((w) => w.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique filenames', () => {
      const filenames = GITHUB_WORKFLOW_TEMPLATES.map((w) => w.filename);
      const uniqueFilenames = new Set(filenames);
      expect(uniqueFilenames.size).toBe(filenames.length);
    });
  });

  describe('BUNDLE_FOLDER_RECOMMENDATIONS', () => {
    it('should have recommendations for testing bundles', () => {
      const testingRecs = BUNDLE_FOLDER_RECOMMENDATIONS.filter((r) =>
        r.trigger.includes('testing')
      );
      expect(testingRecs.length).toBeGreaterThan(0);
    });

    it('should have recommendations for planning bundles', () => {
      const planningRecs = BUNDLE_FOLDER_RECOMMENDATIONS.filter((r) =>
        r.trigger.includes('planning')
      );
      expect(planningRecs.length).toBeGreaterThan(0);
    });

    it('should have valid structure', () => {
      for (const rec of BUNDLE_FOLDER_RECOMMENDATIONS) {
        expect(rec.trigger).toBeDefined();
        expect(rec.recommendations).toBeDefined();
        expect(rec.reason).toBeDefined();
        expect(rec.reason.length).toBeGreaterThan(10);
      }
    });
  });

  describe('getWorkflowsByCategory', () => {
    it('should return workflows for ci category', () => {
      const workflows = getWorkflowsByCategory('ci');
      expect(workflows.length).toBeGreaterThan(0);
      for (const w of workflows) {
        expect(w.category).toBe('ci');
      }
    });

    it('should return workflows for security category', () => {
      const workflows = getWorkflowsByCategory('security');
      expect(workflows.length).toBeGreaterThan(0);
      for (const w of workflows) {
        expect(w.category).toBe('security');
      }
    });

    it('should return empty array for invalid category', () => {
      const workflows = getWorkflowsByCategory('invalid' as 'ci');
      expect(workflows).toEqual([]);
    });
  });

  describe('getRecommendedWorkflows', () => {
    it('should return recommended workflows for node', () => {
      const workflows = getRecommendedWorkflows(['node', 'typescript']);
      expect(workflows.length).toBeGreaterThan(0);
    });

    it('should return recommended workflows for pnpm', () => {
      const workflows = getRecommendedWorkflows(['pnpm']);
      const pnpmWorkflow = workflows.find((w) => w.id === 'ci-pnpm');
      expect(pnpmWorkflow).toBeDefined();
    });

    it('should include workflows marked as recommended', () => {
      const workflows = getRecommendedWorkflows([]);
      const recommended = workflows.filter((w) => w.recommended);
      expect(recommended.length).toBeGreaterThan(0);
    });

    it('should be case-insensitive', () => {
      const lower = getRecommendedWorkflows(['node']);
      const upper = getRecommendedWorkflows(['NODE']);
      expect(lower.length).toBe(upper.length);
    });
  });

  describe('getFolderRecommendationsForBundles', () => {
    it('should return recommendations for testing-complete bundle', () => {
      const recs = getFolderRecommendationsForBundles(['testing-complete']);
      expect(recs.length).toBeGreaterThan(0);
      expect(recs[0].recommendations.tests).toBeDefined();
    });

    it('should return recommendations for planning-complete bundle', () => {
      const recs = getFolderRecommendationsForBundles(['planning-complete']);
      expect(recs.length).toBeGreaterThan(0);
      expect(recs[0].recommendations.planning).toBeDefined();
    });

    it('should return empty for unknown bundles', () => {
      const recs = getFolderRecommendationsForBundles(['unknown-bundle']);
      expect(recs).toEqual([]);
    });

    it('should return multiple recommendations for multiple bundles', () => {
      const recs = getFolderRecommendationsForBundles(['testing-complete', 'planning-complete']);
      expect(recs.length).toBe(2);
    });
  });

  describe('mergeFolderPreferences', () => {
    it('should return defaults when no recommendations', () => {
      const merged = mergeFolderPreferences([]);
      expect(merged).toEqual(DEFAULT_FOLDER_PREFERENCES);
    });

    it('should merge test preferences', () => {
      const recs = getFolderRecommendationsForBundles(['testing-complete']);
      const merged = mergeFolderPreferences(recs);
      expect(merged.tests?.location).toBe('test-folder-root');
    });

    it('should merge planning preferences', () => {
      const recs = getFolderRecommendationsForBundles(['planning-complete']);
      const merged = mergeFolderPreferences(recs);
      expect(merged.planning?.location).toBe('claude-sessions');
      expect(merged.planning?.commitToGit).toBe(false);
    });

    it('should merge cicd workflows without duplicates', () => {
      const recs = [
        {
          trigger: 'test1',
          reason: 'Test reason',
          recommendations: {
            cicd: { location: 'github-workflows' as const, workflows: ['ci-node'] },
          },
        },
        {
          trigger: 'test2',
          reason: 'Test reason 2',
          recommendations: {
            cicd: { location: 'github-workflows' as const, workflows: ['ci-node', 'ci-pnpm'] },
          },
        },
      ];
      const merged = mergeFolderPreferences(recs);
      expect(merged.cicd?.workflows).toContain('ci-node');
      expect(merged.cicd?.workflows).toContain('ci-pnpm');
      // ci-node should only appear once
      expect(merged.cicd?.workflows?.filter((w) => w === 'ci-node').length).toBe(1);
    });
  });
});
