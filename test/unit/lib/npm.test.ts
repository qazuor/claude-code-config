/**
 * Tests for npm package manager utilities
 */

import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createMinimalPackageJson,
  deriveToolSelectionFromCodeStyle,
  formatPackageManagerField,
  generatePackageJsonChanges,
  getInstallCommand,
  getSetupInstructions,
  readPackageJson,
  updatePackageJson,
  writePackageJson,
} from '../../../src/lib/npm/index.js';
import type { DependencyGenerationConfig, ToolSelection } from '../../../src/types/package-json.js';

describe('npm package manager utilities', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'npm-test-'));
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('readPackageJson', () => {
    it('should read existing package.json', async () => {
      const pkgJson = { name: 'test', version: '1.0.0' };
      await fs.writeJson(path.join(testDir, 'package.json'), pkgJson);

      const result = await readPackageJson(testDir);
      expect(result).toEqual(pkgJson);
    });

    it('should return null for non-existent package.json', async () => {
      const result = await readPackageJson(testDir);
      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', async () => {
      await fs.writeFile(path.join(testDir, 'package.json'), 'invalid json');

      const result = await readPackageJson(testDir);
      expect(result).toBeNull();
    });
  });

  describe('writePackageJson', () => {
    it('should write package.json', async () => {
      const pkgJson = { name: 'test', version: '1.0.0' };
      await writePackageJson(testDir, pkgJson);

      const content = await fs.readFile(path.join(testDir, 'package.json'), 'utf-8');
      expect(JSON.parse(content)).toEqual(pkgJson);
    });

    it('should format with 2-space indentation', async () => {
      const pkgJson = { name: 'test', nested: { key: 'value' } };
      await writePackageJson(testDir, pkgJson);

      const content = await fs.readFile(path.join(testDir, 'package.json'), 'utf-8');
      expect(content).toContain('  "name"');
    });
  });

  describe('createMinimalPackageJson', () => {
    it('should create minimal package.json with defaults', () => {
      const result = createMinimalPackageJson({});

      expect(result.name).toBe('my-project');
      expect(result.version).toBe('0.0.1');
      expect(result.type).toBe('module');
      expect(result.scripts).toEqual({});
      expect(result.dependencies).toEqual({});
      expect(result.devDependencies).toEqual({});
    });

    it('should use provided options', () => {
      const result = createMinimalPackageJson({
        name: 'custom-name',
        description: 'My description',
        version: '2.0.0',
        author: 'John Doe',
        license: 'MIT',
      });

      expect(result.name).toBe('custom-name');
      expect(result.description).toBe('My description');
      expect(result.version).toBe('2.0.0');
      expect(result.author).toBe('John Doe');
      expect(result.license).toBe('MIT');
    });
  });

  describe('generatePackageJsonChanges', () => {
    it('should generate changes for biome linter', () => {
      const config: DependencyGenerationConfig = {
        tools: { linter: 'biome' },
        packageManager: 'pnpm',
      };

      const changes = generatePackageJsonChanges(config);

      expect(changes.devDependencies).toHaveProperty('@biomejs/biome');
      expect(changes.scripts).toHaveProperty('lint');
      expect(changes.scripts).toHaveProperty('lint:fix');
    });

    it('should generate changes for prettier formatter', () => {
      const config: DependencyGenerationConfig = {
        tools: { formatter: 'prettier' },
        packageManager: 'pnpm',
      };

      const changes = generatePackageJsonChanges(config);

      expect(changes.devDependencies).toHaveProperty('prettier');
      expect(changes.scripts).toHaveProperty('format');
    });

    it('should generate changes for vitest', () => {
      const config: DependencyGenerationConfig = {
        tools: { testRunner: 'vitest' },
        packageManager: 'pnpm',
      };

      const changes = generatePackageJsonChanges(config);

      expect(changes.devDependencies).toHaveProperty('vitest');
      expect(changes.scripts).toHaveProperty('test');
    });

    it('should generate changes for commitlint', () => {
      const config: DependencyGenerationConfig = {
        tools: { commitlint: true },
        packageManager: 'pnpm',
      };

      const changes = generatePackageJsonChanges(config);

      expect(changes.devDependencies).toHaveProperty('@commitlint/cli');
      expect(changes.devDependencies).toHaveProperty('@commitlint/config-conventional');
    });

    it('should handle none tools', () => {
      const config: DependencyGenerationConfig = {
        tools: { linter: 'none', formatter: 'none', testRunner: 'none' },
        packageManager: 'pnpm',
      };

      const changes = generatePackageJsonChanges(config);

      expect(Object.keys(changes.devDependencies || {})).toHaveLength(0);
      expect(Object.keys(changes.scripts || {})).toHaveLength(0);
    });

    it('should include project metadata', () => {
      const config: DependencyGenerationConfig = {
        tools: {},
        packageManager: 'pnpm',
        project: {
          name: 'my-project',
          description: 'Test project',
          author: 'John',
        },
      };

      const changes = generatePackageJsonChanges(config);

      expect(changes.metadata?.name).toBe('my-project');
      expect(changes.metadata?.description).toBe('Test project');
      expect(changes.metadata?.author).toBe('John');
    });
  });

  describe('updatePackageJson', () => {
    it('should create package.json if missing', async () => {
      const changes = {
        scripts: { test: 'vitest' },
        devDependencies: { vitest: '^2.0.0' },
      };

      const result = await updatePackageJson(testDir, changes, { createIfMissing: true });

      expect(result.success).toBe(true);
      expect(result.created).toBe(true);
      expect(result.addedScripts).toContain('test');
      expect(result.addedDevDependencies).toContain('vitest');

      const pkgJson = await fs.readJson(path.join(testDir, 'package.json'));
      expect(pkgJson.scripts.test).toBe('vitest');
      expect(pkgJson.devDependencies.vitest).toBe('^2.0.0');
    });

    it('should fail if package.json missing and createIfMissing is false', async () => {
      const changes = { scripts: { test: 'vitest' } };

      const result = await updatePackageJson(testDir, changes, { createIfMissing: false });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should skip existing scripts by default', async () => {
      const existingPkg = {
        name: 'test',
        scripts: { test: 'existing-test' },
      };
      await fs.writeJson(path.join(testDir, 'package.json'), existingPkg);

      const changes = { scripts: { test: 'new-test', lint: 'eslint' } };

      const result = await updatePackageJson(testDir, changes);

      expect(result.success).toBe(true);
      expect(result.skippedScripts).toContain('test');
      expect(result.addedScripts).toContain('lint');

      const pkgJson = await fs.readJson(path.join(testDir, 'package.json'));
      expect(pkgJson.scripts.test).toBe('existing-test');
      expect(pkgJson.scripts.lint).toBe('eslint');
    });

    it('should skip existing dependencies by default', async () => {
      const existingPkg = {
        name: 'test',
        devDependencies: { vitest: '^1.0.0' },
      };
      await fs.writeJson(path.join(testDir, 'package.json'), existingPkg);

      const changes = { devDependencies: { vitest: '^2.0.0', jest: '^29.0.0' } };

      const result = await updatePackageJson(testDir, changes);

      expect(result.success).toBe(true);
      expect(result.skippedDevDependencies).toContain('vitest');
      expect(result.addedDevDependencies).toContain('jest');

      const pkgJson = await fs.readJson(path.join(testDir, 'package.json'));
      expect(pkgJson.devDependencies.vitest).toBe('^1.0.0');
      expect(pkgJson.devDependencies.jest).toBe('^29.0.0');
    });

    it('should support dry run mode', async () => {
      const changes = { scripts: { test: 'vitest' } };

      const result = await updatePackageJson(testDir, changes, {
        createIfMissing: true,
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.created).toBe(true);

      const exists = await fs.pathExists(path.join(testDir, 'package.json'));
      expect(exists).toBe(false);
    });
  });

  describe('getInstallCommand', () => {
    it('should return correct command for each package manager', () => {
      expect(getInstallCommand('npm')).toBe('npm install');
      expect(getInstallCommand('yarn')).toBe('yarn');
      expect(getInstallCommand('pnpm')).toBe('pnpm install');
      expect(getInstallCommand('bun')).toBe('bun install');
    });
  });

  describe('formatPackageManagerField', () => {
    it('should format package manager field', () => {
      expect(formatPackageManagerField('pnpm')).toMatch(/pnpm@\d+\.\d+\.\d+/);
      expect(formatPackageManagerField('npm')).toMatch(/npm@\d+\.\d+\.\d+/);
    });

    it('should use provided version', () => {
      expect(formatPackageManagerField('pnpm', '8.15.0')).toBe('pnpm@8.15.0');
    });
  });

  describe('deriveToolSelectionFromCodeStyle', () => {
    it('should derive biome as linter and formatter', () => {
      const result = deriveToolSelectionFromCodeStyle({ biome: true });

      expect(result.linter).toBe('biome');
      expect(result.formatter).toBe('biome');
    });

    it('should derive prettier as formatter', () => {
      const result = deriveToolSelectionFromCodeStyle({ prettier: true });

      expect(result.formatter).toBe('prettier');
    });

    it('should prefer prettier over biome for formatter when both enabled', () => {
      const result = deriveToolSelectionFromCodeStyle({ biome: true, prettier: true });

      expect(result.linter).toBe('biome');
      expect(result.formatter).toBe('prettier');
    });

    it('should derive commitlint with husky', () => {
      const result = deriveToolSelectionFromCodeStyle({ commitlint: true });

      expect(result.commitlint).toBe(true);
      expect(result.husky).toBe(true);
    });
  });

  describe('getSetupInstructions', () => {
    it('should return empty for no tools', () => {
      const result = getSetupInstructions({});
      expect(result).toEqual([]);
    });

    it('should return instructions for commitlint', () => {
      const result = getSetupInstructions({ commitlint: true });
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return instructions for playwright', () => {
      const result = getSetupInstructions({ testRunner: 'playwright' });
      expect(result.some((i) => i.includes('playwright'))).toBe(true);
    });
  });
});
