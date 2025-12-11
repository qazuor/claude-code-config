/**
 * Tests for CLAUDE.md generator
 */
import os from 'node:os';
import path from 'node:path';
import fse from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generateClaudeMd } from '../../../src/lib/scaffold/claude-md-generator.js';
import type { ProjectInfo } from '../../../src/types/config.js';

describe('claude-md-generator', () => {
  let testDir: string;

  const mockProjectInfo: ProjectInfo = {
    name: 'test-project',
    description: 'A test project',
    org: 'test-org',
    repo: 'test-repo',
    entityType: 'item',
    entityTypePlural: 'items',
  };

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `claude-md-test-${Date.now()}`);
    await fse.ensureDir(testDir);
  });

  afterEach(async () => {
    await fse.remove(testDir);
  });

  describe('generateClaudeMd', () => {
    it('should create CLAUDE.md file', async () => {
      const result = await generateClaudeMd(testDir, mockProjectInfo);

      expect(result.created).toBe(true);
      expect(result.skipped).toBe(false);
      expect(result.path).toBe(path.join(testDir, 'CLAUDE.md'));

      const exists = await fse.pathExists(result.path);
      expect(exists).toBe(true);
    });

    it('should include project name in generated file', async () => {
      await generateClaudeMd(testDir, mockProjectInfo);

      const content = await fse.readFile(path.join(testDir, 'CLAUDE.md'), 'utf-8');
      expect(content).toContain('test-project');
    });

    it('should include project description', async () => {
      await generateClaudeMd(testDir, mockProjectInfo);

      const content = await fse.readFile(path.join(testDir, 'CLAUDE.md'), 'utf-8');
      expect(content).toContain('A test project');
    });

    it('should include GitHub org and repo', async () => {
      await generateClaudeMd(testDir, mockProjectInfo);

      const content = await fse.readFile(path.join(testDir, 'CLAUDE.md'), 'utf-8');
      expect(content).toContain('test-org');
      expect(content).toContain('test-repo');
    });

    it('should skip if file exists and overwrite is false', async () => {
      // Create existing file
      await fse.writeFile(path.join(testDir, 'CLAUDE.md'), 'existing content');

      const result = await generateClaudeMd(testDir, mockProjectInfo, { overwrite: false });

      expect(result.created).toBe(false);
      expect(result.skipped).toBe(true);

      // Original content should be preserved
      const content = await fse.readFile(path.join(testDir, 'CLAUDE.md'), 'utf-8');
      expect(content).toBe('existing content');
    });

    it('should overwrite if overwrite option is true', async () => {
      // Create existing file
      await fse.writeFile(path.join(testDir, 'CLAUDE.md'), 'existing content');

      const result = await generateClaudeMd(testDir, mockProjectInfo, { overwrite: true });

      expect(result.created).toBe(true);
      expect(result.skipped).toBe(false);

      // Content should be new
      const content = await fse.readFile(path.join(testDir, 'CLAUDE.md'), 'utf-8');
      expect(content).toContain('test-project');
    });

    it('should include domain when provided', async () => {
      const infoWithDomain: ProjectInfo = {
        ...mockProjectInfo,
        domain: 'example.com',
      };

      await generateClaudeMd(testDir, infoWithDomain);

      const content = await fse.readFile(path.join(testDir, 'CLAUDE.md'), 'utf-8');
      expect(content).toContain('example.com');
    });

    it('should use custom template when provided', async () => {
      const customTemplate = '# Custom\n\n{{PROJECT_NAME}} - {{PROJECT_DESCRIPTION}}';

      await generateClaudeMd(testDir, mockProjectInfo, { customTemplate });

      const content = await fse.readFile(path.join(testDir, 'CLAUDE.md'), 'utf-8');
      expect(content).toBe('# Custom\n\ntest-project - A test project');
    });
  });
});
