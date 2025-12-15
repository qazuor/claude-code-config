/**
 * Tests for standards defaults
 */
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CODE_STANDARDS,
  DEFAULT_DESIGN_STANDARDS,
  DEFAULT_DOCUMENTATION_STANDARDS,
  DEFAULT_PERFORMANCE_STANDARDS,
  DEFAULT_SECURITY_STANDARDS,
  DEFAULT_STANDARDS_CONFIG,
  DEFAULT_TESTING_STANDARDS,
  STANDARDS_PRESETS,
} from '../../../src/constants/standards-defaults.js';

describe('standards-defaults', () => {
  describe('DEFAULT_CODE_STANDARDS', () => {
    it('should have all required properties', () => {
      expect(DEFAULT_CODE_STANDARDS).toHaveProperty('indentStyle');
      expect(DEFAULT_CODE_STANDARDS).toHaveProperty('indentSize');
      expect(DEFAULT_CODE_STANDARDS).toHaveProperty('maxLineLength');
      expect(DEFAULT_CODE_STANDARDS).toHaveProperty('maxFileLines');
      expect(DEFAULT_CODE_STANDARDS).toHaveProperty('quoteStyle');
      expect(DEFAULT_CODE_STANDARDS).toHaveProperty('semicolons');
      expect(DEFAULT_CODE_STANDARDS).toHaveProperty('trailingCommas');
      expect(DEFAULT_CODE_STANDARDS).toHaveProperty('allowAny');
      expect(DEFAULT_CODE_STANDARDS).toHaveProperty('namedExportsOnly');
      expect(DEFAULT_CODE_STANDARDS).toHaveProperty('roroPattern');
      expect(DEFAULT_CODE_STANDARDS).toHaveProperty('jsDocRequired');
    });

    it('should have sensible defaults', () => {
      expect(DEFAULT_CODE_STANDARDS.indentStyle).toBe('space');
      expect(DEFAULT_CODE_STANDARDS.indentSize).toBe(2);
      expect(DEFAULT_CODE_STANDARDS.maxLineLength).toBe(100);
      expect(DEFAULT_CODE_STANDARDS.allowAny).toBe(false);
    });
  });

  describe('DEFAULT_TESTING_STANDARDS', () => {
    it('should have all required properties', () => {
      expect(DEFAULT_TESTING_STANDARDS).toHaveProperty('coverageTarget');
      expect(DEFAULT_TESTING_STANDARDS).toHaveProperty('tddRequired');
      expect(DEFAULT_TESTING_STANDARDS).toHaveProperty('testPattern');
      expect(DEFAULT_TESTING_STANDARDS).toHaveProperty('testLocation');
      expect(DEFAULT_TESTING_STANDARDS).toHaveProperty('unitTestMaxMs');
      expect(DEFAULT_TESTING_STANDARDS).toHaveProperty('integrationTestMaxMs');
    });

    it('should have sensible defaults', () => {
      expect(DEFAULT_TESTING_STANDARDS.coverageTarget).toBe(80);
      expect(DEFAULT_TESTING_STANDARDS.tddRequired).toBe(true);
      expect(DEFAULT_TESTING_STANDARDS.testPattern).toBe('aaa');
    });
  });

  describe('DEFAULT_DOCUMENTATION_STANDARDS', () => {
    it('should have all required properties', () => {
      expect(DEFAULT_DOCUMENTATION_STANDARDS).toHaveProperty('jsDocLevel');
      expect(DEFAULT_DOCUMENTATION_STANDARDS).toHaveProperty('requireExamples');
      expect(DEFAULT_DOCUMENTATION_STANDARDS).toHaveProperty('changelogFormat');
      expect(DEFAULT_DOCUMENTATION_STANDARDS).toHaveProperty('inlineCommentPolicy');
    });

    it('should have sensible defaults', () => {
      expect(DEFAULT_DOCUMENTATION_STANDARDS.jsDocLevel).toBe('standard');
      expect(DEFAULT_DOCUMENTATION_STANDARDS.changelogFormat).toBe('conventional');
    });
  });

  describe('DEFAULT_DESIGN_STANDARDS', () => {
    it('should have all required properties', () => {
      expect(DEFAULT_DESIGN_STANDARDS).toHaveProperty('cssFramework');
      expect(DEFAULT_DESIGN_STANDARDS).toHaveProperty('componentLibrary');
      expect(DEFAULT_DESIGN_STANDARDS).toHaveProperty('accessibilityLevel');
      expect(DEFAULT_DESIGN_STANDARDS).toHaveProperty('darkModeSupport');
    });

    it('should have sensible defaults', () => {
      expect(DEFAULT_DESIGN_STANDARDS.cssFramework).toBe('tailwind');
      expect(DEFAULT_DESIGN_STANDARDS.accessibilityLevel).toBe('AA');
    });
  });

  describe('DEFAULT_SECURITY_STANDARDS', () => {
    it('should have all required properties', () => {
      expect(DEFAULT_SECURITY_STANDARDS).toHaveProperty('authPattern');
      expect(DEFAULT_SECURITY_STANDARDS).toHaveProperty('inputValidation');
      expect(DEFAULT_SECURITY_STANDARDS).toHaveProperty('csrfProtection');
      expect(DEFAULT_SECURITY_STANDARDS).toHaveProperty('rateLimiting');
    });

    it('should have sensible defaults', () => {
      expect(DEFAULT_SECURITY_STANDARDS.authPattern).toBe('jwt');
      expect(DEFAULT_SECURITY_STANDARDS.inputValidation).toBe('zod');
      expect(DEFAULT_SECURITY_STANDARDS.csrfProtection).toBe(true);
    });
  });

  describe('DEFAULT_PERFORMANCE_STANDARDS', () => {
    it('should have all required properties', () => {
      expect(DEFAULT_PERFORMANCE_STANDARDS).toHaveProperty('lcpTarget');
      expect(DEFAULT_PERFORMANCE_STANDARDS).toHaveProperty('fidTarget');
      expect(DEFAULT_PERFORMANCE_STANDARDS).toHaveProperty('clsTarget');
      expect(DEFAULT_PERFORMANCE_STANDARDS).toHaveProperty('bundleSizeTargetKb');
      expect(DEFAULT_PERFORMANCE_STANDARDS).toHaveProperty('apiResponseTargetMs');
    });

    it('should have sensible Core Web Vitals defaults', () => {
      expect(DEFAULT_PERFORMANCE_STANDARDS.lcpTarget).toBe(2500);
      expect(DEFAULT_PERFORMANCE_STANDARDS.fidTarget).toBe(100);
      expect(DEFAULT_PERFORMANCE_STANDARDS.clsTarget).toBe(0.1);
    });
  });

  describe('DEFAULT_STANDARDS_CONFIG', () => {
    it('should contain all category defaults', () => {
      expect(DEFAULT_STANDARDS_CONFIG.code).toBe(DEFAULT_CODE_STANDARDS);
      expect(DEFAULT_STANDARDS_CONFIG.testing).toBe(DEFAULT_TESTING_STANDARDS);
      expect(DEFAULT_STANDARDS_CONFIG.documentation).toBe(DEFAULT_DOCUMENTATION_STANDARDS);
      expect(DEFAULT_STANDARDS_CONFIG.design).toBe(DEFAULT_DESIGN_STANDARDS);
      expect(DEFAULT_STANDARDS_CONFIG.security).toBe(DEFAULT_SECURITY_STANDARDS);
      expect(DEFAULT_STANDARDS_CONFIG.performance).toBe(DEFAULT_PERFORMANCE_STANDARDS);
    });
  });

  describe('STANDARDS_PRESETS', () => {
    it('should have all presets', () => {
      expect(STANDARDS_PRESETS).toHaveProperty('strict');
      expect(STANDARDS_PRESETS).toHaveProperty('balanced');
      expect(STANDARDS_PRESETS).toHaveProperty('relaxed');
      expect(STANDARDS_PRESETS).toHaveProperty('startup');
      expect(STANDARDS_PRESETS).toHaveProperty('enterprise');
      expect(STANDARDS_PRESETS).toHaveProperty('custom');
    });

    it('should have name and description for each preset', () => {
      for (const preset of Object.values(STANDARDS_PRESETS)) {
        expect(preset).toHaveProperty('name');
        expect(preset).toHaveProperty('description');
        expect(preset).toHaveProperty('config');
        expect(typeof preset.name).toBe('string');
        expect(typeof preset.description).toBe('string');
      }
    });

    describe('strict preset', () => {
      it('should have high coverage target', () => {
        expect(STANDARDS_PRESETS.strict.config.testing.coverageTarget).toBe(90);
      });

      it('should require TDD', () => {
        expect(STANDARDS_PRESETS.strict.config.testing.tddRequired).toBe(true);
      });

      it('should require comprehensive JSDoc', () => {
        expect(STANDARDS_PRESETS.strict.config.documentation.jsDocLevel).toBe('comprehensive');
      });

      it('should have highest accessibility level', () => {
        expect(STANDARDS_PRESETS.strict.config.design.accessibilityLevel).toBe('AAA');
      });
    });

    describe('balanced preset', () => {
      it('should use default config', () => {
        expect(STANDARDS_PRESETS.balanced.config).toBe(DEFAULT_STANDARDS_CONFIG);
      });
    });

    describe('relaxed preset', () => {
      it('should have lower coverage target', () => {
        expect(STANDARDS_PRESETS.relaxed.config.testing.coverageTarget).toBe(70);
      });

      it('should not require TDD', () => {
        expect(STANDARDS_PRESETS.relaxed.config.testing.tddRequired).toBe(false);
      });

      it('should have minimal JSDoc', () => {
        expect(STANDARDS_PRESETS.relaxed.config.documentation.jsDocLevel).toBe('minimal');
      });
    });

    describe('startup preset', () => {
      it('should have lowest coverage target', () => {
        expect(STANDARDS_PRESETS.startup.config.testing.coverageTarget).toBe(60);
      });

      it('should have colocated tests', () => {
        expect(STANDARDS_PRESETS.startup.config.testing.testLocation).toBe('colocated');
      });

      it('should not require dark mode', () => {
        expect(STANDARDS_PRESETS.startup.config.design.darkModeSupport).toBe(false);
      });

      it('should have relaxed security', () => {
        expect(STANDARDS_PRESETS.startup.config.security.csrfProtection).toBe(false);
        expect(STANDARDS_PRESETS.startup.config.security.rateLimiting).toBe(false);
      });
    });

    describe('enterprise preset', () => {
      it('should have highest coverage target', () => {
        expect(STANDARDS_PRESETS.enterprise.config.testing.coverageTarget).toBe(95);
      });

      it('should require examples in docs', () => {
        expect(STANDARDS_PRESETS.enterprise.config.documentation.requireExamples).toBe(true);
      });

      it('should use keepachangelog format', () => {
        expect(STANDARDS_PRESETS.enterprise.config.documentation.changelogFormat).toBe(
          'keepachangelog'
        );
      });

      it('should have strictest performance targets', () => {
        expect(STANDARDS_PRESETS.enterprise.config.performance.lcpTarget).toBe(1500);
        expect(STANDARDS_PRESETS.enterprise.config.performance.fidTarget).toBe(50);
      });

      it('should use OAuth authentication', () => {
        expect(STANDARDS_PRESETS.enterprise.config.security.authPattern).toBe('oauth');
      });
    });

    describe('custom preset', () => {
      it('should use default config as base', () => {
        expect(STANDARDS_PRESETS.custom.config).toBe(DEFAULT_STANDARDS_CONFIG);
      });

      it('should have descriptive name', () => {
        expect(STANDARDS_PRESETS.custom.name).toBe('Custom');
        expect(STANDARDS_PRESETS.custom.description).toContain('manually');
      });
    });
  });
});
