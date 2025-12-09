import os from 'node:os';
import path from 'node:path';
import fse from 'fs-extra';
/**
 * Tests for hooks configurator
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getHooksStatus, installHooks } from '../../../src/lib/hooks/configurator.js';
import type { HookConfig } from '../../../src/types/config.js';

describe('hooks configurator', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(
      os.tmpdir(),
      `claude-config-hooks-test-${Date.now()}-${Math.random().toString(36).substring(7)}`
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

  describe('installHooks', () => {
    it('should return empty when hooks not enabled', async () => {
      const config: HookConfig = {
        enabled: false,
      };

      const result = await installHooks(testDir, config);
      expect(result.installed).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it('should install notification hook with desktop', async () => {
      const config: HookConfig = {
        enabled: true,
        notification: {
          desktop: true,
        },
      };

      const result = await installHooks(testDir, config);
      expect(result.installed).toContain('notification.sh');
      expect(result.errors).toEqual([]);

      const hookPath = path.join(testDir, '.claude', 'hooks', 'notification.sh');
      const exists = await fse.pathExists(hookPath);
      expect(exists).toBe(true);

      const content = await fse.readFile(hookPath, 'utf-8');
      expect(content).toContain('notify-send');
    });

    it('should install notification hook with audio', async () => {
      const config: HookConfig = {
        enabled: true,
        notification: {
          audio: true,
        },
      };

      const result = await installHooks(testDir, config);
      expect(result.installed).toContain('notification.sh');

      const hookPath = path.join(testDir, '.claude', 'hooks', 'notification.sh');
      const content = await fse.readFile(hookPath, 'utf-8');
      expect(content).toContain('piper');
    });

    it('should install notification hook with custom command', async () => {
      const config: HookConfig = {
        enabled: true,
        notification: {
          customCommand: 'echo "Custom notification"',
        },
      };

      const result = await installHooks(testDir, config);
      expect(result.installed).toContain('notification.sh');

      const hookPath = path.join(testDir, '.claude', 'hooks', 'notification.sh');
      const content = await fse.readFile(hookPath, 'utf-8');
      expect(content).toContain('echo "Custom notification"');
    });

    it('should install stop hook with beep', async () => {
      const config: HookConfig = {
        enabled: true,
        stop: {
          beep: true,
        },
      };

      const result = await installHooks(testDir, config);
      expect(result.installed).toContain('stop.sh');

      const hookPath = path.join(testDir, '.claude', 'hooks', 'stop.sh');
      const content = await fse.readFile(hookPath, 'utf-8');
      expect(content).toContain('beep');
    });

    it('should install stop hook with custom sound', async () => {
      const config: HookConfig = {
        enabled: true,
        stop: {
          customSound: '/path/to/sound.wav',
        },
      };

      const result = await installHooks(testDir, config);
      expect(result.installed).toContain('stop.sh');

      const hookPath = path.join(testDir, '.claude', 'hooks', 'stop.sh');
      const content = await fse.readFile(hookPath, 'utf-8');
      expect(content).toContain('/path/to/sound.wav');
    });

    it('should install stop hook with custom command', async () => {
      const config: HookConfig = {
        enabled: true,
        stop: {
          customCommand: 'play-sound',
        },
      };

      const result = await installHooks(testDir, config);
      expect(result.installed).toContain('stop.sh');

      const hookPath = path.join(testDir, '.claude', 'hooks', 'stop.sh');
      const content = await fse.readFile(hookPath, 'utf-8');
      expect(content).toContain('play-sound');
    });

    it('should install subagent stop hook with beep', async () => {
      const config: HookConfig = {
        enabled: true,
        subagentStop: {
          beep: true,
        },
      };

      const result = await installHooks(testDir, config);
      expect(result.installed).toContain('subagent-stop.sh');

      const hookPath = path.join(testDir, '.claude', 'hooks', 'subagent-stop.sh');
      const content = await fse.readFile(hookPath, 'utf-8');
      expect(content).toContain('beep');
    });

    it('should install subagent stop hook with custom sound', async () => {
      const config: HookConfig = {
        enabled: true,
        subagentStop: {
          customSound: '/path/to/subagent-sound.wav',
        },
      };

      const result = await installHooks(testDir, config);
      expect(result.installed).toContain('subagent-stop.sh');

      const hookPath = path.join(testDir, '.claude', 'hooks', 'subagent-stop.sh');
      const content = await fse.readFile(hookPath, 'utf-8');
      expect(content).toContain('/path/to/subagent-sound.wav');
    });

    it('should install subagent stop hook with custom command', async () => {
      const config: HookConfig = {
        enabled: true,
        subagentStop: {
          customCommand: 'custom-subagent-stop',
        },
      };

      const result = await installHooks(testDir, config);
      expect(result.installed).toContain('subagent-stop.sh');

      const hookPath = path.join(testDir, '.claude', 'hooks', 'subagent-stop.sh');
      const content = await fse.readFile(hookPath, 'utf-8');
      expect(content).toContain('custom-subagent-stop');
    });

    it('should install all hooks at once', async () => {
      const config: HookConfig = {
        enabled: true,
        notification: {
          desktop: true,
          audio: true,
        },
        stop: {
          beep: true,
        },
        subagentStop: {
          beep: true,
        },
      };

      const result = await installHooks(testDir, config);
      expect(result.installed).toContain('notification.sh');
      expect(result.installed).toContain('stop.sh');
      expect(result.installed).toContain('subagent-stop.sh');
      expect(result.errors).toEqual([]);
    });

    it('should make hooks executable', async () => {
      const config: HookConfig = {
        enabled: true,
        notification: {
          desktop: true,
        },
      };

      await installHooks(testDir, config);

      const hookPath = path.join(testDir, '.claude', 'hooks', 'notification.sh');
      const stats = await fse.stat(hookPath);
      // Check if file has execute permission
      expect(stats.mode & 0o111).toBeGreaterThan(0);
    });
  });

  describe('getHooksStatus', () => {
    it('should return disabled when no hooks exist', async () => {
      const status = await getHooksStatus(testDir);
      expect(status.enabled).toBe(false);
      expect(status.hooks.every((h) => !h.exists)).toBe(true);
    });

    it('should return enabled when hooks exist', async () => {
      const config: HookConfig = {
        enabled: true,
        notification: { desktop: true },
      };
      await installHooks(testDir, config);

      const status = await getHooksStatus(testDir);
      expect(status.enabled).toBe(true);
      expect(status.hooks.some((h) => h.exists)).toBe(true);
    });

    it('should report correct hook names', async () => {
      const status = await getHooksStatus(testDir);
      const hookNames = status.hooks.map((h) => h.name);
      expect(hookNames).toContain('notification.sh');
      expect(hookNames).toContain('stop.sh');
      expect(hookNames).toContain('subagent-stop.sh');
    });

    it('should report executable status', async () => {
      const config: HookConfig = {
        enabled: true,
        notification: { desktop: true },
      };
      await installHooks(testDir, config);

      const status = await getHooksStatus(testDir);
      const notificationHook = status.hooks.find((h) => h.name === 'notification.sh');
      expect(notificationHook?.exists).toBe(true);
      expect(notificationHook?.executable).toBe(true);
    });
  });
});
