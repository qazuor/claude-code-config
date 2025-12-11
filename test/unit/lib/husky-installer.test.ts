/**
 * Tests for Husky installer
 */
import os from 'node:os';
import path from 'node:path';
import fse from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  type HuskyConfig,
  deriveHuskyConfigFromCodeStyle,
  installHusky,
} from '../../../src/lib/git-hooks/husky-installer.js';
import type { CodeStyleConfig } from '../../../src/types/config.js';

describe('husky-installer', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `husky-test-${Date.now()}`);
    await fse.ensureDir(testDir);
  });

  afterEach(async () => {
    await fse.remove(testDir);
  });

  describe('deriveHuskyConfigFromCodeStyle', () => {
    it('should return null when code style is disabled', () => {
      const codeStyle: CodeStyleConfig = {
        enabled: false,
        editorconfig: false,
        commitlint: false,
        biome: false,
        prettier: false,
      };

      const result = deriveHuskyConfigFromCodeStyle(codeStyle);
      expect(result).toBeNull();
    });

    it('should return null when commitlint is disabled', () => {
      const codeStyle: CodeStyleConfig = {
        enabled: true,
        editorconfig: true,
        commitlint: false,
        biome: true,
        prettier: false,
      };

      const result = deriveHuskyConfigFromCodeStyle(codeStyle);
      expect(result).toBeNull();
    });

    it('should return null when commitlint has no husky integration', () => {
      const codeStyle: CodeStyleConfig = {
        enabled: true,
        editorconfig: false,
        commitlint: true,
        commitlintOptions: {
          huskyIntegration: false,
        },
        biome: false,
        prettier: false,
      };

      const result = deriveHuskyConfigFromCodeStyle(codeStyle);
      expect(result).toBeNull();
    });

    it('should return config when commitlint with husky integration is enabled', () => {
      const codeStyle: CodeStyleConfig = {
        enabled: true,
        editorconfig: false,
        commitlint: true,
        commitlintOptions: {
          huskyIntegration: true,
        },
        biome: false,
        prettier: false,
      };

      const result = deriveHuskyConfigFromCodeStyle(codeStyle);
      expect(result).not.toBeNull();
      expect(result?.commitlint).toBe(true);
    });

    it('should include biome lint command when biome is enabled', () => {
      const codeStyle: CodeStyleConfig = {
        enabled: true,
        editorconfig: false,
        commitlint: true,
        commitlintOptions: {
          huskyIntegration: true,
        },
        biome: true,
        prettier: false,
      };

      const result = deriveHuskyConfigFromCodeStyle(codeStyle);
      expect(result?.preCommit).toBe(true);
      expect(result?.lintCommand).toContain('biome');
    });

    it('should include lint-staged command when prettier is enabled', () => {
      const codeStyle: CodeStyleConfig = {
        enabled: true,
        editorconfig: false,
        commitlint: true,
        commitlintOptions: {
          huskyIntegration: true,
        },
        biome: false,
        prettier: true,
      };

      const result = deriveHuskyConfigFromCodeStyle(codeStyle);
      expect(result?.preCommit).toBe(true);
      expect(result?.lintCommand).toContain('lint-staged');
    });
  });

  describe('installHusky', () => {
    it('should create .husky directory', async () => {
      const config: HuskyConfig = {
        commitlint: true,
        preCommit: false,
        prePush: false,
      };

      const result = await installHusky(testDir, config);

      expect(result.initialized).toBe(true);
      const huskyDir = path.join(testDir, '.husky');
      const exists = await fse.pathExists(huskyDir);
      expect(exists).toBe(true);
    });

    it('should create commit-msg hook when commitlint is enabled', async () => {
      const config: HuskyConfig = {
        commitlint: true,
        preCommit: false,
        prePush: false,
      };

      const result = await installHusky(testDir, config);

      expect(result.created).toContain('commit-msg');
      const hookPath = path.join(testDir, '.husky', 'commit-msg');
      const exists = await fse.pathExists(hookPath);
      expect(exists).toBe(true);
    });

    it('should create pre-commit hook when preCommit is enabled', async () => {
      const config: HuskyConfig = {
        commitlint: false,
        preCommit: true,
        prePush: false,
      };

      const result = await installHusky(testDir, config);

      expect(result.created).toContain('pre-commit');
      const hookPath = path.join(testDir, '.husky', 'pre-commit');
      const exists = await fse.pathExists(hookPath);
      expect(exists).toBe(true);
    });

    it('should create pre-push hook when prePush is enabled', async () => {
      const config: HuskyConfig = {
        commitlint: false,
        preCommit: false,
        prePush: true,
      };

      const result = await installHusky(testDir, config);

      expect(result.created).toContain('pre-push');
    });

    it('should skip when files exist and overwrite is false', async () => {
      // Create existing husky directory with hook
      await fse.ensureDir(path.join(testDir, '.husky'));
      await fse.writeFile(path.join(testDir, '.husky', 'commit-msg'), 'existing');

      const config: HuskyConfig = {
        commitlint: true,
        preCommit: false,
        prePush: false,
      };

      const result = await installHusky(testDir, config, { overwrite: false });

      expect(result.skipped).toContain('commit-msg');
    });

    it('should overwrite when overwrite option is true', async () => {
      // Create existing husky directory with hook
      await fse.ensureDir(path.join(testDir, '.husky'));
      await fse.writeFile(path.join(testDir, '.husky', 'commit-msg'), 'existing');

      const config: HuskyConfig = {
        commitlint: true,
        preCommit: false,
        prePush: false,
      };

      const result = await installHusky(testDir, config, { overwrite: true });

      expect(result.created).toContain('commit-msg');
    });
  });
});
