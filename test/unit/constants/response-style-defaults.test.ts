/**
 * Tests for response style defaults
 */
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RESPONSE_STYLE,
  RESPONSE_STYLE_PRESETS,
  generateResponseStyleGuidelines,
} from '../../../src/constants/response-style-defaults.js';
import type { ResponseStyleConfig } from '../../../src/types/config.js';

describe('response-style-defaults', () => {
  describe('DEFAULT_RESPONSE_STYLE', () => {
    it('should have all required properties', () => {
      expect(DEFAULT_RESPONSE_STYLE).toHaveProperty('tone');
      expect(DEFAULT_RESPONSE_STYLE).toHaveProperty('verbosity');
      expect(DEFAULT_RESPONSE_STYLE).toHaveProperty('responseLanguage');
      expect(DEFAULT_RESPONSE_STYLE).toHaveProperty('useEmojis');
      expect(DEFAULT_RESPONSE_STYLE).toHaveProperty('errorStyle');
      expect(DEFAULT_RESPONSE_STYLE).toHaveProperty('explainReasoning');
      expect(DEFAULT_RESPONSE_STYLE).toHaveProperty('offerAlternatives');
      expect(DEFAULT_RESPONSE_STYLE).toHaveProperty('proactivity');
      expect(DEFAULT_RESPONSE_STYLE).toHaveProperty('confirmBeforeBigChanges');
    });

    it('should have sensible defaults', () => {
      expect(DEFAULT_RESPONSE_STYLE.tone).toBe('professional');
      expect(DEFAULT_RESPONSE_STYLE.verbosity).toBe('balanced');
      expect(DEFAULT_RESPONSE_STYLE.responseLanguage).toBe('es');
      expect(DEFAULT_RESPONSE_STYLE.useEmojis).toBe(false);
    });
  });

  describe('RESPONSE_STYLE_PRESETS', () => {
    it('should have all presets', () => {
      expect(RESPONSE_STYLE_PRESETS).toHaveProperty('friendly');
      expect(RESPONSE_STYLE_PRESETS).toHaveProperty('professional');
      expect(RESPONSE_STYLE_PRESETS).toHaveProperty('strict');
      expect(RESPONSE_STYLE_PRESETS).toHaveProperty('mentor');
      expect(RESPONSE_STYLE_PRESETS).toHaveProperty('custom');
    });

    it('should have name and description for each preset', () => {
      for (const preset of Object.values(RESPONSE_STYLE_PRESETS)) {
        expect(preset).toHaveProperty('name');
        expect(preset).toHaveProperty('description');
        expect(preset).toHaveProperty('config');
        expect(typeof preset.name).toBe('string');
        expect(typeof preset.description).toBe('string');
      }
    });

    describe('friendly preset', () => {
      it('should have friendly tone', () => {
        expect(RESPONSE_STYLE_PRESETS.friendly.config.tone).toBe('friendly');
      });

      it('should use emojis', () => {
        expect(RESPONSE_STYLE_PRESETS.friendly.config.useEmojis).toBe(true);
      });

      it('should have supportive error style', () => {
        expect(RESPONSE_STYLE_PRESETS.friendly.config.errorStyle).toBe('supportive');
      });
    });

    describe('professional preset', () => {
      it('should use default config', () => {
        expect(RESPONSE_STYLE_PRESETS.professional.config).toBe(DEFAULT_RESPONSE_STYLE);
      });
    });

    describe('strict preset', () => {
      it('should have strict tone', () => {
        expect(RESPONSE_STYLE_PRESETS.strict.config.tone).toBe('strict');
      });

      it('should be concise', () => {
        expect(RESPONSE_STYLE_PRESETS.strict.config.verbosity).toBe('concise');
      });

      it('should not use emojis', () => {
        expect(RESPONSE_STYLE_PRESETS.strict.config.useEmojis).toBe(false);
      });

      it('should have direct error style', () => {
        expect(RESPONSE_STYLE_PRESETS.strict.config.errorStyle).toBe('direct');
      });

      it('should not explain reasoning', () => {
        expect(RESPONSE_STYLE_PRESETS.strict.config.explainReasoning).toBe(false);
      });

      it('should have minimal proactivity', () => {
        expect(RESPONSE_STYLE_PRESETS.strict.config.proactivity).toBe('minimal');
      });
    });

    describe('mentor preset', () => {
      it('should have mentor tone', () => {
        expect(RESPONSE_STYLE_PRESETS.mentor.config.tone).toBe('mentor');
      });

      it('should be detailed', () => {
        expect(RESPONSE_STYLE_PRESETS.mentor.config.verbosity).toBe('detailed');
      });

      it('should explain reasoning', () => {
        expect(RESPONSE_STYLE_PRESETS.mentor.config.explainReasoning).toBe(true);
      });

      it('should have high proactivity', () => {
        expect(RESPONSE_STYLE_PRESETS.mentor.config.proactivity).toBe('high');
      });
    });

    describe('custom preset', () => {
      it('should use default config as base', () => {
        expect(RESPONSE_STYLE_PRESETS.custom.config).toBe(DEFAULT_RESPONSE_STYLE);
      });

      it('should have descriptive name', () => {
        expect(RESPONSE_STYLE_PRESETS.custom.name).toBe('Custom');
        expect(RESPONSE_STYLE_PRESETS.custom.description).toContain('manually');
      });
    });
  });

  describe('generateResponseStyleGuidelines', () => {
    it('should generate header with section title', () => {
      const guidelines = generateResponseStyleGuidelines(DEFAULT_RESPONSE_STYLE);

      expect(guidelines).toContain('## Response Style');
      expect(guidelines).toContain('AUTO-GENERATED');
    });

    it('should include all config values', () => {
      const guidelines = generateResponseStyleGuidelines(DEFAULT_RESPONSE_STYLE);

      expect(guidelines).toContain('**Tone:**');
      expect(guidelines).toContain('**Verbosity:**');
      expect(guidelines).toContain('**Language:**');
      expect(guidelines).toContain('**Emojis:**');
      expect(guidelines).toContain('**Error Style:**');
      expect(guidelines).toContain('**Explain Reasoning:**');
      expect(guidelines).toContain('**Offer Alternatives:**');
      expect(guidelines).toContain('**Proactivity:**');
      expect(guidelines).toContain('**Confirm Big Changes:**');
    });

    it('should capitalize values correctly', () => {
      const guidelines = generateResponseStyleGuidelines(DEFAULT_RESPONSE_STYLE);

      expect(guidelines).toContain('Professional');
      expect(guidelines).toContain('Balanced');
      expect(guidelines).toContain('Neutral');
    });

    it('should format language correctly for Spanish', () => {
      const config: ResponseStyleConfig = {
        ...DEFAULT_RESPONSE_STYLE,
        responseLanguage: 'es',
      };

      const guidelines = generateResponseStyleGuidelines(config);

      expect(guidelines).toContain('Spanish');
      expect(guidelines).toContain('code in English');
    });

    it('should format language correctly for English', () => {
      const config: ResponseStyleConfig = {
        ...DEFAULT_RESPONSE_STYLE,
        responseLanguage: 'en',
      };

      const guidelines = generateResponseStyleGuidelines(config);

      expect(guidelines).toContain('English');
    });

    it('should format language correctly for auto', () => {
      const config: ResponseStyleConfig = {
        ...DEFAULT_RESPONSE_STYLE,
        responseLanguage: 'auto',
      };

      const guidelines = generateResponseStyleGuidelines(config);

      expect(guidelines).toContain('Auto-detect');
    });

    it('should include guidelines section', () => {
      const guidelines = generateResponseStyleGuidelines(DEFAULT_RESPONSE_STYLE);

      expect(guidelines).toContain('### Guidelines');
    });

    it('should include language guideline for Spanish', () => {
      const config: ResponseStyleConfig = {
        ...DEFAULT_RESPONSE_STYLE,
        responseLanguage: 'es',
      };

      const guidelines = generateResponseStyleGuidelines(config);

      expect(guidelines).toContain('Respond in Spanish, write code/comments in English');
    });

    it('should include language guideline for auto', () => {
      const config: ResponseStyleConfig = {
        ...DEFAULT_RESPONSE_STYLE,
        responseLanguage: 'auto',
      };

      const guidelines = generateResponseStyleGuidelines(config);

      expect(guidelines).toContain('Match the language of the user');
    });

    it('should include tone-specific guidelines for friendly', () => {
      const config: ResponseStyleConfig = {
        ...DEFAULT_RESPONSE_STYLE,
        tone: 'friendly',
      };

      const guidelines = generateResponseStyleGuidelines(config);

      expect(guidelines).toContain('warm and approachable');
      expect(guidelines).toContain('casual language');
    });

    it('should include tone-specific guidelines for professional', () => {
      const guidelines = generateResponseStyleGuidelines(DEFAULT_RESPONSE_STYLE);

      expect(guidelines).toContain('professional but accessible');
    });

    it('should include tone-specific guidelines for formal', () => {
      const config: ResponseStyleConfig = {
        ...DEFAULT_RESPONSE_STYLE,
        tone: 'formal',
      };

      const guidelines = generateResponseStyleGuidelines(config);

      expect(guidelines).toContain('formal, technical language');
    });

    it('should include tone-specific guidelines for strict', () => {
      const config: ResponseStyleConfig = {
        ...DEFAULT_RESPONSE_STYLE,
        tone: 'strict',
      };

      const guidelines = generateResponseStyleGuidelines(config);

      expect(guidelines).toContain('direct and to the point');
    });

    it('should include tone-specific guidelines for mentor', () => {
      const config: ResponseStyleConfig = {
        ...DEFAULT_RESPONSE_STYLE,
        tone: 'mentor',
      };

      const guidelines = generateResponseStyleGuidelines(config);

      expect(guidelines).toContain('educational approach');
    });

    it('should include reasoning guideline when enabled', () => {
      const config: ResponseStyleConfig = {
        ...DEFAULT_RESPONSE_STYLE,
        explainReasoning: true,
      };

      const guidelines = generateResponseStyleGuidelines(config);

      expect(guidelines).toContain('Explain the "why" behind decisions');
    });

    it('should not include reasoning guideline when disabled', () => {
      const config: ResponseStyleConfig = {
        ...DEFAULT_RESPONSE_STYLE,
        explainReasoning: false,
      };

      const guidelines = generateResponseStyleGuidelines(config);

      expect(guidelines).not.toContain('Explain the "why" behind decisions');
    });

    it('should include alternatives guideline when enabled', () => {
      const config: ResponseStyleConfig = {
        ...DEFAULT_RESPONSE_STYLE,
        offerAlternatives: true,
      };

      const guidelines = generateResponseStyleGuidelines(config);

      expect(guidelines).toContain('Present alternatives');
    });

    it('should include confirmation guideline when enabled', () => {
      const config: ResponseStyleConfig = {
        ...DEFAULT_RESPONSE_STYLE,
        confirmBeforeBigChanges: true,
      };

      const guidelines = generateResponseStyleGuidelines(config);

      expect(guidelines).toContain('Ask for confirmation');
    });

    it('should include proactivity guideline for minimal', () => {
      const config: ResponseStyleConfig = {
        ...DEFAULT_RESPONSE_STYLE,
        proactivity: 'minimal',
      };

      const guidelines = generateResponseStyleGuidelines(config);

      expect(guidelines).toContain('Only address what was explicitly asked');
    });

    it('should include proactivity guideline for moderate', () => {
      const config: ResponseStyleConfig = {
        ...DEFAULT_RESPONSE_STYLE,
        proactivity: 'moderate',
      };

      const guidelines = generateResponseStyleGuidelines(config);

      expect(guidelines).toContain('Suggest related improvements');
    });

    it('should include proactivity guideline for high', () => {
      const config: ResponseStyleConfig = {
        ...DEFAULT_RESPONSE_STYLE,
        proactivity: 'high',
      };

      const guidelines = generateResponseStyleGuidelines(config);

      expect(guidelines).toContain('Proactively suggest improvements');
    });

    it('should end with END AUTO-GENERATED marker', () => {
      const guidelines = generateResponseStyleGuidelines(DEFAULT_RESPONSE_STYLE);

      expect(guidelines).toContain('END AUTO-GENERATED');
    });
  });
});
