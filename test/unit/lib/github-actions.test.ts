/**
 * Tests for GitHub Actions generator
 */
import os from 'node:os';
import path from 'node:path';
import fse from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  type CICDConfig,
  getDefaultCICDConfig,
  installCICD,
} from '../../../src/lib/ci-cd/github-actions-generator.js';

describe('github-actions-generator', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `github-actions-test-${Date.now()}`);
    await fse.ensureDir(testDir);
  });

  afterEach(async () => {
    await fse.remove(testDir);
  });

  describe('getDefaultCICDConfig', () => {
    it('should return default config for pnpm', () => {
      const config = getDefaultCICDConfig('pnpm');

      expect(config.enabled).toBe(true);
      expect(config.provider).toBe('github-actions');
      expect(config.ci).toBe(true);
      expect(config.cd).toBe(false);
      expect(config.packageManager).toBe('pnpm');
      expect(config.nodeVersion).toBe('22');
      expect(config.enableCaching).toBe(true);
      expect(config.runTests).toBe(true);
      expect(config.runLint).toBe(true);
      expect(config.runTypecheck).toBe(true);
      expect(config.runBuild).toBe(true);
    });

    it('should return default config for npm', () => {
      const config = getDefaultCICDConfig('npm');

      expect(config.packageManager).toBe('npm');
    });

    it('should return default config for yarn', () => {
      const config = getDefaultCICDConfig('yarn');

      expect(config.packageManager).toBe('yarn');
    });

    it('should return default config for bun', () => {
      const config = getDefaultCICDConfig('bun');

      expect(config.packageManager).toBe('bun');
    });
  });

  describe('installCICD', () => {
    it('should create .github/workflows directory', async () => {
      const config = getDefaultCICDConfig('pnpm');

      const result = await installCICD(testDir, config);

      expect(result.created).toContain('ci.yml');

      const workflowsDir = path.join(testDir, '.github', 'workflows');
      const exists = await fse.pathExists(workflowsDir);
      expect(exists).toBe(true);
    });

    it('should create ci.yml when ci is enabled', async () => {
      const config = getDefaultCICDConfig('pnpm');

      await installCICD(testDir, config);

      const ciPath = path.join(testDir, '.github', 'workflows', 'ci.yml');
      const exists = await fse.pathExists(ciPath);
      expect(exists).toBe(true);

      const content = await fse.readFile(ciPath, 'utf-8');
      expect(content).toContain('name: CI');
      expect(content).toContain('pnpm');
    });

    it('should create release.yml when cd is enabled', async () => {
      const config: CICDConfig = { ...getDefaultCICDConfig('pnpm'), cd: true };

      await installCICD(testDir, config);

      const releasePath = path.join(testDir, '.github', 'workflows', 'release.yml');
      const exists = await fse.pathExists(releasePath);
      expect(exists).toBe(true);

      const content = await fse.readFile(releasePath, 'utf-8');
      expect(content).toContain('name: Release');
      expect(content).toContain('tags');
    });

    it('should not create release.yml when cd is disabled', async () => {
      const config = getDefaultCICDConfig('pnpm');

      await installCICD(testDir, config);

      const releasePath = path.join(testDir, '.github', 'workflows', 'release.yml');
      const exists = await fse.pathExists(releasePath);
      expect(exists).toBe(false);
    });

    it('should return empty result when disabled', async () => {
      const config: CICDConfig = { ...getDefaultCICDConfig('pnpm'), enabled: false };

      const result = await installCICD(testDir, config);

      expect(result.created).toHaveLength(0);
      expect(result.skipped).toHaveLength(0);
    });

    it('should skip existing files when overwrite is false', async () => {
      // Create existing file
      const workflowsDir = path.join(testDir, '.github', 'workflows');
      await fse.ensureDir(workflowsDir);
      await fse.writeFile(path.join(workflowsDir, 'ci.yml'), 'existing content');

      const config = getDefaultCICDConfig('pnpm');

      const result = await installCICD(testDir, config, { overwrite: false });

      expect(result.skipped).toContain('ci.yml');

      // Original content should be preserved
      const content = await fse.readFile(path.join(workflowsDir, 'ci.yml'), 'utf-8');
      expect(content).toBe('existing content');
    });

    it('should overwrite existing files when overwrite is true', async () => {
      // Create existing file
      const workflowsDir = path.join(testDir, '.github', 'workflows');
      await fse.ensureDir(workflowsDir);
      await fse.writeFile(path.join(workflowsDir, 'ci.yml'), 'existing content');

      const config = getDefaultCICDConfig('pnpm');

      const result = await installCICD(testDir, config, { overwrite: true });

      expect(result.created).toContain('ci.yml');

      // Content should be new
      const content = await fse.readFile(path.join(workflowsDir, 'ci.yml'), 'utf-8');
      expect(content).toContain('name: CI');
    });

    it('should include npm ci when packageManager is npm', async () => {
      const config = getDefaultCICDConfig('npm');

      await installCICD(testDir, config);

      const ciPath = path.join(testDir, '.github', 'workflows', 'ci.yml');
      const content = await fse.readFile(ciPath, 'utf-8');
      expect(content).toContain('npm ci');
    });

    it('should include yarn when packageManager is yarn', async () => {
      const config = getDefaultCICDConfig('yarn');

      await installCICD(testDir, config);

      const ciPath = path.join(testDir, '.github', 'workflows', 'ci.yml');
      const content = await fse.readFile(ciPath, 'utf-8');
      expect(content).toContain('yarn install --frozen-lockfile');
    });

    it('should setup bun when packageManager is bun', async () => {
      const config = getDefaultCICDConfig('bun');

      await installCICD(testDir, config);

      const ciPath = path.join(testDir, '.github', 'workflows', 'ci.yml');
      const content = await fse.readFile(ciPath, 'utf-8');
      expect(content).toContain('Setup Bun');
      expect(content).toContain('oven-sh/setup-bun');
    });

    it('should include correct node version', async () => {
      const config: CICDConfig = { ...getDefaultCICDConfig('pnpm'), nodeVersion: '20' };

      await installCICD(testDir, config);

      const ciPath = path.join(testDir, '.github', 'workflows', 'ci.yml');
      const content = await fse.readFile(ciPath, 'utf-8');
      expect(content).toContain("node-version: '20'");
    });
  });
});
