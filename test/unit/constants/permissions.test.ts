/**
 * Tests for permissions constants
 */
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DENY_RULES,
  PERMISSION_PRESETS,
  PRESET_DESCRIPTIONS,
  generateAllowRules,
  generateDenyRules,
  getPresetPermissions,
} from '../../../src/constants/permissions.js';

describe('PERMISSION_PRESETS', () => {
  it('should have all expected presets', () => {
    expect(PERMISSION_PRESETS).toHaveProperty('default');
    expect(PERMISSION_PRESETS).toHaveProperty('trust');
    expect(PERMISSION_PRESETS).toHaveProperty('restrictive');
    expect(PERMISSION_PRESETS).toHaveProperty('custom');
  });

  describe('default preset', () => {
    const preset = PERMISSION_PRESETS.default;

    it('should have file permissions', () => {
      expect(preset.files).toBeDefined();
      expect(preset.files.readAll).toBe(true);
      expect(preset.files.writeCode).toBe(true);
      expect(preset.files.writeConfig).toBe(true);
      expect(preset.files.writeMarkdown).toBe(true);
      expect(preset.files.writeOther).toBe(false);
      expect(preset.files.editTool).toBe(true);
    });

    it('should have conservative git permissions', () => {
      expect(preset.git).toBeDefined();
      expect(preset.git.readOnly).toBe(true);
      expect(preset.git.staging).toBe(false);
      expect(preset.git.commit).toBe(false);
      expect(preset.git.push).toBe(false);
      expect(preset.git.branching).toBe(false);
    });

    it('should have standard bash permissions', () => {
      expect(preset.bash).toBeDefined();
      expect(preset.bash.packageManager).toBe(true);
      expect(preset.bash.testing).toBe(true);
      expect(preset.bash.building).toBe(true);
      expect(preset.bash.docker).toBe(false);
      expect(preset.bash.arbitrary).toBe(false);
    });

    it('should have web permissions enabled', () => {
      expect(preset.web).toBeDefined();
      expect(preset.web.fetch).toBe(true);
      expect(preset.web.search).toBe(true);
    });
  });

  describe('trust preset', () => {
    const preset = PERMISSION_PRESETS.trust;

    it('should allow more file operations', () => {
      expect(preset.files.writeOther).toBe(true);
    });

    it('should allow git operations except push', () => {
      expect(preset.git.staging).toBe(true);
      expect(preset.git.commit).toBe(true);
      expect(preset.git.branching).toBe(true);
      expect(preset.git.push).toBe(false);
    });

    it('should allow docker and arbitrary bash', () => {
      expect(preset.bash.docker).toBe(true);
      expect(preset.bash.arbitrary).toBe(true);
    });
  });

  describe('restrictive preset', () => {
    const preset = PERMISSION_PRESETS.restrictive;

    it('should restrict file writes', () => {
      expect(preset.files.readAll).toBe(true);
      expect(preset.files.writeCode).toBe(false);
      expect(preset.files.writeConfig).toBe(false);
      expect(preset.files.writeMarkdown).toBe(true);
      expect(preset.files.editTool).toBe(false);
    });

    it('should only allow git read', () => {
      expect(preset.git.readOnly).toBe(true);
      expect(preset.git.staging).toBe(false);
      expect(preset.git.commit).toBe(false);
      expect(preset.git.push).toBe(false);
    });

    it('should restrict bash operations', () => {
      expect(preset.bash.packageManager).toBe(false);
      expect(preset.bash.testing).toBe(false);
      expect(preset.bash.building).toBe(false);
      expect(preset.bash.docker).toBe(false);
      expect(preset.bash.arbitrary).toBe(false);
    });
  });
});

describe('DEFAULT_DENY_RULES', () => {
  it('should have deny rules defined', () => {
    expect(Array.isArray(DEFAULT_DENY_RULES)).toBe(true);
    expect(DEFAULT_DENY_RULES.length).toBeGreaterThan(0);
  });

  it('should include dangerous path denials', () => {
    expect(DEFAULT_DENY_RULES.some((r) => r.includes('node_modules'))).toBe(true);
    expect(DEFAULT_DENY_RULES.some((r) => r.includes('.git'))).toBe(true);
    expect(DEFAULT_DENY_RULES.some((r) => r.includes('/etc/'))).toBe(true);
  });

  it('should include dangerous command denials', () => {
    expect(DEFAULT_DENY_RULES.some((r) => r.includes('rm -rf /'))).toBe(true);
    expect(DEFAULT_DENY_RULES.some((r) => r.includes('sudo'))).toBe(true);
  });
});

describe('getPresetPermissions', () => {
  it('should return permissions for default preset', () => {
    const permissions = getPresetPermissions('default');
    expect(permissions.files).toBeDefined();
    expect(permissions.git).toBeDefined();
    expect(permissions.bash).toBeDefined();
    expect(permissions.web).toBeDefined();
  });

  it('should return permissions for trust preset', () => {
    const permissions = getPresetPermissions('trust');
    expect(permissions.bash.arbitrary).toBe(true);
  });

  it('should return permissions for restrictive preset', () => {
    const permissions = getPresetPermissions('restrictive');
    expect(permissions.bash.packageManager).toBe(false);
  });
});

describe('generateAllowRules', () => {
  it('should generate rules for default config', () => {
    const config = {
      preset: 'default' as const,
      files: PERMISSION_PRESETS.default.files,
      git: PERMISSION_PRESETS.default.git,
      bash: PERMISSION_PRESETS.default.bash,
      web: PERMISSION_PRESETS.default.web,
    };

    const rules = generateAllowRules(config);
    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.some((r) => r.includes('Read'))).toBe(true);
    expect(rules.some((r) => r.includes('Write'))).toBe(true);
  });

  it('should not duplicate rules', () => {
    const config = {
      preset: 'default' as const,
      files: PERMISSION_PRESETS.default.files,
      git: PERMISSION_PRESETS.default.git,
      bash: PERMISSION_PRESETS.default.bash,
      web: PERMISSION_PRESETS.default.web,
    };

    const rules = generateAllowRules(config);
    const uniqueRules = [...new Set(rules)];
    expect(rules.length).toBe(uniqueRules.length);
  });
});

describe('generateDenyRules', () => {
  it('should include default deny rules', () => {
    const config = {
      preset: 'default' as const,
      files: PERMISSION_PRESETS.default.files,
      git: PERMISSION_PRESETS.default.git,
      bash: PERMISSION_PRESETS.default.bash,
      web: PERMISSION_PRESETS.default.web,
    };

    const rules = generateDenyRules(config);
    expect(rules.length).toBeGreaterThanOrEqual(DEFAULT_DENY_RULES.length);
  });

  it('should include custom deny rules', () => {
    const config = {
      preset: 'custom' as const,
      files: PERMISSION_PRESETS.default.files,
      git: PERMISSION_PRESETS.default.git,
      bash: PERMISSION_PRESETS.default.bash,
      web: PERMISSION_PRESETS.default.web,
      custom: {
        allow: [],
        deny: ['CustomRule(*)'],
      },
    };

    const rules = generateDenyRules(config);
    expect(rules).toContain('CustomRule(*)');
  });
});

describe('PRESET_DESCRIPTIONS', () => {
  it('should have descriptions for all presets', () => {
    expect(PRESET_DESCRIPTIONS.default).toBeDefined();
    expect(PRESET_DESCRIPTIONS.trust).toBeDefined();
    expect(PRESET_DESCRIPTIONS.restrictive).toBeDefined();
    expect(PRESET_DESCRIPTIONS.custom).toBeDefined();
  });

  it('should have name and description for each preset', () => {
    for (const key of Object.keys(PRESET_DESCRIPTIONS)) {
      const desc = PRESET_DESCRIPTIONS[key as keyof typeof PRESET_DESCRIPTIONS];
      expect(desc.name).toBeDefined();
      expect(desc.description).toBeDefined();
    }
  });
});
