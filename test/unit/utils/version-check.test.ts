/**
 * Tests for version-check utility
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mocking
const { checkForUpdates } = await import('../../../src/lib/utils/version-check.js');

describe('version-check utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkForUpdates', () => {
    it('should not display notification when current version equals latest', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ version: '1.0.0' }),
      });

      await checkForUpdates('1.0.0');

      expect(console.log).not.toHaveBeenCalled();
    });

    it('should not display notification when current version is newer', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ version: '1.0.0' }),
      });

      await checkForUpdates('2.0.0');

      expect(console.log).not.toHaveBeenCalled();
    });

    it('should display notification when newer version is available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ version: '2.0.0' }),
      });

      await checkForUpdates('1.0.0');

      expect(console.log).toHaveBeenCalled();
    });

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Should not throw
      await expect(checkForUpdates('1.0.0')).resolves.not.toThrow();
      expect(console.log).not.toHaveBeenCalled();
    });

    it('should handle non-ok responses gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await checkForUpdates('1.0.0');

      expect(console.log).not.toHaveBeenCalled();
    });

    it('should handle missing version in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await checkForUpdates('1.0.0');

      expect(console.log).not.toHaveBeenCalled();
    });

    it('should compare versions correctly with different lengths', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ version: '1.0.0' }),
      });

      await checkForUpdates('1.0');

      // 1.0 is equal to 1.0.0
      expect(console.log).not.toHaveBeenCalled();
    });

    it('should handle patch version updates', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ version: '1.0.1' }),
      });

      await checkForUpdates('1.0.0');

      expect(console.log).toHaveBeenCalled();
    });

    it('should handle minor version updates', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ version: '1.1.0' }),
      });

      await checkForUpdates('1.0.0');

      expect(console.log).toHaveBeenCalled();
    });

    it('should handle major version updates', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ version: '2.0.0' }),
      });

      await checkForUpdates('1.9.9');

      expect(console.log).toHaveBeenCalled();
    });
  });
});
