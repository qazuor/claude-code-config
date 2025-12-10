/**
 * Integration tests for init command flow
 * Tests the complete installation process including:
 * - Module resolution from tags to IDs
 * - File copying
 * - Config generation with actual module IDs
 */

import os from 'node:os';
import path from 'node:path';
import fse from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readConfig } from '../../src/lib/config/index.js';
import { filterModules, loadRegistry } from '../../src/lib/modules/index.js';
import { installAllModules } from '../../src/lib/modules/installer.js';
import { getTemplatesPath } from '../../src/lib/utils/paths.js';

describe('init flow integration', () => {
  let testDir: string;
  let templatesPath: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `claude-config-init-test-${Date.now()}`);
    await fse.ensureDir(testDir);
    templatesPath = getTemplatesPath();
  });

  afterEach(async () => {
    await fse.remove(testDir);
  });

  describe('module installation from presets', () => {
    it('should resolve tags to actual module IDs for minimal preset', async () => {
      const registry = await loadRegistry(templatesPath);

      // Minimal preset uses tags: ['core', 'quality'] for agents
      const presetTags = ['core', 'quality'];
      const resolvedModules = filterModules(registry, 'agents', presetTags);

      // Should resolve to actual module IDs, not tags
      expect(resolvedModules.length).toBeGreaterThan(0);

      // All resolved modules should have valid IDs (not tag names)
      for (const mod of resolvedModules) {
        expect(mod.id).toBeTruthy();
        expect(mod.id).not.toBe('core');
        expect(mod.id).not.toBe('quality');
        // IDs should be like 'tech-lead', 'qa-engineer', etc.
        expect(mod.id).toMatch(/^[a-z][a-z0-9-]+$/);
      }
    });

    it('should resolve tags to actual module IDs for fullstack preset', async () => {
      const registry = await loadRegistry(templatesPath);

      // Fullstack preset agents tags
      const presetTags = [
        'core',
        'product',
        'backend',
        'frontend',
        'quality',
        'design',
        'specialized',
      ];
      const resolvedModules = filterModules(registry, 'agents', presetTags);

      // Should include modules from all specified tag categories
      expect(resolvedModules.length).toBeGreaterThan(5);

      // Verify some expected modules are included
      const ids = resolvedModules.map((m) => m.id);
      // tech-lead has 'core' tag
      expect(ids).toContain('tech-lead');
      // qa-engineer has 'quality' tag
      expect(ids).toContain('qa-engineer');
    });

    it('should install modules and return installed IDs', async () => {
      const registry = await loadRegistry(templatesPath);

      // Filter modules by tags (simulating preset)
      const agentModules = filterModules(registry, 'agents', ['core', 'quality']);

      // Install modules
      const results = await installAllModules(
        {
          agents: agentModules,
          skills: [],
          commands: [],
          docs: [],
        },
        {
          templatesPath,
          targetPath: testDir,
          overwrite: false,
        }
      );

      // Should have installed modules with actual IDs
      expect(results.agents.installed.length).toBeGreaterThan(0);

      // Installed IDs should be actual module IDs, not tags
      for (const id of results.agents.installed) {
        expect(id).not.toBe('core');
        expect(id).not.toBe('quality');
      }

      // Files should exist
      const claudeDir = path.join(testDir, '.claude', 'agents');
      expect(await fse.pathExists(claudeDir)).toBe(true);
    });

    it('should create correct directory structure', async () => {
      const registry = await loadRegistry(templatesPath);

      const agentModules = filterModules(registry, 'agents', ['core']);
      const skillModules = filterModules(registry, 'skills', ['testing']);
      const commandModules = filterModules(registry, 'commands', ['core']);
      const docModules = filterModules(registry, 'docs', ['workflows']);

      await installAllModules(
        {
          agents: agentModules,
          skills: skillModules,
          commands: commandModules,
          docs: docModules,
        },
        {
          templatesPath,
          targetPath: testDir,
          overwrite: false,
        }
      );

      // Check directory structure
      expect(await fse.pathExists(path.join(testDir, '.claude'))).toBe(true);
      expect(await fse.pathExists(path.join(testDir, '.claude', 'agents'))).toBe(true);
      expect(await fse.pathExists(path.join(testDir, '.claude', 'skills'))).toBe(true);
      expect(await fse.pathExists(path.join(testDir, '.claude', 'commands'))).toBe(true);
      expect(await fse.pathExists(path.join(testDir, '.claude', 'docs'))).toBe(true);
    });
  });

  describe('config file generation', () => {
    it('should save config with actual module IDs after installation', async () => {
      const registry = await loadRegistry(templatesPath);

      // Simulate preset tags
      const presetAgentTags = ['core', 'quality'];
      const agentModules = filterModules(registry, 'agents', presetAgentTags);

      // Install modules
      const results = await installAllModules(
        {
          agents: agentModules,
          skills: [],
          commands: [],
          docs: [],
        },
        {
          templatesPath,
          targetPath: testDir,
          overwrite: false,
        }
      );

      // Write config with installed IDs (simulating what init.ts does)
      const configPath = path.join(testDir, '.claude', 'config.json');
      await fse.ensureDir(path.dirname(configPath));
      await fse.writeJson(configPath, {
        version: '0.1.0',
        modules: {
          agents: { selected: results.agents.installed, excluded: [] },
          skills: { selected: [], excluded: [] },
          commands: { selected: [], excluded: [] },
          docs: { selected: [], excluded: [] },
        },
      });

      // Read and verify config
      const savedConfig = await fse.readJson(configPath);

      // Config should contain actual IDs, not tags
      for (const id of savedConfig.modules.agents.selected) {
        expect(id).not.toBe('core');
        expect(id).not.toBe('quality');
        expect(id).toMatch(/^[a-z][a-z0-9-]+$/);
      }
    });
  });

  describe('templates path resolution', () => {
    it('should resolve to a path containing actual template files', async () => {
      const templatesPath = getTemplatesPath();

      // Templates path should exist
      expect(await fse.pathExists(templatesPath)).toBe(true);

      // Should contain expected directories
      expect(await fse.pathExists(path.join(templatesPath, 'agents'))).toBe(true);
      expect(await fse.pathExists(path.join(templatesPath, 'skills'))).toBe(true);
      expect(await fse.pathExists(path.join(templatesPath, 'commands'))).toBe(true);
      expect(await fse.pathExists(path.join(templatesPath, 'docs'))).toBe(true);
    });

    it('should contain registry files', async () => {
      const templatesPath = getTemplatesPath();

      // Each category should have a _registry.json
      expect(await fse.pathExists(path.join(templatesPath, 'agents', '_registry.json'))).toBe(true);
      expect(await fse.pathExists(path.join(templatesPath, 'skills', '_registry.json'))).toBe(true);
      expect(await fse.pathExists(path.join(templatesPath, 'commands', '_registry.json'))).toBe(
        true
      );
      expect(await fse.pathExists(path.join(templatesPath, 'docs', '_registry.json'))).toBe(true);
    });
  });
});
