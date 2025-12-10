/**
 * Prompt cancellation utility with ESC key support
 *
 * Provides graceful cancellation handling for CLI prompts using AbortController.
 * - Handles Ctrl+C via ExitPromptError from @inquirer/prompts
 * - Handles ESC key by showing confirmation before cancelling
 * - Wraps all @inquirer/prompts functions to add ESC support
 */

import * as readline from 'node:readline';
import {
  checkbox as inquirerCheckbox,
  confirm as inquirerConfirm,
  input as inquirerInput,
  password as inquirerPassword,
  select as inquirerSelect,
} from '@inquirer/prompts';
import type { Context } from '@inquirer/type';
import chalk from 'chalk';

/**
 * Error thrown when user confirms cancellation via ESC
 */
export class UserCancelledError extends Error {
  constructor(message = 'Operation cancelled by user') {
    super(message);
    this.name = 'UserCancelledError';
  }
}

/**
 * Check if an error is a cancellation error (ESC confirmed, Ctrl+C, or abort)
 */
export function isCancellationError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === 'ExitPromptError' ||
    error.name === 'UserCancelledError' ||
    error.name === 'AbortPromptError'
  );
}

// Global state for ESC handling
let escHandlerActive = false;
let currentAbortController: AbortController | null = null;
let keypressHandler: ((str: string | undefined, key: readline.Key) => void) | null = null;

/**
 * Start listening for ESC key presses
 */
function startEscListener(): void {
  if (escHandlerActive || !process.stdin.isTTY) return;

  // Set up keypress events
  readline.emitKeypressEvents(process.stdin);

  keypressHandler = (_str: string | undefined, key: readline.Key) => {
    if (key.name === 'escape' && currentAbortController) {
      currentAbortController.abort();
    }
  };

  process.stdin.on('keypress', keypressHandler);
  escHandlerActive = true;
}

/**
 * Stop listening for ESC key presses
 */
function stopEscListener(): void {
  if (!escHandlerActive || !keypressHandler) return;

  process.stdin.removeListener('keypress', keypressHandler);
  keypressHandler = null;
  escHandlerActive = false;
}

/**
 * Create an AbortController and start ESC listener
 */
function setupAbortController(): AbortController {
  currentAbortController = new AbortController();
  startEscListener();
  return currentAbortController;
}

/**
 * Clean up after prompt completes
 */
function cleanupAbortController(): void {
  currentAbortController = null;
}

/**
 * Check if error is from abort (ESC press)
 */
function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortPromptError';
}

/**
 * Ask user to confirm cancellation
 * Uses inquirerConfirm directly to avoid recursion
 */
async function confirmCancellation(): Promise<boolean> {
  // Temporarily disable ESC listener for this prompt
  const wasActive = escHandlerActive;
  if (wasActive) {
    stopEscListener();
  }

  console.log(); // New line after aborted prompt

  try {
    const shouldCancel = await inquirerConfirm({
      message: chalk.yellow('Do you want to cancel the installation?'),
      default: false,
    });
    return shouldCancel;
  } catch (error) {
    // If user presses Ctrl+C during confirmation, treat as cancel
    if (isCancellationError(error)) {
      return true;
    }
    throw error;
  } finally {
    // Restore ESC listener if it was active
    if (wasActive) {
      startEscListener();
    }
  }
}

// Type definitions for prompt configs
type InputConfig = Parameters<typeof inquirerInput>[0];
type ConfirmConfig = Parameters<typeof inquirerConfirm>[0];
type SelectConfig<T> = Parameters<typeof inquirerSelect<T>>[0];
type CheckboxConfig<T> = Parameters<typeof inquirerCheckbox<T>>[0];
type PasswordConfig = Parameters<typeof inquirerPassword>[0];

/**
 * Generic wrapper for prompts with ESC confirmation support
 */
async function withEscConfirmation<T, C>(
  promptFn: (config: C, context?: Context) => Promise<T>,
  config: C,
  context?: Context
): Promise<T> {
  while (true) {
    const controller = setupAbortController();

    try {
      const result = await promptFn(config, { ...context, signal: controller.signal });
      cleanupAbortController();
      return result;
    } catch (error) {
      cleanupAbortController();

      // If ESC was pressed (AbortPromptError), ask for confirmation
      if (isAbortError(error)) {
        const shouldCancel = await confirmCancellation();

        if (shouldCancel) {
          throw new UserCancelledError('Cancelled with ESC');
        }

        // User chose not to cancel, show the prompt again
        console.log(chalk.dim('  Continuing...\n'));
        continue;
      }

      // For other errors (including Ctrl+C), propagate them
      throw error;
    }
  }
}

/**
 * Input prompt with ESC confirmation support
 */
export async function input(config: InputConfig, context?: Context): Promise<string> {
  return withEscConfirmation(inquirerInput, config, context);
}

/**
 * Confirm prompt with ESC confirmation support
 */
export async function confirm(config: ConfirmConfig, context?: Context): Promise<boolean> {
  return withEscConfirmation(inquirerConfirm, config, context);
}

/**
 * Select prompt with ESC confirmation support
 */
export async function select<T>(config: SelectConfig<T>, context?: Context): Promise<T> {
  return withEscConfirmation(
    inquirerSelect as (config: SelectConfig<T>, context?: Context) => Promise<T>,
    config,
    context
  );
}

/**
 * Checkbox prompt with ESC confirmation support
 */
export async function checkbox<T>(config: CheckboxConfig<T>, context?: Context): Promise<T[]> {
  return withEscConfirmation(
    inquirerCheckbox as (config: CheckboxConfig<T>, context?: Context) => Promise<T[]>,
    config,
    context
  );
}

/**
 * Password prompt with ESC confirmation support
 */
export async function password(config: PasswordConfig, context?: Context): Promise<string> {
  return withEscConfirmation(inquirerPassword, config, context);
}

/**
 * Set up global handlers for graceful cancellation
 * This catches uncaught ExitPromptError from inquirer prompts
 */
export function setupGracefulCancellation(): void {
  // Handle uncaught ExitPromptError from inquirer (Ctrl+C during prompt)
  process.on('uncaughtException', (error) => {
    if (isCancellationError(error)) {
      stopEscListener();
      console.log(chalk.dim('\n  Cancelled.\n'));
      process.exit(0);
    }
    // Log and exit for other errors
    console.error(chalk.red('Unexpected error:'), error);
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    if (reason instanceof Error && isCancellationError(reason)) {
      stopEscListener();
      console.log(chalk.dim('\n  Cancelled.\n'));
      process.exit(0);
    }
    console.error(chalk.red('Unhandled rejection:'), reason);
    process.exit(1);
  });

  // Handle SIGINT (Ctrl+C outside of prompt)
  process.on('SIGINT', () => {
    stopEscListener();
    console.log(chalk.dim('\n  Interrupted.\n'));
    process.exit(0);
  });

  // Handle SIGTERM
  process.on('SIGTERM', () => {
    stopEscListener();
    console.log(chalk.dim('\n  Terminated.\n'));
    process.exit(0);
  });
}

/**
 * Show a hint about how to cancel
 */
export function showCancelHint(): void {
  console.log(chalk.dim('  Press ESC or Ctrl+C to cancel at any time\n'));
}

/**
 * Clean up resources when done
 */
export function cleanup(): void {
  stopEscListener();
}

/**
 * Print a cancellation message and exit
 */
export function exitWithCancel(message = 'Operation cancelled'): never {
  cleanup();
  console.log(chalk.yellow(`\n  ${message}\n`));
  process.exit(0);
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
        exitWithCancel();
      }
      return null;
    }
    throw error;
  }
}
