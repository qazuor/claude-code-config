import os from 'node:os';
import path from 'node:path';
import fse from 'fs-extra';
/**
 * Tests for scaffold lib
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  detectProject,
  getProjectDescription,
  getProjectName,
  hasExistingClaudeConfig,
} from '../../../src/lib/scaffold/detector.js';

describe('scaffold detector', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `claude-config-scaffold-test-${Date.now()}`);
    await fse.ensureDir(testDir);
  });

  afterEach(async () => {
    await fse.remove(testDir);
  });

  describe('detectProject', () => {
    it('should return not detected for empty directory', async () => {
      const result = await detectProject(testDir);
      expect(result.detected).toBe(false);
      expect(result.confidence).toBe('low');
    });

    it('should detect Node.js project from package.json', async () => {
      await fse.writeJson(path.join(testDir, 'package.json'), {
        name: 'test-project',
        version: '1.0.0',
      });

      const result = await detectProject(testDir);
      expect(result.detected).toBe(true);
      expect(result.signals.some((s) => s.file === 'package.json')).toBe(true);
    });

    it('should detect pnpm package manager', async () => {
      await fse.writeJson(path.join(testDir, 'package.json'), { name: 'test' });
      await fse.writeFile(path.join(testDir, 'pnpm-lock.yaml'), '');

      const result = await detectProject(testDir);
      expect(result.packageManager).toBe('pnpm');
    });

    it('should detect npm package manager', async () => {
      await fse.writeJson(path.join(testDir, 'package.json'), { name: 'test' });
      await fse.writeJson(path.join(testDir, 'package-lock.json'), {});

      const result = await detectProject(testDir);
      expect(result.packageManager).toBe('npm');
    });

    it('should detect yarn package manager', async () => {
      await fse.writeJson(path.join(testDir, 'package.json'), { name: 'test' });
      await fse.writeFile(path.join(testDir, 'yarn.lock'), '');

      const result = await detectProject(testDir);
      expect(result.packageManager).toBe('yarn');
    });

    it('should detect bun package manager', async () => {
      await fse.writeJson(path.join(testDir, 'package.json'), { name: 'test' });
      await fse.writeFile(path.join(testDir, 'bun.lockb'), '');

      const result = await detectProject(testDir);
      expect(result.packageManager).toBe('bun');
    });

    it('should detect Astro project', async () => {
      await fse.writeJson(path.join(testDir, 'package.json'), {
        name: 'astro-project',
        dependencies: { astro: '^3.0.0' },
      });

      const result = await detectProject(testDir);
      expect(result.projectType).toBe('astro');
      expect(result.suggestedBundles).toContain('astro-react-stack');
    });

    it('should detect Next.js project', async () => {
      await fse.writeJson(path.join(testDir, 'package.json'), {
        name: 'next-project',
        dependencies: { next: '^14.0.0' },
      });

      const result = await detectProject(testDir);
      expect(result.projectType).toBe('nextjs');
      expect(result.suggestedBundles).toContain('react-tanstack-stack');
    });

    it('should detect Vite + React project', async () => {
      await fse.writeJson(path.join(testDir, 'package.json'), {
        name: 'vite-react-project',
        dependencies: { react: '^18.0.0' },
        devDependencies: { vite: '^5.0.0' },
      });
      await fse.writeFile(path.join(testDir, 'vite.config.ts'), '');

      const result = await detectProject(testDir);
      expect(result.projectType).toBe('vite-react');
      expect(result.suggestedBundles).toContain('react-tanstack-stack');
    });

    it('should detect Hono project', async () => {
      await fse.writeJson(path.join(testDir, 'package.json'), {
        name: 'hono-project',
        dependencies: { hono: '^4.0.0' },
      });

      const result = await detectProject(testDir);
      expect(result.projectType).toBe('hono');
      expect(result.suggestedBundles).toContain('hono-api');
    });

    it('should detect monorepo from turbo.json', async () => {
      await fse.writeJson(path.join(testDir, 'package.json'), { name: 'monorepo' });
      await fse.writeJson(path.join(testDir, 'turbo.json'), {});

      const result = await detectProject(testDir);
      expect(result.projectType).toBe('monorepo');
      // Monorepos get git-workflow as default
      expect(result.suggestedBundles).toContain('git-workflow');
    });

    it('should detect monorepo from pnpm-workspace.yaml', async () => {
      await fse.writeJson(path.join(testDir, 'package.json'), { name: 'monorepo' });
      await fse.writeFile(path.join(testDir, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*');

      const result = await detectProject(testDir);
      expect(result.projectType).toBe('monorepo');
    });

    it('should detect monorepo from workspaces in package.json', async () => {
      await fse.writeJson(path.join(testDir, 'package.json'), {
        name: 'monorepo',
        workspaces: ['packages/*'],
      });

      const result = await detectProject(testDir);
      expect(result.projectType).toBe('monorepo');
    });

    it('should suggest hono-api for backend + frontend deps', async () => {
      await fse.writeJson(path.join(testDir, 'package.json'), {
        name: 'fullstack',
        dependencies: {
          hono: '^4.0.0',
          react: '^18.0.0',
        },
      });

      const result = await detectProject(testDir);
      // Hono project type is detected, so hono-api is suggested
      expect(result.suggestedBundles).toContain('hono-api');
    });

    it('should suggest hono-drizzle-stack for API + database deps', async () => {
      await fse.writeJson(path.join(testDir, 'package.json'), {
        name: 'backend',
        dependencies: {
          hono: '^4.0.0',
          'drizzle-orm': '^1.0.0',
        },
      });

      const result = await detectProject(testDir);
      expect(result.suggestedBundles).toContain('hono-drizzle-stack');
    });

    it('should have high confidence when type and manager detected', async () => {
      await fse.writeJson(path.join(testDir, 'package.json'), {
        name: 'project',
        dependencies: { astro: '^3.0.0' },
      });
      await fse.writeFile(path.join(testDir, 'pnpm-lock.yaml'), '');

      const result = await detectProject(testDir);
      expect(result.confidence).toBe('high');
    });

    it('should have medium confidence when only type detected', async () => {
      await fse.writeJson(path.join(testDir, 'package.json'), {
        name: 'project',
        dependencies: { astro: '^3.0.0' },
      });

      const result = await detectProject(testDir);
      expect(result.confidence).toBe('medium');
    });
  });

  describe('getProjectName', () => {
    it('should return name from package.json', async () => {
      await fse.writeJson(path.join(testDir, 'package.json'), {
        name: 'my-awesome-project',
      });

      const name = await getProjectName(testDir);
      expect(name).toBe('my-awesome-project');
    });

    it('should return directory name when no package.json', async () => {
      const name = await getProjectName(testDir);
      expect(name).toBeDefined();
      expect(typeof name).toBe('string');
    });
  });

  describe('getProjectDescription', () => {
    it('should return description from package.json', async () => {
      await fse.writeJson(path.join(testDir, 'package.json'), {
        name: 'project',
        description: 'An awesome project',
      });

      const description = await getProjectDescription(testDir);
      expect(description).toBe('An awesome project');
    });

    it('should return undefined when no description', async () => {
      await fse.writeJson(path.join(testDir, 'package.json'), {
        name: 'project',
      });

      const description = await getProjectDescription(testDir);
      expect(description).toBeUndefined();
    });

    it('should return undefined when no package.json', async () => {
      const description = await getProjectDescription(testDir);
      expect(description).toBeUndefined();
    });
  });

  describe('hasExistingClaudeConfig', () => {
    it('should return false when no .claude directory', async () => {
      const result = await hasExistingClaudeConfig(testDir);
      expect(result).toBe(false);
    });

    it('should return true when .claude directory exists', async () => {
      await fse.ensureDir(path.join(testDir, '.claude'));

      const result = await hasExistingClaudeConfig(testDir);
      expect(result).toBe(true);
    });
  });
});
