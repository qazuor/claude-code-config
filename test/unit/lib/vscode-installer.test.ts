/**
 * Tests for VSCode settings installer
 */
import os from 'node:os';
import path from 'node:path';
import fse from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  generateVSCodeExtensions,
  generateVSCodeSettings,
  installVSCodeConfig,
  installVSCodeExtensions,
  installVSCodeSettings,
} from '../../../src/lib/code-style/vscode-installer.js';
import type { CodeStyleConfig } from '../../../src/types/config.js';

describe('vscode-installer', () => {
  let testDir: string;

  const baseConfig: CodeStyleConfig = {
    enabled: true,
    editorconfig: false,
    commitlint: false,
    biome: false,
    prettier: false,
  };

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `vscode-test-${Date.now()}`);
    await fse.ensureDir(testDir);
  });

  afterEach(async () => {
    await fse.remove(testDir);
  });

  describe('generateVSCodeSettings', () => {
    it('should generate settings for biome', () => {
      const config: CodeStyleConfig = { ...baseConfig, biome: true };

      const settings = generateVSCodeSettings(config);

      expect(settings['editor.defaultFormatter']).toBe('biomejs.biome');
      expect(settings['editor.formatOnSave']).toBe(true);
      expect(settings['biome.enabled']).toBe(true);
    });

    it('should generate settings for prettier', () => {
      const config: CodeStyleConfig = { ...baseConfig, prettier: true };

      const settings = generateVSCodeSettings(config);

      expect(settings['editor.defaultFormatter']).toBe('esbenp.prettier-vscode');
      expect(settings['editor.formatOnSave']).toBe(true);
    });

    it('should prefer biome over prettier when both are enabled', () => {
      const config: CodeStyleConfig = { ...baseConfig, biome: true, prettier: true };

      const settings = generateVSCodeSettings(config);

      expect(settings['editor.defaultFormatter']).toBe('biomejs.biome');
    });

    it('should include language-specific settings for biome', () => {
      const config: CodeStyleConfig = { ...baseConfig, biome: true };

      const settings = generateVSCodeSettings(config);

      expect(settings['[typescript]']).toBeDefined();
      expect(settings['[javascript]']).toBeDefined();
      expect(settings['[json]']).toBeDefined();
    });

    it('should disable ESLint when biome is enabled', () => {
      const config: CodeStyleConfig = { ...baseConfig, biome: true };

      const settings = generateVSCodeSettings(config);

      expect(settings['eslint.enable']).toBe(false);
    });

    it('should detect indentation when editorconfig is enabled', () => {
      const config: CodeStyleConfig = { ...baseConfig, editorconfig: true };

      const settings = generateVSCodeSettings(config);

      expect(settings['editor.detectIndentation']).toBe(false);
    });
  });

  describe('generateVSCodeExtensions', () => {
    it('should recommend biome extension', () => {
      const config: CodeStyleConfig = { ...baseConfig, biome: true };

      const extensions = generateVSCodeExtensions(config);

      expect(extensions.recommendations).toContain('biomejs.biome');
    });

    it('should recommend prettier extension', () => {
      const config: CodeStyleConfig = { ...baseConfig, prettier: true };

      const extensions = generateVSCodeExtensions(config);

      expect(extensions.recommendations).toContain('esbenp.prettier-vscode');
    });

    it('should recommend editorconfig extension', () => {
      const config: CodeStyleConfig = { ...baseConfig, editorconfig: true };

      const extensions = generateVSCodeExtensions(config);

      expect(extensions.recommendations).toContain('EditorConfig.EditorConfig');
    });

    it('should not recommend prettier when biome is enabled', () => {
      const config: CodeStyleConfig = { ...baseConfig, biome: true, prettier: true };

      const extensions = generateVSCodeExtensions(config);

      expect(extensions.recommendations).toContain('biomejs.biome');
      expect(extensions.recommendations).not.toContain('esbenp.prettier-vscode');
    });
  });

  describe('installVSCodeSettings', () => {
    it('should create .vscode directory and settings.json', async () => {
      const config: CodeStyleConfig = { ...baseConfig, biome: true };

      const result = await installVSCodeSettings(testDir, config);

      expect(result.created).toBe(true);
      expect(result.skipped).toBe(false);

      const settingsPath = path.join(testDir, '.vscode', 'settings.json');
      const exists = await fse.pathExists(settingsPath);
      expect(exists).toBe(true);
    });

    it('should skip when disabled', async () => {
      const config: CodeStyleConfig = { ...baseConfig, enabled: false };

      const result = await installVSCodeSettings(testDir, config);

      expect(result.skipped).toBe(true);
    });

    it('should skip when file exists and overwrite is false', async () => {
      await fse.ensureDir(path.join(testDir, '.vscode'));
      await fse.writeJson(path.join(testDir, '.vscode', 'settings.json'), { existing: true });

      const config: CodeStyleConfig = { ...baseConfig, biome: true };

      const result = await installVSCodeSettings(testDir, config, { overwrite: false });

      expect(result.skipped).toBe(true);
    });

    it('should merge when merge option is true', async () => {
      await fse.ensureDir(path.join(testDir, '.vscode'));
      await fse.writeJson(path.join(testDir, '.vscode', 'settings.json'), { existing: true });

      const config: CodeStyleConfig = { ...baseConfig, biome: true };

      const result = await installVSCodeSettings(testDir, config, { merge: true });

      expect(result.updated).toBe(true);

      const content = await fse.readJson(path.join(testDir, '.vscode', 'settings.json'));
      expect(content.existing).toBe(true);
      expect(content['editor.defaultFormatter']).toBe('biomejs.biome');
    });
  });

  describe('installVSCodeExtensions', () => {
    it('should create extensions.json', async () => {
      const config: CodeStyleConfig = { ...baseConfig, biome: true };

      const result = await installVSCodeExtensions(testDir, config);

      expect(result.created).toBe(true);

      const extensionsPath = path.join(testDir, '.vscode', 'extensions.json');
      const exists = await fse.pathExists(extensionsPath);
      expect(exists).toBe(true);
    });
  });

  describe('installVSCodeConfig', () => {
    it('should install both settings and extensions', async () => {
      const config: CodeStyleConfig = { ...baseConfig, biome: true };

      const result = await installVSCodeConfig(testDir, config);

      expect(result.settings.created).toBe(true);
      expect(result.extensions.created).toBe(true);
    });
  });
});
