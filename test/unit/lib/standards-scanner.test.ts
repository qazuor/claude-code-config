/**
 * Tests for standards scanner
 */
import os from 'node:os';
import path from 'node:path';
import fse from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  formatScanResult,
  hasUnconfiguredPlaceholders,
  scanStandardsPlaceholders,
} from '../../../src/lib/standards/scanner.js';
import type { StandardsConfig } from '../../../src/types/standards.js';

describe('standards-scanner', () => {
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
    testDir = path.join(os.tmpdir(), `standards-scanner-test-${Date.now()}`);
    await fse.ensureDir(testDir);
  });

  afterEach(async () => {
    await fse.remove(testDir);
  });

  describe('scanStandardsPlaceholders', () => {
    it('should find placeholders in files', async () => {
      const standardsDir = path.join(testDir, 'docs', 'standards');
      await fse.ensureDir(standardsDir);

      await fse.writeFile(
        path.join(standardsDir, 'test.md'),
        '# Test\n\n{{INDENT_STYLE}} and {{COVERAGE_TARGET}}'
      );

      const result = await scanStandardsPlaceholders(testDir);

      expect(result.totalPlaceholders).toBe(2);
      expect(result.unconfiguredPlaceholders).toHaveLength(2);
    });

    it('should identify configured vs unconfigured placeholders', async () => {
      const standardsDir = path.join(testDir, 'docs', 'standards');
      await fse.ensureDir(standardsDir);

      await fse.writeFile(
        path.join(standardsDir, 'test.md'),
        '{{INDENT_STYLE}} {{UNKNOWN_PLACEHOLDER}}'
      );

      const result = await scanStandardsPlaceholders(testDir, fullConfig);

      // INDENT_STYLE should be configured, UNKNOWN_PLACEHOLDER should not
      expect(result.configuredPlaceholders).toBeGreaterThan(0);
      const unconfiguredNames = result.unconfiguredPlaceholders.map((u) => u.placeholder);
      expect(unconfiguredNames).toContain('{{UNKNOWN_PLACEHOLDER}}');
      expect(unconfiguredNames).not.toContain('{{INDENT_STYLE}}');
    });

    it('should track which files contain each placeholder', async () => {
      const standardsDir = path.join(testDir, 'docs', 'standards');
      await fse.ensureDir(standardsDir);

      await fse.writeFile(path.join(standardsDir, 'file1.md'), '{{CUSTOM_PLACEHOLDER}}');
      await fse.writeFile(path.join(standardsDir, 'file2.md'), '{{CUSTOM_PLACEHOLDER}}');

      const result = await scanStandardsPlaceholders(testDir);

      const customPlaceholder = result.unconfiguredPlaceholders.find(
        (u) => u.placeholder === '{{CUSTOM_PLACEHOLDER}}'
      );
      expect(customPlaceholder?.files).toHaveLength(2);
    });

    it('should return unique placeholders', async () => {
      const standardsDir = path.join(testDir, 'docs', 'standards');
      await fse.ensureDir(standardsDir);

      await fse.writeFile(
        path.join(standardsDir, 'test.md'),
        '{{INDENT_STYLE}} {{INDENT_STYLE}} {{INDENT_STYLE}}'
      );

      const result = await scanStandardsPlaceholders(testDir);

      expect(result.totalPlaceholders).toBe(1);
    });

    it('should return empty result when no files exist', async () => {
      const result = await scanStandardsPlaceholders(testDir);

      expect(result.totalPlaceholders).toBe(0);
      expect(result.unconfiguredPlaceholders).toHaveLength(0);
    });

    it('should scan subdirectories', async () => {
      const subDir = path.join(testDir, 'docs', 'standards', 'subdir');
      await fse.ensureDir(subDir);

      await fse.writeFile(path.join(subDir, 'nested.md'), '{{NESTED_PLACEHOLDER}}');

      const result = await scanStandardsPlaceholders(testDir);

      expect(result.totalPlaceholders).toBe(1);
    });

    it('should only scan specific file extensions', async () => {
      const standardsDir = path.join(testDir, 'docs', 'standards');
      await fse.ensureDir(standardsDir);

      await fse.writeFile(path.join(standardsDir, 'test.md'), '{{MD_PLACEHOLDER}}');
      await fse.writeFile(path.join(standardsDir, 'test.json'), '{"key": "{{JSON_PLACEHOLDER}}"}');
      await fse.writeFile(path.join(standardsDir, 'test.js'), 'const x = "{{JS_PLACEHOLDER}}"');

      const result = await scanStandardsPlaceholders(testDir);

      const placeholders = result.unconfiguredPlaceholders.map((u) => u.placeholder);
      expect(placeholders).toContain('{{MD_PLACEHOLDER}}');
      expect(placeholders).toContain('{{JSON_PLACEHOLDER}}');
      expect(placeholders).not.toContain('{{JS_PLACEHOLDER}}');
    });
  });

  describe('formatScanResult', () => {
    it('should format result with unconfigured placeholders', () => {
      const result = {
        unconfiguredPlaceholders: [
          { placeholder: '{{CUSTOM_1}}', files: ['file1.md', 'file2.md'] },
          { placeholder: '{{CUSTOM_2}}', files: ['file3.md'] },
        ],
        totalPlaceholders: 5,
        configuredPlaceholders: 3,
      };

      const formatted = formatScanResult(result);

      expect(formatted).toContain('Standards Placeholder Scan');
      expect(formatted).toContain('Total placeholders found: 5');
      expect(formatted).toContain('Already configured: 3');
      expect(formatted).toContain('Unconfigured: 2');
      expect(formatted).toContain('{{CUSTOM_1}}');
      expect(formatted).toContain('file1.md');
    });

    it('should show success message when all configured', () => {
      const result = {
        unconfiguredPlaceholders: [],
        totalPlaceholders: 10,
        configuredPlaceholders: 10,
      };

      const formatted = formatScanResult(result);

      expect(formatted).toContain('All placeholders are configured');
    });

    it('should truncate many files', () => {
      const result = {
        unconfiguredPlaceholders: [
          {
            placeholder: '{{CUSTOM}}',
            files: ['file1.md', 'file2.md', 'file3.md', 'file4.md', 'file5.md'],
          },
        ],
        totalPlaceholders: 1,
        configuredPlaceholders: 0,
      };

      const formatted = formatScanResult(result);

      expect(formatted).toContain('and 2 more files');
    });
  });

  describe('hasUnconfiguredPlaceholders', () => {
    it('should return true when unconfigured placeholders exist', async () => {
      const standardsDir = path.join(testDir, 'docs', 'standards');
      await fse.ensureDir(standardsDir);

      await fse.writeFile(path.join(standardsDir, 'test.md'), '{{UNKNOWN_PLACEHOLDER}}');

      const result = await hasUnconfiguredPlaceholders(testDir, fullConfig);

      expect(result).toBe(true);
    });

    it('should return false when all placeholders are configured', async () => {
      const standardsDir = path.join(testDir, 'docs', 'standards');
      await fse.ensureDir(standardsDir);

      await fse.writeFile(path.join(standardsDir, 'test.md'), '{{INDENT_STYLE}}');

      const result = await hasUnconfiguredPlaceholders(testDir, fullConfig);

      expect(result).toBe(false);
    });

    it('should return false when no placeholders exist', async () => {
      const standardsDir = path.join(testDir, 'docs', 'standards');
      await fse.ensureDir(standardsDir);

      await fse.writeFile(path.join(standardsDir, 'test.md'), '# No placeholders');

      const result = await hasUnconfiguredPlaceholders(testDir, fullConfig);

      expect(result).toBe(false);
    });
  });
});
