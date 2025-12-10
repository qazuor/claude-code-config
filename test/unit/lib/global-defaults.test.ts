/**
 * Tests for global defaults management
 */

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock fs module
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  unlink: vi.fn(),
}));

// Mock os.homedir
vi.mock('node:os', () => ({
  homedir: vi.fn(() => '/mock/home'),
}));

import {
  clearGlobalDefaults,
  formatGlobalDefaults,
  getGlobalDefaultsPath,
  getGlobalTemplateConfig,
  hasGlobalDefaults,
  mergeWithGlobalDefaults,
  readGlobalDefaults,
  updateGlobalDefaults,
  writeGlobalDefaults,
} from '../../../src/lib/config/global-defaults.js';

describe('global-defaults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getGlobalDefaultsPath', () => {
    it('should return path to defaults.json in ~/.claude', () => {
      const result = getGlobalDefaultsPath();
      expect(result).toBe(path.join('/mock/home', '.claude', 'defaults.json'));
    });
  });

  describe('readGlobalDefaults', () => {
    it('should read and parse defaults file', async () => {
      const mockDefaults = { templateConfig: { commands: { test: 'npm test' } } };
      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify(mockDefaults));

      const result = await readGlobalDefaults();

      expect(fs.readFile).toHaveBeenCalledWith(
        path.join('/mock/home', '.claude', 'defaults.json'),
        'utf-8'
      );
      expect(result).toEqual(mockDefaults);
    });

    it('should return empty object when file does not exist', async () => {
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('ENOENT'));

      const result = await readGlobalDefaults();

      expect(result).toEqual({});
    });

    it('should return empty object on invalid JSON', async () => {
      vi.mocked(fs.readFile).mockResolvedValueOnce('invalid json');

      const result = await readGlobalDefaults();

      expect(result).toEqual({});
    });
  });

  describe('writeGlobalDefaults', () => {
    it('should write defaults to file', async () => {
      vi.mocked(fs.mkdir).mockResolvedValueOnce(undefined);
      vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);

      const defaults = { templateConfig: { commands: { test: 'npm test' } } };
      await writeGlobalDefaults(defaults);

      expect(fs.mkdir).toHaveBeenCalledWith(path.join('/mock/home', '.claude'), {
        recursive: true,
      });
      expect(fs.writeFile).toHaveBeenCalled();

      const writtenData = JSON.parse(vi.mocked(fs.writeFile).mock.calls[0][1] as string);
      expect(writtenData.templateConfig).toEqual(defaults.templateConfig);
      expect(writtenData.lastUpdated).toBeDefined();
    });

    it('should handle mkdir errors gracefully', async () => {
      vi.mocked(fs.mkdir).mockRejectedValueOnce(new Error('EEXIST'));
      vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);

      await expect(writeGlobalDefaults({})).resolves.not.toThrow();
    });
  });

  describe('updateGlobalDefaults', () => {
    it('should merge new config with existing defaults', async () => {
      const existing = { templateConfig: { commands: { lint: 'npm lint' } } };
      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify(existing));
      vi.mocked(fs.mkdir).mockResolvedValueOnce(undefined);
      vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);

      await updateGlobalDefaults({ commands: { test: 'npm test' } });

      const writtenData = JSON.parse(vi.mocked(fs.writeFile).mock.calls[0][1] as string);
      expect(writtenData.templateConfig.commands.lint).toBe('npm lint');
      expect(writtenData.templateConfig.commands.test).toBe('npm test');
    });
  });

  describe('mergeWithGlobalDefaults', () => {
    it('should merge detected values with global defaults', () => {
      const detected = { commands: { test: 'pnpm test' }, paths: { src: './src' } };
      const globalDefaults = { commands: { lint: 'npm lint' }, paths: { dist: './dist' } };

      const result = mergeWithGlobalDefaults(detected, globalDefaults);

      expect(result.commands).toEqual({ lint: 'npm lint', test: 'pnpm test' });
      expect(result.paths).toEqual({ dist: './dist', src: './src' });
    });

    it('should prefer detected values over global defaults', () => {
      const detected = { commands: { test: 'pnpm test' } };
      const globalDefaults = { commands: { test: 'npm test' } };

      const result = mergeWithGlobalDefaults(detected, globalDefaults);

      expect(result.commands?.test).toBe('pnpm test');
    });

    it('should filter out undefined values from detected', () => {
      const detected = { commands: { test: undefined as unknown as string } };
      const globalDefaults = { commands: { test: 'npm test' } };

      const result = mergeWithGlobalDefaults(detected, globalDefaults);

      expect(result.commands?.test).toBe('npm test');
    });

    it('should merge all categories', () => {
      const detected = {
        commands: { cmd: 'a' },
        paths: { path: 'b' },
        targets: { target: 1 },
        tracking: { track: 'c' },
        techStack: { tech: 'd' },
        environment: { env: 'e' },
        brand: { name: 'f' },
      };

      const result = mergeWithGlobalDefaults(detected, {});

      expect(result.commands).toEqual({ cmd: 'a' });
      expect(result.paths).toEqual({ path: 'b' });
      expect(result.targets).toEqual({ target: 1 });
      expect(result.tracking).toEqual({ track: 'c' });
      expect(result.techStack).toEqual({ tech: 'd' });
      expect(result.environment).toEqual({ env: 'e' });
      expect(result.brand).toEqual({ name: 'f' });
    });
  });

  describe('hasGlobalDefaults', () => {
    it('should return true when template config exists', async () => {
      vi.mocked(fs.readFile).mockResolvedValueOnce(
        JSON.stringify({ templateConfig: { commands: { test: 'npm test' } } })
      );

      const result = await hasGlobalDefaults();

      expect(result).toBe(true);
    });

    it('should return false when template config is empty', async () => {
      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify({ templateConfig: {} }));

      const result = await hasGlobalDefaults();

      expect(result).toBe(false);
    });

    it('should return false when file does not exist', async () => {
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('ENOENT'));

      const result = await hasGlobalDefaults();

      expect(result).toBe(false);
    });
  });

  describe('clearGlobalDefaults', () => {
    it('should delete the defaults file', async () => {
      vi.mocked(fs.unlink).mockResolvedValueOnce(undefined);

      await clearGlobalDefaults();

      expect(fs.unlink).toHaveBeenCalledWith(path.join('/mock/home', '.claude', 'defaults.json'));
    });

    it('should handle missing file gracefully', async () => {
      vi.mocked(fs.unlink).mockRejectedValueOnce(new Error('ENOENT'));

      await expect(clearGlobalDefaults()).resolves.not.toThrow();
    });
  });

  describe('getGlobalTemplateConfig', () => {
    it('should return template config from defaults', async () => {
      const templateConfig = { commands: { test: 'npm test' } };
      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify({ templateConfig }));

      const result = await getGlobalTemplateConfig();

      expect(result).toEqual(templateConfig);
    });

    it('should return empty object when no template config', async () => {
      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify({}));

      const result = await getGlobalTemplateConfig();

      expect(result).toEqual({});
    });
  });

  describe('formatGlobalDefaults', () => {
    it('should format empty defaults', () => {
      const result = formatGlobalDefaults({});

      expect(result).toContain('Global Defaults');
      expect(result).toContain('No template configuration saved');
    });

    it('should format defaults with lastUpdated', () => {
      const result = formatGlobalDefaults({
        lastUpdated: '2024-01-01T00:00:00.000Z',
        templateConfig: {},
      });

      expect(result).toContain('Last updated');
    });

    it('should format all config categories', () => {
      const defaults = {
        templateConfig: {
          commands: { test: 'npm test' },
          paths: { src: './src' },
          targets: { coverage: 90 },
          tracking: { issuePrefix: 'PROJ' },
          techStack: { framework: 'react' },
          environment: { nodeEnv: 'NODE_ENV' },
          brand: { name: 'MyApp' },
        },
      };

      const result = formatGlobalDefaults(defaults);

      expect(result).toContain('Commands:');
      expect(result).toContain('test: npm test');
      expect(result).toContain('Paths:');
      expect(result).toContain('src: ./src');
      expect(result).toContain('Targets:');
      expect(result).toContain('coverage: 90');
      expect(result).toContain('Tracking:');
      expect(result).toContain('issuePrefix: PROJ');
      expect(result).toContain('Tech Stack:');
      expect(result).toContain('framework: react');
      expect(result).toContain('Environment:');
      expect(result).toContain('nodeEnv: NODE_ENV');
      expect(result).toContain('Brand:');
      expect(result).toContain('name: MyApp');
    });

    it('should skip empty categories', () => {
      const defaults = {
        templateConfig: {
          commands: { test: 'npm test' },
          paths: {},
        },
      };

      const result = formatGlobalDefaults(defaults);

      expect(result).toContain('Commands:');
      expect(result).not.toContain('Paths:');
    });

    it('should skip undefined values in categories', () => {
      const defaults = {
        templateConfig: {
          commands: { test: 'npm test', empty: undefined as unknown as string },
        },
      };

      const result = formatGlobalDefaults(defaults);

      expect(result).toContain('test: npm test');
      expect(result).not.toContain('empty:');
    });
  });
});
