/**
 * Spinner utility for progress indication
 */

import ora, { type Ora } from 'ora';
import pc from 'picocolors';

interface SpinnerOptions {
  text?: string;
  color?: 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray';
}

class SpinnerManager {
  private spinner: Ora | null = null;
  private silent = false;

  configure(options: { silent?: boolean }): void {
    if (options.silent !== undefined) this.silent = options.silent;
  }

  /**
   * Start a spinner with a message
   */
  start(text: string, options?: SpinnerOptions): Ora | null {
    if (this.silent) return null;

    // Stop any existing spinner
    this.stop();

    this.spinner = ora({
      text,
      color: options?.color || 'cyan',
      spinner: 'dots',
    }).start();

    return this.spinner;
  }

  /**
   * Update spinner text
   */
  text(text: string): void {
    if (this.spinner) {
      this.spinner.text = text;
    }
  }

  /**
   * Stop spinner with success message
   */
  succeed(text?: string): void {
    if (this.spinner) {
      this.spinner.succeed(text);
      this.spinner = null;
    }
  }

  /**
   * Stop spinner with failure message
   */
  fail(text?: string): void {
    if (this.spinner) {
      this.spinner.fail(text);
      this.spinner = null;
    }
  }

  /**
   * Stop spinner with warning message
   */
  warn(text?: string): void {
    if (this.spinner) {
      this.spinner.warn(text);
      this.spinner = null;
    }
  }

  /**
   * Stop spinner with info message
   */
  info(text?: string): void {
    if (this.spinner) {
      this.spinner.info(text);
      this.spinner = null;
    }
  }

  /**
   * Stop spinner without message
   */
  stop(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  /**
   * Check if spinner is running
   */
  isRunning(): boolean {
    return this.spinner?.isSpinning ?? false;
  }
}

// Export singleton instance
export const spinner = new SpinnerManager();

/**
 * Execute an async operation with a spinner
 */
export async function withSpinner<T>(
  text: string,
  operation: () => Promise<T>,
  options?: {
    successText?: string;
    failText?: string;
    silent?: boolean;
  }
): Promise<T> {
  if (options?.silent) {
    return operation();
  }

  spinner.start(text);

  try {
    const result = await operation();
    spinner.succeed(options?.successText || text);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    spinner.fail(options?.failText || `${text} - ${pc.red(errorMessage)}`);
    throw error;
  }
}

/**
 * Create a progress indicator for multiple steps
 */
export function createProgressTracker(totalSteps: number, options?: { silent?: boolean }) {
  let currentStep = 0;

  return {
    next(stepText: string): void {
      currentStep++;
      if (!options?.silent) {
        spinner.start(`[${currentStep}/${totalSteps}] ${stepText}`);
      }
    },

    complete(text?: string): void {
      if (!options?.silent) {
        spinner.succeed(text || `[${currentStep}/${totalSteps}] Done`);
      }
    },

    fail(text?: string): void {
      if (!options?.silent) {
        spinner.fail(text);
      }
    },

    get current(): number {
      return currentStep;
    },

    get total(): number {
      return totalSteps;
    },
  };
}
