/**
 * Tests for prompt cancellation utilities
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock @inquirer/prompts before importing
vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
  confirm: vi.fn(),
  select: vi.fn(),
  checkbox: vi.fn(),
  password: vi.fn(),
}));

// Mock readline
vi.mock('node:readline', () => ({
  emitKeypressEvents: vi.fn(),
}));

// Mock chalk to avoid color issues in tests
vi.mock('chalk', () => ({
  default: {
    dim: (str: string) => str,
    yellow: (str: string) => str,
    red: (str: string) => str,
  },
}));

import {
  checkbox as inquirerCheckbox,
  confirm as inquirerConfirm,
  input as inquirerInput,
  password as inquirerPassword,
  select as inquirerSelect,
} from '@inquirer/prompts';

import {
  UserCancelledError,
  checkbox,
  cleanup,
  confirm,
  exitWithCancel,
  input,
  isCancellationError,
  password,
  select,
  setupGracefulCancellation,
  showCancelHint,
  withCancellation,
} from '../../../src/lib/utils/prompt-cancel.js';

describe('prompt-cancel utilities', () => {
  const originalIsTTY = process.stdin.isTTY;
  let stdinOnSpy: ReturnType<typeof vi.spyOn>;
  let stdinRemoveListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock stdin as TTY to enable ESC listener
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    // Mock stdin.on and removeListener
    stdinOnSpy = vi.spyOn(process.stdin, 'on').mockReturnValue(process.stdin);
    stdinRemoveListenerSpy = vi
      .spyOn(process.stdin, 'removeListener')
      .mockReturnValue(process.stdin);
  });

  afterEach(() => {
    cleanup();
    // Restore original isTTY
    Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true });
    stdinOnSpy?.mockRestore();
    stdinRemoveListenerSpy?.mockRestore();
  });

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

    it('should return true for AbortPromptError', () => {
      const error = new Error('Aborted');
      error.name = 'AbortPromptError';
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

    it('should call exitWithCancel when exitOnCancel is true (default)', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(
        withCancellation(async () => {
          throw new UserCancelledError();
        })
      ).rejects.toThrow('process.exit called');

      expect(exitSpy).toHaveBeenCalledWith(0);

      consoleSpy.mockRestore();
      exitSpy.mockRestore();
    });

    it('should work without options', async () => {
      const result = await withCancellation(async () => 'value');
      expect(result).toBe('value');
    });
  });

  describe('prompt wrappers', () => {
    describe('input', () => {
      it('should call inquirer input and return result', async () => {
        vi.mocked(inquirerInput).mockResolvedValueOnce('test-value');

        const result = await input({ message: 'Enter value:' });

        expect(inquirerInput).toHaveBeenCalledWith(
          { message: 'Enter value:' },
          expect.objectContaining({ signal: expect.any(AbortSignal) })
        );
        expect(result).toBe('test-value');
      });

      it('should show confirmation on ESC and continue if user says no', async () => {
        const abortError = new Error('Aborted');
        abortError.name = 'AbortPromptError';

        // First call aborts (ESC), second returns value (after continue)
        vi.mocked(inquirerInput)
          .mockRejectedValueOnce(abortError)
          .mockResolvedValueOnce('final-value');

        // Confirmation prompt - user says no (don't cancel)
        vi.mocked(inquirerConfirm).mockResolvedValueOnce(false);

        const result = await input({ message: 'Enter value:' });

        expect(inquirerConfirm).toHaveBeenCalledWith(
          expect.objectContaining({ message: expect.stringContaining('cancel') })
        );
        expect(result).toBe('final-value');
      });

      it('should throw UserCancelledError when user confirms cancellation', async () => {
        const abortError = new Error('Aborted');
        abortError.name = 'AbortPromptError';

        vi.mocked(inquirerInput).mockRejectedValueOnce(abortError);
        vi.mocked(inquirerConfirm).mockResolvedValueOnce(true); // User confirms cancel

        await expect(input({ message: 'Enter value:' })).rejects.toThrow(UserCancelledError);
      });

      it('should rethrow non-abort errors', async () => {
        const regularError = new Error('Network error');

        vi.mocked(inquirerInput).mockRejectedValueOnce(regularError);

        await expect(input({ message: 'Enter value:' })).rejects.toThrow('Network error');
      });
    });

    describe('confirm', () => {
      it('should call inquirer confirm and return result', async () => {
        vi.mocked(inquirerConfirm).mockResolvedValueOnce(true);

        const result = await confirm({ message: 'Continue?' });

        expect(inquirerConfirm).toHaveBeenCalledWith(
          { message: 'Continue?' },
          expect.objectContaining({ signal: expect.any(AbortSignal) })
        );
        expect(result).toBe(true);
      });

      it('should return false when user declines', async () => {
        vi.mocked(inquirerConfirm).mockResolvedValueOnce(false);

        const result = await confirm({ message: 'Continue?' });

        expect(result).toBe(false);
      });

      it('should handle ESC with confirmation flow', async () => {
        const abortError = new Error('Aborted');
        abortError.name = 'AbortPromptError';

        vi.mocked(inquirerConfirm)
          .mockRejectedValueOnce(abortError) // First confirm call aborts
          .mockResolvedValueOnce(false) // Cancellation confirmation - user says no
          .mockResolvedValueOnce(true); // Retry - user says yes

        const result = await confirm({ message: 'Continue?' });

        expect(result).toBe(true);
      });
    });

    describe('select', () => {
      it('should call inquirer select and return result', async () => {
        vi.mocked(inquirerSelect).mockResolvedValueOnce('option1');

        const result = await select({
          message: 'Choose:',
          choices: [
            { name: 'Option 1', value: 'option1' },
            { name: 'Option 2', value: 'option2' },
          ],
        });

        expect(inquirerSelect).toHaveBeenCalled();
        expect(result).toBe('option1');
      });

      it('should handle typed return values', async () => {
        type MyOption = 'a' | 'b' | 'c';
        vi.mocked(inquirerSelect).mockResolvedValueOnce('b');

        const result = await select<MyOption>({
          message: 'Choose:',
          choices: [
            { name: 'A', value: 'a' as MyOption },
            { name: 'B', value: 'b' as MyOption },
            { name: 'C', value: 'c' as MyOption },
          ],
        });

        expect(result).toBe('b');
      });
    });

    describe('checkbox', () => {
      it('should call inquirer checkbox and return array', async () => {
        vi.mocked(inquirerCheckbox).mockResolvedValueOnce(['opt1', 'opt3']);

        const result = await checkbox({
          message: 'Select multiple:',
          choices: [
            { name: 'Option 1', value: 'opt1' },
            { name: 'Option 2', value: 'opt2' },
            { name: 'Option 3', value: 'opt3' },
          ],
        });

        expect(inquirerCheckbox).toHaveBeenCalled();
        expect(result).toEqual(['opt1', 'opt3']);
      });

      it('should return empty array when nothing selected', async () => {
        vi.mocked(inquirerCheckbox).mockResolvedValueOnce([]);

        const result = await checkbox({
          message: 'Select:',
          choices: [{ name: 'Option', value: 'opt' }],
        });

        expect(result).toEqual([]);
      });
    });

    describe('password', () => {
      it('should call inquirer password and return value', async () => {
        vi.mocked(inquirerPassword).mockResolvedValueOnce('secret123');

        const result = await password({ message: 'Enter password:' });

        expect(inquirerPassword).toHaveBeenCalledWith(
          { message: 'Enter password:' },
          expect.objectContaining({ signal: expect.any(AbortSignal) })
        );
        expect(result).toBe('secret123');
      });

      it('should handle ESC during password entry', async () => {
        const abortError = new Error('Aborted');
        abortError.name = 'AbortPromptError';

        vi.mocked(inquirerPassword)
          .mockRejectedValueOnce(abortError)
          .mockResolvedValueOnce('secret');
        vi.mocked(inquirerConfirm).mockResolvedValueOnce(false); // Don't cancel

        const result = await password({ message: 'Enter password:' });

        expect(result).toBe('secret');
      });
    });
  });

  describe('ESC confirmation flow', () => {
    it('should treat Ctrl+C during confirmation as cancel', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortPromptError';

      const ctrlCError = new Error('Ctrl+C');
      ctrlCError.name = 'ExitPromptError';

      vi.mocked(inquirerInput).mockRejectedValueOnce(abortError);
      vi.mocked(inquirerConfirm).mockRejectedValueOnce(ctrlCError); // Ctrl+C during confirmation

      await expect(input({ message: 'Enter:' })).rejects.toThrow(UserCancelledError);
    });

    it('should rethrow non-cancellation errors from confirmation prompt', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortPromptError';

      const networkError = new Error('Network failure');

      vi.mocked(inquirerInput).mockRejectedValueOnce(abortError);
      vi.mocked(inquirerConfirm).mockRejectedValueOnce(networkError);

      await expect(input({ message: 'Enter:' })).rejects.toThrow('Network failure');
    });

    it('should allow multiple ESC presses with continue', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortPromptError';

      vi.mocked(inquirerInput)
        .mockRejectedValueOnce(abortError) // First ESC
        .mockRejectedValueOnce(abortError) // Second ESC
        .mockResolvedValueOnce('done'); // Finally enter value

      vi.mocked(inquirerConfirm)
        .mockResolvedValueOnce(false) // First: don't cancel
        .mockResolvedValueOnce(false); // Second: don't cancel

      const result = await input({ message: 'Enter:' });

      expect(inquirerConfirm).toHaveBeenCalledTimes(2);
      expect(result).toBe('done');
    });
  });

  describe('utility functions', () => {
    describe('showCancelHint', () => {
      it('should log cancel hint to console', () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        showCancelHint();

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ESC'));
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Ctrl+C'));

        consoleSpy.mockRestore();
      });
    });

    describe('cleanup', () => {
      it('should not throw when called multiple times', () => {
        expect(() => {
          cleanup();
          cleanup();
          cleanup();
        }).not.toThrow();
      });
    });

    describe('exitWithCancel', () => {
      it('should log message and exit', () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit called');
        });

        expect(() => exitWithCancel()).toThrow('process.exit called');
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('cancelled'));
        expect(exitSpy).toHaveBeenCalledWith(0);

        consoleSpy.mockRestore();
        exitSpy.mockRestore();
      });

      it('should accept custom message', () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit called');
        });

        expect(() => exitWithCancel('Custom exit message')).toThrow('process.exit called');
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Custom exit message'));

        consoleSpy.mockRestore();
        exitSpy.mockRestore();
      });
    });

    describe('setupGracefulCancellation', () => {
      it('should register process event handlers', () => {
        const onSpy = vi.spyOn(process, 'on');

        setupGracefulCancellation();

        expect(onSpy).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
        expect(onSpy).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
        expect(onSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
        expect(onSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));

        onSpy.mockRestore();
      });

      it('should handle uncaughtException with cancellation error', () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit called');
        });

        let exceptionHandler: ((error: Error) => void) | undefined;
        const onSpy = vi.spyOn(process, 'on').mockImplementation((event, handler) => {
          if (event === 'uncaughtException') {
            exceptionHandler = handler as (error: Error) => void;
          }
          return process;
        });

        setupGracefulCancellation();

        const cancelError = new UserCancelledError();
        expect(() => exceptionHandler?.(cancelError)).toThrow('process.exit called');
        expect(exitSpy).toHaveBeenCalledWith(0);

        consoleSpy.mockRestore();
        exitSpy.mockRestore();
        onSpy.mockRestore();
      });

      it('should handle uncaughtException with regular error', () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit called');
        });

        let exceptionHandler: ((error: Error) => void) | undefined;
        const onSpy = vi.spyOn(process, 'on').mockImplementation((event, handler) => {
          if (event === 'uncaughtException') {
            exceptionHandler = handler as (error: Error) => void;
          }
          return process;
        });

        setupGracefulCancellation();

        const regularError = new Error('Some error');
        expect(() => exceptionHandler?.(regularError)).toThrow('process.exit called');
        expect(exitSpy).toHaveBeenCalledWith(1);

        consoleErrorSpy.mockRestore();
        exitSpy.mockRestore();
        onSpy.mockRestore();
      });

      it('should handle unhandledRejection with cancellation error', () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit called');
        });

        let rejectionHandler: ((reason: unknown) => void) | undefined;
        const onSpy = vi.spyOn(process, 'on').mockImplementation((event, handler) => {
          if (event === 'unhandledRejection') {
            rejectionHandler = handler as (reason: unknown) => void;
          }
          return process;
        });

        setupGracefulCancellation();

        const cancelError = new UserCancelledError();
        expect(() => rejectionHandler?.(cancelError)).toThrow('process.exit called');
        expect(exitSpy).toHaveBeenCalledWith(0);

        consoleSpy.mockRestore();
        exitSpy.mockRestore();
        onSpy.mockRestore();
      });

      it('should handle unhandledRejection with regular error', () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit called');
        });

        let rejectionHandler: ((reason: unknown) => void) | undefined;
        const onSpy = vi.spyOn(process, 'on').mockImplementation((event, handler) => {
          if (event === 'unhandledRejection') {
            rejectionHandler = handler as (reason: unknown) => void;
          }
          return process;
        });

        setupGracefulCancellation();

        const regularError = new Error('Some error');
        expect(() => rejectionHandler?.(regularError)).toThrow('process.exit called');
        expect(exitSpy).toHaveBeenCalledWith(1);

        consoleErrorSpy.mockRestore();
        exitSpy.mockRestore();
        onSpy.mockRestore();
      });

      it('should handle SIGINT', () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit called');
        });

        let sigintHandler: (() => void) | undefined;
        const onSpy = vi.spyOn(process, 'on').mockImplementation((event, handler) => {
          if (event === 'SIGINT') {
            sigintHandler = handler as () => void;
          }
          return process;
        });

        setupGracefulCancellation();

        expect(() => sigintHandler?.()).toThrow('process.exit called');
        expect(exitSpy).toHaveBeenCalledWith(0);
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Interrupted'));

        consoleSpy.mockRestore();
        exitSpy.mockRestore();
        onSpy.mockRestore();
      });

      it('should handle SIGTERM', () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
          throw new Error('process.exit called');
        });

        let sigtermHandler: (() => void) | undefined;
        const onSpy = vi.spyOn(process, 'on').mockImplementation((event, handler) => {
          if (event === 'SIGTERM') {
            sigtermHandler = handler as () => void;
          }
          return process;
        });

        setupGracefulCancellation();

        expect(() => sigtermHandler?.()).toThrow('process.exit called');
        expect(exitSpy).toHaveBeenCalledWith(0);
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Terminated'));

        consoleSpy.mockRestore();
        exitSpy.mockRestore();
        onSpy.mockRestore();
      });
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete prompt flow with multiple inputs', async () => {
      vi.mocked(inquirerInput).mockResolvedValueOnce('John');
      vi.mocked(inquirerConfirm).mockResolvedValueOnce(true);
      vi.mocked(inquirerSelect).mockResolvedValueOnce('admin');

      const name = await input({ message: 'Name:' });
      const confirmed = await confirm({ message: 'Confirm?' });
      const role = await select({
        message: 'Role:',
        choices: [
          { name: 'Admin', value: 'admin' },
          { name: 'User', value: 'user' },
        ],
      });

      expect(name).toBe('John');
      expect(confirmed).toBe(true);
      expect(role).toBe('admin');
    });

    it('should handle ESC in middle of multi-prompt flow', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortPromptError';

      vi.mocked(inquirerInput).mockResolvedValueOnce('John');
      // ESC on confirm, then continue
      vi.mocked(inquirerConfirm)
        .mockRejectedValueOnce(abortError)
        .mockResolvedValueOnce(false) // Don't cancel
        .mockResolvedValueOnce(true); // Actual confirm answer

      const name = await input({ message: 'Name:' });
      const confirmed = await confirm({ message: 'Confirm?' });

      expect(name).toBe('John');
      expect(confirmed).toBe(true);
    });
  });
});
