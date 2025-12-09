/**
 * Tests for spinner utility
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgressTracker, spinner, withSpinner } from '../../../src/lib/utils/spinner.js';

// Mock ora
vi.mock('ora', () => {
  const mockSpinner = {
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    warn: vi.fn().mockReturnThis(),
    info: vi.fn().mockReturnThis(),
    isSpinning: false,
    text: '',
  };
  return {
    default: vi.fn(() => mockSpinner),
  };
});

describe('spinner', () => {
  beforeEach(() => {
    spinner.configure({ silent: false });
    spinner.stop();
    vi.clearAllMocks();
  });

  afterEach(() => {
    spinner.stop();
  });

  describe('configure', () => {
    it('should configure silent mode', () => {
      spinner.configure({ silent: true });
      const result = spinner.start('test');
      expect(result).toBeNull();
    });
  });

  describe('start', () => {
    it('should start spinner with text', () => {
      const result = spinner.start('Loading...');
      expect(result).not.toBeNull();
    });

    it('should start spinner with options', () => {
      const result = spinner.start('Loading...', { color: 'green' });
      expect(result).not.toBeNull();
    });

    it('should return null when silent', () => {
      spinner.configure({ silent: true });
      const result = spinner.start('Loading...');
      expect(result).toBeNull();
    });

    it('should stop existing spinner before starting new one', () => {
      spinner.start('First');
      spinner.start('Second');
      // No error means success
    });
  });

  describe('text', () => {
    it('should update spinner text', () => {
      spinner.start('Initial');
      spinner.text('Updated');
      // Should not throw
    });

    it('should do nothing when no spinner', () => {
      spinner.text('No spinner');
      // Should not throw
    });
  });

  describe('succeed', () => {
    it('should stop with success', () => {
      spinner.start('Test');
      spinner.succeed('Done');
      expect(spinner.isRunning()).toBe(false);
    });

    it('should do nothing when no spinner', () => {
      spinner.succeed('No spinner');
      // Should not throw
    });
  });

  describe('fail', () => {
    it('should stop with failure', () => {
      spinner.start('Test');
      spinner.fail('Error');
      expect(spinner.isRunning()).toBe(false);
    });

    it('should do nothing when no spinner', () => {
      spinner.fail('No spinner');
      // Should not throw
    });
  });

  describe('warn', () => {
    it('should stop with warning', () => {
      spinner.start('Test');
      spinner.warn('Warning');
      expect(spinner.isRunning()).toBe(false);
    });

    it('should do nothing when no spinner', () => {
      spinner.warn('No spinner');
      // Should not throw
    });
  });

  describe('info', () => {
    it('should stop with info', () => {
      spinner.start('Test');
      spinner.info('Info');
      expect(spinner.isRunning()).toBe(false);
    });

    it('should do nothing when no spinner', () => {
      spinner.info('No spinner');
      // Should not throw
    });
  });

  describe('stop', () => {
    it('should stop spinner', () => {
      spinner.start('Test');
      spinner.stop();
      expect(spinner.isRunning()).toBe(false);
    });

    it('should do nothing when no spinner', () => {
      spinner.stop();
      // Should not throw
    });
  });

  describe('isRunning', () => {
    it('should return false when no spinner', () => {
      expect(spinner.isRunning()).toBe(false);
    });
  });
});

describe('withSpinner', () => {
  beforeEach(() => {
    spinner.configure({ silent: false });
    vi.clearAllMocks();
  });

  it('should execute operation with spinner', async () => {
    const result = await withSpinner('Loading', async () => 'result');
    expect(result).toBe('result');
  });

  it('should succeed on successful operation', async () => {
    const result = await withSpinner('Loading', async () => 42, {
      successText: 'Done!',
    });
    expect(result).toBe(42);
  });

  it('should fail and rethrow on error', async () => {
    await expect(
      withSpinner('Loading', async () => {
        throw new Error('Test error');
      })
    ).rejects.toThrow('Test error');
  });

  it('should handle non-Error throws', async () => {
    await expect(
      withSpinner('Loading', async () => {
        throw 'string error';
      })
    ).rejects.toBe('string error');
  });

  it('should skip spinner when silent', async () => {
    const result = await withSpinner('Loading', async () => 'result', {
      silent: true,
    });
    expect(result).toBe('result');
  });
});

describe('createProgressTracker', () => {
  beforeEach(() => {
    spinner.configure({ silent: false });
    vi.clearAllMocks();
  });

  it('should create tracker with total steps', () => {
    const tracker = createProgressTracker(5);
    expect(tracker.total).toBe(5);
    expect(tracker.current).toBe(0);
  });

  it('should track progress through steps', () => {
    const tracker = createProgressTracker(3);

    tracker.next('Step 1');
    expect(tracker.current).toBe(1);

    tracker.next('Step 2');
    expect(tracker.current).toBe(2);

    tracker.next('Step 3');
    expect(tracker.current).toBe(3);
  });

  it('should complete with message', () => {
    const tracker = createProgressTracker(2);
    tracker.next('Step 1');
    tracker.complete('All done');
    // Should not throw
  });

  it('should complete without message', () => {
    const tracker = createProgressTracker(2);
    tracker.next('Step 1');
    tracker.complete();
    // Should not throw
  });

  it('should fail with message', () => {
    const tracker = createProgressTracker(2);
    tracker.next('Step 1');
    tracker.fail('Something went wrong');
    // Should not throw
  });

  it('should work in silent mode', () => {
    const tracker = createProgressTracker(3, { silent: true });

    tracker.next('Step 1');
    expect(tracker.current).toBe(1);

    tracker.complete('Done');
    // Should not throw
  });

  it('should work when failing in silent mode', () => {
    const tracker = createProgressTracker(3, { silent: true });
    tracker.next('Step 1');
    tracker.fail('Error');
    // Should not throw
  });
});
