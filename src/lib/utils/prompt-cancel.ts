/**
 * Prompt cancellation utility with ESC key support
 *
 * Provides graceful cancellation handling for CLI prompts.
 * - Handles Ctrl+C via ExitPromptError from @inquirer/prompts
 * - Handles ESC key globally during interactive prompts
 * - Provides utilities for wrapping async operations
 */

import readline from 'node:readline';
import { confirm } from '@inquirer/prompts';
import chalk from 'chalk';

/**
 * Error thrown when user cancels the operation
 */
export class UserCancelledError extends Error {
  constructor(message = 'Operation cancelled by user') {
    super(message);
    this.name = 'UserCancelledError';
  }
}

/**
 * Check if an error is a cancellation error
 */
export function isCancellationError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name === 'ExitPromptError' || error.name === 'UserCancelledError';
}

// Global state
let escListenerActive = false;
let cancelConfirmationPending = false;

/**
 * Enable ESC key listener for cancellation
 * Call this before starting interactive prompts
 */
export function enableEscListener(): void {
  if (escListenerActive || !process.stdin.isTTY) return;

  // Enable raw mode and keypress events
  readline.emitKeypressEvents(process.stdin);

  const keypressHandler = async (
    _str: string | undefined,
    key: { name: string; ctrl: boolean; sequence: string }
  ) => {
    // Check for ESC key (escape sequence is '\x1B' or key.name is 'escape')
    if (key.name === 'escape' && !cancelConfirmationPending) {
      cancelConfirmationPending = true;

      // Show cancel confirmation
      console.log(chalk.yellow('\n\n  ESC pressed'));

      try {
        const shouldCancel = await confirm({
          message: 'Cancel and exit?',
          default: false,
        });

        if (shouldCancel) {
          console.log(chalk.dim('\n  Operation cancelled.\n'));
          process.exit(0);
        }
        console.log(chalk.dim('  Continuing...\n'));
      } catch {
        // Error during confirmation (e.g., Ctrl+C) - exit
        console.log(chalk.dim('\n  Cancelled.\n'));
        process.exit(0);
      } finally {
        cancelConfirmationPending = false;
      }
    }
  };

  process.stdin.on('keypress', keypressHandler);
  escListenerActive = true;
}

/**
 * Disable ESC key listener
 */
export function disableEscListener(): void {
  if (!escListenerActive) return;
  process.stdin.removeAllListeners('keypress');
  escListenerActive = false;
}

/**
 * Wrap an async function to handle cancellation gracefully
 */
export async function withCancellation<T>(
  fn: () => Promise<T>,
  options?: {
    onCancel?: () => void;
    exitOnCancel?: boolean;
  }
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    if (isCancellationError(error)) {
      options?.onCancel?.();
      if (options?.exitOnCancel !== false) {
        console.log(chalk.dim('\n  Cancelled.\n'));
        process.exit(0);
      }
      return null;
    }
    throw error;
  }
}

/**
 * Set up global handlers for graceful cancellation
 * This catches uncaught ExitPromptError from inquirer prompts
 */
export function setupGracefulCancellation(): void {
  // Handle uncaught ExitPromptError from inquirer (Ctrl+C during prompt)
  process.on('uncaughtException', (error) => {
    if (error instanceof Error && error.name === 'ExitPromptError') {
      console.log(chalk.dim('\n  Cancelled.\n'));
      process.exit(0);
    }
    // Log and exit for other errors
    console.error(chalk.red('Unexpected error:'), error);
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    if (reason instanceof Error && reason.name === 'ExitPromptError') {
      console.log(chalk.dim('\n  Cancelled.\n'));
      process.exit(0);
    }
    console.error(chalk.red('Unhandled rejection:'), reason);
    process.exit(1);
  });

  // Handle SIGINT (Ctrl+C outside of prompt)
  process.on('SIGINT', () => {
    console.log(chalk.dim('\n  Interrupted.\n'));
    process.exit(0);
  });

  // Handle SIGTERM
  process.on('SIGTERM', () => {
    console.log(chalk.dim('\n  Terminated.\n'));
    process.exit(0);
  });
}

/**
 * Print a cancellation message and exit
 */
export function exitWithCancel(message = 'Operation cancelled'): never {
  console.log(chalk.yellow(`\n  ${message}\n`));
  process.exit(0);
}

/**
 * Show a hint about how to cancel
 */
export function showCancelHint(): void {
  console.log(chalk.dim('  Press ESC or Ctrl+C to cancel at any time\n'));
}
