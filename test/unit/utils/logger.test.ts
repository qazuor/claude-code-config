/**
 * Tests for logger utility
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { colors, logger } from '../../../src/lib/utils/logger.js';

describe('logger', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Reset logger to default state
    logger.configure({ verbose: false, silent: false });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('basic methods', () => {
    it('should have info method', () => {
      expect(typeof logger.info).toBe('function');
      logger.info('test message');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should have success method', () => {
      expect(typeof logger.success).toBe('function');
      logger.success('success message');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should have warn method', () => {
      expect(typeof logger.warn).toBe('function');
      logger.warn('warning message');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should have error method', () => {
      expect(typeof logger.error).toBe('function');
      logger.error('error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should have debug method', () => {
      expect(typeof logger.debug).toBe('function');
      // Debug requires verbose mode
      logger.configure({ verbose: true });
      logger.debug('debug message');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('formatting methods', () => {
    it('should have title method', () => {
      expect(typeof logger.title).toBe('function');
      logger.title('Test Title');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should have subtitle method', () => {
      expect(typeof logger.subtitle).toBe('function');
      logger.subtitle('Test Subtitle');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should have newline method', () => {
      expect(typeof logger.newline).toBe('function');
      logger.newline();
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should have item method', () => {
      expect(typeof logger.item).toBe('function');
      logger.item('list item');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should have keyValue method', () => {
      expect(typeof logger.keyValue).toBe('function');
      logger.keyValue('key', 'value');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should have note method', () => {
      expect(typeof logger.note).toBe('function');
      logger.note('note message');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should have arrow method', () => {
      expect(typeof logger.arrow).toBe('function');
      logger.arrow('arrow message');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should have step method', () => {
      expect(typeof logger.step).toBe('function');
      logger.step(1, 5, 'Step message');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should have raw method', () => {
      expect(typeof logger.raw).toBe('function');
      logger.raw('raw output');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('box method', () => {
    it('should render box with content', () => {
      logger.box('Box Title', ['Line 1', 'Line 2']);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle empty content', () => {
      logger.box('Empty Box', []);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('table method', () => {
    it('should render a table', () => {
      logger.table(
        ['Col1', 'Col2'],
        [
          ['a', 'b'],
          ['c', 'd'],
        ]
      );
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('status method', () => {
    it('should render status', () => {
      logger.status('Test', 'success');
      logger.status('Test', 'error');
      logger.status('Test', 'warn');
      logger.status('Test', 'pending');
      logger.status('Test', 'skip');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('instructions method', () => {
    it('should render instructions', () => {
      logger.instructions('Title', ['Step 1', 'Step 2']);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('configure method', () => {
    it('should configure verbose mode', () => {
      logger.configure({ verbose: true });
      logger.debug('debug message');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should configure silent mode', () => {
      logger.configure({ silent: true });
      logger.info('silent message');
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should still log errors when silent', () => {
      logger.configure({ silent: true });
      logger.error('error in silent mode');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});

describe('colors', () => {
  it('should export color functions', () => {
    expect(typeof colors.primary).toBe('function');
    expect(typeof colors.secondary).toBe('function');
    expect(typeof colors.success).toBe('function');
    expect(typeof colors.warning).toBe('function');
    expect(typeof colors.error).toBe('function');
    expect(typeof colors.muted).toBe('function');
    expect(typeof colors.bold).toBe('function');
    expect(typeof colors.underline).toBe('function');
  });

  it('should return string when formatting', () => {
    expect(typeof colors.primary('text')).toBe('string');
    expect(typeof colors.success('text')).toBe('string');
    expect(typeof colors.bold('text')).toBe('string');
  });

  it('should handle empty strings', () => {
    expect(typeof colors.primary('')).toBe('string');
  });
});
