/**
 * Tests for prompt cancellation utilities
 */

import { describe, expect, it, vi } from 'vitest';
import {
  UserCancelledError,
  isCancellationError,
  withCancellation,
} from '../../../src/lib/utils/prompt-cancel.js';

describe('prompt-cancel utilities', () => {
  describe('UserCancelledError', () => {
    it('should be an instance of Error', () => {
      const error = new UserCancelledError();
      expect(error).toBeInstanceOf(Error);
    });

    it('should have correct name', () => {
      const error = new UserCancelledError();
      expect(error.name).toBe('UserCancelledError');
    });

    it('should have default message', () => {
      const error = new UserCancelledError();
      expect(error.message).toBe('Operation cancelled by user');
    });

    it('should accept custom message', () => {
      const error = new UserCancelledError('Custom cancel message');
      expect(error.message).toBe('Custom cancel message');
    });
  });

  describe('isCancellationError', () => {
    it('should return true for UserCancelledError', () => {
      const error = new UserCancelledError();
      expect(isCancellationError(error)).toBe(true);
    });

    it('should return true for ExitPromptError', () => {
      const error = new Error('User cancelled');
      error.name = 'ExitPromptError';
      expect(isCancellationError(error)).toBe(true);
    });

    it('should return false for regular Error', () => {
      const error = new Error('Some error');
      expect(isCancellationError(error)).toBe(false);
    });

    it('should return false for non-Error values', () => {
      expect(isCancellationError('string')).toBe(false);
      expect(isCancellationError(123)).toBe(false);
      expect(isCancellationError(null)).toBe(false);
      expect(isCancellationError(undefined)).toBe(false);
      expect(isCancellationError({})).toBe(false);
    });

    it('should return false for TypeError', () => {
      const error = new TypeError('Type error');
      expect(isCancellationError(error)).toBe(false);
    });
  });

  describe('withCancellation', () => {
    it('should return the result of successful async function', async () => {
      const result = await withCancellation(async () => 'success', { exitOnCancel: false });
      expect(result).toBe('success');
    });

    it('should return the result of successful promise', async () => {
      const result = await withCancellation(() => Promise.resolve(42), { exitOnCancel: false });
      expect(result).toBe(42);
    });

    it('should return null on UserCancelledError when exitOnCancel is false', async () => {
      const result = await withCancellation(
        async () => {
          throw new UserCancelledError();
        },
        { exitOnCancel: false }
      );
      expect(result).toBeNull();
    });

    it('should return null on ExitPromptError when exitOnCancel is false', async () => {
      const error = new Error('Cancelled');
      error.name = 'ExitPromptError';

      const result = await withCancellation(
        async () => {
          throw error;
        },
        { exitOnCancel: false }
      );
      expect(result).toBeNull();
    });

    it('should call onCancel callback on cancellation', async () => {
      const onCancel = vi.fn();

      await withCancellation(
        async () => {
          throw new UserCancelledError();
        },
        { exitOnCancel: false, onCancel }
      );

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should rethrow non-cancellation errors', async () => {
      const error = new Error('Regular error');

      await expect(
        withCancellation(
          async () => {
            throw error;
          },
          { exitOnCancel: false }
        )
      ).rejects.toThrow('Regular error');
    });

    it('should not call onCancel for non-cancellation errors', async () => {
      const onCancel = vi.fn();

      try {
        await withCancellation(
          async () => {
            throw new Error('Regular error');
          },
          { exitOnCancel: false, onCancel }
        );
      } catch {
        // Expected
      }

      expect(onCancel).not.toHaveBeenCalled();
    });
  });
});
