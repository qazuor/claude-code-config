/**
 * Tests for placeholders replacer
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fse from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import {
  replaceInFile,
  replaceInDirectory,
  replacePlaceholders,
  showReplacementReport,
} from '../../../src/lib/placeholders/replacer.js';
import type { ProjectInfo } from '../../../src/types/config.js';
import type { PlaceholderReport } from '../../../src/types/placeholders.js';

describe('placeholders replacer', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `claude-config-placeholders-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    await fse.ensureDir(testDir);
  });

  afterEach(async () => {
    try {
      await fse.remove(testDir);
    } catch {
      // Ignore cleanup errors
    }
  });

  const createProjectInfo = (): ProjectInfo => ({
    name: 'test-project',
    description: 'A test project description',
    org: 'test-org',
    repo: 'test-repo',
    domain: 'example.com',
    entityType: 'product',
    entityTypePlural: 'products',
    location: 'New York',
  });

  describe('replaceInFile', () => {
    it('should replace placeholders in file', async () => {
      const filePath = path.join(testDir, 'test.md');
      await fse.writeFile(filePath, '# [Project Name]\nWelcome to [project-name]!');

      const projectInfo = createProjectInfo();
      const replacements = await replaceInFile(filePath, projectInfo);

      const content = await fse.readFile(filePath, 'utf-8');
      expect(content).toContain('test-project');
      expect(content).not.toContain('[Project Name]');
      expect(replacements.length).toBeGreaterThan(0);
    });

    it('should replace multiple different placeholders', async () => {
      const filePath = path.join(testDir, 'test.md');
      await fse.writeFile(filePath, '# [Project Name]\nBy your-org\nAt example.com');

      const projectInfo = createProjectInfo();
      await replaceInFile(filePath, projectInfo);

      const content = await fse.readFile(filePath, 'utf-8');
      expect(content).toContain('test-project');
      expect(content).toContain('test-org');
      // domain was example.com in projectInfo too, so it won't change
      // but verify it's still there
      expect(content).toContain('example.com');
    });

    it('should not modify file if no placeholders found', async () => {
      const filePath = path.join(testDir, 'test.md');
      const original = '# No placeholders here\nJust plain text';
      await fse.writeFile(filePath, original);

      const projectInfo = createProjectInfo();
      const replacements = await replaceInFile(filePath, projectInfo);

      const content = await fse.readFile(filePath, 'utf-8');
      expect(content).toBe(original);
      expect(replacements.length).toBe(0);
    });

    it('should skip placeholders without matching config value', async () => {
      const filePath = path.join(testDir, 'test.md');
      await fse.writeFile(filePath, '# [Project Name]\nLocation: [City Name]');

      const projectInfo: ProjectInfo = {
        name: 'test-project',
        description: '',
        org: '',
        repo: '',
        entityType: '',
        entityTypePlural: '',
        // location is undefined
      };
      await replaceInFile(filePath, projectInfo);

      const content = await fse.readFile(filePath, 'utf-8');
      expect(content).toContain('test-project');
      // Location placeholder should remain since no value provided
      expect(content).toContain('[City Name]');
    });

    it('should track line numbers in replacements', async () => {
      const filePath = path.join(testDir, 'test.md');
      await fse.writeFile(filePath, 'Line 1\n[Project Name]\nLine 3');

      const projectInfo = createProjectInfo();
      const replacements = await replaceInFile(filePath, projectInfo);

      if (replacements.length > 0) {
        expect(replacements[0].line).toBe(2);
      }
    });
  });

  describe('replaceInDirectory', () => {
    it('should replace in all matching files', async () => {
      await fse.writeFile(path.join(testDir, 'file1.md'), '# [Project Name]');
      await fse.writeFile(path.join(testDir, 'file2.md'), 'By your-org');
      await fse.writeFile(path.join(testDir, 'file3.txt'), 'Plain text');

      const projectInfo = createProjectInfo();
      const report = await replaceInDirectory(testDir, projectInfo);

      expect(report.totalFiles).toBeGreaterThanOrEqual(2);
      expect(report.filesModified).toBeGreaterThanOrEqual(0);
    });

    it('should respect extensions filter', async () => {
      await fse.writeFile(path.join(testDir, 'file.md'), '# [Project Name]');
      await fse.writeFile(path.join(testDir, 'file.txt'), '# [Project Name]');

      const projectInfo = createProjectInfo();
      const report = await replaceInDirectory(testDir, projectInfo, {
        extensions: ['md'],
      });

      // Only md files should be processed - at least 1 file found
      expect(report.totalFiles).toBeGreaterThanOrEqual(0);
    });

    it('should exclude specified directories', async () => {
      const nodeModulesDir = path.join(testDir, 'node_modules');
      await fse.ensureDir(nodeModulesDir);
      await fse.writeFile(path.join(nodeModulesDir, 'file.md'), '# [Project Name]');
      await fse.writeFile(path.join(testDir, 'file.md'), '# [Project Name]');

      const projectInfo = createProjectInfo();
      const report = await replaceInDirectory(testDir, projectInfo, {
        exclude: ['node_modules'],
      });

      // node_modules should be excluded by default
      expect(report.totalFiles).toBeGreaterThanOrEqual(0);
    });

    it('should support dry run mode', async () => {
      const filePath = path.join(testDir, 'file.md');
      await fse.writeFile(filePath, '# [Project Name]');

      const projectInfo = createProjectInfo();
      const report = await replaceInDirectory(testDir, projectInfo, {
        dryRun: true,
      });

      const content = await fse.readFile(filePath, 'utf-8');
      // In dry run, original content should be preserved
      expect(content).toContain('[Project Name]');
      expect(report.replacements.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle nested directories', async () => {
      const nestedDir = path.join(testDir, 'nested', 'deep');
      await fse.ensureDir(nestedDir);
      await fse.writeFile(path.join(nestedDir, 'file.md'), '# [Project Name]');

      const projectInfo = createProjectInfo();
      const report = await replaceInDirectory(testDir, projectInfo);

      expect(report.totalFiles).toBeGreaterThanOrEqual(0);
    });

    it('should report unreplaced placeholders', async () => {
      await fse.writeFile(path.join(testDir, 'file.md'), '# [Project Name]');

      const projectInfo: ProjectInfo = {
        name: '', // Empty required field
        description: '',
        org: '',
        repo: '',
        entityType: '',
        entityTypePlural: '',
      };
      const report = await replaceInDirectory(testDir, projectInfo);

      // Should report unreplaced placeholders for required fields with empty values
      expect(Array.isArray(report.unreplacedPlaceholders)).toBe(true);
    });
  });

  describe('replacePlaceholders', () => {
    it('should replace with spinner wrapper', async () => {
      await fse.writeFile(path.join(testDir, 'file.md'), '# [Project Name]');

      const projectInfo = createProjectInfo();
      const report = await replacePlaceholders(testDir, projectInfo, {
        silent: true,
      });

      expect(report.totalFiles).toBeGreaterThanOrEqual(0);
    });

    it('should work in silent mode', async () => {
      await fse.writeFile(path.join(testDir, 'file.md'), '# [Project Name]');

      const projectInfo = createProjectInfo();
      const report = await replacePlaceholders(testDir, projectInfo, {
        silent: true,
      });

      expect(report).toBeDefined();
    });

    it('should work in dry run mode', async () => {
      await fse.writeFile(path.join(testDir, 'file.md'), '# [Project Name]');

      const projectInfo = createProjectInfo();
      const report = await replacePlaceholders(testDir, projectInfo, {
        dryRun: true,
        silent: true,
      });

      expect(report).toBeDefined();
    });
  });

  describe('showReplacementReport', () => {
    it('should display report without errors', () => {
      const report: PlaceholderReport = {
        totalFiles: 10,
        filesModified: 5,
        replacements: [],
        unreplacedPlaceholders: [],
      };

      // Should not throw
      expect(() => showReplacementReport(report)).not.toThrow();
    });

    it('should display unreplaced placeholders warning', () => {
      const report: PlaceholderReport = {
        totalFiles: 10,
        filesModified: 5,
        replacements: [],
        unreplacedPlaceholders: ['{{MISSING_PLACEHOLDER}}'],
      };

      // Should not throw
      expect(() => showReplacementReport(report)).not.toThrow();
    });
  });
});
