/**
 * Tests for pre-commit hook generator
 */
import { describe, expect, it } from 'vitest';
import {
  generatePreCommitScript,
  generateSimplePreCommitHook,
} from '../../../src/lib/git-hooks/precommit-generator.js';
import type { PreCommitConfig } from '../../../src/types/config.js';

describe('precommit-generator', () => {
  const baseConfig: PreCommitConfig = {
    enabled: true,
    lint: {
      enabled: true,
      stagedOnly: true,
      tool: 'biome',
    },
    typecheck: {
      enabled: true,
    },
    tests: {
      enabled: false,
      mode: 'none',
      coverageThreshold: 0,
    },
    formatCheck: {
      enabled: false,
    },
    customCommands: [],
    showTiming: false,
    continueOnFailure: false,
  };

  describe('generatePreCommitScript', () => {
    it('should generate disabled script when disabled', () => {
      const config: PreCommitConfig = {
        ...baseConfig,
        enabled: false,
      };

      const script = generatePreCommitScript(config);

      expect(script).toContain('#!/usr/bin/env sh');
      expect(script).toContain('Pre-commit hook disabled');
      expect(script).toContain('exit 0');
    });

    it('should generate header with husky setup', () => {
      const script = generatePreCommitScript(baseConfig);

      expect(script).toContain('#!/usr/bin/env sh');
      expect(script).toContain('husky.sh');
      expect(script).toContain('Running pre-commit checks');
      expect(script).toContain('Bypass with: git commit --no-verify');
    });

    it('should include lint section when enabled', () => {
      const script = generatePreCommitScript(baseConfig);

      expect(script).toContain('# Linting');
      expect(script).toContain('Linting...');
      expect(script).toContain('biome check --staged');
    });

    it('should use biome staged command for biome tool', () => {
      const config: PreCommitConfig = {
        ...baseConfig,
        lint: { enabled: true, stagedOnly: true, tool: 'biome' },
      };

      const script = generatePreCommitScript(config);

      expect(script).toContain('biome check --staged --no-errors-on-unmatched');
    });

    it('should use lint-staged for eslint tool', () => {
      const config: PreCommitConfig = {
        ...baseConfig,
        lint: { enabled: true, stagedOnly: true, tool: 'eslint' },
      };

      const script = generatePreCommitScript(config);

      expect(script).toContain('lint-staged');
    });

    it('should use full lint command when not staged only', () => {
      const config: PreCommitConfig = {
        ...baseConfig,
        lint: { enabled: true, stagedOnly: false, tool: 'biome' },
      };

      const script = generatePreCommitScript(config);

      expect(script).toContain('biome check .');
    });

    it('should use custom lint command when provided', () => {
      const config: PreCommitConfig = {
        ...baseConfig,
        lint: { enabled: true, stagedOnly: true, command: 'npm run my-lint' },
      };

      const script = generatePreCommitScript(config);

      expect(script).toContain('npm run my-lint');
    });

    it('should include typecheck section when enabled', () => {
      const script = generatePreCommitScript(baseConfig);

      expect(script).toContain('# Type checking');
      expect(script).toContain('Type checking...');
      expect(script).toContain('pnpm typecheck');
    });

    it('should use custom typecheck command when provided', () => {
      const config: PreCommitConfig = {
        ...baseConfig,
        typecheck: { enabled: true, command: 'tsc --noEmit' },
      };

      const script = generatePreCommitScript(config);

      expect(script).toContain('tsc --noEmit');
    });

    it('should include format check section when enabled', () => {
      const config: PreCommitConfig = {
        ...baseConfig,
        formatCheck: { enabled: true, tool: 'prettier' },
      };

      const script = generatePreCommitScript(config);

      expect(script).toContain('# Format check');
      expect(script).toContain('Format check...');
      expect(script).toContain('prettier --check');
    });

    it('should use biome format check for biome tool', () => {
      const config: PreCommitConfig = {
        ...baseConfig,
        formatCheck: { enabled: true, tool: 'biome' },
      };

      const script = generatePreCommitScript(config);

      expect(script).toContain('biome format --check');
    });

    it('should include test section when enabled with mode', () => {
      const config: PreCommitConfig = {
        ...baseConfig,
        tests: { enabled: true, mode: 'affected', coverageThreshold: 0 },
      };

      const script = generatePreCommitScript(config);

      expect(script).toContain('# Tests');
      expect(script).toContain('Running affected tests');
      expect(script).toContain('vitest related --run');
    });

    it('should run all tests when mode is all', () => {
      const config: PreCommitConfig = {
        ...baseConfig,
        tests: { enabled: true, mode: 'all', coverageThreshold: 0 },
      };

      const script = generatePreCommitScript(config);

      expect(script).toContain('Running all tests');
      expect(script).toContain('pnpm test');
    });

    it('should add coverage threshold when specified', () => {
      const config: PreCommitConfig = {
        ...baseConfig,
        tests: { enabled: true, mode: 'all', coverageThreshold: 80 },
      };

      const script = generatePreCommitScript(config);

      expect(script).toContain('--coverage');
      expect(script).toContain('--coverage.thresholds.lines=80');
    });

    it('should not include test section when mode is none', () => {
      const config: PreCommitConfig = {
        ...baseConfig,
        tests: { enabled: true, mode: 'none', coverageThreshold: 0 },
      };

      const script = generatePreCommitScript(config);

      expect(script).not.toContain('# Tests');
    });

    it('should include timing setup when showTiming is true', () => {
      const config: PreCommitConfig = {
        ...baseConfig,
        showTiming: true,
      };

      const script = generatePreCommitScript(config);

      expect(script).toContain('# Timing setup');
      expect(script).toContain('START_TIME=$(date +%s)');
      expect(script).toContain('step_start');
      expect(script).toContain('step_end');
      expect(script).toContain('ELAPSED_TIME');
    });

    it('should use fail fast mode by default', () => {
      const script = generatePreCommitScript(baseConfig);

      expect(script).toContain('# Fail fast mode');
      expect(script).toContain('set -e');
    });

    it('should use error tracking when continueOnFailure is true', () => {
      const config: PreCommitConfig = {
        ...baseConfig,
        continueOnFailure: true,
      };

      const script = generatePreCommitScript(config);

      expect(script).toContain('# Error tracking');
      expect(script).toContain('ERRORS=0');
      expect(script).toContain('track_error');
    });

    it('should handle allowFailure for lint', () => {
      const config: PreCommitConfig = {
        ...baseConfig,
        lint: { enabled: true, stagedOnly: true, allowFailure: true },
      };

      const script = generatePreCommitScript(config);

      expect(script).toContain('Lint warnings (non-blocking)');
    });

    it('should handle allowFailure for typecheck', () => {
      const config: PreCommitConfig = {
        ...baseConfig,
        typecheck: { enabled: true, allowFailure: true },
      };

      const script = generatePreCommitScript(config);

      expect(script).toContain('Type warnings (non-blocking)');
    });

    it('should include custom commands', () => {
      const config: PreCommitConfig = {
        ...baseConfig,
        customCommands: [{ name: 'Security Scan', command: 'pnpm audit', order: 10 }],
      };

      const script = generatePreCommitScript(config);

      expect(script).toContain('# Custom: Security Scan');
      expect(script).toContain('Security Scan...');
      expect(script).toContain('pnpm audit');
    });

    it('should sort custom commands by order', () => {
      const config: PreCommitConfig = {
        ...baseConfig,
        customCommands: [
          { name: 'Second', command: 'echo second', order: 20 },
          { name: 'First', command: 'echo first', order: 10 },
        ],
      };

      const script = generatePreCommitScript(config);

      const firstIndex = script.indexOf('# Custom: First');
      const secondIndex = script.indexOf('# Custom: Second');
      expect(firstIndex).toBeLessThan(secondIndex);
    });

    it('should handle custom command with allowFailure', () => {
      const config: PreCommitConfig = {
        ...baseConfig,
        customCommands: [{ name: 'Optional Check', command: 'echo test', allowFailure: true }],
      };

      const script = generatePreCommitScript(config);

      expect(script).toContain('Optional Check warnings (non-blocking)');
    });

    it('should include footer with success message', () => {
      const script = generatePreCommitScript(baseConfig);

      expect(script).toContain('# Final status');
      expect(script).toContain('All checks passed!');
    });

    it('should include timing in footer when showTiming is true', () => {
      const config: PreCommitConfig = {
        ...baseConfig,
        showTiming: true,
      };

      const script = generatePreCommitScript(config);

      expect(script).toContain('END_TIME=$(date +%s)');
      expect(script).toContain('TOTAL_TIME');
    });

    it('should include error count check in footer when continueOnFailure is true', () => {
      const config: PreCommitConfig = {
        ...baseConfig,
        continueOnFailure: true,
      };

      const script = generatePreCommitScript(config);

      expect(script).toContain('if [ $ERRORS -gt 0 ]');
      expect(script).toContain('Pre-commit failed with $ERRORS error(s)');
    });
  });

  describe('generateSimplePreCommitHook', () => {
    it('should generate simple hook with command', () => {
      const script = generateSimplePreCommitHook('pnpm lint-staged');

      expect(script).toContain('#!/usr/bin/env sh');
      expect(script).toContain('husky.sh');
      expect(script).toContain('pnpm lint-staged');
    });

    it('should not include timing or error tracking', () => {
      const script = generateSimplePreCommitHook('npm test');

      expect(script).not.toContain('ELAPSED_TIME');
      expect(script).not.toContain('ERRORS');
      expect(script).not.toContain('track_error');
    });
  });
});
