import os from 'node:os';
import path from 'node:path';
import fse from 'fs-extra';
/**
 * Tests for permissions configurator
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PERMISSION_PRESETS } from '../../../src/constants/permissions.js';
import {
  analyzePermissions,
  getCurrentPermissions,
  installPermissions,
  mergePermissions,
  resetPermissionsToPreset,
  setCoAuthorSetting,
} from '../../../src/lib/permissions/configurator.js';
import type { PermissionsConfig } from '../../../src/types/permissions.js';

describe('permissions configurator', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(
      os.tmpdir(),
      `claude-config-permissions-test-${Date.now()}-${Math.random().toString(36).substring(7)}`
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

  const createDefaultConfig = (): PermissionsConfig => ({
    preset: 'default',
    files: PERMISSION_PRESETS.default.files,
    git: PERMISSION_PRESETS.default.git,
    bash: PERMISSION_PRESETS.default.bash,
    web: PERMISSION_PRESETS.default.web,
    custom: { allow: [], deny: [] },
  });

  describe('installPermissions', () => {
    it('should install project-level permissions', async () => {
      const config = createDefaultConfig();
      const result = await installPermissions(testDir, config, 'project');

      expect(result.success).toBe(true);
      expect(result.path).toContain('.claude/settings.local.json');
      expect(result.errors).toEqual([]);

      const settingsPath = path.join(testDir, '.claude', 'settings.local.json');
      const settings = await fse.readJson(settingsPath);
      expect(settings.permissions).toBeDefined();
      expect(settings.permissions.allow).toBeDefined();
      expect(settings.permissions.deny).toBeDefined();
    });

    it('should preserve existing settings', async () => {
      const settingsPath = path.join(testDir, '.claude', 'settings.local.json');
      await fse.ensureDir(path.dirname(settingsPath));
      await fse.writeJson(settingsPath, {
        mcpServers: { test: {} },
        otherConfig: true,
      });

      const config = createDefaultConfig();
      const result = await installPermissions(testDir, config, 'project');

      expect(result.success).toBe(true);

      const settings = await fse.readJson(settingsPath);
      expect(settings.mcpServers).toBeDefined();
      expect(settings.otherConfig).toBe(true);
      expect(settings.permissions).toBeDefined();
    });

    it('should handle invalid existing settings file', async () => {
      const settingsPath = path.join(testDir, '.claude', 'settings.local.json');
      await fse.ensureDir(path.dirname(settingsPath));
      await fse.writeFile(settingsPath, 'invalid json');

      const config = createDefaultConfig();
      const result = await installPermissions(testDir, config, 'project');

      expect(result.success).toBe(true);
    });

    it('should include custom rules', async () => {
      const config: PermissionsConfig = {
        ...createDefaultConfig(),
        custom: {
          allow: ['CustomAllow(*)'],
          deny: ['CustomDeny(*)'],
        },
      };

      const result = await installPermissions(testDir, config, 'project');
      expect(result.success).toBe(true);

      const settingsPath = path.join(testDir, '.claude', 'settings.local.json');
      const settings = await fse.readJson(settingsPath);
      expect(settings.permissions.allow).toContain('CustomAllow(*)');
      expect(settings.permissions.deny).toContain('CustomDeny(*)');
    });
  });

  describe('getCurrentPermissions', () => {
    it('should return undefined for both when no settings exist', async () => {
      const result = await getCurrentPermissions(testDir);
      expect(result.project).toBeUndefined();
      expect(result.user).toBeUndefined();
    });

    it('should return project permissions', async () => {
      const settingsPath = path.join(testDir, '.claude', 'settings.local.json');
      await fse.ensureDir(path.dirname(settingsPath));
      await fse.writeJson(settingsPath, {
        permissions: {
          allow: ['Read(*)'],
          deny: ['Write(*)'],
        },
      });

      const result = await getCurrentPermissions(testDir);
      expect(result.project?.allow).toContain('Read(*)');
      expect(result.project?.deny).toContain('Write(*)');
    });

    it('should handle invalid settings file', async () => {
      const settingsPath = path.join(testDir, '.claude', 'settings.local.json');
      await fse.ensureDir(path.dirname(settingsPath));
      await fse.writeFile(settingsPath, 'invalid json');

      const result = await getCurrentPermissions(testDir);
      expect(result.project).toBeUndefined();
    });
  });

  describe('setCoAuthorSetting', () => {
    it('should set co-author to true', async () => {
      const result = await setCoAuthorSetting(testDir, true, 'project');
      expect(result).toBe(true);

      const settingsPath = path.join(testDir, '.claude', 'settings.local.json');
      const settings = await fse.readJson(settingsPath);
      expect(settings.includeCoAuthoredBy).toBe(true);
    });

    it('should set co-author to false', async () => {
      const result = await setCoAuthorSetting(testDir, false, 'project');
      expect(result).toBe(true);

      const settingsPath = path.join(testDir, '.claude', 'settings.local.json');
      const settings = await fse.readJson(settingsPath);
      expect(settings.includeCoAuthoredBy).toBe(false);
    });

    it('should preserve existing settings', async () => {
      const settingsPath = path.join(testDir, '.claude', 'settings.local.json');
      await fse.ensureDir(path.dirname(settingsPath));
      await fse.writeJson(settingsPath, {
        permissions: { allow: [] },
      });

      const result = await setCoAuthorSetting(testDir, true, 'project');
      expect(result).toBe(true);

      const settings = await fse.readJson(settingsPath);
      expect(settings.permissions).toBeDefined();
      expect(settings.includeCoAuthoredBy).toBe(true);
    });
  });

  describe('mergePermissions', () => {
    it('should merge with existing permissions', async () => {
      const settingsPath = path.join(testDir, '.claude', 'settings.local.json');
      await fse.ensureDir(path.dirname(settingsPath));
      await fse.writeJson(settingsPath, {
        permissions: {
          allow: ['ExistingAllow(*)'],
          deny: ['ExistingDeny(*)'],
        },
      });

      const result = await mergePermissions(testDir, ['NewAllow(*)'], ['NewDeny(*)'], 'project');
      expect(result).toBe(true);

      const settings = await fse.readJson(settingsPath);
      expect(settings.permissions.allow).toContain('ExistingAllow(*)');
      expect(settings.permissions.allow).toContain('NewAllow(*)');
      expect(settings.permissions.deny).toContain('ExistingDeny(*)');
      expect(settings.permissions.deny).toContain('NewDeny(*)');
    });

    it('should create permissions when none exist', async () => {
      const result = await mergePermissions(testDir, ['Allow(*)'], ['Deny(*)'], 'project');
      expect(result).toBe(true);

      const settingsPath = path.join(testDir, '.claude', 'settings.local.json');
      const settings = await fse.readJson(settingsPath);
      expect(settings.permissions.allow).toContain('Allow(*)');
      expect(settings.permissions.deny).toContain('Deny(*)');
    });

    it('should deduplicate rules', async () => {
      const settingsPath = path.join(testDir, '.claude', 'settings.local.json');
      await fse.ensureDir(path.dirname(settingsPath));
      await fse.writeJson(settingsPath, {
        permissions: {
          allow: ['Rule(*)'],
          deny: [],
        },
      });

      const result = await mergePermissions(testDir, ['Rule(*)'], [], 'project');
      expect(result).toBe(true);

      const settings = await fse.readJson(settingsPath);
      // Should not have duplicates
      const ruleCount = settings.permissions.allow.filter((r: string) => r === 'Rule(*)').length;
      expect(ruleCount).toBe(1);
    });
  });

  describe('resetPermissionsToPreset', () => {
    it('should reset to default preset', async () => {
      const result = await resetPermissionsToPreset(testDir, 'default', 'project');
      expect(result).toBe(true);

      const settingsPath = path.join(testDir, '.claude', 'settings.local.json');
      const settings = await fse.readJson(settingsPath);
      expect(settings.permissions).toBeDefined();
    });

    it('should reset to trust preset', async () => {
      const result = await resetPermissionsToPreset(testDir, 'trust', 'project');
      expect(result).toBe(true);
    });

    it('should reset to restrictive preset', async () => {
      const result = await resetPermissionsToPreset(testDir, 'restrictive', 'project');
      expect(result).toBe(true);
    });

    it('should overwrite existing permissions', async () => {
      const settingsPath = path.join(testDir, '.claude', 'settings.local.json');
      await fse.ensureDir(path.dirname(settingsPath));
      await fse.writeJson(settingsPath, {
        permissions: {
          allow: ['OldRule(*)'],
          deny: [],
        },
      });

      const result = await resetPermissionsToPreset(testDir, 'default', 'project');
      expect(result).toBe(true);

      const settings = await fse.readJson(settingsPath);
      expect(settings.permissions.allow).not.toContain('OldRule(*)');
    });
  });

  describe('analyzePermissions', () => {
    it('should warn about arbitrary bash', () => {
      const config: PermissionsConfig = {
        ...createDefaultConfig(),
        bash: {
          ...PERMISSION_PRESETS.default.bash,
          arbitrary: true,
        },
      };

      const result = analyzePermissions(config);
      expect(result.warnings.some((w) => w.includes('Arbitrary bash'))).toBe(true);
    });

    it('should warn about git push', () => {
      const config: PermissionsConfig = {
        ...createDefaultConfig(),
        git: {
          ...PERMISSION_PRESETS.default.git,
          push: true,
        },
      };

      const result = analyzePermissions(config);
      expect(result.warnings.some((w) => w.includes('Git push'))).toBe(true);
    });

    it('should warn about writeOther', () => {
      const config: PermissionsConfig = {
        ...createDefaultConfig(),
        files: {
          ...PERMISSION_PRESETS.default.files,
          writeOther: true,
        },
      };

      const result = analyzePermissions(config);
      expect(result.warnings.some((w) => w.includes('non-code files'))).toBe(true);
    });

    it('should suggest enabling package manager with testing', () => {
      const config: PermissionsConfig = {
        ...createDefaultConfig(),
        bash: {
          ...PERMISSION_PRESETS.default.bash,
          testing: true,
          packageManager: false,
        },
      };

      const result = analyzePermissions(config);
      expect(result.suggestions.some((s) => s.includes('package manager'))).toBe(true);
    });

    it('should suggest edit tool with writeCode', () => {
      const config: PermissionsConfig = {
        ...createDefaultConfig(),
        files: {
          ...PERMISSION_PRESETS.default.files,
          writeCode: true,
          editTool: false,
        },
      };

      const result = analyzePermissions(config);
      expect(result.suggestions.some((s) => s.includes('Edit tool'))).toBe(true);
    });

    it('should suggest enabling git read operations', () => {
      const config: PermissionsConfig = {
        ...createDefaultConfig(),
        git: {
          ...PERMISSION_PRESETS.default.git,
          readOnly: false,
        },
      };

      const result = analyzePermissions(config);
      expect(result.suggestions.some((s) => s.includes('Git read'))).toBe(true);
    });

    it('should return empty arrays for safe config', () => {
      const config = createDefaultConfig();
      const result = analyzePermissions(config);
      expect(result.warnings.length).toBe(0);
      expect(result.suggestions.length).toBe(0);
    });
  });
});
