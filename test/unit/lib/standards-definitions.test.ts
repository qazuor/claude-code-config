/**
 * Tests for standards definitions
 */
import { describe, expect, it } from 'vitest';
import {
  CODE_STANDARDS_DEFINITION,
  DESIGN_STANDARDS_DEFINITION,
  DOCUMENTATION_STANDARDS_DEFINITION,
  PERFORMANCE_STANDARDS_DEFINITION,
  SECURITY_STANDARDS_DEFINITION,
  STANDARDS_DEFINITIONS,
  TESTING_STANDARDS_DEFINITION,
  getAllStandardsPlaceholders,
  getAllStandardsTargetFiles,
} from '../../../src/lib/standards/definitions.js';

describe('standards-definitions', () => {
  describe('CODE_STANDARDS_DEFINITION', () => {
    it('should have correct id and name', () => {
      expect(CODE_STANDARDS_DEFINITION.id).toBe('code');
      expect(CODE_STANDARDS_DEFINITION.name).toBe('Code Standards');
    });

    it('should have icon', () => {
      expect(CODE_STANDARDS_DEFINITION.icon).toBe('📝');
    });

    it('should have all required options', () => {
      const optionIds = CODE_STANDARDS_DEFINITION.options.map((o) => o.id);
      expect(optionIds).toContain('indentStyle');
      expect(optionIds).toContain('indentSize');
      expect(optionIds).toContain('maxLineLength');
      expect(optionIds).toContain('maxFileLines');
      expect(optionIds).toContain('quoteStyle');
      expect(optionIds).toContain('semicolons');
      expect(optionIds).toContain('trailingCommas');
      expect(optionIds).toContain('allowAny');
      expect(optionIds).toContain('namedExportsOnly');
      expect(optionIds).toContain('roroPattern');
      expect(optionIds).toContain('jsDocRequired');
    });

    it('should have target files', () => {
      expect(CODE_STANDARDS_DEFINITION.targetFiles).toContain('code-standards.md');
    });

    it('should have placeholders for each option', () => {
      for (const option of CODE_STANDARDS_DEFINITION.options) {
        expect(option.affectsPlaceholders.length).toBeGreaterThan(0);
        for (const placeholder of option.affectsPlaceholders) {
          expect(placeholder).toMatch(/^\{\{[A-Z_]+\}\}$/);
        }
      }
    });

    it('should have valid option types', () => {
      for (const option of CODE_STANDARDS_DEFINITION.options) {
        expect(['select', 'boolean']).toContain(option.type);
        if (option.type === 'select') {
          expect(option.choices).toBeDefined();
          expect(option.choices?.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('TESTING_STANDARDS_DEFINITION', () => {
    it('should have correct id and name', () => {
      expect(TESTING_STANDARDS_DEFINITION.id).toBe('testing');
      expect(TESTING_STANDARDS_DEFINITION.name).toBe('Testing Standards');
    });

    it('should have icon', () => {
      expect(TESTING_STANDARDS_DEFINITION.icon).toBe('🧪');
    });

    it('should have all required options', () => {
      const optionIds = TESTING_STANDARDS_DEFINITION.options.map((o) => o.id);
      expect(optionIds).toContain('coverageTarget');
      expect(optionIds).toContain('tddRequired');
      expect(optionIds).toContain('testPattern');
      expect(optionIds).toContain('testLocation');
      expect(optionIds).toContain('unitTestMaxMs');
      expect(optionIds).toContain('integrationTestMaxMs');
    });

    it('should have target files', () => {
      expect(TESTING_STANDARDS_DEFINITION.targetFiles).toContain('testing-standards.md');
    });
  });

  describe('DOCUMENTATION_STANDARDS_DEFINITION', () => {
    it('should have correct id and name', () => {
      expect(DOCUMENTATION_STANDARDS_DEFINITION.id).toBe('documentation');
      expect(DOCUMENTATION_STANDARDS_DEFINITION.name).toBe('Documentation Standards');
    });

    it('should have icon', () => {
      expect(DOCUMENTATION_STANDARDS_DEFINITION.icon).toBe('📚');
    });

    it('should have all required options', () => {
      const optionIds = DOCUMENTATION_STANDARDS_DEFINITION.options.map((o) => o.id);
      expect(optionIds).toContain('jsDocLevel');
      expect(optionIds).toContain('requireExamples');
      expect(optionIds).toContain('changelogFormat');
      expect(optionIds).toContain('inlineCommentPolicy');
    });
  });

  describe('DESIGN_STANDARDS_DEFINITION', () => {
    it('should have correct id and name', () => {
      expect(DESIGN_STANDARDS_DEFINITION.id).toBe('design');
      expect(DESIGN_STANDARDS_DEFINITION.name).toBe('Design Standards');
    });

    it('should have icon', () => {
      expect(DESIGN_STANDARDS_DEFINITION.icon).toBe('🎨');
    });

    it('should have all required options', () => {
      const optionIds = DESIGN_STANDARDS_DEFINITION.options.map((o) => o.id);
      expect(optionIds).toContain('cssFramework');
      expect(optionIds).toContain('componentLibrary');
      expect(optionIds).toContain('accessibilityLevel');
      expect(optionIds).toContain('darkModeSupport');
    });

    it('should have multiple placeholders for accessibility', () => {
      const accessOption = DESIGN_STANDARDS_DEFINITION.options.find(
        (o) => o.id === 'accessibilityLevel'
      );
      expect(accessOption?.affectsPlaceholders).toContain('{{WCAG_LEVEL}}');
      expect(accessOption?.affectsPlaceholders).toContain('{{ACCESSIBILITY_LEVEL}}');
    });
  });

  describe('SECURITY_STANDARDS_DEFINITION', () => {
    it('should have correct id and name', () => {
      expect(SECURITY_STANDARDS_DEFINITION.id).toBe('security');
      expect(SECURITY_STANDARDS_DEFINITION.name).toBe('Security Standards');
    });

    it('should have icon', () => {
      expect(SECURITY_STANDARDS_DEFINITION.icon).toBe('🔒');
    });

    it('should have all required options', () => {
      const optionIds = SECURITY_STANDARDS_DEFINITION.options.map((o) => o.id);
      expect(optionIds).toContain('authPattern');
      expect(optionIds).toContain('inputValidation');
      expect(optionIds).toContain('csrfProtection');
      expect(optionIds).toContain('rateLimiting');
    });

    it('should have multiple placeholders for inputValidation', () => {
      const validationOption = SECURITY_STANDARDS_DEFINITION.options.find(
        (o) => o.id === 'inputValidation'
      );
      expect(validationOption?.affectsPlaceholders).toContain('{{VALIDATION_LIBRARY}}');
      expect(validationOption?.affectsPlaceholders).toContain('{{INPUT_VALIDATION}}');
    });
  });

  describe('PERFORMANCE_STANDARDS_DEFINITION', () => {
    it('should have correct id and name', () => {
      expect(PERFORMANCE_STANDARDS_DEFINITION.id).toBe('performance');
      expect(PERFORMANCE_STANDARDS_DEFINITION.name).toBe('Performance Standards');
    });

    it('should have icon', () => {
      expect(PERFORMANCE_STANDARDS_DEFINITION.icon).toBe('⚡');
    });

    it('should have all required options', () => {
      const optionIds = PERFORMANCE_STANDARDS_DEFINITION.options.map((o) => o.id);
      expect(optionIds).toContain('lcpTarget');
      expect(optionIds).toContain('fidTarget');
      expect(optionIds).toContain('clsTarget');
      expect(optionIds).toContain('bundleSizeTargetKb');
      expect(optionIds).toContain('apiResponseTargetMs');
    });

    it('should have Core Web Vitals targets with valid ranges', () => {
      const lcpOption = PERFORMANCE_STANDARDS_DEFINITION.options.find((o) => o.id === 'lcpTarget');
      const fidOption = PERFORMANCE_STANDARDS_DEFINITION.options.find((o) => o.id === 'fidTarget');
      const clsOption = PERFORMANCE_STANDARDS_DEFINITION.options.find((o) => o.id === 'clsTarget');

      expect(lcpOption?.choices?.length).toBeGreaterThan(0);
      expect(fidOption?.choices?.length).toBeGreaterThan(0);
      expect(clsOption?.choices?.length).toBeGreaterThan(0);
    });
  });

  describe('STANDARDS_DEFINITIONS', () => {
    it('should contain all 6 categories', () => {
      const categories = Object.keys(STANDARDS_DEFINITIONS);
      expect(categories).toContain('code');
      expect(categories).toContain('testing');
      expect(categories).toContain('documentation');
      expect(categories).toContain('design');
      expect(categories).toContain('security');
      expect(categories).toContain('performance');
      expect(categories).toHaveLength(6);
    });

    it('should have matching ids', () => {
      for (const [key, definition] of Object.entries(STANDARDS_DEFINITIONS)) {
        expect(definition.id).toBe(key);
      }
    });
  });

  describe('getAllStandardsPlaceholders', () => {
    it('should return array of placeholders', () => {
      const placeholders = getAllStandardsPlaceholders();
      expect(Array.isArray(placeholders)).toBe(true);
      expect(placeholders.length).toBeGreaterThan(0);
    });

    it('should return unique placeholders', () => {
      const placeholders = getAllStandardsPlaceholders();
      const unique = [...new Set(placeholders)];
      expect(placeholders).toHaveLength(unique.length);
    });

    it('should return sorted placeholders', () => {
      const placeholders = getAllStandardsPlaceholders();
      const sorted = [...placeholders].sort();
      expect(placeholders).toEqual(sorted);
    });

    it('should include all key placeholders', () => {
      const placeholders = getAllStandardsPlaceholders();
      expect(placeholders).toContain('{{INDENT_STYLE}}');
      expect(placeholders).toContain('{{COVERAGE_TARGET}}');
      expect(placeholders).toContain('{{AUTH_PATTERN}}');
      expect(placeholders).toContain('{{LCP_TARGET}}');
    });

    it('should have valid placeholder format', () => {
      const placeholders = getAllStandardsPlaceholders();
      for (const p of placeholders) {
        expect(p).toMatch(/^\{\{[A-Z_]+\}\}$/);
      }
    });
  });

  describe('getAllStandardsTargetFiles', () => {
    it('should return array of files', () => {
      const files = getAllStandardsTargetFiles();
      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThan(0);
    });

    it('should return unique files', () => {
      const files = getAllStandardsTargetFiles();
      const unique = [...new Set(files)];
      expect(files).toHaveLength(unique.length);
    });

    it('should return sorted files', () => {
      const files = getAllStandardsTargetFiles();
      const sorted = [...files].sort();
      expect(files).toEqual(sorted);
    });

    it('should include all standard files', () => {
      const files = getAllStandardsTargetFiles();
      expect(files).toContain('code-standards.md');
      expect(files).toContain('testing-standards.md');
      expect(files).toContain('documentation-standards.md');
      expect(files).toContain('design-standards.md');
      expect(files).toContain('security-standards.md');
      expect(files).toContain('performance-standards.md');
    });
  });
});
