/**
 * Tests for config lib
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  readConfig,
  writeConfig,
  hasConfig,
  hasClaudeDir,
  getConfigPath,
  getClaudeDirPath,
  createDefaultConfig,
  updateConfig,
  mergeConfig,
  addModulesToConfig,
  removeModulesFromConfig,
  getInstalledModulesFromConfig,
  getConfigVersion,
  needsMigration,
  readPartialConfig,
  updateMcpConfig,
  updateExtrasConfig,
} from '../../../src/lib/config/index.js';
import fse from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import type { ClaudeConfig } from '../../../src/types/config.js';

describe('config lib', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `claude-config-config-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    await fse.ensureDir(testDir);
  });

  afterEach(async () => {
    try {
      await fse.remove(testDir);
    } catch {
      // Ignore errors during cleanup
    }
  });

  const createTestProjectInfo = () => ({
    name: 'test-project',
    description: 'A test project',
    org: 'test-org',
    repo: 'test-repo',
    entityType: 'item',
    entityTypePlural: 'items',
  });

  const createTestPreferences = () => ({
    language: 'en' as const,
    responseLanguage: 'en' as const,
    includeCoAuthor: false,
  });

  describe('hasConfig', () => {
    it('should return false when no .claude directory exists', async () => {
      const result = await hasConfig(testDir);
      expect(result).toBe(false);
    });

    it('should return false when .claude exists but no config.json', async () => {
      await fse.ensureDir(path.join(testDir, '.claude'));
      const result = await hasConfig(testDir);
      expect(result).toBe(false);
    });

    it('should return true when config.json exists', async () => {
      const claudeDir = path.join(testDir, '.claude');
      await fse.ensureDir(claudeDir);
      const configPath = path.join(claudeDir, 'config.json');
      await fse.writeJson(configPath, { version: '1.0.0' });
      // Verify file was created
      const fileExists = await fse.pathExists(configPath);
      expect(fileExists).toBe(true);
      const result = await hasConfig(testDir);
      expect(result).toBe(true);
    });
  });

  describe('createDefaultConfig', () => {
    it('should create config with required project info', () => {
      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });

      expect(config.version).toBe('1.0.0');
      expect(config.project.name).toBe('test-project');
      expect(config.project.description).toBe('A test project');
      expect(config.project.org).toBe('test-org');
      expect(config.project.repo).toBe('test-repo');
    });

    it('should set default preferences', () => {
      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });

      expect(config.preferences).toBeDefined();
      expect(config.preferences.language).toBe('en');
      expect(config.preferences.responseLanguage).toBe('en');
      expect(typeof config.preferences.includeCoAuthor).toBe('boolean');
    });

    it('should initialize empty module selections', () => {
      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });

      expect(config.modules).toBeDefined();
      expect(config.modules.agents).toBeDefined();
      expect(config.modules.agents.selected).toEqual([]);
      expect(config.modules.skills).toBeDefined();
      expect(config.modules.commands).toBeDefined();
      expect(config.modules.docs).toBeDefined();
    });

    it('should set default extras', () => {
      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });

      expect(config.extras).toBeDefined();
      expect(typeof config.extras.schemas).toBe('boolean');
      expect(typeof config.extras.scripts).toBe('boolean');
      expect(config.extras.hooks).toBeDefined();
      expect(typeof config.extras.sessions).toBe('boolean');
    });

    it('should set template source', () => {
      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });

      expect(config.templateSource).toBeDefined();
      expect(config.templateSource.type).toBe('local');
      expect(config.templateSource.installedAt).toBeDefined();
    });
  });

  describe('writeConfig', () => {
    it('should write config to .claude/config.json', async () => {
      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo: { ...createTestProjectInfo(), name: 'write-test' },
        preferences: createTestPreferences(),
      });
      await writeConfig(testDir, config);

      const configPath = path.join(testDir, '.claude', 'config.json');
      const exists = await fse.pathExists(configPath);
      expect(exists).toBe(true);
    });

    it('should create .claude directory if not exists', async () => {
      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });
      await writeConfig(testDir, config);

      const claudeDir = path.join(testDir, '.claude');
      const exists = await fse.pathExists(claudeDir);
      expect(exists).toBe(true);
    });

    it('should write valid JSON', async () => {
      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo: { ...createTestProjectInfo(), name: 'json-test' },
        preferences: createTestPreferences(),
      });
      await writeConfig(testDir, config);

      const configPath = path.join(testDir, '.claude', 'config.json');
      const content = await fse.readJson(configPath);
      expect(content.project.name).toBe('json-test');
    });
  });

  describe('readConfig', () => {
    it('should read config from .claude/config.json', async () => {
      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo: { ...createTestProjectInfo(), name: 'read-test', description: 'test description' },
        preferences: createTestPreferences(),
      });
      await writeConfig(testDir, config);

      const readResult = await readConfig(testDir);
      expect(readResult).not.toBeNull();
      expect(readResult!.project.name).toBe('read-test');
      expect(readResult!.project.description).toBe('test description');
    });

    it('should return null when config does not exist', async () => {
      const result = await readConfig(testDir);
      expect(result).toBeNull();
    });

    it('should preserve all config fields', async () => {
      const projectInfo = {
        name: 'preserve-test',
        description: 'test',
        org: 'org',
        repo: 'repo',
        domain: 'example.com',
        entityType: 'product',
        entityTypePlural: 'products',
        location: 'New York',
      };

      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo,
        preferences: createTestPreferences(),
      });
      // Manually set some modules for testing
      config.modules.agents.selected = ['tech-lead', 'qa-engineer'];
      config.extras.schemas = true;

      await writeConfig(testDir, config);

      // Verify config file was created
      const configPath = path.join(testDir, '.claude', 'config.json');
      const fileExists = await fse.pathExists(configPath);
      expect(fileExists).toBe(true);

      const readResult = await readConfig(testDir);

      expect(readResult).not.toBeNull();
      expect(readResult!.modules.agents.selected).toEqual(['tech-lead', 'qa-engineer']);
      expect(readResult!.extras.schemas).toBe(true);
      expect(readResult!.project.domain).toBe('example.com');
      expect(readResult!.project.location).toBe('New York');
    });
  });

  describe('round-trip', () => {
    it('should preserve config through write and read', async () => {
      const projectInfo = {
        name: 'round-trip-test',
        description: 'Round trip test',
        org: 'myorg',
        repo: 'myrepo',
        entityType: 'widget',
        entityTypePlural: 'widgets',
      };

      const original = createDefaultConfig({
        version: '1.0.0',
        projectInfo,
        preferences: { language: 'es', responseLanguage: 'es', includeCoAuthor: true },
      });
      original.modules.agents.selected = ['tech-lead'];
      original.modules.skills.selected = ['tdd-methodology'];

      await writeConfig(testDir, original);
      const loaded = await readConfig(testDir);

      expect(loaded).not.toBeNull();
      expect(loaded!.project).toEqual(original.project);
      expect(loaded!.modules).toEqual(original.modules);
      expect(loaded!.preferences.language).toBe('es');
      expect(loaded!.preferences.includeCoAuthor).toBe(true);
    });
  });

  describe('hasClaudeDir', () => {
    it('should return false when .claude directory does not exist', async () => {
      const result = await hasClaudeDir(testDir);
      expect(result).toBe(false);
    });

    it('should return true when .claude directory exists', async () => {
      await fse.ensureDir(path.join(testDir, '.claude'));
      const result = await hasClaudeDir(testDir);
      expect(result).toBe(true);
    });
  });

  describe('getConfigPath', () => {
    it('should return correct config path', () => {
      const result = getConfigPath(testDir);
      expect(result).toBe(path.join(testDir, '.claude', 'config.json'));
    });
  });

  describe('getClaudeDirPath', () => {
    it('should return correct .claude directory path', () => {
      const result = getClaudeDirPath(testDir);
      expect(result).toBe(path.join(testDir, '.claude'));
    });
  });

  describe('readPartialConfig', () => {
    it('should return null when config does not exist', async () => {
      const result = await readPartialConfig(testDir);
      expect(result).toBeNull();
    });

    it('should return partial config when it exists', async () => {
      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });
      await writeConfig(testDir, config);

      const result = await readPartialConfig(testDir);
      expect(result).not.toBeNull();
      expect(result!.version).toBe('1.0.0');
    });
  });

  describe('getInstalledModulesFromConfig', () => {
    it('should return all selected modules by category', () => {
      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });
      config.modules.agents.selected = ['tech-lead', 'qa-engineer'];
      config.modules.skills.selected = ['tdd-methodology'];
      config.modules.commands.selected = ['commit', 'quality-check'];
      config.modules.docs.selected = ['quick-start'];

      const result = getInstalledModulesFromConfig(config);

      expect(result.agents).toEqual(['tech-lead', 'qa-engineer']);
      expect(result.skills).toEqual(['tdd-methodology']);
      expect(result.commands).toEqual(['commit', 'quality-check']);
      expect(result.docs).toEqual(['quick-start']);
    });

    it('should return empty arrays for no modules', () => {
      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });

      const result = getInstalledModulesFromConfig(config);

      expect(result.agents).toEqual([]);
      expect(result.skills).toEqual([]);
      expect(result.commands).toEqual([]);
      expect(result.docs).toEqual([]);
    });
  });

  describe('getConfigVersion', () => {
    it('should return the config version', () => {
      const config = createDefaultConfig({
        version: '2.5.3',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });

      const result = getConfigVersion(config);
      expect(result).toBe('2.5.3');
    });
  });

  describe('needsMigration', () => {
    it('should return true when config major version is lower', () => {
      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });

      expect(needsMigration(config, '2.0.0')).toBe(true);
    });

    it('should return true when config minor version is lower', () => {
      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });

      expect(needsMigration(config, '1.1.0')).toBe(true);
    });

    it('should return false when versions are equal', () => {
      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });

      expect(needsMigration(config, '1.0.0')).toBe(false);
    });

    it('should return false when config version is higher', () => {
      const config = createDefaultConfig({
        version: '2.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });

      expect(needsMigration(config, '1.5.0')).toBe(false);
    });

    it('should return false when only patch version differs', () => {
      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });

      expect(needsMigration(config, '1.0.5')).toBe(false);
    });
  });

  describe('updateConfig', () => {
    it('should return null when no existing config', async () => {
      const result = await updateConfig(testDir, { version: '2.0.0' });
      expect(result).toBeNull();
    });

    it('should merge updates into existing config', async () => {
      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });
      await writeConfig(testDir, config);

      const result = await updateConfig(testDir, {
        version: '1.1.0',
        project: { name: 'updated-project' },
      });

      expect(result).not.toBeNull();
      expect(result!.version).toBe('1.1.0');
      expect(result!.project.name).toBe('updated-project');
      expect(result!.project.description).toBe('A test project'); // preserved
    });

    it('should update lastUpdated timestamp', async () => {
      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });
      await writeConfig(testDir, config);
      const originalTimestamp = config.customizations.lastUpdated;

      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await updateConfig(testDir, { version: '1.0.1' });
      expect(result!.customizations.lastUpdated).not.toBe(originalTimestamp);
    });
  });

  describe('mergeConfig', () => {
    it('should merge project updates', () => {
      const existing = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });

      const result = mergeConfig(existing, {
        project: { name: 'new-name', domain: 'new.com' },
      });

      expect(result.project.name).toBe('new-name');
      expect(result.project.domain).toBe('new.com');
      expect(result.project.description).toBe('A test project'); // preserved
    });

    it('should merge preferences updates', () => {
      const existing = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });

      const result = mergeConfig(existing, {
        preferences: { language: 'es' },
      });

      expect(result.preferences.language).toBe('es');
      expect(result.preferences.includeCoAuthor).toBe(false); // preserved
    });

    it('should replace modules category entirely', () => {
      const existing = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });
      existing.modules.agents.selected = ['old-agent'];

      const result = mergeConfig(existing, {
        modules: {
          agents: { selected: ['new-agent'], excluded: [] },
        },
      });

      expect(result.modules.agents.selected).toEqual(['new-agent']);
    });

    it('should merge extras updates', () => {
      const existing = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });

      const result = mergeConfig(existing, {
        extras: { schemas: true, scripts: true },
      });

      expect(result.extras.schemas).toBe(true);
      expect(result.extras.scripts).toBe(true);
      expect(result.extras.sessions).toBe(false); // preserved default
    });
  });

  describe('addModulesToConfig', () => {
    it('should add new modules to empty list', () => {
      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });

      const result = addModulesToConfig(config, 'agents', ['tech-lead', 'qa-engineer']);

      expect(result.modules.agents.selected).toEqual(['tech-lead', 'qa-engineer']);
    });

    it('should add new modules to existing list', () => {
      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });
      config.modules.agents.selected = ['existing-agent'];

      const result = addModulesToConfig(config, 'agents', ['new-agent']);

      expect(result.modules.agents.selected).toContain('existing-agent');
      expect(result.modules.agents.selected).toContain('new-agent');
    });

    it('should not duplicate existing modules', () => {
      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });
      config.modules.agents.selected = ['tech-lead'];

      const result = addModulesToConfig(config, 'agents', ['tech-lead', 'new-agent']);

      const techLeadCount = result.modules.agents.selected.filter((m) => m === 'tech-lead').length;
      expect(techLeadCount).toBe(1);
      expect(result.modules.agents.selected).toContain('new-agent');
    });

    it('should work with different module categories', () => {
      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });

      const result = addModulesToConfig(config, 'skills', ['tdd', 'security']);
      expect(result.modules.skills.selected).toEqual(['tdd', 'security']);
    });
  });

  describe('removeModulesFromConfig', () => {
    it('should remove specified modules', () => {
      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });
      config.modules.agents.selected = ['keep', 'remove-me', 'also-keep'];

      const result = removeModulesFromConfig(config, 'agents', ['remove-me']);

      expect(result.modules.agents.selected).toEqual(['keep', 'also-keep']);
    });

    it('should add removed modules to excluded list', () => {
      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });
      config.modules.agents.selected = ['module1', 'module2'];

      const result = removeModulesFromConfig(config, 'agents', ['module1']);

      expect(result.modules.agents.excluded).toContain('module1');
    });

    it('should handle removing non-existent modules', () => {
      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });
      config.modules.agents.selected = ['existing'];

      const result = removeModulesFromConfig(config, 'agents', ['non-existent']);

      expect(result.modules.agents.selected).toEqual(['existing']);
      expect(result.modules.agents.excluded).toContain('non-existent');
    });
  });

  describe('updateMcpConfig', () => {
    it('should update MCP configuration', () => {
      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });

      const newMcp = {
        level: 'user' as const,
        servers: [{ serverId: 'context7', level: 'user' as const, config: {} }],
      };

      const result = updateMcpConfig(config, newMcp);

      expect(result.mcp.level).toBe('user');
      expect(result.mcp.servers).toHaveLength(1);
      expect(result.mcp.servers[0].serverId).toBe('context7');
    });
  });

  describe('updateExtrasConfig', () => {
    it('should update extras configuration', () => {
      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });

      const result = updateExtrasConfig(config, {
        schemas: true,
        scripts: true,
        sessions: true,
      });

      expect(result.extras.schemas).toBe(true);
      expect(result.extras.scripts).toBe(true);
      expect(result.extras.sessions).toBe(true);
    });

    it('should preserve existing extras not updated', () => {
      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });
      config.extras.hooks = { enabled: true, notification: { enabled: true } };

      const result = updateExtrasConfig(config, { schemas: true });

      expect(result.extras.schemas).toBe(true);
      expect(result.extras.hooks.enabled).toBe(true);
    });
  });

  describe('writeConfig with backup', () => {
    it('should create backup when requested', async () => {
      const config = createDefaultConfig({
        version: '1.0.0',
        projectInfo: createTestProjectInfo(),
        preferences: createTestPreferences(),
      });
      await writeConfig(testDir, config);

      // Update config with backup
      const updatedConfig = { ...config, version: '1.1.0' };
      await writeConfig(testDir, updatedConfig, { backup: true });

      // Check backup exists
      const claudeDir = path.join(testDir, '.claude');
      const files = await fse.readdir(claudeDir);
      const backupFiles = files.filter((f) => f.includes('.backup.'));
      expect(backupFiles.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('readConfig with invalid JSON', () => {
    it('should return null for invalid JSON config', async () => {
      const claudeDir = path.join(testDir, '.claude');
      const configPath = path.join(claudeDir, 'config.json');
      await fse.ensureDir(claudeDir);
      await fse.writeFile(configPath, 'invalid json content');

      const result = await readConfig(testDir);
      expect(result).toBeNull();
    });
  });
});
