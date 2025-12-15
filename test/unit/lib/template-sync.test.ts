/**
 * Tests for template sync functionality
 */
import os from 'node:os';
import path from 'node:path';
import fse from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  checkTemplatesNeedUpdate,
  formatSyncResult,
  syncStandardsTemplates,
} from '../../../src/lib/standards/template-sync.js';
import type { TemplateSyncResult } from '../../../src/lib/standards/template-sync.js';

// Mock getTemplatesPath to return a controllable path
vi.mock('../../../src/lib/utils/paths.js', () => ({
  getTemplatesPath: vi.fn(() => '/mock/templates'),
}));

describe('template-sync', () => {
  let testDir: string;
  let mockTemplatesDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `template-sync-test-${Date.now()}`);
    mockTemplatesDir = path.join(testDir, 'mock-templates');

    await fse.ensureDir(testDir);
    await fse.ensureDir(mockTemplatesDir);

    // Reset mock to use our test templates directory
    const pathsModule = await import('../../../src/lib/utils/paths.js');
    vi.mocked(pathsModule.getTemplatesPath).mockReturnValue(mockTemplatesDir);
  });

  afterEach(async () => {
    await fse.remove(testDir);
    vi.clearAllMocks();
  });

  describe('syncStandardsTemplates', () => {
    it('should create templates when target directory is empty', async () => {
      const claudePath = path.join(testDir, '.claude');
      const sourceDir = path.join(mockTemplatesDir, 'docs', 'standards');

      // Create source template
      await fse.ensureDir(sourceDir);
      await fse.writeFile(
        path.join(sourceDir, 'code-standards.md'),
        '# Code Standards\n\n{{INDENT_STYLE}}'
      );

      const result = await syncStandardsTemplates(claudePath);

      expect(result.created).toContain('code-standards.md');
      expect(result.errors).toHaveLength(0);

      // Verify file was created
      const targetFile = path.join(claudePath, 'docs', 'standards', 'code-standards.md');
      expect(await fse.pathExists(targetFile)).toBe(true);
    });

    it('should skip existing templates with placeholders', async () => {
      const claudePath = path.join(testDir, '.claude');
      const sourceDir = path.join(mockTemplatesDir, 'docs', 'standards');
      const targetDir = path.join(claudePath, 'docs', 'standards');

      // Create source template
      await fse.ensureDir(sourceDir);
      await fse.writeFile(
        path.join(sourceDir, 'code-standards.md'),
        '# Code Standards\n\n{{INDENT_STYLE}}'
      );

      // Create target with placeholders already
      await fse.ensureDir(targetDir);
      await fse.writeFile(
        path.join(targetDir, 'code-standards.md'),
        '# Code Standards\n\nAUTO-GENERATED: Configured values'
      );

      const result = await syncStandardsTemplates(claudePath);

      expect(result.skipped).toContain('code-standards.md');
      expect(result.created).not.toContain('code-standards.md');
    });

    it('should update existing templates when overwrite is true', async () => {
      const claudePath = path.join(testDir, '.claude');
      const sourceDir = path.join(mockTemplatesDir, 'docs', 'standards');
      const targetDir = path.join(claudePath, 'docs', 'standards');

      // Create source template with new content
      await fse.ensureDir(sourceDir);
      await fse.writeFile(path.join(sourceDir, 'code-standards.md'), '# NEW CONTENT');

      // Create target with old content
      await fse.ensureDir(targetDir);
      await fse.writeFile(
        path.join(targetDir, 'code-standards.md'),
        '# OLD CONTENT\n\nAUTO-GENERATED: Configured values'
      );

      const result = await syncStandardsTemplates(claudePath, { overwrite: true });

      expect(result.updated).toContain('code-standards.md');

      // Verify content was updated
      const content = await fse.readFile(path.join(targetDir, 'code-standards.md'), 'utf-8');
      expect(content).toBe('# NEW CONTENT');
    });

    it('should create backup when backup option is true', async () => {
      const claudePath = path.join(testDir, '.claude');
      const sourceDir = path.join(mockTemplatesDir, 'docs', 'standards');
      const targetDir = path.join(claudePath, 'docs', 'standards');

      // Create source template
      await fse.ensureDir(sourceDir);
      await fse.writeFile(path.join(sourceDir, 'code-standards.md'), '# NEW CONTENT');

      // Create target with existing content
      await fse.ensureDir(targetDir);
      await fse.writeFile(
        path.join(targetDir, 'code-standards.md'),
        '# OLD CONTENT\n\nAUTO-GENERATED: Configured values'
      );

      await syncStandardsTemplates(claudePath, { overwrite: true, backup: true });

      // Check backup was created
      const files = await fse.readdir(targetDir);
      const backupFile = files.find((f) => f.startsWith('code-standards.md.backup-'));
      expect(backupFile).toBeDefined();

      // Verify backup content
      if (backupFile) {
        const backupContent = await fse.readFile(path.join(targetDir, backupFile), 'utf-8');
        expect(backupContent).toContain('# OLD CONTENT');
      }
    });

    it('should handle missing source templates gracefully', async () => {
      const claudePath = path.join(testDir, '.claude');

      // Don't create any source templates
      const sourceDir = path.join(mockTemplatesDir, 'docs', 'standards');
      await fse.ensureDir(sourceDir);

      const result = await syncStandardsTemplates(claudePath);

      // All should be skipped since source files don't exist
      expect(result.skipped.length).toBeGreaterThan(0);
      expect(result.created).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should create target directory if it does not exist', async () => {
      const claudePath = path.join(testDir, '.claude-new');
      const sourceDir = path.join(mockTemplatesDir, 'docs', 'standards');

      // Create source template
      await fse.ensureDir(sourceDir);
      await fse.writeFile(path.join(sourceDir, 'code-standards.md'), '# Test');

      await syncStandardsTemplates(claudePath);

      // Verify directory was created
      expect(await fse.pathExists(path.join(claudePath, 'docs', 'standards'))).toBe(true);
    });
  });

  describe('checkTemplatesNeedUpdate', () => {
    it('should detect missing templates', async () => {
      const claudePath = path.join(testDir, '.claude');
      const sourceDir = path.join(mockTemplatesDir, 'docs', 'standards');

      // Create source template
      await fse.ensureDir(sourceDir);
      await fse.writeFile(path.join(sourceDir, 'code-standards.md'), '# Test');

      // Don't create target
      await fse.ensureDir(path.join(claudePath, 'docs', 'standards'));

      const result = await checkTemplatesNeedUpdate(claudePath);

      expect(result.needsUpdate).toBe(true);
      expect(result.missing).toContain('code-standards.md');
    });

    it('should detect outdated templates without placeholders', async () => {
      const claudePath = path.join(testDir, '.claude');
      const sourceDir = path.join(mockTemplatesDir, 'docs', 'standards');
      const targetDir = path.join(claudePath, 'docs', 'standards');

      // Create source template with placeholders
      await fse.ensureDir(sourceDir);
      await fse.writeFile(path.join(sourceDir, 'code-standards.md'), '# Test {{INDENT_STYLE}}');

      // Create target without placeholders
      await fse.ensureDir(targetDir);
      await fse.writeFile(path.join(targetDir, 'code-standards.md'), '# Old Content');

      const result = await checkTemplatesNeedUpdate(claudePath);

      expect(result.needsUpdate).toBe(true);
      expect(result.outdated).toContain('code-standards.md');
    });

    it('should return false when all templates are up to date', async () => {
      const claudePath = path.join(testDir, '.claude');
      const sourceDir = path.join(mockTemplatesDir, 'docs', 'standards');
      const targetDir = path.join(claudePath, 'docs', 'standards');

      const allTemplates = [
        'code-standards.md',
        'testing-standards.md',
        'documentation-standards.md',
        'design-standards.md',
        'security-standards.md',
        'performance-standards.md',
      ];

      // Create all source templates
      await fse.ensureDir(sourceDir);
      await fse.ensureDir(targetDir);

      for (const template of allTemplates) {
        await fse.writeFile(path.join(sourceDir, template), '# Test');
        // Create target with placeholders (considered up to date)
        await fse.writeFile(
          path.join(targetDir, template),
          '# Test\n\nAUTO-GENERATED: Configured values'
        );
      }

      const result = await checkTemplatesNeedUpdate(claudePath);

      expect(result.needsUpdate).toBe(false);
      expect(result.missing).toHaveLength(0);
      expect(result.outdated).toHaveLength(0);
    });
  });

  describe('formatSyncResult', () => {
    it('should format result with created files', () => {
      const result: TemplateSyncResult = {
        created: ['code-standards.md', 'testing-standards.md'],
        updated: [],
        skipped: [],
        errors: [],
      };

      const formatted = formatSyncResult(result);

      expect(formatted).toContain('Template Sync Results');
      expect(formatted).toContain('Created: 2');
      expect(formatted).toContain('code-standards.md');
      expect(formatted).toContain('testing-standards.md');
    });

    it('should format result with updated files', () => {
      const result: TemplateSyncResult = {
        created: [],
        updated: ['code-standards.md'],
        skipped: [],
        errors: [],
      };

      const formatted = formatSyncResult(result);

      expect(formatted).toContain('Updated: 1');
      expect(formatted).toContain('code-standards.md');
    });

    it('should format result with skipped files', () => {
      const result: TemplateSyncResult = {
        created: [],
        updated: [],
        skipped: ['code-standards.md', 'testing-standards.md', 'design-standards.md'],
        errors: [],
      };

      const formatted = formatSyncResult(result);

      expect(formatted).toContain('Skipped (already up to date): 3');
    });

    it('should format result with errors', () => {
      const result: TemplateSyncResult = {
        created: [],
        updated: [],
        skipped: [],
        errors: ['code-standards.md: Permission denied'],
      };

      const formatted = formatSyncResult(result);

      expect(formatted).toContain('Errors: 1');
      expect(formatted).toContain('Permission denied');
    });

    it('should format mixed results', () => {
      const result: TemplateSyncResult = {
        created: ['new.md'],
        updated: ['updated.md'],
        skipped: ['skipped.md'],
        errors: ['error.md: Failed'],
      };

      const formatted = formatSyncResult(result);

      expect(formatted).toContain('Created: 1');
      expect(formatted).toContain('Updated: 1');
      expect(formatted).toContain('Skipped');
      expect(formatted).toContain('Errors: 1');
    });
  });
});
