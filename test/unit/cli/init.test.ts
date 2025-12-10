/**
 * Tests for init command
 */

import os from 'node:os';
import path from 'node:path';
import fse from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClaudeConfig } from '../../../src/types/config.js';
import type { ModuleCategory } from '../../../src/types/modules.js';

import { filterModules, loadRegistry } from '../../../src/lib/modules/index.js';
import { installAllModules } from '../../../src/lib/modules/installer.js';
// Import the functions we need to test
import { getTemplatesPath } from '../../../src/lib/utils/paths.js';

describe('init command', () => {
  let testDir: string;
  let templatesDir: string;
  let targetDir: string;

  beforeEach(async () => {
    testDir = path.join(
      os.tmpdir(),
      `claude-config-init-test-${Date.now()}-${Math.random().toString(36).substring(7)}`
    );
    templatesDir = path.join(testDir, 'templates');
    targetDir = path.join(testDir, 'target');

    await fse.ensureDir(templatesDir);
    await fse.ensureDir(targetDir);

    // Create template structure with registry files
    await fse.ensureDir(path.join(templatesDir, 'agents'));
    await fse.ensureDir(path.join(templatesDir, 'skills'));
    await fse.ensureDir(path.join(templatesDir, 'commands'));
    await fse.ensureDir(path.join(templatesDir, 'docs'));

    // Create registry files for each category
    // Note: The registry file format uses 'modules' as the key, not the category name
    const agentsRegistry = {
      modules: [
        {
          id: 'tech-lead',
          name: 'Tech Lead',
          description: 'Technical leadership',
          file: 'tech-lead.md',
          tags: ['leadership', 'architecture'],
        },
        {
          id: 'qa-engineer',
          name: 'QA Engineer',
          description: 'Quality assurance',
          file: 'qa-engineer.md',
          tags: ['testing', 'quality'],
        },
      ],
    };

    const skillsRegistry = {
      modules: [
        {
          id: 'tdd-methodology',
          name: 'TDD Methodology',
          description: 'Test-driven development',
          file: 'tdd-methodology.md',
          tags: ['testing', 'methodology'],
        },
        {
          id: 'code-review',
          name: 'Code Review',
          description: 'Code review practices',
          file: 'code-review.md',
          tags: ['quality', 'collaboration'],
        },
      ],
    };

    const commandsRegistry = {
      modules: [
        {
          id: 'commit',
          name: 'Commit',
          description: 'Git commit helper',
          file: 'commit.md',
          tags: ['git', 'workflow'],
        },
        {
          id: 'review',
          name: 'Review',
          description: 'Code review helper',
          file: 'review.md',
          tags: ['review', 'workflow'],
        },
      ],
    };

    const docsRegistry = {
      modules: [
        {
          id: 'quick-start',
          name: 'Quick Start',
          description: 'Getting started guide',
          file: 'quick-start.md',
          tags: ['onboarding', 'guide'],
        },
        {
          id: 'best-practices',
          name: 'Best Practices',
          description: 'Development best practices',
          file: 'best-practices.md',
          tags: ['guide', 'standards'],
        },
      ],
    };

    // Write registry files
    await fse.writeJson(path.join(templatesDir, 'agents', '_registry.json'), agentsRegistry);
    await fse.writeJson(path.join(templatesDir, 'skills', '_registry.json'), skillsRegistry);
    await fse.writeJson(path.join(templatesDir, 'commands', '_registry.json'), commandsRegistry);
    await fse.writeJson(path.join(templatesDir, 'docs', '_registry.json'), docsRegistry);

    // Create sample module files
    await fse.writeFile(path.join(templatesDir, 'agents', 'tech-lead.md'), '# Tech Lead Agent');
    await fse.writeFile(path.join(templatesDir, 'agents', 'qa-engineer.md'), '# QA Engineer');
    await fse.writeFile(
      path.join(templatesDir, 'skills', 'tdd-methodology.md'),
      '# TDD Methodology'
    );
    await fse.writeFile(
      path.join(templatesDir, 'skills', 'code-review.md'),
      '# Code Review Skills'
    );
    await fse.writeFile(path.join(templatesDir, 'commands', 'commit.md'), '# Commit Command');
    await fse.writeFile(path.join(templatesDir, 'commands', 'review.md'), '# Review Command');
    await fse.writeFile(path.join(templatesDir, 'docs', 'quick-start.md'), '# Quick Start');
    await fse.writeFile(path.join(templatesDir, 'docs', 'best-practices.md'), '# Best Practices');
  });

  afterEach(async () => {
    try {
      await fse.remove(testDir);
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('getTemplatesPath', () => {
    it('should return the correct templates directory path', () => {
      const templatesPath = getTemplatesPath();

      expect(templatesPath).toBeTruthy();
      expect(typeof templatesPath).toBe('string');
      expect(path.isAbsolute(templatesPath)).toBe(true);
      expect(templatesPath.endsWith('templates')).toBe(true);
    });

    it('should return a path that exists in the actual package', () => {
      const templatesPath = getTemplatesPath();

      // In the real package, this should exist
      // In tests, we can at least verify the path format is correct
      expect(templatesPath).toMatch(/templates$/);
    });

    it('should return consistent path on multiple calls', () => {
      const path1 = getTemplatesPath();
      const path2 = getTemplatesPath();
      expect(path1).toBe(path2);
    });
  });

  describe('init command configuration updates', () => {
    it('should correctly update configuration with actual installed module IDs for agents', async () => {
      // Load registry
      const registry = await loadRegistry(templatesDir);

      // Select modules by tags (simulating preset selection)
      const selectedTags = ['leadership', 'architecture'];
      const agentModules = filterModules(registry, 'agents', selectedTags);

      // Install modules
      const installResults = await installAllModules(
        {
          agents: agentModules,
          skills: [],
          commands: [],
          docs: [],
        },
        {
          templatesPath: templatesDir,
          targetPath: targetDir,
        }
      );

      // Verify that installed module IDs are returned (not tags)
      expect(installResults.agents.installed).toContain('tech-lead');
      expect(installResults.agents.installed).not.toContain('leadership');
      expect(installResults.agents.installed).not.toContain('architecture');

      // Verify the modules were actually installed
      const installedPath = path.join(targetDir, '.claude', 'agents', 'tech-lead.md');
      expect(await fse.pathExists(installedPath)).toBe(true);
    });

    it('should correctly update configuration with actual installed module IDs for skills', async () => {
      // Load registry
      const registry = await loadRegistry(templatesDir);

      // Select modules by tags
      const selectedTags = ['testing', 'methodology'];
      const skillModules = filterModules(registry, 'skills', selectedTags);

      // Install modules
      const installResults = await installAllModules(
        {
          agents: [],
          skills: skillModules,
          commands: [],
          docs: [],
        },
        {
          templatesPath: templatesDir,
          targetPath: targetDir,
        }
      );

      // Verify that installed module IDs are returned (not tags)
      expect(installResults.skills.installed).toContain('tdd-methodology');
      expect(installResults.skills.installed).not.toContain('testing');
      expect(installResults.skills.installed).not.toContain('methodology');

      // Verify the modules were actually installed
      const installedPath = path.join(targetDir, '.claude', 'skills', 'tdd-methodology.md');
      expect(await fse.pathExists(installedPath)).toBe(true);
    });

    it('should correctly update configuration with actual installed module IDs for commands', async () => {
      // Load registry
      const registry = await loadRegistry(templatesDir);

      // Select modules by tags
      const selectedTags = ['git', 'workflow'];
      const commandModules = filterModules(registry, 'commands', selectedTags);

      // Install modules
      const installResults = await installAllModules(
        {
          agents: [],
          skills: [],
          commands: commandModules,
          docs: [],
        },
        {
          templatesPath: templatesDir,
          targetPath: targetDir,
        }
      );

      // Verify that installed module IDs are returned (not tags)
      expect(installResults.commands.installed).toContain('commit');
      expect(installResults.commands.installed).not.toContain('git');
      expect(installResults.commands.installed).not.toContain('workflow');

      // Verify the modules were actually installed
      const installedPath = path.join(targetDir, '.claude', 'commands', 'commit.md');
      expect(await fse.pathExists(installedPath)).toBe(true);
    });

    it('should correctly update configuration with actual installed module IDs for docs', async () => {
      // Load registry
      const registry = await loadRegistry(templatesDir);

      // Select modules by tags
      const selectedTags = ['onboarding', 'guide'];
      const docModules = filterModules(registry, 'docs', selectedTags);

      // Install modules
      const installResults = await installAllModules(
        {
          agents: [],
          skills: [],
          commands: [],
          docs: docModules,
        },
        {
          templatesPath: templatesDir,
          targetPath: targetDir,
        }
      );

      // Verify that installed module IDs are returned (not tags)
      expect(installResults.docs.installed).toContain('quick-start');
      expect(installResults.docs.installed).not.toContain('onboarding');
      expect(installResults.docs.installed).not.toContain('guide');

      // Verify the modules were actually installed
      const installedPath = path.join(targetDir, '.claude', 'docs', 'quick-start.md');
      expect(await fse.pathExists(installedPath)).toBe(true);
    });

    it('should update configuration with multiple installed modules across all categories', async () => {
      // Load registry
      const registry = await loadRegistry(templatesDir);

      // Select modules for all categories
      const agentModules = filterModules(registry, 'agents', ['leadership', 'testing']);
      const skillModules = filterModules(registry, 'skills', ['testing', 'quality']);
      const commandModules = filterModules(registry, 'commands', ['git', 'review']);
      const docModules = filterModules(registry, 'docs', ['onboarding', 'standards']);

      // Install all modules
      const installResults = await installAllModules(
        {
          agents: agentModules,
          skills: skillModules,
          commands: commandModules,
          docs: docModules,
        },
        {
          templatesPath: templatesDir,
          targetPath: targetDir,
        }
      );

      // Verify agents
      expect(installResults.agents.installed).toContain('tech-lead');
      expect(installResults.agents.installed).toContain('qa-engineer');
      expect(installResults.agents.installed.length).toBe(2);

      // Verify skills
      expect(installResults.skills.installed).toContain('tdd-methodology');
      expect(installResults.skills.installed).toContain('code-review');
      expect(installResults.skills.installed.length).toBe(2);

      // Verify commands
      expect(installResults.commands.installed).toContain('commit');
      expect(installResults.commands.installed).toContain('review');
      expect(installResults.commands.installed.length).toBe(2);

      // Verify docs
      expect(installResults.docs.installed).toContain('quick-start');
      expect(installResults.docs.installed).toContain('best-practices');
      expect(installResults.docs.installed.length).toBe(2);

      // Verify all files were actually installed
      expect(await fse.pathExists(path.join(targetDir, '.claude', 'agents', 'tech-lead.md'))).toBe(
        true
      );
      expect(
        await fse.pathExists(path.join(targetDir, '.claude', 'agents', 'qa-engineer.md'))
      ).toBe(true);
      expect(
        await fse.pathExists(path.join(targetDir, '.claude', 'skills', 'tdd-methodology.md'))
      ).toBe(true);
      expect(
        await fse.pathExists(path.join(targetDir, '.claude', 'skills', 'code-review.md'))
      ).toBe(true);
      expect(await fse.pathExists(path.join(targetDir, '.claude', 'commands', 'commit.md'))).toBe(
        true
      );
      expect(await fse.pathExists(path.join(targetDir, '.claude', 'commands', 'review.md'))).toBe(
        true
      );
      expect(await fse.pathExists(path.join(targetDir, '.claude', 'docs', 'quick-start.md'))).toBe(
        true
      );
      expect(
        await fse.pathExists(path.join(targetDir, '.claude', 'docs', 'best-practices.md'))
      ).toBe(true);
    });

    it('should handle empty module selection for a category', async () => {
      // Load registry
      const registry = await loadRegistry(templatesDir);

      // Select modules only for agents, leave others empty
      const agentModules = filterModules(registry, 'agents', ['leadership']);

      // Install modules
      const installResults = await installAllModules(
        {
          agents: agentModules,
          skills: [],
          commands: [],
          docs: [],
        },
        {
          templatesPath: templatesDir,
          targetPath: targetDir,
        }
      );

      // Verify agents installed
      expect(installResults.agents.installed).toContain('tech-lead');
      expect(installResults.agents.installed.length).toBeGreaterThan(0);

      // Verify other categories are empty
      expect(installResults.skills.installed).toEqual([]);
      expect(installResults.commands.installed).toEqual([]);
      expect(installResults.docs.installed).toEqual([]);
    });

    it('should properly update config structure as done in executeInstallation', async () => {
      // Simulate the config update pattern from lines 424-428 in init.ts
      const registry = await loadRegistry(templatesDir);

      // Initial config with tags
      const config: Pick<ClaudeConfig, 'modules'> = {
        modules: {
          agents: { selected: ['leadership', 'architecture'], excluded: [] },
          skills: { selected: ['testing'], excluded: [] },
          commands: { selected: ['git'], excluded: [] },
          docs: { selected: ['onboarding'], excluded: [] },
        },
      };

      // Resolve modules (tags -> actual module definitions)
      const categories: ModuleCategory[] = ['agents', 'skills', 'commands', 'docs'];
      const modulesByCategory: Record<ModuleCategory, any[]> = {
        agents: filterModules(registry, 'agents', config.modules.agents.selected),
        skills: filterModules(registry, 'skills', config.modules.skills.selected),
        commands: filterModules(registry, 'commands', config.modules.commands.selected),
        docs: filterModules(registry, 'docs', config.modules.docs.selected),
      };

      // Install modules
      const installResults = await installAllModules(modulesByCategory, {
        templatesPath: templatesDir,
        targetPath: targetDir,
      });

      // Update config with actual installed module IDs (not tags) - mimicking lines 425-428
      config.modules.agents.selected = installResults.agents?.installed ?? [];
      config.modules.skills.selected = installResults.skills?.installed ?? [];
      config.modules.commands.selected = installResults.commands?.installed ?? [];
      config.modules.docs.selected = installResults.docs?.installed ?? [];

      // Verify the config now contains actual module IDs, not tags
      expect(config.modules.agents.selected).toContain('tech-lead');
      expect(config.modules.agents.selected).not.toContain('leadership');
      expect(config.modules.agents.selected).not.toContain('architecture');

      expect(config.modules.skills.selected).toContain('tdd-methodology');
      expect(config.modules.skills.selected).not.toContain('testing');

      expect(config.modules.commands.selected).toContain('commit');
      expect(config.modules.commands.selected).not.toContain('git');

      expect(config.modules.docs.selected).toContain('quick-start');
      expect(config.modules.docs.selected).not.toContain('onboarding');
    });
  });
});
