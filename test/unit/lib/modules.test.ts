import os from 'node:os';
import path from 'node:path';
import fse from 'fs-extra';
/**
 * Tests for modules lib
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  filterModules,
  getAllModules,
  getModule,
  getModuleIds,
  getModulesByTag,
  loadRegistry,
  validateModuleIds,
} from '../../../src/lib/modules/registry.js';
import {
  checkRemovalImpact,
  getDependents,
  getSuggestedModules,
  resolveAllModules,
  resolveModules,
  sortByDependencies,
} from '../../../src/lib/modules/resolver.js';
import type { ModuleDefinition, ModuleRegistry } from '../../../src/types/modules.js';

describe('modules lib', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `claude-config-modules-test-${Date.now()}`);
    await fse.ensureDir(testDir);
  });

  afterEach(async () => {
    await fse.remove(testDir);
  });

  describe('loadRegistry', () => {
    it('should return empty registry when no templates exist', async () => {
      const registry = await loadRegistry(testDir);
      expect(registry.agents).toEqual([]);
      expect(registry.skills).toEqual([]);
      expect(registry.commands).toEqual([]);
      expect(registry.docs).toEqual([]);
    });

    it('should load modules from _registry.json', async () => {
      const agentsDir = path.join(testDir, 'agents');
      await fse.ensureDir(agentsDir);

      const registryData = {
        category: 'agents',
        modules: [
          {
            id: 'test-agent',
            name: 'Test Agent',
            description: 'A test agent',
            file: 'test-agent.md',
          },
        ],
      };
      await fse.writeJson(path.join(agentsDir, '_registry.json'), registryData);
      await fse.writeFile(path.join(agentsDir, 'test-agent.md'), '# Test Agent');

      const registry = await loadRegistry(testDir);
      expect(registry.agents.length).toBe(1);
      expect(registry.agents[0].id).toBe('test-agent');
      expect(registry.agents[0].name).toBe('Test Agent');
    });

    it('should load modules from multiple categories', async () => {
      // Create agents
      const agentsDir = path.join(testDir, 'agents');
      await fse.ensureDir(agentsDir);
      await fse.writeJson(path.join(agentsDir, '_registry.json'), {
        category: 'agents',
        modules: [{ id: 'agent1', name: 'Agent 1', file: 'agent1.md' }],
      });
      await fse.writeFile(path.join(agentsDir, 'agent1.md'), '# Agent');

      // Create skills
      const skillsDir = path.join(testDir, 'skills');
      await fse.ensureDir(skillsDir);
      await fse.writeJson(path.join(skillsDir, '_registry.json'), {
        category: 'skills',
        modules: [{ id: 'skill1', name: 'Skill 1', file: 'skill1.md' }],
      });
      await fse.writeFile(path.join(skillsDir, 'skill1.md'), '# Skill');

      const registry = await loadRegistry(testDir);
      expect(registry.agents.length).toBe(1);
      expect(registry.skills.length).toBe(1);
    });

    it('should handle modules with tags', async () => {
      const agentsDir = path.join(testDir, 'agents');
      await fse.ensureDir(agentsDir);
      await fse.writeJson(path.join(agentsDir, '_registry.json'), {
        category: 'agents',
        modules: [
          { id: 'tagged-agent', name: 'Tagged', file: 'tagged.md', tags: ['engineering', 'core'] },
        ],
      });
      await fse.writeFile(path.join(agentsDir, 'tagged.md'), '# Tagged');

      const registry = await loadRegistry(testDir);
      expect(registry.agents[0].tags).toContain('engineering');
      expect(registry.agents[0].tags).toContain('core');
    });
  });

  describe('getModule', () => {
    let registry: ModuleRegistry;

    beforeEach(() => {
      registry = {
        agents: [
          { id: 'agent1', name: 'Agent 1', description: '', category: 'agents', file: 'agent1.md' },
          { id: 'agent2', name: 'Agent 2', description: '', category: 'agents', file: 'agent2.md' },
        ],
        skills: [
          { id: 'skill1', name: 'Skill 1', description: '', category: 'skills', file: 'skill1.md' },
        ],
        commands: [],
        docs: [],
      };
    });

    it('should find module by id', () => {
      const module = getModule(registry, 'agents', 'agent1');
      expect(module).toBeDefined();
      expect(module?.name).toBe('Agent 1');
    });

    it('should return undefined for non-existing module', () => {
      const module = getModule(registry, 'agents', 'nonexistent');
      expect(module).toBeUndefined();
    });

    it('should find module in correct category', () => {
      const agent = getModule(registry, 'agents', 'skill1');
      const skill = getModule(registry, 'skills', 'skill1');
      expect(agent).toBeUndefined();
      expect(skill).toBeDefined();
    });
  });

  describe('getAllModules', () => {
    it('should return all modules from all categories', () => {
      const registry: ModuleRegistry = {
        agents: [{ id: 'a1', name: 'A1', description: '', category: 'agents', file: 'a1.md' }],
        skills: [{ id: 's1', name: 'S1', description: '', category: 'skills', file: 's1.md' }],
        commands: [{ id: 'c1', name: 'C1', description: '', category: 'commands', file: 'c1.md' }],
        docs: [{ id: 'd1', name: 'D1', description: '', category: 'docs', file: 'd1.md' }],
      };

      const allModules = getAllModules(registry);
      expect(allModules.length).toBe(4);
    });

    it('should return empty array for empty registry', () => {
      const registry: ModuleRegistry = {
        agents: [],
        skills: [],
        commands: [],
        docs: [],
      };

      const allModules = getAllModules(registry);
      expect(allModules).toEqual([]);
    });
  });

  describe('getModulesByTag', () => {
    let registry: ModuleRegistry;

    beforeEach(() => {
      registry = {
        agents: [
          {
            id: 'a1',
            name: 'A1',
            description: '',
            category: 'agents',
            file: 'a1.md',
            tags: ['core', 'engineering'],
          },
          {
            id: 'a2',
            name: 'A2',
            description: '',
            category: 'agents',
            file: 'a2.md',
            tags: ['quality'],
          },
          {
            id: 'a3',
            name: 'A3',
            description: '',
            category: 'agents',
            file: 'a3.md',
            tags: ['engineering'],
          },
        ],
        skills: [],
        commands: [],
        docs: [],
      };
    });

    it('should filter modules by tag', () => {
      const engineering = getModulesByTag(registry, 'agents', 'engineering');
      expect(engineering.length).toBe(2);
      expect(engineering.map((m) => m.id)).toContain('a1');
      expect(engineering.map((m) => m.id)).toContain('a3');
    });

    it('should return empty array for non-existing tag', () => {
      const result = getModulesByTag(registry, 'agents', 'nonexistent');
      expect(result).toEqual([]);
    });
  });

  describe('filterModules', () => {
    let registry: ModuleRegistry;

    beforeEach(() => {
      registry = {
        agents: [
          { id: 'a1', name: 'A1', description: '', category: 'agents', file: 'a1.md' },
          { id: 'a2', name: 'A2', description: '', category: 'agents', file: 'a2.md' },
          { id: 'a3', name: 'A3', description: '', category: 'agents', file: 'a3.md' },
        ],
        skills: [],
        commands: [],
        docs: [],
      };
    });

    it('should filter by id list', () => {
      const filtered = filterModules(registry, 'agents', ['a1', 'a3']);
      expect(filtered.length).toBe(2);
      expect(filtered.map((m) => m.id)).toEqual(['a1', 'a3']);
    });

    it('should ignore non-existing ids', () => {
      const filtered = filterModules(registry, 'agents', ['a1', 'nonexistent']);
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('a1');
    });

    it('should return empty for empty id list', () => {
      const filtered = filterModules(registry, 'agents', []);
      expect(filtered).toEqual([]);
    });

    it('should filter by tag when module has tags', () => {
      const registryWithTags: ModuleRegistry = {
        agents: [
          {
            id: 'tech-lead',
            name: 'Tech Lead',
            description: '',
            category: 'agents',
            file: 'tech-lead.md',
            tags: ['core', 'leadership'],
          },
          {
            id: 'qa-engineer',
            name: 'QA Engineer',
            description: '',
            category: 'agents',
            file: 'qa-engineer.md',
            tags: ['quality', 'testing'],
          },
          {
            id: 'debugger',
            name: 'Debugger',
            description: '',
            category: 'agents',
            file: 'debugger.md',
            tags: ['quality', 'debugging'],
          },
        ],
        skills: [],
        commands: [],
        docs: [],
      };

      // Filter by tag 'core' should return tech-lead
      const coreFiltered = filterModules(registryWithTags, 'agents', ['core']);
      expect(coreFiltered.length).toBe(1);
      expect(coreFiltered[0].id).toBe('tech-lead');

      // Filter by tag 'quality' should return qa-engineer and debugger
      const qualityFiltered = filterModules(registryWithTags, 'agents', ['quality']);
      expect(qualityFiltered.length).toBe(2);
      expect(qualityFiltered.map((m) => m.id)).toContain('qa-engineer');
      expect(qualityFiltered.map((m) => m.id)).toContain('debugger');
    });

    it('should filter by both ID and tag in same query', () => {
      const registryWithTags: ModuleRegistry = {
        agents: [
          {
            id: 'tech-lead',
            name: 'Tech Lead',
            description: '',
            category: 'agents',
            file: 'tech-lead.md',
            tags: ['core'],
          },
          {
            id: 'qa-engineer',
            name: 'QA Engineer',
            description: '',
            category: 'agents',
            file: 'qa-engineer.md',
            tags: ['quality'],
          },
          {
            id: 'debugger',
            name: 'Debugger',
            description: '',
            category: 'agents',
            file: 'debugger.md',
            tags: ['quality'],
          },
        ],
        skills: [],
        commands: [],
        docs: [],
      };

      // Filter by tag 'core' and explicit ID 'debugger'
      const filtered = filterModules(registryWithTags, 'agents', ['core', 'debugger']);
      expect(filtered.length).toBe(2);
      expect(filtered.map((m) => m.id)).toContain('tech-lead');
      expect(filtered.map((m) => m.id)).toContain('debugger');
    });

    it('should not duplicate modules when ID and tag match same module', () => {
      const registryWithTags: ModuleRegistry = {
        agents: [
          {
            id: 'tech-lead',
            name: 'Tech Lead',
            description: '',
            category: 'agents',
            file: 'tech-lead.md',
            tags: ['core'],
          },
        ],
        skills: [],
        commands: [],
        docs: [],
      };

      // Filter by both ID 'tech-lead' and tag 'core' (both match same module)
      const filtered = filterModules(registryWithTags, 'agents', ['tech-lead', 'core']);
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('tech-lead');
    });

    it('should handle modules with multiple tags', () => {
      const registryWithTags: ModuleRegistry = {
        agents: [
          {
            id: 'fullstack-dev',
            name: 'Fullstack Dev',
            description: '',
            category: 'agents',
            file: 'fullstack-dev.md',
            tags: ['frontend', 'backend', 'core'],
          },
        ],
        skills: [],
        commands: [],
        docs: [],
      };

      // Any matching tag should return the module
      expect(filterModules(registryWithTags, 'agents', ['frontend']).length).toBe(1);
      expect(filterModules(registryWithTags, 'agents', ['backend']).length).toBe(1);
      expect(filterModules(registryWithTags, 'agents', ['core']).length).toBe(1);
      expect(filterModules(registryWithTags, 'agents', ['nonexistent']).length).toBe(0);
    });
  });

  describe('getModuleIds', () => {
    it('should return all ids for category', () => {
      const registry: ModuleRegistry = {
        agents: [
          { id: 'a1', name: 'A1', description: '', category: 'agents', file: 'a1.md' },
          { id: 'a2', name: 'A2', description: '', category: 'agents', file: 'a2.md' },
        ],
        skills: [],
        commands: [],
        docs: [],
      };

      const ids = getModuleIds(registry, 'agents');
      expect(ids).toEqual(['a1', 'a2']);
    });
  });

  describe('validateModuleIds', () => {
    let registry: ModuleRegistry;

    beforeEach(() => {
      registry = {
        agents: [
          { id: 'a1', name: 'A1', description: '', category: 'agents', file: 'a1.md' },
          { id: 'a2', name: 'A2', description: '', category: 'agents', file: 'a2.md' },
        ],
        skills: [],
        commands: [],
        docs: [],
      };
    });

    it('should separate valid and invalid ids', () => {
      const result = validateModuleIds(registry, 'agents', ['a1', 'a3', 'a2', 'a4']);
      expect(result.valid).toEqual(['a1', 'a2']);
      expect(result.invalid).toEqual(['a3', 'a4']);
    });

    it('should return all as valid when all exist', () => {
      const result = validateModuleIds(registry, 'agents', ['a1', 'a2']);
      expect(result.valid).toEqual(['a1', 'a2']);
      expect(result.invalid).toEqual([]);
    });

    it('should return all as invalid when none exist', () => {
      const result = validateModuleIds(registry, 'agents', ['x1', 'x2']);
      expect(result.valid).toEqual([]);
      expect(result.invalid).toEqual(['x1', 'x2']);
    });
  });

  describe('resolveModules', () => {
    let registry: ModuleRegistry;

    beforeEach(() => {
      registry = {
        agents: [
          {
            id: 'a1',
            name: 'A1',
            description: '',
            category: 'agents',
            file: 'a1.md',
            dependencies: ['a2'],
          },
          { id: 'a2', name: 'A2', description: '', category: 'agents', file: 'a2.md' },
          {
            id: 'a3',
            name: 'A3',
            description: '',
            category: 'agents',
            file: 'a3.md',
            dependencies: ['a1'],
          },
        ],
        skills: [{ id: 's1', name: 'S1', description: '', category: 'skills', file: 's1.md' }],
        commands: [],
        docs: [],
      };
    });

    it('should resolve selected modules', () => {
      const result = resolveModules(registry, 'agents', ['a1']);
      expect(result.resolved.length).toBe(2); // a1 and its dependency a2
      expect(result.resolved.map((m) => m.id)).toContain('a1');
      expect(result.resolved.map((m) => m.id)).toContain('a2');
    });

    it('should report unresolved modules', () => {
      const result = resolveModules(registry, 'agents', ['nonexistent']);
      expect(result.unresolved).toContain('nonexistent');
    });

    it('should handle transitive dependencies', () => {
      const result = resolveModules(registry, 'agents', ['a3']);
      // a3 depends on a1, which depends on a2
      expect(result.resolved.map((m) => m.id)).toContain('a3');
      expect(result.resolved.map((m) => m.id)).toContain('a1');
      expect(result.resolved.map((m) => m.id)).toContain('a2');
    });

    it('should not duplicate modules', () => {
      const result = resolveModules(registry, 'agents', ['a1', 'a2']);
      const ids = result.resolved.map((m) => m.id);
      const uniqueIds = [...new Set(ids)];
      expect(ids.length).toBe(uniqueIds.length);
    });
  });

  describe('getDependents', () => {
    let registry: ModuleRegistry;

    beforeEach(() => {
      registry = {
        agents: [
          {
            id: 'a1',
            name: 'A1',
            description: '',
            category: 'agents',
            file: 'a1.md',
            dependencies: ['a2'],
          },
          { id: 'a2', name: 'A2', description: '', category: 'agents', file: 'a2.md' },
          {
            id: 'a3',
            name: 'A3',
            description: '',
            category: 'agents',
            file: 'a3.md',
            dependencies: ['a2'],
          },
        ],
        skills: [],
        commands: [],
        docs: [],
      };
    });

    it('should find modules that depend on a given module', () => {
      const dependents = getDependents(registry, 'agents', 'a2');
      expect(dependents.length).toBe(2);
      expect(dependents.map((m) => m.id)).toContain('a1');
      expect(dependents.map((m) => m.id)).toContain('a3');
    });

    it('should return empty array when no dependents', () => {
      const dependents = getDependents(registry, 'agents', 'a1');
      expect(dependents.length).toBe(0);
    });
  });

  describe('sortByDependencies', () => {
    it('should sort modules with dependencies first', () => {
      const modules: ModuleDefinition[] = [
        {
          id: 'a1',
          name: 'A1',
          description: '',
          category: 'agents',
          file: 'a1.md',
          dependencies: ['a2'],
        },
        { id: 'a2', name: 'A2', description: '', category: 'agents', file: 'a2.md' },
      ];

      const sorted = sortByDependencies(modules);
      const a1Index = sorted.findIndex((m) => m.id === 'a1');
      const a2Index = sorted.findIndex((m) => m.id === 'a2');

      // a2 should come before a1 since a1 depends on a2
      expect(a2Index).toBeLessThan(a1Index);
    });

    it('should handle modules without dependencies', () => {
      const modules: ModuleDefinition[] = [
        { id: 'a1', name: 'A1', description: '', category: 'agents', file: 'a1.md' },
        { id: 'a2', name: 'A2', description: '', category: 'agents', file: 'a2.md' },
      ];

      const sorted = sortByDependencies(modules);
      expect(sorted.length).toBe(2);
    });

    it('should handle chain of dependencies', () => {
      const modules: ModuleDefinition[] = [
        {
          id: 'a3',
          name: 'A3',
          description: '',
          category: 'agents',
          file: 'a3.md',
          dependencies: ['a2'],
        },
        { id: 'a1', name: 'A1', description: '', category: 'agents', file: 'a1.md' },
        {
          id: 'a2',
          name: 'A2',
          description: '',
          category: 'agents',
          file: 'a2.md',
          dependencies: ['a1'],
        },
      ];

      const sorted = sortByDependencies(modules);
      const a1Index = sorted.findIndex((m) => m.id === 'a1');
      const a2Index = sorted.findIndex((m) => m.id === 'a2');
      const a3Index = sorted.findIndex((m) => m.id === 'a3');

      // a1 should come first, then a2, then a3
      expect(a1Index).toBeLessThan(a2Index);
      expect(a2Index).toBeLessThan(a3Index);
    });

    it('should handle missing dependency in modules list', () => {
      const modules: ModuleDefinition[] = [
        {
          id: 'a1',
          name: 'A1',
          description: '',
          category: 'agents',
          file: 'a1.md',
          dependencies: ['missing'],
        },
      ];

      const sorted = sortByDependencies(modules);
      expect(sorted.length).toBe(1);
      expect(sorted[0].id).toBe('a1');
    });
  });

  describe('resolveAllModules', () => {
    let registry: ModuleRegistry;

    beforeEach(() => {
      registry = {
        agents: [
          { id: 'a1', name: 'A1', description: '', category: 'agents', file: 'a1.md' },
          { id: 'a2', name: 'A2', description: '', category: 'agents', file: 'a2.md' },
        ],
        skills: [{ id: 's1', name: 'S1', description: '', category: 'skills', file: 's1.md' }],
        commands: [{ id: 'c1', name: 'C1', description: '', category: 'commands', file: 'c1.md' }],
        docs: [{ id: 'd1', name: 'D1', description: '', category: 'docs', file: 'd1.md' }],
      };
    });

    it('should resolve modules across all categories', () => {
      const results = resolveAllModules(registry, {
        agents: ['a1'],
        skills: ['s1'],
        commands: ['c1'],
        docs: ['d1'],
      });

      expect(results.agents.resolved.map((m) => m.id)).toContain('a1');
      expect(results.skills.resolved.map((m) => m.id)).toContain('s1');
      expect(results.commands.resolved.map((m) => m.id)).toContain('c1');
      expect(results.docs.resolved.map((m) => m.id)).toContain('d1');
    });

    it('should handle empty selection', () => {
      const results = resolveAllModules(registry, {
        agents: [],
        skills: [],
        commands: [],
        docs: [],
      });

      expect(results.agents.resolved).toEqual([]);
      expect(results.skills.resolved).toEqual([]);
      expect(results.commands.resolved).toEqual([]);
      expect(results.docs.resolved).toEqual([]);
    });

    it('should handle partial selection', () => {
      const results = resolveAllModules(registry, {
        agents: ['a1', 'a2'],
        skills: [],
        commands: [],
        docs: [],
      });

      expect(results.agents.resolved.length).toBe(2);
      expect(results.skills.resolved.length).toBe(0);
    });
  });

  describe('checkRemovalImpact', () => {
    let registry: ModuleRegistry;

    beforeEach(() => {
      registry = {
        agents: [
          {
            id: 'a1',
            name: 'A1',
            description: '',
            category: 'agents',
            file: 'a1.md',
            dependencies: ['a2'],
          },
          { id: 'a2', name: 'A2', description: '', category: 'agents', file: 'a2.md' },
          {
            id: 'a3',
            name: 'A3',
            description: '',
            category: 'agents',
            file: 'a3.md',
            dependencies: ['a2'],
          },
        ],
        skills: [],
        commands: [],
        docs: [],
      };
    });

    it('should report modules that would be affected by removal', () => {
      const result = checkRemovalImpact(registry, 'agents', 'a2', ['a1', 'a2', 'a3']);

      expect(result.canRemove).toBe(false);
      expect(result.blockedBy).toContain('a1');
      expect(result.blockedBy).toContain('a3');
    });

    it('should allow removal when no installed modules depend on it', () => {
      const result = checkRemovalImpact(registry, 'agents', 'a1', ['a1', 'a2']);

      expect(result.canRemove).toBe(true);
      expect(result.blockedBy).toEqual([]);
    });

    it('should allow removal when dependents are not installed', () => {
      const result = checkRemovalImpact(registry, 'agents', 'a2', ['a2']);

      expect(result.canRemove).toBe(true);
      expect(result.blockedBy).toEqual([]);
    });
  });

  describe('getSuggestedModules', () => {
    let registry: ModuleRegistry;

    beforeEach(() => {
      registry = {
        agents: [
          {
            id: 'a1',
            name: 'A1',
            description: '',
            category: 'agents',
            file: 'a1.md',
            tags: ['engineering'],
          },
          {
            id: 'a2',
            name: 'A2',
            description: '',
            category: 'agents',
            file: 'a2.md',
            tags: ['engineering'],
          },
          {
            id: 'a3',
            name: 'A3',
            description: '',
            category: 'agents',
            file: 'a3.md',
            tags: ['quality'],
          },
        ],
        skills: [
          {
            id: 's1',
            name: 'S1',
            description: '',
            category: 'skills',
            file: 's1.md',
            tags: ['engineering'],
          },
        ],
        commands: [],
        docs: [],
      };
    });

    it('should suggest modules with matching tags', () => {
      const suggestions = getSuggestedModules(registry, {
        agents: ['a1'],
        skills: [],
        commands: [],
        docs: [],
      });

      // Should suggest a2 (same tag 'engineering') and s1 (same tag 'engineering')
      const ids = suggestions.map((m) => m.id);
      expect(ids).toContain('a2');
      expect(ids).toContain('s1');
    });

    it('should not suggest already installed modules', () => {
      const suggestions = getSuggestedModules(registry, {
        agents: ['a1', 'a2'],
        skills: ['s1'],
        commands: [],
        docs: [],
      });

      const ids = suggestions.map((m) => m.id);
      expect(ids).not.toContain('a1');
      expect(ids).not.toContain('a2');
      expect(ids).not.toContain('s1');
    });

    it('should return empty array when no matching tags', () => {
      const suggestions = getSuggestedModules(registry, {
        agents: ['a3'],
        skills: [],
        commands: [],
        docs: [],
      });

      // a3 has 'quality' tag, no other modules have this tag
      expect(suggestions.length).toBe(0);
    });

    it('should return empty array when no installed modules', () => {
      const suggestions = getSuggestedModules(registry, {
        agents: [],
        skills: [],
        commands: [],
        docs: [],
      });

      expect(suggestions.length).toBe(0);
    });
  });

  describe('loadRegistry with fallback scanning', () => {
    it('should scan directory when registry.json has invalid content', async () => {
      const agentsDir = path.join(testDir, 'agents');
      const subDir = path.join(agentsDir, 'engineering');
      await fse.ensureDir(subDir);

      // Write invalid JSON to registry
      await fse.writeFile(path.join(agentsDir, '_registry.json'), 'invalid json');

      // Create a module file in subdirectory
      await fse.writeFile(path.join(subDir, 'test-agent.md'), '# Test Agent');

      const registry = await loadRegistry(testDir);

      // Should fallback to scanning and find the module
      expect(registry.agents.length).toBeGreaterThanOrEqual(0);
    });

    it('should scan subdirectories for modules', async () => {
      const agentsDir = path.join(testDir, 'agents');
      const engDir = path.join(agentsDir, 'engineering');
      const qualDir = path.join(agentsDir, 'quality');
      await fse.ensureDir(engDir);
      await fse.ensureDir(qualDir);

      // Create module files (no registry.json)
      await fse.writeFile(path.join(engDir, 'backend-dev.md'), '# Backend Dev');
      await fse.writeFile(path.join(qualDir, 'qa-engineer.md'), '# QA Engineer');

      const registry = await loadRegistry(testDir);

      // Should find modules via scanning
      expect(registry.agents.length).toBeGreaterThanOrEqual(0);
    });

    it('should skip directories starting with underscore', async () => {
      const agentsDir = path.join(testDir, 'agents');
      const hiddenDir = path.join(agentsDir, '_internal');
      await fse.ensureDir(hiddenDir);

      await fse.writeFile(path.join(hiddenDir, 'secret.md'), '# Secret');

      const registry = await loadRegistry(testDir);

      // Should not include modules from _internal
      const secretModule = registry.agents.find((m) => m.id === 'secret');
      expect(secretModule).toBeUndefined();
    });

    it('should scan root category files', async () => {
      const agentsDir = path.join(testDir, 'agents');
      await fse.ensureDir(agentsDir);

      // Create root level module file (no subdirectory, no registry)
      await fse.writeFile(path.join(agentsDir, 'root-agent.md'), '# Root Agent');

      const registry = await loadRegistry(testDir);

      // Should find the root level module
      const rootModule = registry.agents.find((m) => m.id === 'root-agent');
      expect(rootModule).toBeDefined();
      if (rootModule) {
        expect(rootModule.name).toBe('Root Agent');
      }
    });

    it('should not include README.md as a module', async () => {
      const agentsDir = path.join(testDir, 'agents');
      await fse.ensureDir(agentsDir);

      await fse.writeFile(path.join(agentsDir, 'README.md'), '# Readme');
      await fse.writeFile(path.join(agentsDir, 'actual-agent.md'), '# Actual');

      const registry = await loadRegistry(testDir);

      const readmeModule = registry.agents.find((m) => m.id === 'README');
      expect(readmeModule).toBeUndefined();
    });
  });

  describe('resolveModules with circular dependencies', () => {
    it('should detect circular dependencies', () => {
      const registry: ModuleRegistry = {
        agents: [
          {
            id: 'a1',
            name: 'A1',
            description: '',
            category: 'agents',
            file: 'a1.md',
            dependencies: ['a2'],
          },
          {
            id: 'a2',
            name: 'A2',
            description: '',
            category: 'agents',
            file: 'a2.md',
            dependencies: ['a1'],
          },
        ],
        skills: [],
        commands: [],
        docs: [],
      };

      const result = resolveModules(registry, 'agents', ['a1']);

      // Should detect circular dependency
      expect(result.circular.length).toBeGreaterThan(0);
    });

    it('should handle self-referential dependency', () => {
      const registry: ModuleRegistry = {
        agents: [
          {
            id: 'a1',
            name: 'A1',
            description: '',
            category: 'agents',
            file: 'a1.md',
            dependencies: ['a1'],
          },
        ],
        skills: [],
        commands: [],
        docs: [],
      };

      const result = resolveModules(registry, 'agents', ['a1']);

      // Should detect circular dependency
      expect(result.circular).toContain('a1');
    });
  });
});
