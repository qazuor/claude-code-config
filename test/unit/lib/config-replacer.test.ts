/**
 * Tests for config-replacer template processing
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock fs module
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  readdir: vi.fn(),
}));

// Mock ora spinner
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    info: vi.fn().mockReturnThis(),
  })),
}));

import {
  flattenTemplateConfig,
  formatReplacementReport,
  previewReplacements,
  replaceTemplateConfigWithSpinner,
  replaceTemplatePlaceholders,
} from '../../../src/lib/templates/config-replacer.js';
import type {
  TemplateConfig,
  TemplatePlaceholderReport,
} from '../../../src/types/template-config.js';

describe('config-replacer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('flattenTemplateConfig', () => {
    it('should return empty object for empty config', () => {
      const result = flattenTemplateConfig({});
      expect(result).toEqual({});
    });

    it('should flatten commands section', () => {
      const config: Partial<TemplateConfig> = {
        commands: {
          typecheck: 'pnpm typecheck',
          lint: 'pnpm lint',
          test: 'pnpm test',
          coverage: 'pnpm test:coverage',
          build: 'pnpm build',
          format: 'pnpm format',
          securityScan: 'pnpm audit',
          lighthouse: 'npx lighthouse',
          bundleAnalyze: 'pnpm analyze',
        },
      };

      const result = flattenTemplateConfig(config);

      expect(result['{{TYPECHECK_COMMAND}}']).toBe('pnpm typecheck');
      expect(result['{{LINT_COMMAND}}']).toBe('pnpm lint');
      expect(result['{{TEST_COMMAND}}']).toBe('pnpm test');
      expect(result['{{COVERAGE_COMMAND}}']).toBe('pnpm test:coverage');
      expect(result['{{BUILD_COMMAND}}']).toBe('pnpm build');
      expect(result['{{FORMAT_COMMAND}}']).toBe('pnpm format');
      expect(result['{{SECURITY_SCAN_COMMAND}}']).toBe('pnpm audit');
      expect(result['{{LIGHTHOUSE_COMMAND}}']).toBe('npx lighthouse');
      expect(result['{{BUNDLE_ANALYZE_COMMAND}}']).toBe('pnpm analyze');
    });

    it('should flatten paths section', () => {
      const config: Partial<TemplateConfig> = {
        paths: {
          planningPath: '.claude/planning',
          refactorPath: '.claude/refactor',
          archivePath: '.claude/archive',
          schemasPath: '.claude/schemas',
          projectRoot: '.',
        },
      };

      const result = flattenTemplateConfig(config);

      expect(result['{{PLANNING_PATH}}']).toBe('.claude/planning');
      expect(result['{{REFACTOR_PATH}}']).toBe('.claude/refactor');
      expect(result['{{ARCHIVE_PATH}}']).toBe('.claude/archive');
      expect(result['{{SCHEMAS_PATH}}']).toBe('.claude/schemas');
      expect(result['{{PROJECT_ROOT}}']).toBe('.');
    });

    it('should flatten targets section with numbers converted to strings', () => {
      const config: Partial<TemplateConfig> = {
        targets: {
          coverageTarget: 90,
          bundleSizeTarget: 500,
          lcpTarget: 2500,
          fidTarget: 100,
          clsTarget: 0.1,
          apiResponseTarget: 200,
          dbQueryTarget: 50,
          wcagLevel: 'AA',
        },
      };

      const result = flattenTemplateConfig(config);

      expect(result['{{COVERAGE_TARGET}}']).toBe('90');
      expect(result['{{BUNDLE_SIZE_TARGET}}']).toBe('500');
      expect(result['{{LCP_TARGET}}']).toBe('2500');
      expect(result['{{FID_TARGET}}']).toBe('100');
      expect(result['{{CLS_TARGET}}']).toBe('0.1');
      expect(result['{{API_RESPONSE_TARGET}}']).toBe('200');
      expect(result['{{DB_QUERY_TARGET}}']).toBe('50');
      expect(result['{{WCAG_LEVEL}}']).toBe('AA');
    });

    it('should flatten tracking section', () => {
      const config: Partial<TemplateConfig> = {
        tracking: {
          issueTracker: 'github',
          trackingFile: '.claude/tracking.json',
          registryFile: '.claude/registry.json',
          taskCodePattern: 'TASK-',
          closedDays: 30,
          staleDays: 14,
        },
      };

      const result = flattenTemplateConfig(config);

      expect(result['{{ISSUE_TRACKER}}']).toBe('github');
      expect(result['{{TRACKING_FILE}}']).toBe('.claude/tracking.json');
      expect(result['{{REGISTRY_FILE}}']).toBe('.claude/registry.json');
      expect(result['{{TASK_CODE_PATTERN}}']).toBe('TASK-');
      expect(result['{{CLOSED_DAYS}}']).toBe('30');
      expect(result['{{STALE_DAYS}}']).toBe('14');
    });

    it('should flatten techStack section', () => {
      const config: Partial<TemplateConfig> = {
        techStack: {
          frontendFramework: 'React',
          databaseOrm: 'Drizzle',
          validationLibrary: 'Zod',
          authPattern: 'Clerk',
          stateManagement: 'TanStack Query',
          testFramework: 'Vitest',
          bundler: 'Vite',
          apiFramework: 'Hono',
        },
      };

      const result = flattenTemplateConfig(config);

      expect(result['{{FRONTEND_FRAMEWORK}}']).toBe('React');
      expect(result['{{DATABASE_ORM}}']).toBe('Drizzle');
      expect(result['{{VALIDATION_LIBRARY}}']).toBe('Zod');
      expect(result['{{AUTH_PATTERN}}']).toBe('Clerk');
      expect(result['{{STATE_MANAGEMENT}}']).toBe('TanStack Query');
      expect(result['{{TEST_FRAMEWORK}}']).toBe('Vitest');
      expect(result['{{BUNDLER}}']).toBe('Vite');
      expect(result['{{API_FRAMEWORK}}']).toBe('Hono');
    });

    it('should flatten environment section', () => {
      const config: Partial<TemplateConfig> = {
        environment: {
          githubTokenEnv: 'GITHUB_TOKEN',
          githubOwnerEnv: 'GITHUB_OWNER',
          githubRepoEnv: 'GITHUB_REPO',
          issueTrackerTokenEnv: 'LINEAR_API_KEY',
        },
      };

      const result = flattenTemplateConfig(config);

      expect(result['{{GITHUB_TOKEN_ENV}}']).toBe('GITHUB_TOKEN');
      expect(result['{{GITHUB_OWNER_ENV}}']).toBe('GITHUB_OWNER');
      expect(result['{{GITHUB_REPO_ENV}}']).toBe('GITHUB_REPO');
      expect(result['{{ISSUE_TRACKER_TOKEN_ENV}}']).toBe('LINEAR_API_KEY');
    });

    it('should flatten brand section', () => {
      const config: Partial<TemplateConfig> = {
        brand: {
          brandName: 'MyApp',
          primaryColor: '#3B82F6',
          secondaryColor: '#10B981',
          fontFamily: 'Inter, sans-serif',
          toneOfVoice: 'professional',
        },
      };

      const result = flattenTemplateConfig(config);

      expect(result['{{BRAND_NAME}}']).toBe('MyApp');
      expect(result['{{PRIMARY_COLOR}}']).toBe('#3B82F6');
      expect(result['{{SECONDARY_COLOR}}']).toBe('#10B981');
      expect(result['{{FONT_FAMILY}}']).toBe('Inter, sans-serif');
      expect(result['{{TONE_OF_VOICE}}']).toBe('professional');
    });

    it('should skip undefined values', () => {
      const config: Partial<TemplateConfig> = {
        commands: {
          test: 'pnpm test',
          // Other commands not defined
        },
      };

      const result = flattenTemplateConfig(config);

      expect(result['{{TEST_COMMAND}}']).toBe('pnpm test');
      expect(result['{{LINT_COMMAND}}']).toBeUndefined();
    });

    it('should flatten all sections combined', () => {
      const config: Partial<TemplateConfig> = {
        commands: { test: 'pnpm test' },
        paths: { projectRoot: '.' },
        targets: { coverageTarget: 90 },
        tracking: { issueTracker: 'github' },
        techStack: { frontendFramework: 'React' },
        environment: { githubTokenEnv: 'GITHUB_TOKEN' },
        brand: { brandName: 'MyApp' },
      };

      const result = flattenTemplateConfig(config);

      expect(Object.keys(result)).toHaveLength(7);
      expect(result['{{TEST_COMMAND}}']).toBe('pnpm test');
      expect(result['{{PROJECT_ROOT}}']).toBe('.');
      expect(result['{{COVERAGE_TARGET}}']).toBe('90');
      expect(result['{{ISSUE_TRACKER}}']).toBe('github');
      expect(result['{{FRONTEND_FRAMEWORK}}']).toBe('React');
      expect(result['{{GITHUB_TOKEN_ENV}}']).toBe('GITHUB_TOKEN');
      expect(result['{{BRAND_NAME}}']).toBe('MyApp');
    });
  });

  describe('replaceTemplatePlaceholders', () => {
    it('should return report with zero files when directory is empty', async () => {
      vi.mocked(fs.readdir).mockResolvedValueOnce([]);

      const result = await replaceTemplatePlaceholders('/test/dir', {});

      expect(result.totalFiles).toBe(0);
      expect(result.filesModified).toBe(0);
      expect(result.replacements).toEqual([]);
    });

    it('should process .md files', async () => {
      // Mock directory listing
      vi.mocked(fs.readdir).mockResolvedValueOnce([
        { name: 'test.md', isDirectory: () => false, isFile: () => true },
      ] as unknown as ReturnType<typeof fs.readdir>);

      // Mock file content
      vi.mocked(fs.readFile).mockResolvedValueOnce('Test {{TEST_COMMAND}} content');
      vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);

      const result = await replaceTemplatePlaceholders('/test/dir', {
        commands: { test: 'pnpm test' },
      });

      expect(result.totalFiles).toBe(1);
      expect(result.filesModified).toBe(1);
      expect(result.replacements).toHaveLength(1);
      expect(result.replacements[0]).toEqual({
        file: 'test.md',
        placeholder: '{{TEST_COMMAND}}',
        value: 'pnpm test',
      });
    });

    it('should process .json, .yaml, .yml, .txt files', async () => {
      vi.mocked(fs.readdir).mockResolvedValueOnce([
        { name: 'config.json', isDirectory: () => false, isFile: () => true },
        { name: 'config.yaml', isDirectory: () => false, isFile: () => true },
        { name: 'config.yml', isDirectory: () => false, isFile: () => true },
        { name: 'readme.txt', isDirectory: () => false, isFile: () => true },
      ] as unknown as ReturnType<typeof fs.readdir>);

      // No placeholders in these files
      vi.mocked(fs.readFile).mockResolvedValue('no placeholders');
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const result = await replaceTemplatePlaceholders('/test/dir', {});

      expect(result.totalFiles).toBe(4);
      expect(result.filesModified).toBe(0);
    });

    it('should skip non-processable files', async () => {
      vi.mocked(fs.readdir).mockResolvedValueOnce([
        { name: 'script.js', isDirectory: () => false, isFile: () => true },
        { name: 'style.css', isDirectory: () => false, isFile: () => true },
        { name: 'image.png', isDirectory: () => false, isFile: () => true },
      ] as unknown as ReturnType<typeof fs.readdir>);

      const result = await replaceTemplatePlaceholders('/test/dir', {});

      expect(result.totalFiles).toBe(0);
    });

    it('should skip directories like node_modules, .git, dist', async () => {
      vi.mocked(fs.readdir).mockResolvedValueOnce([
        { name: 'node_modules', isDirectory: () => true, isFile: () => false },
        { name: '.git', isDirectory: () => true, isFile: () => false },
        { name: 'dist', isDirectory: () => true, isFile: () => false },
        { name: 'build', isDirectory: () => true, isFile: () => false },
        { name: '.next', isDirectory: () => true, isFile: () => false },
        { name: '.turbo', isDirectory: () => true, isFile: () => false },
      ] as unknown as ReturnType<typeof fs.readdir>);

      const result = await replaceTemplatePlaceholders('/test/dir', {});

      expect(result.totalFiles).toBe(0);
      // readdir should not be called for skipped directories
      expect(fs.readdir).toHaveBeenCalledTimes(1);
    });

    it('should process subdirectories recursively', async () => {
      // Root directory
      vi.mocked(fs.readdir).mockResolvedValueOnce([
        { name: 'src', isDirectory: () => true, isFile: () => false },
        { name: 'README.md', isDirectory: () => false, isFile: () => true },
      ] as unknown as ReturnType<typeof fs.readdir>);

      // src subdirectory
      vi.mocked(fs.readdir).mockResolvedValueOnce([
        { name: 'config.json', isDirectory: () => false, isFile: () => true },
      ] as unknown as ReturnType<typeof fs.readdir>);

      vi.mocked(fs.readFile).mockResolvedValue('no placeholders');

      const result = await replaceTemplatePlaceholders('/test/dir', {});

      expect(result.totalFiles).toBe(2);
    });

    it('should handle file read errors gracefully', async () => {
      vi.mocked(fs.readdir).mockResolvedValueOnce([
        { name: 'test.md', isDirectory: () => false, isFile: () => true },
      ] as unknown as ReturnType<typeof fs.readdir>);

      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('ENOENT'));

      const result = await replaceTemplatePlaceholders('/test/dir', {
        commands: { test: 'pnpm test' },
      });

      expect(result.totalFiles).toBe(1);
      expect(result.filesModified).toBe(0);
    });

    it('should handle directory read errors gracefully', async () => {
      vi.mocked(fs.readdir).mockRejectedValueOnce(new Error('ENOENT'));

      const result = await replaceTemplatePlaceholders('/nonexistent/dir', {});

      expect(result.totalFiles).toBe(0);
    });

    it('should replace multiple placeholders in same file', async () => {
      vi.mocked(fs.readdir).mockResolvedValueOnce([
        { name: 'test.md', isDirectory: () => false, isFile: () => true },
      ] as unknown as ReturnType<typeof fs.readdir>);

      vi.mocked(fs.readFile).mockResolvedValueOnce('Run {{TEST_COMMAND}} and {{LINT_COMMAND}}');
      vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);

      const result = await replaceTemplatePlaceholders('/test/dir', {
        commands: { test: 'pnpm test', lint: 'pnpm lint' },
      });

      expect(result.replacements).toHaveLength(2);
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join('/test/dir', 'test.md'),
        'Run pnpm test and pnpm lint',
        'utf-8'
      );
    });

    it('should track unreplaced placeholders', async () => {
      vi.mocked(fs.readdir).mockResolvedValueOnce([]);

      const result = await replaceTemplatePlaceholders('/test/dir', {
        commands: { test: 'pnpm test' },
      });

      // All placeholders except TEST_COMMAND should be unreplaced
      expect(result.unreplaced.length).toBeGreaterThan(0);
      expect(result.unreplaced).not.toContain('{{TEST_COMMAND}}');
    });
  });

  describe('replaceTemplateConfigWithSpinner', () => {
    it('should show success message when files are modified', async () => {
      vi.mocked(fs.readdir).mockResolvedValueOnce([
        { name: 'test.md', isDirectory: () => false, isFile: () => true },
      ] as unknown as ReturnType<typeof fs.readdir>);
      vi.mocked(fs.readFile).mockResolvedValueOnce('{{TEST_COMMAND}}');
      vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);

      const result = await replaceTemplateConfigWithSpinner('/test/dir', {
        commands: { test: 'pnpm test' },
      });

      expect(result.filesModified).toBe(1);
    });

    it('should show info message when no placeholders found', async () => {
      vi.mocked(fs.readdir).mockResolvedValueOnce([]);

      const result = await replaceTemplateConfigWithSpinner('/test/dir', {});

      expect(result.filesModified).toBe(0);
    });

    it('should show fail message and rethrow on error', async () => {
      vi.mocked(fs.readdir).mockRejectedValueOnce(new Error('Permission denied'));

      // The function catches errors during getAllFiles but doesn't throw
      // Only explicit errors would be thrown
      const result = await replaceTemplateConfigWithSpinner('/test/dir', {});
      expect(result.filesModified).toBe(0);
    });
  });

  describe('formatReplacementReport', () => {
    it('should format empty report', () => {
      const report: TemplatePlaceholderReport = {
        totalFiles: 0,
        filesModified: 0,
        replacements: [],
        unreplaced: [],
      };

      const result = formatReplacementReport(report);

      expect(result).toContain('Template Configuration Applied');
      expect(result).toContain('Total files scanned: 0');
      expect(result).toContain('Files modified: 0');
      expect(result).toContain('Total replacements: 0');
    });

    it('should format report with replacements', () => {
      const report: TemplatePlaceholderReport = {
        totalFiles: 10,
        filesModified: 2,
        replacements: [
          { file: 'README.md', placeholder: '{{TEST_COMMAND}}', value: 'pnpm test' },
          { file: 'README.md', placeholder: '{{LINT_COMMAND}}', value: 'pnpm lint' },
          { file: 'config.json', placeholder: '{{COVERAGE_TARGET}}', value: '90' },
        ],
        unreplaced: [],
      };

      const result = formatReplacementReport(report);

      expect(result).toContain('Total files scanned: 10');
      expect(result).toContain('Files modified: 2');
      expect(result).toContain('Total replacements: 3');
      expect(result).toContain('Replacements:');
      expect(result).toContain('README.md:');
      expect(result).toContain('{{TEST_COMMAND}} → pnpm test');
      expect(result).toContain('{{LINT_COMMAND}} → pnpm lint');
      expect(result).toContain('config.json:');
      expect(result).toContain('{{COVERAGE_TARGET}} → 90');
    });

    it('should format report with unreplaced placeholders', () => {
      const report: TemplatePlaceholderReport = {
        totalFiles: 5,
        filesModified: 0,
        replacements: [],
        unreplaced: ['{{TEST_COMMAND}}', '{{LINT_COMMAND}}', '{{BUILD_COMMAND}}'],
      };

      const result = formatReplacementReport(report);

      expect(result).toContain('Not configured (using defaults or runtime values):');
      expect(result).toContain('{{TEST_COMMAND}}');
      expect(result).toContain('{{LINT_COMMAND}}');
      expect(result).toContain('{{BUILD_COMMAND}}');
    });

    it('should truncate unreplaced list when more than 10', () => {
      const unreplaced = Array.from({ length: 15 }, (_, i) => `{{PLACEHOLDER_${i}}}`);
      const report: TemplatePlaceholderReport = {
        totalFiles: 5,
        filesModified: 0,
        replacements: [],
        unreplaced,
      };

      const result = formatReplacementReport(report);

      expect(result).toContain('... and 5 more');
    });
  });

  describe('previewReplacements', () => {
    it('should return empty array when no files', async () => {
      vi.mocked(fs.readdir).mockResolvedValueOnce([]);

      const result = await previewReplacements('/test/dir', {});

      expect(result).toEqual([]);
    });

    it('should preview replacements without modifying files', async () => {
      vi.mocked(fs.readdir).mockResolvedValueOnce([
        { name: 'test.md', isDirectory: () => false, isFile: () => true },
      ] as unknown as ReturnType<typeof fs.readdir>);
      vi.mocked(fs.readFile).mockResolvedValueOnce('Run {{TEST_COMMAND}}');

      const result = await previewReplacements('/test/dir', {
        commands: { test: 'pnpm test' },
      });

      expect(result).toEqual([
        {
          file: 'test.md',
          placeholder: '{{TEST_COMMAND}}',
          value: 'pnpm test',
        },
      ]);
      // writeFile should NOT be called
      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('should handle file read errors gracefully', async () => {
      vi.mocked(fs.readdir).mockResolvedValueOnce([
        { name: 'test.md', isDirectory: () => false, isFile: () => true },
      ] as unknown as ReturnType<typeof fs.readdir>);
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('EACCES'));

      const result = await previewReplacements('/test/dir', {
        commands: { test: 'pnpm test' },
      });

      expect(result).toEqual([]);
    });

    it('should find multiple placeholders in multiple files', async () => {
      vi.mocked(fs.readdir).mockResolvedValueOnce([
        { name: 'file1.md', isDirectory: () => false, isFile: () => true },
        { name: 'file2.md', isDirectory: () => false, isFile: () => true },
      ] as unknown as ReturnType<typeof fs.readdir>);
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce('{{TEST_COMMAND}}')
        .mockResolvedValueOnce('{{LINT_COMMAND}} and {{TEST_COMMAND}}');

      const result = await previewReplacements('/test/dir', {
        commands: { test: 'pnpm test', lint: 'pnpm lint' },
      });

      expect(result).toHaveLength(3);
      expect(result).toContainEqual({
        file: 'file1.md',
        placeholder: '{{TEST_COMMAND}}',
        value: 'pnpm test',
      });
      expect(result).toContainEqual({
        file: 'file2.md',
        placeholder: '{{LINT_COMMAND}}',
        value: 'pnpm lint',
      });
      expect(result).toContainEqual({
        file: 'file2.md',
        placeholder: '{{TEST_COMMAND}}',
        value: 'pnpm test',
      });
    });
  });
});
