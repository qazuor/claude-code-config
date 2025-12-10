/**
 * Tests for template processor
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('../../../src/lib/utils/fs.js', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  listFiles: vi.fn(),
  joinPath: vi.fn((...parts: string[]) => parts.join('/')),
}));

vi.mock('../../../src/lib/utils/spinner.js', () => ({
  withSpinner: vi.fn((_, fn) => fn()),
}));

vi.mock('../../../src/lib/utils/logger.js', () => ({
  logger: {
    newline: vi.fn(),
    subtitle: vi.fn(),
    keyValue: vi.fn(),
    warn: vi.fn(),
    item: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  processTemplate,
  processTemplateFile,
  processTemplates,
  processTemplatesInDirectory,
  showTemplateReport,
} from '../../../src/lib/templates/processor.js';
import { listFiles, readFile, writeFile } from '../../../src/lib/utils/fs.js';
import { logger } from '../../../src/lib/utils/logger.js';
import type { TemplateContext, TemplateProcessingReport } from '../../../src/types/templates.js';

describe('processor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('processTemplate', () => {
    it('should return unchanged content when no directives', () => {
      const content = 'Simple content without directives';
      const context: TemplateContext = { values: {} };

      const result = processTemplate(content, context);

      expect(result.content).toBe(content);
      expect(result.modified).toBe(false);
      expect(result.directivesProcessed).toBe(0);
    });

    it('should process if directive with truthy condition', () => {
      const content = '{{#if isEnabled}}Enabled content{{/if}}';
      // Context values are accessed directly on context, not context.values
      const context = { isEnabled: true } as unknown as TemplateContext;

      const result = processTemplate(content, context);

      expect(result.content).toBe('Enabled content');
      expect(result.modified).toBe(true);
      expect(result.directivesProcessed).toBe(1);
    });

    it('should process if directive with falsy condition', () => {
      const content = '{{#if isEnabled}}Enabled content{{/if}}';
      const context = { isEnabled: false } as unknown as TemplateContext;

      const result = processTemplate(content, context);

      expect(result.content).toBe('');
      expect(result.modified).toBe(true);
    });

    it('should process unless directive', () => {
      const content = '{{#unless isDisabled}}Content when not disabled{{/unless}}';
      const context = { isDisabled: false } as unknown as TemplateContext;

      const result = processTemplate(content, context);

      expect(result.content).toBe('Content when not disabled');
      expect(result.modified).toBe(true);
    });

    it('should process unless directive when condition is true', () => {
      const content = '{{#unless isDisabled}}Content{{/unless}}';
      const context = { isDisabled: true } as unknown as TemplateContext;

      const result = processTemplate(content, context);

      expect(result.content).toBe('');
      expect(result.modified).toBe(true);
    });

    it('should process each directive', () => {
      // Note: The template system uses 'item' as the loop variable, not 'this'
      const content = '{{#each items}}Item: {{item}}\n{{/each}}';
      const context = { items: ['a', 'b', 'c'] } as unknown as TemplateContext;

      const result = processTemplate(content, context);

      expect(result.content).toContain('Item: a');
      expect(result.content).toContain('Item: b');
      expect(result.content).toContain('Item: c');
      expect(result.modified).toBe(true);
    });

    it('should process each directive with empty array', () => {
      const content = 'Before{{#each items}}Item{{/each}}After';
      const context = { items: [] } as unknown as TemplateContext;

      const result = processTemplate(content, context);

      expect(result.content).toBe('BeforeAfter');
      expect(result.modified).toBe(true);
    });

    it('should process section directive', () => {
      const content = '{{#section main}}Section content{{/section}}';
      const context = {} as unknown as TemplateContext;

      const result = processTemplate(content, context);

      expect(result.content).toBe('Section content');
      expect(result.modified).toBe(true);
    });

    it('should process variable replacements', () => {
      const content = 'Hello {{name}}!';
      const context = { name: 'World' } as unknown as TemplateContext;

      const result = processTemplate(content, context);

      expect(result.content).toBe('Hello World!');
      expect(result.modified).toBe(true);
    });

    it('should process variable with transform', () => {
      const content = 'Name: {{name | uppercase}}';
      const context = { name: 'test' } as unknown as TemplateContext;

      const result = processTemplate(content, context);

      expect(result.content).toBe('Name: TEST');
      expect(result.modified).toBe(true);
    });

    it('should handle nested path variables', () => {
      const content = 'Config: {{config.database.host}}';
      const context = { config: { database: { host: 'localhost' } } } as unknown as TemplateContext;

      const result = processTemplate(content, context);

      expect(result.content).toBe('Config: localhost');
    });

    it('should warn for undefined variables', () => {
      const content = 'Hello {{undefinedVar}}!';
      const context = {} as unknown as TemplateContext;

      const result = processTemplate(content, context);

      expect(result.warnings).toContain('Variable not found: undefinedVar');
    });

    it('should handle nested directives', () => {
      const content = '{{#if showList}}{{#each items}}{{item}}{{/each}}{{/if}}';
      const context = { showList: true, items: ['a', 'b'] } as unknown as TemplateContext;

      const result = processTemplate(content, context);

      expect(result.content).toBe('ab');
    });

    it('should clean up excessive empty lines', () => {
      // Only tests cleanup when there are directives
      const content = '{{#if true}}Line1{{/if}}\n\n\n\n\nLine2';
      const context = { true: true } as unknown as TemplateContext;

      const result = processTemplate(content, context);

      // The cleanup function removes excessive newlines
      expect(result.content).not.toContain('\n\n\n');
    });

    it('should return errors for invalid templates', () => {
      const content = '{{#if condition}}Unclosed if';
      const context = {} as unknown as TemplateContext;

      const result = processTemplate(content, context);

      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should warn for include directives (not supported)', () => {
      const content = '{{> partialName}}';
      const context = {} as unknown as TemplateContext;

      const result = processTemplate(content, context);

      expect(result.warnings.some((w) => w.includes('Include directive not yet supported'))).toBe(
        true
      );
    });

    it('should process comparison in if directive', () => {
      const content = '{{#if framework == "react"}}React project{{/if}}';
      const context = { framework: 'react' } as unknown as TemplateContext;

      const result = processTemplate(content, context);

      expect(result.content).toBe('React project');
    });

    it('should process negation in if directive', () => {
      const content = '{{#if !disabled}}Not disabled{{/if}}';
      const context = { disabled: false } as unknown as TemplateContext;

      const result = processTemplate(content, context);

      expect(result.content).toBe('Not disabled');
    });
  });

  describe('processTemplateFile', () => {
    it('should read file, process, and write if modified', async () => {
      vi.mocked(readFile).mockResolvedValueOnce('Hello {{name}}!');
      vi.mocked(writeFile).mockResolvedValueOnce(undefined);

      const context = { name: 'World' } as unknown as TemplateContext;
      const result = await processTemplateFile('/test/file.md', context);

      expect(readFile).toHaveBeenCalledWith('/test/file.md');
      expect(writeFile).toHaveBeenCalledWith('/test/file.md', 'Hello World!');
      expect(result.modified).toBe(true);
    });

    it('should not write file if not modified', async () => {
      vi.mocked(readFile).mockResolvedValueOnce('No directives here');

      const context = {} as unknown as TemplateContext;
      await processTemplateFile('/test/file.md', context);

      expect(writeFile).not.toHaveBeenCalled();
    });

    it('should not write file if there are errors', async () => {
      vi.mocked(readFile).mockResolvedValueOnce('{{#if unclosed}}bad');

      const context = {} as unknown as TemplateContext;
      const result = await processTemplateFile('/test/file.md', context);

      expect(writeFile).not.toHaveBeenCalled();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('processTemplatesInDirectory', () => {
    it('should return report with zero files when directory is empty', async () => {
      vi.mocked(listFiles).mockResolvedValueOnce([]);

      const context = {} as unknown as TemplateContext;
      const report = await processTemplatesInDirectory('/test/dir', context);

      expect(report.totalFiles).toBe(0);
      expect(report.filesModified).toBe(0);
    });

    it('should process files with directives', async () => {
      vi.mocked(listFiles).mockResolvedValueOnce(['file1.md', 'file2.md']);
      vi.mocked(readFile)
        .mockResolvedValueOnce('Hello {{name}}!')
        .mockResolvedValueOnce('No directives');
      vi.mocked(writeFile).mockResolvedValue(undefined);

      const context = { name: 'World' } as unknown as TemplateContext;
      const report = await processTemplatesInDirectory('/test/dir', context);

      expect(report.totalFiles).toBe(2);
      expect(report.filesModified).toBe(1);
    });

    it('should skip files without directives', async () => {
      vi.mocked(listFiles).mockResolvedValueOnce(['plain.md']);
      vi.mocked(readFile).mockResolvedValueOnce('Plain content');

      const context = {} as unknown as TemplateContext;
      const report = await processTemplatesInDirectory('/test/dir', context);

      expect(report.filesModified).toBe(0);
      expect(writeFile).not.toHaveBeenCalled();
    });

    it('should track files with errors', async () => {
      vi.mocked(listFiles).mockResolvedValueOnce(['bad.md']);
      vi.mocked(readFile).mockResolvedValueOnce('{{#if unclosed}}');

      const context = {} as unknown as TemplateContext;
      const report = await processTemplatesInDirectory('/test/dir', context);

      expect(report.filesWithErrors).toContain('bad.md');
    });

    it('should use dry run option to skip writing', async () => {
      vi.mocked(listFiles).mockResolvedValueOnce(['file.md']);
      vi.mocked(readFile).mockResolvedValueOnce('Hello {{name}}!');

      const context = { name: 'World' } as unknown as TemplateContext;
      await processTemplatesInDirectory('/test/dir', context, { dryRun: true });

      expect(writeFile).not.toHaveBeenCalled();
    });

    it('should use custom extensions option', async () => {
      vi.mocked(listFiles).mockResolvedValueOnce([]);

      const context = {} as unknown as TemplateContext;
      await processTemplatesInDirectory('/test/dir', context, {
        extensions: ['txt', 'html'],
      });

      expect(listFiles).toHaveBeenCalledWith('**/*.{txt,html}', expect.any(Object));
    });

    it('should use custom exclude option', async () => {
      vi.mocked(listFiles).mockResolvedValueOnce([]);

      const context = {} as unknown as TemplateContext;
      await processTemplatesInDirectory('/test/dir', context, {
        exclude: ['vendor', 'cache'],
      });

      expect(listFiles).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          ignore: ['**/vendor/**', '**/cache/**'],
        })
      );
    });

    it('should count total directives processed', async () => {
      vi.mocked(listFiles).mockResolvedValueOnce(['file.md']);
      vi.mocked(readFile).mockResolvedValueOnce('Hello {{name}}! {{#if show}}Shown{{/if}}');
      vi.mocked(writeFile).mockResolvedValue(undefined);

      const context = { name: 'World', show: true } as unknown as TemplateContext;
      const report = await processTemplatesInDirectory('/test/dir', context);

      expect(report.totalDirectives).toBeGreaterThan(0);
    });

    it('should handle file read errors', async () => {
      vi.mocked(listFiles).mockResolvedValueOnce(['error.md']);
      vi.mocked(readFile).mockRejectedValueOnce(new Error('EACCES'));

      const context = {} as unknown as TemplateContext;
      const report = await processTemplatesInDirectory('/test/dir', context);

      expect(report.filesWithErrors).toContain('error.md');
    });

    it('should collect warnings from processed files', async () => {
      vi.mocked(listFiles).mockResolvedValueOnce(['file.md']);
      vi.mocked(readFile).mockResolvedValueOnce('{{undefinedVar}}');

      const context = {} as unknown as TemplateContext;
      const report = await processTemplatesInDirectory('/test/dir', context);

      expect(report.warnings.some((w) => w.includes('undefinedVar'))).toBe(true);
    });
  });

  describe('processTemplates', () => {
    it('should use spinner wrapper', async () => {
      vi.mocked(listFiles).mockResolvedValueOnce([]);

      const context = {} as unknown as TemplateContext;
      await processTemplates('/test/dir', context);

      // The function is called through withSpinner mock
      expect(listFiles).toHaveBeenCalled();
    });

    it('should pass silent option to spinner', async () => {
      vi.mocked(listFiles).mockResolvedValueOnce([]);

      const context = {} as unknown as TemplateContext;
      await processTemplates('/test/dir', context, { silent: true });

      expect(listFiles).toHaveBeenCalled();
    });
  });

  describe('showTemplateReport', () => {
    it('should show basic report info', () => {
      const report: TemplateProcessingReport = {
        totalFiles: 10,
        filesModified: 5,
        totalDirectives: 20,
        filesWithErrors: [],
        warnings: [],
      };

      showTemplateReport(report);

      expect(logger.subtitle).toHaveBeenCalledWith('Template Processing Report');
      expect(logger.keyValue).toHaveBeenCalledWith('Files scanned', '10');
      expect(logger.keyValue).toHaveBeenCalledWith('Files modified', '5');
      expect(logger.keyValue).toHaveBeenCalledWith('Directives processed', '20');
    });

    it('should show files with errors', () => {
      const report: TemplateProcessingReport = {
        totalFiles: 5,
        filesModified: 0,
        totalDirectives: 0,
        filesWithErrors: ['bad1.md', 'bad2.md'],
        warnings: [],
      };

      showTemplateReport(report);

      expect(logger.warn).toHaveBeenCalledWith('Files with errors:');
      expect(logger.item).toHaveBeenCalledWith('bad1.md');
      expect(logger.item).toHaveBeenCalledWith('bad2.md');
    });

    it('should show warnings when 5 or fewer', () => {
      const report: TemplateProcessingReport = {
        totalFiles: 5,
        filesModified: 0,
        totalDirectives: 0,
        filesWithErrors: [],
        warnings: ['Warning 1', 'Warning 2', 'Warning 3'],
      };

      showTemplateReport(report);

      expect(logger.warn).toHaveBeenCalledWith('Warnings:');
      expect(logger.item).toHaveBeenCalledWith('Warning 1');
      expect(logger.item).toHaveBeenCalledWith('Warning 2');
      expect(logger.item).toHaveBeenCalledWith('Warning 3');
    });

    it('should truncate warnings when more than 5', () => {
      const report: TemplateProcessingReport = {
        totalFiles: 5,
        filesModified: 0,
        totalDirectives: 0,
        filesWithErrors: [],
        warnings: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'],
      };

      showTemplateReport(report);

      expect(logger.warn).toHaveBeenCalledWith('7 warnings (showing first 5):');
      expect(logger.item).toHaveBeenCalledTimes(5);
    });

    it('should not show warnings section when empty', () => {
      const report: TemplateProcessingReport = {
        totalFiles: 5,
        filesModified: 0,
        totalDirectives: 0,
        filesWithErrors: [],
        warnings: [],
      };

      showTemplateReport(report);

      expect(logger.warn).not.toHaveBeenCalledWith('Warnings:');
    });
  });
});
