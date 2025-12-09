/**
 * Tests for dependencies constants
 */
import { describe, expect, it } from 'vitest';
import { DEPENDENCIES, getDependenciesForFeature } from '../../../src/constants/dependencies.js';

describe('DEPENDENCIES', () => {
  it('should have at least 3 dependencies defined', () => {
    expect(DEPENDENCIES.length).toBeGreaterThanOrEqual(3);
  });

  it('each dependency should have required properties', () => {
    for (const dep of DEPENDENCIES) {
      expect(dep.id).toBeDefined();
      expect(typeof dep.id).toBe('string');

      expect(dep.name).toBeDefined();
      expect(typeof dep.name).toBe('string');

      expect(dep.description).toBeDefined();
      expect(typeof dep.description).toBe('string');

      expect(dep.requiredFor).toBeDefined();
      expect(Array.isArray(dep.requiredFor)).toBe(true);
      expect(dep.requiredFor.length).toBeGreaterThan(0);

      expect(dep.checkCommand).toBeDefined();
      expect(typeof dep.checkCommand).toBe('string');

      expect(dep.platforms).toBeDefined();
    }
  });

  it('should have unique IDs', () => {
    const ids = DEPENDENCIES.map((d) => d.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  describe('platform instructions', () => {
    it('should have at least one platform for each dependency', () => {
      for (const dep of DEPENDENCIES) {
        const platforms = Object.keys(dep.platforms);
        expect(platforms.length).toBeGreaterThan(0);
      }
    });

    it('platform instructions should have commands', () => {
      for (const dep of DEPENDENCIES) {
        for (const platform of Object.values(dep.platforms)) {
          if (platform) {
            expect(platform.commands).toBeDefined();
            expect(Array.isArray(platform.commands)).toBe(true);
            expect(platform.commands.length).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  describe('known dependencies', () => {
    it('should include jq', () => {
      const jq = DEPENDENCIES.find((d) => d.id === 'jq');
      expect(jq).toBeDefined();
      expect(jq!.name).toBe('jq');
      expect(jq!.requiredFor).toContain('hooks');
    });

    it('should include notify-send', () => {
      const notifySend = DEPENDENCIES.find((d) => d.id === 'notify-send');
      expect(notifySend).toBeDefined();
      expect(notifySend!.platforms.linux).toBeDefined();
    });
  });
});

describe('getDependenciesForFeature', () => {
  it('should return dependencies for hooks feature', () => {
    const hooksDeps = getDependenciesForFeature('hooks');
    expect(hooksDeps.length).toBeGreaterThan(0);
  });

  it('should return empty array for unknown feature', () => {
    const unknownDeps = getDependenciesForFeature('unknown-feature');
    expect(unknownDeps).toEqual([]);
  });

  it('should return all dependencies that match the feature', () => {
    const hooksDeps = getDependenciesForFeature('hooks');
    for (const dep of hooksDeps) {
      expect(dep.requiredFor).toContain('hooks');
    }
  });
});
