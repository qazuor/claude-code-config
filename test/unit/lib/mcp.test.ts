/**
 * Tests for MCP configurator
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fse from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import {
  installMcpServers,
  getInstalledMcpServers,
  removeMcpServer,
  getAvailableMcpServers,
  validateMcpConfig,
} from '../../../src/lib/mcp/configurator.js';
import type { McpConfig, McpInstallation } from '../../../src/types/config.js';

describe('mcp configurator', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `claude-config-mcp-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    await fse.ensureDir(testDir);
  });

  afterEach(async () => {
    try {
      await fse.remove(testDir);
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('installMcpServers', () => {
    it('should return success with empty path for empty servers', async () => {
      const config: McpConfig = {
        level: 'project',
        servers: [],
      };

      const result = await installMcpServers(testDir, config);
      expect(result.success).toBe(true);
      expect(result.path).toBe('');
      expect(result.errors).toEqual([]);
    });

    it('should install project-level MCP servers', async () => {
      const config: McpConfig = {
        level: 'project',
        servers: [
          {
            serverId: 'context7',
            level: 'project',
            config: {},
          },
        ],
      };

      const result = await installMcpServers(testDir, config);
      expect(result.success).toBe(true);
      expect(result.path).toContain('.claude/settings.local.json');

      const settingsPath = path.join(testDir, '.claude', 'settings.local.json');
      const settings = await fse.readJson(settingsPath);
      expect(settings.mcpServers).toBeDefined();
      expect(settings.mcpServers.context7).toBeDefined();
    });

    it('should install custom MCP server with package', async () => {
      const config: McpConfig = {
        level: 'project',
        servers: [
          {
            serverId: 'custom-server',
            level: 'project',
            config: {
              package: '@my/custom-mcp-server',
              apiKey: 'test-key',
            },
          },
        ],
      };

      const result = await installMcpServers(testDir, config);
      expect(result.success).toBe(true);

      const settingsPath = path.join(testDir, '.claude', 'settings.local.json');
      const settings = await fse.readJson(settingsPath);
      expect(settings.mcpServers['custom-server'].args).toContain('@my/custom-mcp-server');
      // apiKey converts to APIKEY (camelCase -> UPPERCASE with underscores for special chars only)
      expect(settings.mcpServers['custom-server'].env.APIKEY).toBe('test-key');
    });

    it('should add to existing settings', async () => {
      // Create existing settings
      const settingsPath = path.join(testDir, '.claude', 'settings.local.json');
      await fse.ensureDir(path.dirname(settingsPath));
      await fse.writeJson(settingsPath, {
        mcpServers: { existing: { command: 'test' } },
        otherConfig: true,
      });

      const config: McpConfig = {
        level: 'project',
        servers: [
          {
            serverId: 'context7',
            level: 'project',
            config: {},
          },
        ],
      };

      const result = await installMcpServers(testDir, config);
      expect(result.success).toBe(true);

      const settings = await fse.readJson(settingsPath);
      expect(settings.mcpServers.existing).toBeDefined();
      expect(settings.mcpServers.context7).toBeDefined();
      expect(settings.otherConfig).toBe(true);
    });

    it('should handle invalid existing settings file', async () => {
      // Create invalid settings file
      const settingsPath = path.join(testDir, '.claude', 'settings.local.json');
      await fse.ensureDir(path.dirname(settingsPath));
      await fse.writeFile(settingsPath, 'invalid json');

      const config: McpConfig = {
        level: 'project',
        servers: [
          {
            serverId: 'context7',
            level: 'project',
            config: {},
          },
        ],
      };

      const result = await installMcpServers(testDir, config);
      // Should succeed by starting fresh
      expect(result.success).toBe(true);
    });
  });

  describe('getInstalledMcpServers', () => {
    it('should return empty arrays when no settings exist', async () => {
      const result = await getInstalledMcpServers(testDir);
      expect(result.project).toEqual([]);
      expect(result.user).toEqual([]);
    });

    it('should return project servers', async () => {
      const settingsPath = path.join(testDir, '.claude', 'settings.local.json');
      await fse.ensureDir(path.dirname(settingsPath));
      await fse.writeJson(settingsPath, {
        mcpServers: {
          server1: { command: 'test' },
          server2: { command: 'test' },
        },
      });

      const result = await getInstalledMcpServers(testDir);
      expect(result.project).toContain('server1');
      expect(result.project).toContain('server2');
    });

    it('should handle invalid settings file', async () => {
      const settingsPath = path.join(testDir, '.claude', 'settings.local.json');
      await fse.ensureDir(path.dirname(settingsPath));
      await fse.writeFile(settingsPath, 'invalid json');

      const result = await getInstalledMcpServers(testDir);
      expect(result.project).toEqual([]);
    });
  });

  describe('removeMcpServer', () => {
    it('should remove server from settings', async () => {
      const settingsPath = path.join(testDir, '.claude', 'settings.local.json');
      await fse.ensureDir(path.dirname(settingsPath));
      await fse.writeJson(settingsPath, {
        mcpServers: {
          server1: { command: 'test' },
          server2: { command: 'test' },
        },
      });

      const result = await removeMcpServer(testDir, 'server1', 'project');
      expect(result).toBe(true);

      const settings = await fse.readJson(settingsPath);
      expect(settings.mcpServers.server1).toBeUndefined();
      expect(settings.mcpServers.server2).toBeDefined();
    });

    it('should return false for non-existent settings file', async () => {
      const result = await removeMcpServer(testDir, 'server1', 'project');
      expect(result).toBe(false);
    });

    it('should return false for non-existent server', async () => {
      const settingsPath = path.join(testDir, '.claude', 'settings.local.json');
      await fse.ensureDir(path.dirname(settingsPath));
      await fse.writeJson(settingsPath, {
        mcpServers: {
          otherServer: { command: 'test' },
        },
      });

      const result = await removeMcpServer(testDir, 'server1', 'project');
      expect(result).toBe(false);
    });

    it('should return false when mcpServers is not defined', async () => {
      const settingsPath = path.join(testDir, '.claude', 'settings.local.json');
      await fse.ensureDir(path.dirname(settingsPath));
      await fse.writeJson(settingsPath, {});

      const result = await removeMcpServer(testDir, 'server1', 'project');
      expect(result).toBe(false);
    });
  });

  describe('getAvailableMcpServers', () => {
    it('should return servers grouped by category', () => {
      const grouped = getAvailableMcpServers();
      expect(typeof grouped).toBe('object');

      // Should have some categories
      const categories = Object.keys(grouped);
      expect(categories.length).toBeGreaterThan(0);

      // Each category should have servers
      for (const category of categories) {
        expect(Array.isArray(grouped[category])).toBe(true);
        expect(grouped[category].length).toBeGreaterThan(0);
      }
    });

    it('should include known servers', () => {
      const grouped = getAvailableMcpServers();
      const allServers = Object.values(grouped).flat();
      const serverIds = allServers.map((s) => s.id);

      expect(serverIds).toContain('context7');
      expect(serverIds).toContain('github');
    });
  });

  describe('validateMcpConfig', () => {
    it('should validate known server with all required fields', () => {
      const installation: McpInstallation = {
        serverId: 'github',
        level: 'project',
        config: {
          token: 'test-token',
        },
      };

      const result = validateMcpConfig(installation);
      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('should report missing required fields', () => {
      const installation: McpInstallation = {
        serverId: 'github',
        level: 'project',
        config: {},
      };

      const result = validateMcpConfig(installation);
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('token');
    });

    it('should validate custom server with package', () => {
      const installation: McpInstallation = {
        serverId: 'custom-server',
        level: 'project',
        config: {
          package: '@my/custom-server',
        },
      };

      const result = validateMcpConfig(installation);
      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('should report missing package for custom server', () => {
      const installation: McpInstallation = {
        serverId: 'custom-server',
        level: 'project',
        config: {},
      };

      const result = validateMcpConfig(installation);
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('package');
    });

    it('should validate server without required config', () => {
      const installation: McpInstallation = {
        serverId: 'context7',
        level: 'project',
        config: {},
      };

      const result = validateMcpConfig(installation);
      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });
  });
});
