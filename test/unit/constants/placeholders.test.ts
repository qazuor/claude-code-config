/**
 * Tests for placeholders constants
 */
import { describe, it, expect } from 'vitest';
import {
  PLACEHOLDERS,
  applyTransform,
  getPlaceholder,
  getRequiredPlaceholders,
  getOptionalPlaceholders,
} from '../../../src/constants/placeholders.js';

describe('PLACEHOLDERS', () => {
  it('should have at least 5 placeholders defined', () => {
    expect(PLACEHOLDERS.length).toBeGreaterThanOrEqual(5);
  });

  it('each placeholder should have required properties', () => {
    for (const placeholder of PLACEHOLDERS) {
      expect(placeholder.description).toBeDefined();
      expect(typeof placeholder.description).toBe('string');

      expect(placeholder.pattern).toBeDefined();
      expect(
        typeof placeholder.pattern === 'string' || placeholder.pattern instanceof RegExp
      ).toBe(true);

      expect(placeholder.configKey).toBeDefined();
      expect(typeof placeholder.configKey).toBe('string');

      expect(typeof placeholder.required).toBe('boolean');

      expect(placeholder.transform).toBeDefined();
    }
  });

  describe('known placeholders', () => {
    it('should include project name placeholder', () => {
      const projectName = PLACEHOLDERS.find((p) => p.configKey === 'name');
      expect(projectName).toBeDefined();
      expect(projectName!.required).toBe(true);
    });

    it('should include organization placeholder', () => {
      const org = PLACEHOLDERS.find((p) => p.configKey === 'org');
      expect(org).toBeDefined();
    });

    it('should include repository placeholder', () => {
      const repo = PLACEHOLDERS.find((p) => p.configKey === 'repo');
      expect(repo).toBeDefined();
    });

    it('should include domain placeholder', () => {
      const domain = PLACEHOLDERS.find((p) => p.configKey === 'domain');
      expect(domain).toBeDefined();
    });

    it('should include entity type placeholders', () => {
      const entity = PLACEHOLDERS.find((p) => p.configKey === 'entityType');
      const entityPlural = PLACEHOLDERS.find((p) => p.configKey === 'entityTypePlural');
      expect(entity).toBeDefined();
      expect(entityPlural).toBeDefined();
    });
  });
});

describe('getRequiredPlaceholders', () => {
  it('should return only required placeholders', () => {
    const required = getRequiredPlaceholders();
    expect(required.length).toBeGreaterThan(0);
    expect(required.every((p) => p.required === true)).toBe(true);
  });
});

describe('getOptionalPlaceholders', () => {
  it('should return only optional placeholders', () => {
    const optional = getOptionalPlaceholders();
    expect(optional.every((p) => p.required === false)).toBe(true);
  });
});

describe('getPlaceholder', () => {
  it('should find placeholder by pattern source', () => {
    const placeholder = getPlaceholder('your-org');
    expect(placeholder).toBeDefined();
    expect(placeholder!.configKey).toBe('org');
  });
});

describe('applyTransform', () => {
  it('should return value unchanged with none transform', () => {
    expect(applyTransform('Test Value', 'none')).toBe('Test Value');
  });

  it('should apply lowercase transform with dashes', () => {
    expect(applyTransform('TEST VALUE', 'lowercase')).toBe('test-value');
    expect(applyTransform('MixedCase', 'lowercase')).toBe('mixedcase');
  });

  it('should apply uppercase transform with underscores', () => {
    expect(applyTransform('test value', 'uppercase')).toBe('TEST_VALUE');
    expect(applyTransform('MixedCase', 'uppercase')).toBe('MIXEDCASE');
  });

  it('should apply capitalize transform', () => {
    expect(applyTransform('test value', 'capitalize')).toBe('Test Value');
    expect(applyTransform('hello', 'capitalize')).toBe('Hello');
    expect(applyTransform('', 'capitalize')).toBe('');
  });

  it('should apply pluralize transform', () => {
    expect(applyTransform('city', 'pluralize')).toBe('cities');
    expect(applyTransform('box', 'pluralize')).toBe('boxes');
    expect(applyTransform('dish', 'pluralize')).toBe('dishes');
    expect(applyTransform('product', 'pluralize')).toBe('products');
  });

  it('should handle empty strings', () => {
    expect(applyTransform('', 'lowercase')).toBe('');
    expect(applyTransform('', 'uppercase')).toBe('');
    expect(applyTransform('', 'none')).toBe('');
  });
});
