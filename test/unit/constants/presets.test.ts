/**
 * Tests for presets constants
 */
import { describe, expect, it } from 'vitest';
import {
  PRESETS,
  getPreset,
  getPresetNames,
  isModuleInPreset,
} from '../../../src/constants/presets.js';
import type { PresetName } from '../../../src/types/presets.js';

describe('PRESETS', () => {
  it('should have all expected preset keys', () => {
    const expectedPresets: PresetName[] = [
      'fullstack',
      'frontend',
      'backend',
      'minimal',
      'api-only',
      'documentation',
      'quality-focused',
    ];

    expect(Object.keys(PRESETS)).toEqual(expect.arrayContaining(expectedPresets));
    expect(Object.keys(PRESETS).length).toBe(7);
  });

  it('should export getPresetNames function', () => {
    const names = getPresetNames();
    expect(names).toEqual(
      expect.arrayContaining([
        'fullstack',
        'frontend',
        'backend',
        'minimal',
        'api-only',
        'documentation',
        'quality-focused',
      ])
    );
  });

  describe('each preset', () => {
    const presetNames = Object.keys(PRESETS) as PresetName[];

    it.each(presetNames)('preset "%s" should have required properties', (presetName) => {
      const preset = PRESETS[presetName];
      expect(preset).toBeDefined();
      expect(preset.name).toBe(presetName);
      expect(preset.displayName).toBeDefined();
      expect(typeof preset.displayName).toBe('string');
      expect(preset.description).toBeDefined();
      expect(typeof preset.description).toBe('string');
      expect(preset.modules).toBeDefined();
      expect(preset.extras).toBeDefined();
    });

    it.each(presetNames)('preset "%s" should have valid module arrays', (presetName) => {
      const preset = PRESETS[presetName];
      expect(Array.isArray(preset.modules.agents)).toBe(true);
      expect(Array.isArray(preset.modules.skills)).toBe(true);
      expect(Array.isArray(preset.modules.commands)).toBe(true);
      expect(Array.isArray(preset.modules.docs)).toBe(true);
    });

    it.each(presetNames)('preset "%s" should have valid extras object', (presetName) => {
      const preset = PRESETS[presetName];
      expect(typeof preset.extras.schemas).toBe('boolean');
      expect(typeof preset.extras.scripts).toBe('boolean');
      expect(typeof preset.extras.hooks).toBe('boolean');
      expect(typeof preset.extras.sessions).toBe('boolean');
    });
  });

  describe('fullstack preset', () => {
    it('should include core agents', () => {
      const preset = PRESETS.fullstack;
      expect(preset.modules.agents).toContain('core');
      expect(preset.modules.agents).toContain('backend');
      expect(preset.modules.agents).toContain('frontend');
    });

    it('should have all extras enabled', () => {
      const preset = PRESETS.fullstack;
      expect(preset.extras.schemas).toBe(true);
      expect(preset.extras.scripts).toBe(true);
      expect(preset.extras.hooks).toBe(true);
      expect(preset.extras.sessions).toBe(true);
    });
  });

  describe('frontend preset', () => {
    it('should include frontend-specific agents', () => {
      const preset = PRESETS.frontend;
      expect(preset.modules.agents).toContain('frontend');
      expect(preset.modules.agents).toContain('design');
    });

    it('should have hooks and sessions enabled', () => {
      const preset = PRESETS.frontend;
      expect(preset.extras.hooks).toBe(true);
      expect(preset.extras.sessions).toBe(true);
    });
  });

  describe('backend preset', () => {
    it('should include backend-specific agents', () => {
      const preset = PRESETS.backend;
      expect(preset.modules.agents).toContain('backend');
      expect(preset.modules.agents).toContain('product');
    });

    it('should have schemas and scripts enabled', () => {
      const preset = PRESETS.backend;
      expect(preset.extras.schemas).toBe(true);
      expect(preset.extras.scripts).toBe(true);
    });
  });

  describe('minimal preset', () => {
    it('should have minimal agents', () => {
      const preset = PRESETS.minimal;
      expect(preset.modules.agents).toContain('core');
      expect(preset.modules.agents).toContain('quality');
      expect(preset.modules.agents.length).toBe(2);
    });

    it('should have no extras enabled', () => {
      const preset = PRESETS.minimal;
      expect(preset.extras.schemas).toBe(false);
      expect(preset.extras.scripts).toBe(false);
      expect(preset.extras.hooks).toBe(false);
      expect(preset.extras.sessions).toBe(false);
    });
  });

  describe('api-only preset', () => {
    it('should have API-focused agents', () => {
      const preset = PRESETS['api-only'];
      expect(preset.modules.agents).toContain('core');
      expect(preset.modules.agents).toContain('backend');
    });

    it('should have schemas enabled but not scripts', () => {
      const preset = PRESETS['api-only'];
      expect(preset.extras.schemas).toBe(true);
      expect(preset.extras.scripts).toBe(false);
    });
  });

  describe('documentation preset', () => {
    it('should include specialized agents', () => {
      const preset = PRESETS.documentation;
      expect(preset.modules.agents).toContain('core');
      expect(preset.modules.agents).toContain('specialized');
    });

    it('should have sessions enabled', () => {
      const preset = PRESETS.documentation;
      expect(preset.extras.sessions).toBe(true);
    });
  });

  describe('quality-focused preset', () => {
    it('should include quality agents', () => {
      const preset = PRESETS['quality-focused'];
      expect(preset.modules.agents).toContain('core');
      expect(preset.modules.agents).toContain('quality');
    });

    it('should have quality-focused skills', () => {
      const preset = PRESETS['quality-focused'];
      expect(preset.modules.skills).toContain('testing');
      expect(preset.modules.skills).toContain('audit');
      expect(preset.modules.skills).toContain('qa');
    });
  });
});

describe('getPreset', () => {
  it('should return preset by name', () => {
    const preset = getPreset('fullstack');
    expect(preset.name).toBe('fullstack');
    expect(preset.displayName).toBe('Full Stack');
  });

  it('should return correct preset for all names', () => {
    const names = getPresetNames();
    for (const name of names) {
      const preset = getPreset(name);
      expect(preset).toBeDefined();
      expect(preset.name).toBe(name);
    }
  });
});

describe('isModuleInPreset', () => {
  it('should return true for modules in preset', () => {
    expect(isModuleInPreset('fullstack', 'agents', 'core')).toBe(true);
    expect(isModuleInPreset('fullstack', 'agents', 'backend')).toBe(true);
  });

  it('should return false for modules not in preset', () => {
    expect(isModuleInPreset('minimal', 'agents', 'backend')).toBe(false);
    expect(isModuleInPreset('minimal', 'agents', 'frontend')).toBe(false);
  });
});
