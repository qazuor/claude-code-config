/**
 * Tests for module installer
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fse from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import {
  installModules,
  installAllModules,
  uninstallModule,
  isModuleInstalled,
  getInstalledModules,
  installExtras,
} from '../../../src/lib/modules/installer.js';
import type { ModuleDefinition } from '../../../src/types/modules.js';

describe('module installer', () => {
  let testDir: string;
  let templatesDir: string;
  let targetDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `claude-config-installer-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    templatesDir = path.join(testDir, 'templates');
    targetDir = path.join(testDir, 'target');

    await fse.ensureDir(templatesDir);
    await fse.ensureDir(targetDir);

    // Create template structure
    await fse.ensureDir(path.join(templatesDir, 'agents'));
    await fse.ensureDir(path.join(templatesDir, 'skills'));
    await fse.ensureDir(path.join(templatesDir, 'commands'));
    await fse.ensureDir(path.join(templatesDir, 'docs'));
    await fse.ensureDir(path.join(templatesDir, 'schemas'));
    await fse.ensureDir(path.join(templatesDir, 'scripts'));

    // Create sample module files
    await fse.writeFile(path.join(templatesDir, 'agents', 'tech-lead.md'), '# Tech Lead Agent');
    await fse.writeFile(path.join(templatesDir, 'agents', 'qa-engineer.md'), '# QA Engineer Agent');
    await fse.writeFile(path.join(templatesDir, 'skills', 'tdd-methodology.md'), '# TDD Methodology');
    await fse.writeFile(path.join(templatesDir, 'commands', 'commit.md'), '# Commit Command');
    await fse.writeFile(path.join(templatesDir, 'docs', 'quick-start.md'), '# Quick Start');
    await fse.writeFile(path.join(templatesDir, 'schemas', 'config.schema.json'), '{}');
    await fse.writeFile(path.join(templatesDir, 'scripts', 'setup.sh'), '#!/bin/bash');
  });

  afterEach(async () => {
    try {
      await fse.remove(testDir);
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('installModules', () => {
    it('should install modules from templates', async () => {
      const modules: ModuleDefinition[] = [
        { id: 'tech-lead', name: 'Tech Lead', description: '', category: 'agents', file: 'tech-lead.md' },
      ];

      const result = await installModules('agents', modules, {
        templatesPath: templatesDir,
        targetPath: targetDir,
      });

      expect(result.success).toBe(true);
      expect(result.installed).toContain('tech-lead');

      const installedPath = path.join(targetDir, '.claude', 'agents', 'tech-lead.md');
      expect(await fse.pathExists(installedPath)).toBe(true);
    });

    it('should install multiple modules', async () => {
      const modules: ModuleDefinition[] = [
        { id: 'tech-lead', name: 'Tech Lead', description: '', category: 'agents', file: 'tech-lead.md' },
        { id: 'qa-engineer', name: 'QA Engineer', description: '', category: 'agents', file: 'qa-engineer.md' },
      ];

      const result = await installModules('agents', modules, {
        templatesPath: templatesDir,
        targetPath: targetDir,
      });

      expect(result.success).toBe(true);
      expect(result.installed).toHaveLength(2);
    });

    it('should skip existing modules when overwrite is false', async () => {
      const modules: ModuleDefinition[] = [
        { id: 'tech-lead', name: 'Tech Lead', description: '', category: 'agents', file: 'tech-lead.md' },
      ];

      // Pre-install
      await installModules('agents', modules, {
        templatesPath: templatesDir,
        targetPath: targetDir,
      });

      // Try to install again without overwrite
      const result = await installModules('agents', modules, {
        templatesPath: templatesDir,
        targetPath: targetDir,
        overwrite: false,
      });

      expect(result.skipped).toContain('tech-lead');
      expect(result.installed).not.toContain('tech-lead');
    });

    it('should overwrite when overwrite is true', async () => {
      const modules: ModuleDefinition[] = [
        { id: 'tech-lead', name: 'Tech Lead', description: '', category: 'agents', file: 'tech-lead.md' },
      ];

      // Pre-install
      await installModules('agents', modules, {
        templatesPath: templatesDir,
        targetPath: targetDir,
      });

      // Install again with overwrite
      const result = await installModules('agents', modules, {
        templatesPath: templatesDir,
        targetPath: targetDir,
        overwrite: true,
      });

      expect(result.installed).toContain('tech-lead');
      expect(result.skipped).not.toContain('tech-lead');
    });

    it('should fail for non-existent source files', async () => {
      const modules: ModuleDefinition[] = [
        { id: 'nonexistent', name: 'Nonexistent', description: '', category: 'agents', file: 'nonexistent.md' },
      ];

      const result = await installModules('agents', modules, {
        templatesPath: templatesDir,
        targetPath: targetDir,
      });

      expect(result.success).toBe(false);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].id).toBe('nonexistent');
    });

    it('should support dry run mode', async () => {
      const modules: ModuleDefinition[] = [
        { id: 'tech-lead', name: 'Tech Lead', description: '', category: 'agents', file: 'tech-lead.md' },
      ];

      const result = await installModules('agents', modules, {
        templatesPath: templatesDir,
        targetPath: targetDir,
        dryRun: true,
      });

      expect(result.installed).toContain('tech-lead');

      // File should NOT be created in dry run
      const installedPath = path.join(targetDir, '.claude', 'agents', 'tech-lead.md');
      expect(await fse.pathExists(installedPath)).toBe(false);
    });
  });

  describe('installAllModules', () => {
    it('should install modules for all categories', async () => {
      const modulesByCategory = {
        agents: [
          { id: 'tech-lead', name: 'Tech Lead', description: '', category: 'agents' as const, file: 'tech-lead.md' },
        ],
        skills: [
          { id: 'tdd-methodology', name: 'TDD', description: '', category: 'skills' as const, file: 'tdd-methodology.md' },
        ],
        commands: [
          { id: 'commit', name: 'Commit', description: '', category: 'commands' as const, file: 'commit.md' },
        ],
        docs: [
          { id: 'quick-start', name: 'Quick Start', description: '', category: 'docs' as const, file: 'quick-start.md' },
        ],
      };

      const results = await installAllModules(modulesByCategory, {
        templatesPath: templatesDir,
        targetPath: targetDir,
      });

      expect(results.agents.installed).toContain('tech-lead');
      expect(results.skills.installed).toContain('tdd-methodology');
      expect(results.commands.installed).toContain('commit');
      expect(results.docs.installed).toContain('quick-start');
    });

    it('should handle empty categories', async () => {
      const modulesByCategory = {
        agents: [],
        skills: [],
        commands: [],
        docs: [],
      };

      const results = await installAllModules(modulesByCategory, {
        templatesPath: templatesDir,
        targetPath: targetDir,
      });

      expect(results.agents.installed).toEqual([]);
      expect(results.skills.installed).toEqual([]);
    });
  });

  describe('uninstallModule', () => {
    it('should uninstall installed module', async () => {
      const modules: ModuleDefinition[] = [
        { id: 'tech-lead', name: 'Tech Lead', description: '', category: 'agents', file: 'tech-lead.md' },
      ];

      await installModules('agents', modules, {
        templatesPath: templatesDir,
        targetPath: targetDir,
      });

      const result = await uninstallModule('agents', 'tech-lead', targetDir);
      expect(result.success).toBe(true);

      const modulePath = path.join(targetDir, '.claude', 'agents', 'tech-lead.md');
      expect(await fse.pathExists(modulePath)).toBe(false);
    });

    it('should fail for non-existent module', async () => {
      const result = await uninstallModule('agents', 'nonexistent', targetDir);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('isModuleInstalled', () => {
    it('should return true for installed module', async () => {
      const modules: ModuleDefinition[] = [
        { id: 'tech-lead', name: 'Tech Lead', description: '', category: 'agents', file: 'tech-lead.md' },
      ];

      await installModules('agents', modules, {
        templatesPath: templatesDir,
        targetPath: targetDir,
      });

      const installed = await isModuleInstalled('agents', 'tech-lead', targetDir);
      expect(installed).toBe(true);
    });

    it('should return false for non-installed module', async () => {
      const installed = await isModuleInstalled('agents', 'nonexistent', targetDir);
      expect(installed).toBe(false);
    });
  });

  describe('getInstalledModules', () => {
    it('should return empty array when no modules installed', async () => {
      const installed = await getInstalledModules('agents', targetDir);
      expect(installed).toEqual([]);
    });

    it('should return installed module ids', async () => {
      const modules: ModuleDefinition[] = [
        { id: 'tech-lead', name: 'Tech Lead', description: '', category: 'agents', file: 'tech-lead.md' },
        { id: 'qa-engineer', name: 'QA Engineer', description: '', category: 'agents', file: 'qa-engineer.md' },
      ];

      await installModules('agents', modules, {
        templatesPath: templatesDir,
        targetPath: targetDir,
      });

      const installed = await getInstalledModules('agents', targetDir);
      expect(installed).toContain('tech-lead');
      expect(installed).toContain('qa-engineer');
    });

    it('should filter out README and underscore-prefixed files', async () => {
      await fse.ensureDir(path.join(targetDir, '.claude', 'agents'));
      await fse.writeFile(path.join(targetDir, '.claude', 'agents', 'README.md'), '# README');
      await fse.writeFile(path.join(targetDir, '.claude', 'agents', '_registry.json'), '{}');
      await fse.writeFile(path.join(targetDir, '.claude', 'agents', 'real-agent.md'), '# Agent');

      const installed = await getInstalledModules('agents', targetDir);
      expect(installed).not.toContain('README');
      expect(installed).not.toContain('_registry');
      expect(installed).toContain('real-agent');
    });
  });

  describe('installExtras', () => {
    it('should install schemas when enabled', async () => {
      const result = await installExtras(
        { schemas: true },
        {
          templatesPath: templatesDir,
          targetPath: targetDir,
        }
      );

      expect(result.installed).toContain('schemas');
      expect(await fse.pathExists(path.join(targetDir, '.claude', 'schemas'))).toBe(true);
    });

    it('should install scripts when enabled', async () => {
      const result = await installExtras(
        { scripts: true },
        {
          templatesPath: templatesDir,
          targetPath: targetDir,
        }
      );

      expect(result.installed).toContain('scripts');
    });

    it('should not install disabled extras', async () => {
      const result = await installExtras(
        { schemas: false, scripts: false },
        {
          templatesPath: templatesDir,
          targetPath: targetDir,
        }
      );

      expect(result.installed).toEqual([]);
    });

    it('should skip non-existent extra directories', async () => {
      const result = await installExtras(
        { hooks: true, sessions: true },
        {
          templatesPath: templatesDir,
          targetPath: targetDir,
        }
      );

      // hooks and sessions directories don't exist in templates
      expect(result.failed).toEqual([]);
    });

    it('should support dry run mode', async () => {
      const result = await installExtras(
        { schemas: true },
        {
          templatesPath: templatesDir,
          targetPath: targetDir,
          dryRun: true,
        }
      );

      expect(result.installed).toContain('schemas');
      // Should NOT create directory in dry run
      expect(await fse.pathExists(path.join(targetDir, '.claude', 'schemas'))).toBe(false);
    });

    it('should skip existing extras when overwrite is false', async () => {
      // First install
      await installExtras(
        { schemas: true },
        {
          templatesPath: templatesDir,
          targetPath: targetDir,
        }
      );

      // Try again without overwrite
      const result = await installExtras(
        { schemas: true },
        {
          templatesPath: templatesDir,
          targetPath: targetDir,
          overwrite: false,
        }
      );

      expect(result.skipped).toContain('schemas');
    });
  });
});
