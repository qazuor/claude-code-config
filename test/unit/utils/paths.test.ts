/**
 * Tests for paths utility
 */

import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getPackageRoot, getTemplatesPath } from '../../../src/lib/utils/paths.js';

describe('paths utility', () => {
  describe('getPackageRoot', () => {
    it('should return a valid path', () => {
      const root = getPackageRoot();
      expect(root).toBeTruthy();
      expect(typeof root).toBe('string');
    });

    it('should return an absolute path', () => {
      const root = getPackageRoot();
      expect(path.isAbsolute(root)).toBe(true);
    });

    it('should return consistent path on multiple calls', () => {
      const root1 = getPackageRoot();
      const root2 = getPackageRoot();
      expect(root1).toBe(root2);
    });
  });

  describe('getTemplatesPath', () => {
    it('should return a valid path', () => {
      const templatesPath = getTemplatesPath();
      expect(templatesPath).toBeTruthy();
      expect(typeof templatesPath).toBe('string');
    });

    it('should return an absolute path', () => {
      const templatesPath = getTemplatesPath();
      expect(path.isAbsolute(templatesPath)).toBe(true);
    });

    it('should end with templates directory', () => {
      const templatesPath = getTemplatesPath();
      expect(templatesPath.endsWith('templates')).toBe(true);
    });

    it('should be a child of package root', () => {
      const root = getPackageRoot();
      const templatesPath = getTemplatesPath();
      expect(templatesPath.startsWith(root)).toBe(true);
    });

    it('should return consistent path on multiple calls', () => {
      const path1 = getTemplatesPath();
      const path2 = getTemplatesPath();
      expect(path1).toBe(path2);
    });
  });
});
