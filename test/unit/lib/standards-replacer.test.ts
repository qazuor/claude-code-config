/**
 * Tests for standards replacer
 */
import os from 'node:os';
import path from 'node:path';
import fse from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  flattenStandardsConfig,
  formatStandardsReport,
  previewStandardsReplacements,
  replaceStandardsPlaceholders,
} from '../../../src/lib/standards/replacer.js';
import type { StandardsConfig, StandardsReplacementReport } from '../../../src/types/standards.js';

describe('standards-replacer', () => {
  let testDir: string;

  const fullConfig: StandardsConfig = {
    code: {
      indentStyle: 'space',
      indentSize: 2,
      maxLineLength: 100,
      maxFileLines: 500,
      quoteStyle: 'single',
      semicolons: true,
      trailingCommas: 'all',
      allowAny: false,
      namedExportsOnly: true,
      roroPattern: true,
      jsDocRequired: true,
    },
    testing: {
      coverageTarget: 90,
      tddRequired: true,
      testPattern: 'aaa',
      testLocation: 'separate',
      unitTestMaxMs: 100,
      integrationTestMaxMs: 1000,
    },
    documentation: {
      jsDocLevel: 'standard',
      requireExamples: true,
      changelogFormat: 'conventional',
      inlineCommentPolicy: 'why-not-what',
    },
    design: {
      cssFramework: 'tailwind',
      componentLibrary: 'shadcn',
      accessibilityLevel: 'AA',
      darkModeSupport: true,
    },
    security: {
      authPattern: 'jwt',
      inputValidation: 'zod',
      csrfProtection: true,
      rateLimiting: true,
    },
    performance: {
      lcpTarget: 2500,
      fidTarget: 100,
      clsTarget: 0.1,
      bundleSizeTargetKb: 250,
      apiResponseTargetMs: 200,
    },
  };

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `standards-replacer-test-${Date.now()}`);
    await fse.ensureDir(testDir);
  });

  afterEach(async () => {
    await fse.remove(testDir);
  });

  describe('flattenStandardsConfig', () => {
    it('should flatten code standards', () => {
      const result = flattenStandardsConfig(fullConfig);

      expect(result['{{INDENT_STYLE}}']).toBe('space');
      expect(result['{{INDENT_SIZE}}']).toBe('2');
      expect(result['{{MAX_LINE_LENGTH}}']).toBe('100');
      expect(result['{{MAX_FILE_LINES}}']).toBe('500');
      expect(result['{{QUOTE_STYLE}}']).toBe('single');
      expect(result['{{USE_SEMICOLONS}}']).toBe('yes');
      expect(result['{{TRAILING_COMMAS}}']).toBe('all');
      expect(result['{{ALLOW_ANY}}']).toBe('no');
      expect(result['{{NAMED_EXPORTS_ONLY}}']).toBe('yes');
      expect(result['{{RORO_PATTERN}}']).toBe('yes');
      expect(result['{{JSDOC_REQUIRED}}']).toBe('yes');
    });

    it('should flatten testing standards', () => {
      const result = flattenStandardsConfig(fullConfig);

      expect(result['{{COVERAGE_TARGET}}']).toBe('90');
      expect(result['{{TDD_REQUIRED}}']).toBe('yes');
      expect(result['{{TEST_PATTERN}}']).toBe('AAA');
      expect(result['{{TEST_LOCATION}}']).toBe('separate');
      expect(result['{{UNIT_TEST_MAX_MS}}']).toBe('100');
      expect(result['{{INTEGRATION_TEST_MAX_MS}}']).toBe('1000');
    });

    it('should flatten documentation standards', () => {
      const result = flattenStandardsConfig(fullConfig);

      expect(result['{{JSDOC_LEVEL}}']).toBe('standard');
      expect(result['{{REQUIRE_EXAMPLES}}']).toBe('yes');
      expect(result['{{CHANGELOG_FORMAT}}']).toBe('conventional');
      expect(result['{{INLINE_COMMENT_POLICY}}']).toBe('why-not-what');
    });

    it('should flatten design standards', () => {
      const result = flattenStandardsConfig(fullConfig);

      expect(result['{{CSS_FRAMEWORK}}']).toBe('tailwind');
      expect(result['{{COMPONENT_LIBRARY}}']).toBe('shadcn');
      expect(result['{{WCAG_LEVEL}}']).toBe('AA');
      expect(result['{{ACCESSIBILITY_LEVEL}}']).toBe('AA');
      expect(result['{{DARK_MODE_SUPPORT}}']).toBe('yes');
    });

    it('should flatten security standards', () => {
      const result = flattenStandardsConfig(fullConfig);

      expect(result['{{AUTH_PATTERN}}']).toBe('jwt');
      expect(result['{{VALIDATION_LIBRARY}}']).toBe('zod');
      expect(result['{{INPUT_VALIDATION}}']).toBe('zod');
      expect(result['{{CSRF_PROTECTION}}']).toBe('yes');
      expect(result['{{RATE_LIMITING}}']).toBe('yes');
    });

    it('should flatten performance standards', () => {
      const result = flattenStandardsConfig(fullConfig);

      expect(result['{{LCP_TARGET}}']).toBe('2500');
      expect(result['{{FID_TARGET}}']).toBe('100');
      expect(result['{{CLS_TARGET}}']).toBe('0.1');
      expect(result['{{BUNDLE_SIZE_TARGET}}']).toBe('250');
      expect(result['{{API_RESPONSE_TARGET}}']).toBe('200');
    });

    it('should handle partial config', () => {
      const partialConfig: StandardsConfig = {
        code: fullConfig.code,
      } as StandardsConfig;

      const result = flattenStandardsConfig(partialConfig);

      expect(result['{{INDENT_STYLE}}']).toBe('space');
      expect(result['{{COVERAGE_TARGET}}']).toBeUndefined();
    });

    it('should convert booleans to yes/no strings', () => {
      const configWithFalse: StandardsConfig = {
        ...fullConfig,
        code: {
          ...fullConfig.code,
          semicolons: false,
          allowAny: true,
        },
      };

      const result = flattenStandardsConfig(configWithFalse);

      expect(result['{{USE_SEMICOLONS}}']).toBe('no');
      expect(result['{{ALLOW_ANY}}']).toBe('yes');
    });
  });

  describe('replaceStandardsPlaceholders', () => {
    it('should replace placeholders in files', async () => {
      // Create test directory structure
      const standardsDir = path.join(testDir, 'docs', 'standards');
      await fse.ensureDir(standardsDir);

      // Create test file with placeholders
      const testFile = path.join(standardsDir, 'code-standards.md');
      await fse.writeFile(
        testFile,
        '# Code Standards\n\nIndent: {{INDENT_STYLE}} with {{INDENT_SIZE}} spaces'
      );

      const report = await replaceStandardsPlaceholders(testDir, fullConfig);

      expect(report.modifiedFiles.length).toBeGreaterThan(0);
      expect(report.replacedPlaceholders).toContain('{{INDENT_STYLE}}');
      expect(report.replacedPlaceholders).toContain('{{INDENT_SIZE}}');

      // Verify file content
      const content = await fse.readFile(testFile, 'utf-8');
      expect(content).toContain('space');
      expect(content).toContain('2');
      expect(content).not.toContain('{{INDENT_STYLE}}');
    });

    it('should track unused placeholders', async () => {
      // Create test directory structure
      const standardsDir = path.join(testDir, 'docs', 'standards');
      await fse.ensureDir(standardsDir);

      // Create test file without all placeholders
      const testFile = path.join(standardsDir, 'test.md');
      await fse.writeFile(testFile, '# Test\n\nOnly {{INDENT_STYLE}} used');

      const report = await replaceStandardsPlaceholders(testDir, fullConfig);

      // Should have many unused placeholders since we only used one
      expect(report.unusedPlaceholders.length).toBeGreaterThan(0);
    });

    it('should return empty report when no files exist', async () => {
      const report = await replaceStandardsPlaceholders(testDir, fullConfig);

      expect(report.modifiedFiles).toHaveLength(0);
      expect(report.replacedPlaceholders).toHaveLength(0);
    });

    it('should skip non-processable files', async () => {
      const standardsDir = path.join(testDir, 'docs', 'standards');
      await fse.ensureDir(standardsDir);

      // Create non-processable file
      await fse.writeFile(path.join(standardsDir, 'test.js'), 'const x = "{{INDENT_STYLE}}"');

      const report = await replaceStandardsPlaceholders(testDir, fullConfig);

      expect(report.modifiedFiles).toHaveLength(0);
    });

    it('should process multiple file types', async () => {
      const standardsDir = path.join(testDir, 'docs', 'standards');
      await fse.ensureDir(standardsDir);

      await fse.writeFile(path.join(standardsDir, 'test.md'), '{{INDENT_STYLE}}');
      await fse.writeFile(path.join(standardsDir, 'test.json'), '{"indent": "{{INDENT_STYLE}}"}');
      await fse.writeFile(path.join(standardsDir, 'test.yaml'), 'indent: {{INDENT_STYLE}}');

      const report = await replaceStandardsPlaceholders(testDir, fullConfig);

      expect(report.modifiedFiles).toHaveLength(3);
    });
  });

  describe('previewStandardsReplacements', () => {
    it('should preview replacements without modifying files', async () => {
      const standardsDir = path.join(testDir, 'docs', 'standards');
      await fse.ensureDir(standardsDir);

      const testFile = path.join(standardsDir, 'code-standards.md');
      const originalContent = '# Code Standards\n\nIndent: {{INDENT_STYLE}}';
      await fse.writeFile(testFile, originalContent);

      const preview = await previewStandardsReplacements(testDir, fullConfig);

      // Should find the placeholder
      expect(preview.length).toBeGreaterThan(0);
      expect(preview.some((p) => p.placeholder === '{{INDENT_STYLE}}')).toBe(true);

      // File should not be modified
      const content = await fse.readFile(testFile, 'utf-8');
      expect(content).toBe(originalContent);
    });

    it('should return empty array when no placeholders found', async () => {
      const standardsDir = path.join(testDir, 'docs', 'standards');
      await fse.ensureDir(standardsDir);

      await fse.writeFile(path.join(standardsDir, 'test.md'), '# No placeholders here');

      const preview = await previewStandardsReplacements(testDir, fullConfig);

      expect(preview).toHaveLength(0);
    });
  });

  describe('formatStandardsReport', () => {
    it('should format report with modified files', () => {
      const report: StandardsReplacementReport = {
        modifiedFiles: ['docs/standards/code-standards.md', 'docs/standards/testing-standards.md'],
        replacedPlaceholders: ['{{INDENT_STYLE}}', '{{COVERAGE_TARGET}}'],
        unusedPlaceholders: [],
        errors: [],
      };

      const formatted = formatStandardsReport(report);

      expect(formatted).toContain('Standards Configuration Applied');
      expect(formatted).toContain('Files modified: 2');
      expect(formatted).toContain('Placeholders replaced: 2');
      expect(formatted).toContain('code-standards.md');
      expect(formatted).toContain('testing-standards.md');
    });

    it('should format report with unused placeholders', () => {
      const report: StandardsReplacementReport = {
        modifiedFiles: ['test.md'],
        replacedPlaceholders: ['{{INDENT_STYLE}}'],
        unusedPlaceholders: ['{{UNUSED_1}}', '{{UNUSED_2}}', '{{UNUSED_3}}'],
        errors: [],
      };

      const formatted = formatStandardsReport(report);

      expect(formatted).toContain('Unused placeholders');
      expect(formatted).toContain('{{UNUSED_1}}');
    });

    it('should format report with errors', () => {
      const report: StandardsReplacementReport = {
        modifiedFiles: [],
        replacedPlaceholders: [],
        unusedPlaceholders: [],
        errors: ['Error reading file.md'],
      };

      const formatted = formatStandardsReport(report);

      expect(formatted).toContain('Errors');
      expect(formatted).toContain('Error reading file.md');
    });

    it('should truncate many unused placeholders', () => {
      const report: StandardsReplacementReport = {
        modifiedFiles: [],
        replacedPlaceholders: [],
        unusedPlaceholders: Array.from({ length: 10 }, (_, i) => `{{UNUSED_${i}}}`),
        errors: [],
      };

      const formatted = formatStandardsReport(report);

      expect(formatted).toContain('and 5 more');
    });
  });
});
