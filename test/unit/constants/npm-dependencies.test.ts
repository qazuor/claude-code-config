/**
 * Tests for npm-dependencies constants
 */

import { describe, expect, it } from 'vitest';
import {
  COMMITLINT_DEPENDENCIES,
  FORMATTER_DEPENDENCIES,
  HUSKY_DEPENDENCIES,
  LINTER_DEPENDENCIES,
  TEST_RUNNER_DEPENDENCIES,
  TYPESCRIPT_DEPENDENCIES,
  formatInstallCommand,
  getFormatterDependencies,
  getLinterDependencies,
  getTestRunnerDependencies,
  mergeToolDependencies,
} from '../../../src/constants/npm-dependencies.js';

describe('npm-dependencies constants', () => {
  describe('LINTER_DEPENDENCIES', () => {
    it('should have biome linter config', () => {
      expect(LINTER_DEPENDENCIES.biome).toBeDefined();
      expect(LINTER_DEPENDENCIES.biome.packages).toHaveLength(1);
      expect(LINTER_DEPENDENCIES.biome.packages[0].name).toBe('@biomejs/biome');
      expect(LINTER_DEPENDENCIES.biome.scripts).toHaveLength(2);
    });

    it('should have eslint linter config', () => {
      expect(LINTER_DEPENDENCIES.eslint).toBeDefined();
      expect(LINTER_DEPENDENCIES.eslint.packages.length).toBeGreaterThanOrEqual(2);
      expect(LINTER_DEPENDENCIES.eslint.scripts).toHaveLength(2);
    });

    it('should have oxlint linter config', () => {
      expect(LINTER_DEPENDENCIES.oxlint).toBeDefined();
      expect(LINTER_DEPENDENCIES.oxlint.packages).toHaveLength(1);
    });
  });

  describe('FORMATTER_DEPENDENCIES', () => {
    it('should have biome formatter config', () => {
      expect(FORMATTER_DEPENDENCIES.biome).toBeDefined();
      expect(FORMATTER_DEPENDENCIES.biome.scripts).toHaveLength(2);
    });

    it('should have prettier formatter config', () => {
      expect(FORMATTER_DEPENDENCIES.prettier).toBeDefined();
      expect(FORMATTER_DEPENDENCIES.prettier.packages).toHaveLength(1);
      expect(FORMATTER_DEPENDENCIES.prettier.packages[0].name).toBe('prettier');
    });
  });

  describe('TEST_RUNNER_DEPENDENCIES', () => {
    it('should have vitest config', () => {
      expect(TEST_RUNNER_DEPENDENCIES.vitest).toBeDefined();
      expect(TEST_RUNNER_DEPENDENCIES.vitest.packages.length).toBeGreaterThanOrEqual(1);
      expect(TEST_RUNNER_DEPENDENCIES.vitest.scripts.length).toBeGreaterThanOrEqual(2);
    });

    it('should have jest config', () => {
      expect(TEST_RUNNER_DEPENDENCIES.jest).toBeDefined();
      expect(TEST_RUNNER_DEPENDENCIES.jest.packages.length).toBeGreaterThanOrEqual(2);
    });

    it('should have playwright config', () => {
      expect(TEST_RUNNER_DEPENDENCIES.playwright).toBeDefined();
      expect(TEST_RUNNER_DEPENDENCIES.playwright.packages).toHaveLength(1);
    });
  });

  describe('COMMITLINT_DEPENDENCIES', () => {
    it('should have commitlint packages', () => {
      expect(COMMITLINT_DEPENDENCIES.packages).toHaveLength(2);
      expect(COMMITLINT_DEPENDENCIES.packages[0].name).toBe('@commitlint/cli');
    });

    it('should have setup instructions', () => {
      expect(COMMITLINT_DEPENDENCIES.setupInstructions).toBeDefined();
      expect(COMMITLINT_DEPENDENCIES.setupInstructions?.length).toBeGreaterThan(0);
    });
  });

  describe('HUSKY_DEPENDENCIES', () => {
    it('should have husky package', () => {
      expect(HUSKY_DEPENDENCIES.packages).toHaveLength(1);
      expect(HUSKY_DEPENDENCIES.packages[0].name).toBe('husky');
    });

    it('should have prepare script', () => {
      expect(HUSKY_DEPENDENCIES.scripts).toHaveLength(1);
      expect(HUSKY_DEPENDENCIES.scripts[0].name).toBe('prepare');
    });
  });

  describe('TYPESCRIPT_DEPENDENCIES', () => {
    it('should have typescript packages', () => {
      expect(TYPESCRIPT_DEPENDENCIES.packages.length).toBeGreaterThanOrEqual(1);
      expect(TYPESCRIPT_DEPENDENCIES.packages.some((p) => p.name === 'typescript')).toBe(true);
    });

    it('should have typecheck script', () => {
      expect(TYPESCRIPT_DEPENDENCIES.scripts.some((s) => s.name === 'typecheck')).toBe(true);
    });
  });

  describe('getLinterDependencies', () => {
    it('should return biome dependencies', () => {
      const deps = getLinterDependencies('biome');
      expect(deps).toBe(LINTER_DEPENDENCIES.biome);
    });

    it('should return eslint dependencies', () => {
      const deps = getLinterDependencies('eslint');
      expect(deps).toBe(LINTER_DEPENDENCIES.eslint);
    });

    it('should return undefined for unknown linter', () => {
      const deps = getLinterDependencies('unknown');
      expect(deps).toBeUndefined();
    });
  });

  describe('getFormatterDependencies', () => {
    it('should return prettier dependencies', () => {
      const deps = getFormatterDependencies('prettier');
      expect(deps).toBe(FORMATTER_DEPENDENCIES.prettier);
    });

    it('should return undefined for unknown formatter', () => {
      const deps = getFormatterDependencies('unknown');
      expect(deps).toBeUndefined();
    });
  });

  describe('getTestRunnerDependencies', () => {
    it('should return vitest dependencies', () => {
      const deps = getTestRunnerDependencies('vitest');
      expect(deps).toBe(TEST_RUNNER_DEPENDENCIES.vitest);
    });

    it('should return undefined for unknown test runner', () => {
      const deps = getTestRunnerDependencies('unknown');
      expect(deps).toBeUndefined();
    });
  });

  describe('mergeToolDependencies', () => {
    it('should merge multiple tool dependencies', () => {
      const merged = mergeToolDependencies(
        LINTER_DEPENDENCIES.biome,
        FORMATTER_DEPENDENCIES.prettier
      );

      expect(merged.packages).toHaveLength(2);
      expect(merged.packages.some((p) => p.name === '@biomejs/biome')).toBe(true);
      expect(merged.packages.some((p) => p.name === 'prettier')).toBe(true);
    });

    it('should deduplicate packages by name', () => {
      const merged = mergeToolDependencies(LINTER_DEPENDENCIES.biome, FORMATTER_DEPENDENCIES.biome);

      // Biome appears in both, should only appear once
      const biomePackages = merged.packages.filter((p) => p.name === '@biomejs/biome');
      expect(biomePackages).toHaveLength(1);
    });

    it('should merge scripts', () => {
      const merged = mergeToolDependencies(
        LINTER_DEPENDENCIES.biome,
        TEST_RUNNER_DEPENDENCIES.vitest
      );

      expect(merged.scripts.some((s) => s.name === 'lint')).toBe(true);
      expect(merged.scripts.some((s) => s.name === 'test')).toBe(true);
    });

    it('should merge setup instructions', () => {
      const merged = mergeToolDependencies(COMMITLINT_DEPENDENCIES, TEST_RUNNER_DEPENDENCIES.jest);

      expect(merged.setupInstructions).toBeDefined();
      expect(merged.setupInstructions?.length).toBeGreaterThan(0);
    });

    it('should handle undefined inputs', () => {
      const merged = mergeToolDependencies(LINTER_DEPENDENCIES.biome, undefined, undefined);

      expect(merged.packages).toHaveLength(1);
    });

    it('should handle all undefined inputs', () => {
      const merged = mergeToolDependencies(undefined, undefined);

      expect(merged.packages).toHaveLength(0);
      expect(merged.scripts).toHaveLength(0);
    });
  });

  describe('formatInstallCommand', () => {
    const packages = [
      { name: 'biome', version: '^1.0.0', isDev: true, description: 'Biome' },
      { name: 'react', version: '^18.0.0', isDev: false, description: 'React' },
    ];

    it('should format pnpm command', () => {
      const cmd = formatInstallCommand(packages, 'pnpm');
      expect(cmd).toContain('pnpm add -D biome');
      expect(cmd).toContain('pnpm add react');
    });

    it('should format npm command', () => {
      const cmd = formatInstallCommand(packages, 'npm');
      expect(cmd).toContain('npm install -D biome');
      expect(cmd).toContain('npm install react');
    });

    it('should format yarn command', () => {
      const cmd = formatInstallCommand(packages, 'yarn');
      expect(cmd).toContain('yarn add -D biome');
      expect(cmd).toContain('yarn add react');
    });

    it('should format bun command', () => {
      const cmd = formatInstallCommand(packages, 'bun');
      expect(cmd).toContain('bun add -D biome');
      expect(cmd).toContain('bun add react');
    });

    it('should handle dev dependencies only', () => {
      const devOnly = [{ name: 'vitest', version: '^1.0.0', isDev: true, description: 'Vitest' }];
      const cmd = formatInstallCommand(devOnly, 'pnpm');
      expect(cmd).toBe('pnpm add -D vitest');
    });
  });
});
