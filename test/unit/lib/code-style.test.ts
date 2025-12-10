/**
 * Tests for code style installer
 */

import os from 'node:os';
import path from 'node:path';
import fse from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getCodeStyleDependencies,
  installCodeStyle,
} from '../../../src/lib/code-style/installer.js';
import type { CodeStyleConfig } from '../../../src/types/config.js';

describe('code-style installer', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(
      os.tmpdir(),
      `claude-config-code-style-test-${Date.now()}-${Math.random().toString(36).substring(7)}`
    );
    await fse.ensureDir(testDir);
  });

  afterEach(async () => {
    try {
      await fse.remove(testDir);
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('installCodeStyle', () => {
    it('should not install anything when code style is disabled', async () => {
      const config: CodeStyleConfig = {
        enabled: false,
        editorconfig: false,
        commitlint: false,
        biome: false,
        prettier: false,
      };

      const result = await installCodeStyle(testDir, config);

      expect(result.installed).toHaveLength(0);
      expect(result.skipped).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should install editorconfig when enabled', async () => {
      const config: CodeStyleConfig = {
        enabled: true,
        editorconfig: true,
        commitlint: false,
        biome: false,
        prettier: false,
      };

      const result = await installCodeStyle(testDir, config);

      expect(result.installed).toContain('.editorconfig');
      expect(await fse.pathExists(path.join(testDir, '.editorconfig'))).toBe(true);
    });

    it('should install commitlint config when enabled', async () => {
      const config: CodeStyleConfig = {
        enabled: true,
        editorconfig: false,
        commitlint: true,
        biome: false,
        prettier: false,
      };

      const result = await installCodeStyle(testDir, config);

      expect(result.installed).toContain('commitlint.config.js');
      expect(await fse.pathExists(path.join(testDir, 'commitlint.config.js'))).toBe(true);
    });

    it('should install biome config when enabled', async () => {
      const config: CodeStyleConfig = {
        enabled: true,
        editorconfig: false,
        commitlint: false,
        biome: true,
        prettier: false,
      };

      const result = await installCodeStyle(testDir, config);

      expect(result.installed).toContain('biome.json');
      expect(await fse.pathExists(path.join(testDir, 'biome.json'))).toBe(true);
    });

    it('should install prettier config and ignore file when enabled', async () => {
      const config: CodeStyleConfig = {
        enabled: true,
        editorconfig: false,
        commitlint: false,
        biome: false,
        prettier: true,
      };

      const result = await installCodeStyle(testDir, config);

      expect(result.installed).toContain('.prettierrc');
      expect(result.installed).toContain('.prettierignore');
      expect(await fse.pathExists(path.join(testDir, '.prettierrc'))).toBe(true);
      expect(await fse.pathExists(path.join(testDir, '.prettierignore'))).toBe(true);
    });

    it('should install multiple configs when multiple tools are enabled', async () => {
      const config: CodeStyleConfig = {
        enabled: true,
        editorconfig: true,
        commitlint: true,
        biome: true,
        prettier: false,
      };

      const result = await installCodeStyle(testDir, config);

      expect(result.installed).toContain('.editorconfig');
      expect(result.installed).toContain('commitlint.config.js');
      expect(result.installed).toContain('biome.json');
      expect(result.installed.length).toBe(3);
    });

    it('should skip existing files without overwrite option', async () => {
      // Create existing file
      await fse.writeFile(path.join(testDir, '.editorconfig'), '# existing');

      const config: CodeStyleConfig = {
        enabled: true,
        editorconfig: true,
        commitlint: false,
        biome: false,
        prettier: false,
      };

      const result = await installCodeStyle(testDir, config);

      expect(result.skipped).toContain('.editorconfig');
      expect(result.installed).not.toContain('.editorconfig');

      // Verify content wasn't changed
      const content = await fse.readFile(path.join(testDir, '.editorconfig'), 'utf-8');
      expect(content).toBe('# existing');
    });

    it('should overwrite existing files with overwrite option', async () => {
      // Create existing file
      await fse.writeFile(path.join(testDir, '.editorconfig'), '# existing');

      const config: CodeStyleConfig = {
        enabled: true,
        editorconfig: true,
        commitlint: false,
        biome: false,
        prettier: false,
      };

      const result = await installCodeStyle(testDir, config, { overwrite: true });

      expect(result.installed).toContain('.editorconfig');
      expect(result.skipped).not.toContain('.editorconfig');

      // Verify content was replaced
      const content = await fse.readFile(path.join(testDir, '.editorconfig'), 'utf-8');
      expect(content).not.toBe('# existing');
      expect(content).toContain('root = true');
    });
  });

  describe('getCodeStyleDependencies', () => {
    it('should return empty arrays when no tools are enabled', () => {
      const config: CodeStyleConfig = {
        enabled: false,
        editorconfig: false,
        commitlint: false,
        biome: false,
        prettier: false,
      };

      const result = getCodeStyleDependencies(config);

      expect(result.devDependencies).toHaveLength(0);
      expect(result.instructions).toHaveLength(0);
    });

    it('should return commitlint dependencies when commitlint is enabled', () => {
      const config: CodeStyleConfig = {
        enabled: true,
        editorconfig: false,
        commitlint: true,
        biome: false,
        prettier: false,
      };

      const result = getCodeStyleDependencies(config);

      expect(result.devDependencies).toContain('@commitlint/cli');
      expect(result.devDependencies).toContain('@commitlint/config-conventional');
      expect(result.instructions.some((i) => i.includes('Husky'))).toBe(true);
    });

    it('should return biome dependencies when biome is enabled', () => {
      const config: CodeStyleConfig = {
        enabled: true,
        editorconfig: false,
        commitlint: false,
        biome: true,
        prettier: false,
      };

      const result = getCodeStyleDependencies(config);

      expect(result.devDependencies).toContain('@biomejs/biome');
      expect(result.instructions.some((i) => i.includes('biome'))).toBe(true);
    });

    it('should return prettier dependencies when prettier is enabled', () => {
      const config: CodeStyleConfig = {
        enabled: true,
        editorconfig: false,
        commitlint: false,
        biome: false,
        prettier: true,
      };

      const result = getCodeStyleDependencies(config);

      expect(result.devDependencies).toContain('prettier');
      expect(result.instructions.some((i) => i.includes('prettier'))).toBe(true);
    });

    it('should not return dependencies for editorconfig (no deps needed)', () => {
      const config: CodeStyleConfig = {
        enabled: true,
        editorconfig: true,
        commitlint: false,
        biome: false,
        prettier: false,
      };

      const result = getCodeStyleDependencies(config);

      // EditorConfig doesn't need npm dependencies
      expect(result.devDependencies).toHaveLength(0);
    });

    it('should return all dependencies when all tools are enabled', () => {
      const config: CodeStyleConfig = {
        enabled: true,
        editorconfig: true,
        commitlint: true,
        biome: true,
        prettier: true,
      };

      const result = getCodeStyleDependencies(config);

      expect(result.devDependencies).toContain('@commitlint/cli');
      expect(result.devDependencies).toContain('@commitlint/config-conventional');
      expect(result.devDependencies).toContain('@biomejs/biome');
      expect(result.devDependencies).toContain('prettier');
    });
  });
});
