/**
 * Tests for dependencies checker
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEPENDENCIES } from '../../../src/constants/dependencies.js';
import {
  checkAllDependencies,
  checkDependency,
  checkFeatureDependencies,
  formatDependencyReport,
  getCurrentPlatform,
  getInstallInstructions,
  getRequiredFeatures,
} from '../../../src/lib/dependencies/checker.js';
import type { DependencyInfo, DependencyReport } from '../../../src/types/dependencies.js';

// Mock child_process exec
vi.mock('node:child_process', () => ({
  exec: vi.fn((cmd, callback) => {
    if (cmd.includes('which git') || cmd.includes('command -v git')) {
      callback(null, { stdout: 'git version 2.40.0', stderr: '' });
    } else if (cmd.includes('command -v jq')) {
      callback(null, { stdout: 'jq-1.6', stderr: '' });
    } else {
      callback(new Error('command not found'), { stdout: '', stderr: '' });
    }
  }),
}));

describe('dependencies checker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentPlatform', () => {
    it('should return a valid platform', () => {
      const platform = getCurrentPlatform();
      expect(['linux', 'macos', 'windows']).toContain(platform);
    });
  });

  describe('checkDependency', () => {
    it('should return installed: true for existing command', async () => {
      const dep: DependencyInfo = {
        id: 'test-dep',
        name: 'Test Dependency',
        description: 'A test dependency',
        requiredFor: ['testing'],
        checkCommand: 'command -v git',
        platforms: {},
      };

      const result = await checkDependency(dep);
      expect(result.id).toBe('test-dep');
      expect(result.installed).toBe(true);
    });

    it('should return installed: false for missing command', async () => {
      const dep: DependencyInfo = {
        id: 'missing-dep',
        name: 'Missing Dependency',
        description: 'A missing dependency',
        requiredFor: ['testing'],
        checkCommand: 'command -v nonexistent-command-xyz',
        platforms: {},
      };

      const result = await checkDependency(dep);
      expect(result.id).toBe('missing-dep');
      expect(result.installed).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should extract version from output', async () => {
      const dep: DependencyInfo = {
        id: 'versioned-dep',
        name: 'Versioned Dependency',
        description: 'A dependency with version',
        requiredFor: ['testing'],
        checkCommand: 'command -v git',
        platforms: {},
      };

      const result = await checkDependency(dep);
      if (result.installed && result.version) {
        expect(result.version).toMatch(/\d+\.\d+\.\d+/);
      }
    });
  });

  describe('checkAllDependencies', () => {
    it('should check all dependencies', async () => {
      const report = await checkAllDependencies();
      expect(report.checked).toBeDefined();
      expect(Array.isArray(report.checked)).toBe(true);
      expect(report.missing).toBeDefined();
      expect(Array.isArray(report.missing)).toBe(true);
      expect(report.instructions).toBeDefined();
    });

    it('should report missing dependencies', async () => {
      const report = await checkAllDependencies();
      // At least some dependencies might be missing in test environment
      expect(Array.isArray(report.missing)).toBe(true);
    });
  });

  describe('checkFeatureDependencies', () => {
    it('should check dependencies for specific features', async () => {
      const report = await checkFeatureDependencies(['hooks']);
      expect(report.checked).toBeDefined();
      expect(Array.isArray(report.checked)).toBe(true);
    });

    it('should return empty for features with no dependencies', async () => {
      const report = await checkFeatureDependencies(['unknown-feature']);
      expect(report.checked).toEqual([]);
    });

    it('should deduplicate dependencies across features', async () => {
      const report = await checkFeatureDependencies(['hooks', 'hook:notification:audio']);
      // Should have checked deps without duplicates
      const ids = report.checked.map((c) => c.id);
      const uniqueIds = [...new Set(ids)];
      expect(ids.length).toBe(uniqueIds.length);
    });
  });

  describe('getInstallInstructions', () => {
    it('should return instructions for valid platform', () => {
      const dep: DependencyInfo = {
        id: 'test-dep',
        name: 'Test',
        description: 'Test',
        requiredFor: ['test'],
        checkCommand: 'test',
        platforms: {
          linux: {
            commands: ['apt install test'],
            notes: 'Test notes',
          },
        },
      };

      const instructions = getInstallInstructions(dep, 'linux');
      expect(instructions).toContain('apt install test');
    });

    it('should return fallback message for missing platform', () => {
      const dep: DependencyInfo = {
        id: 'test-dep',
        name: 'Test',
        description: 'Test',
        requiredFor: ['test'],
        checkCommand: 'test',
        platforms: {},
      };

      const instructions = getInstallInstructions(dep, 'linux');
      expect(instructions[0]).toContain('No installation instructions');
    });

    it('should use current platform when not specified', () => {
      const dep: DependencyInfo = {
        id: 'test-dep',
        name: 'Test',
        description: 'Test',
        requiredFor: ['test'],
        checkCommand: 'test',
        platforms: {
          linux: { commands: ['linux-cmd'] },
          macos: { commands: ['macos-cmd'] },
          windows: { commands: ['windows-cmd'] },
        },
      };

      const instructions = getInstallInstructions(dep);
      expect(instructions.length).toBeGreaterThan(0);
    });
  });

  describe('formatDependencyReport', () => {
    it('should display success message when no missing', () => {
      const report: DependencyReport = {
        checked: [{ id: 'test', installed: true }],
        missing: [],
        instructions: new Map(),
      };

      // Should not throw
      expect(() => formatDependencyReport(report)).not.toThrow();
    });

    it('should display missing dependencies', () => {
      const dep: DependencyInfo = {
        id: 'missing',
        name: 'Missing Dep',
        description: 'A missing dependency',
        requiredFor: ['feature1', 'feature2'],
        checkCommand: 'test',
        platforms: {
          linux: { commands: ['install-cmd'], notes: 'Some notes' },
        },
      };

      const report: DependencyReport = {
        checked: [{ id: 'missing', installed: false }],
        missing: [dep],
        instructions: new Map([['missing', { commands: ['install-cmd'], notes: 'Some notes' }]]),
      };

      // Should not throw
      expect(() => formatDependencyReport(report)).not.toThrow();
    });

    it('should handle dependencies without notes', () => {
      const dep: DependencyInfo = {
        id: 'missing',
        name: 'Missing Dep',
        description: 'A missing dependency',
        requiredFor: ['feature1'],
        checkCommand: 'test',
        platforms: {
          linux: { commands: ['install-cmd'] },
        },
      };

      const report: DependencyReport = {
        checked: [{ id: 'missing', installed: false }],
        missing: [dep],
        instructions: new Map([['missing', { commands: ['install-cmd'] }]]),
      };

      // Should not throw
      expect(() => formatDependencyReport(report)).not.toThrow();
    });
  });

  describe('getRequiredFeatures', () => {
    it('should return empty array for empty config', () => {
      const features = getRequiredFeatures({});
      expect(features).toEqual([]);
    });

    it('should include hooks when enabled', () => {
      const features = getRequiredFeatures({
        hooks: { enabled: true },
      });
      expect(features).toContain('hooks');
    });

    it('should include audio feature when configured', () => {
      const features = getRequiredFeatures({
        hooks: {
          enabled: true,
          notification: { audio: true },
        },
      });
      expect(features).toContain('hooks');
      expect(features).toContain('hook:notification:audio');
    });

    it('should include desktop feature when configured', () => {
      const features = getRequiredFeatures({
        hooks: {
          enabled: true,
          notification: { desktop: true },
        },
      });
      expect(features).toContain('hooks');
      expect(features).toContain('hook:notification:desktop');
    });

    it('should include mcp-servers when configured', () => {
      const features = getRequiredFeatures({
        mcp: {
          servers: [{ serverId: 'test' }],
        },
      });
      expect(features).toContain('mcp-servers');
    });

    it('should not include mcp-servers when array is empty', () => {
      const features = getRequiredFeatures({
        mcp: {
          servers: [],
        },
      });
      expect(features).not.toContain('mcp-servers');
    });
  });
});
