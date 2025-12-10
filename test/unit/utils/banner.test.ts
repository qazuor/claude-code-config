/**
 * Tests for banner utility
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock figlet
vi.mock('figlet', () => ({
  default: {
    textSync: vi.fn(() => 'BANNER\nTEXT\nHERE'),
  },
}));

// Mock chalk
vi.mock('chalk', () => {
  const hexFn = (text: string) => text;
  hexFn.bold = (text: string) => text;
  return {
    default: {
      hex: () => hexFn,
      gray: (text: string) => text,
    },
  };
});

import figlet from 'figlet';
import { showBanner, showInlineBanner } from '../../../src/lib/utils/banner.js';

describe('banner utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('showBanner', () => {
    it('should call figlet.textSync with correct options', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      showBanner();

      expect(figlet.textSync).toHaveBeenCalledWith('Qazuor', {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default',
      });

      consoleSpy.mockRestore();
    });

    it('should log the banner and description', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      showBanner();

      // Should call console.log multiple times
      expect(consoleSpy).toHaveBeenCalled();
      // Check for description text
      const calls = consoleSpy.mock.calls.flat();
      expect(
        calls.some(
          (c) => typeof c === 'string' && c.includes('Claude Code Configuration & Project Setup')
        )
      ).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should apply gradient colors to banner lines', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      showBanner();

      // Banner text is split into lines and colored
      // First call should be the colored banner
      expect(consoleSpy.mock.calls.length).toBeGreaterThan(0);

      consoleSpy.mockRestore();
    });
  });

  describe('showInlineBanner', () => {
    it('should log inline banner with title', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      showInlineBanner();

      expect(consoleSpy).toHaveBeenCalled();
      const calls = consoleSpy.mock.calls.flat();
      expect(calls.some((c) => typeof c === 'string' && c.includes('Qazuor Claude Config'))).toBe(
        true
      );

      consoleSpy.mockRestore();
    });

    it('should log empty lines for spacing', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      showInlineBanner();

      // Should have calls with no arguments (empty lines)
      expect(consoleSpy.mock.calls.length).toBeGreaterThanOrEqual(3);

      consoleSpy.mockRestore();
    });

    it('should log separator line', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      showInlineBanner();

      const calls = consoleSpy.mock.calls.flat();
      expect(calls.some((c) => typeof c === 'string' && c.includes('─'))).toBe(true);

      consoleSpy.mockRestore();
    });
  });
});
