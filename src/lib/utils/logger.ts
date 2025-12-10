/**
 * Logger utility with colored output
 */

import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'success' | 'warn' | 'error';

interface LoggerOptions {
  verbose?: boolean;
  silent?: boolean;
}

const SYMBOLS = {
  info: chalk.blue('ℹ'),
  success: chalk.green('✔'),
  warn: chalk.yellow('⚠'),
  error: chalk.red('✖'),
  debug: chalk.gray('●'),
  arrow: chalk.cyan('→'),
  bullet: chalk.dim('•'),
};

class Logger {
  private verbose = false;
  private silent = false;

  configure(options: LoggerOptions): void {
    if (options.verbose !== undefined) this.verbose = options.verbose;
    if (options.silent !== undefined) this.silent = options.silent;
  }

  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (this.silent && level !== 'error') return;
    if (level === 'debug' && !this.verbose) return;

    const prefix = SYMBOLS[level];
    const formattedMessage = args.length > 0 ? `${message} ${args.join(' ')}` : message;

    switch (level) {
      case 'error':
        console.error(`${prefix} ${chalk.red(formattedMessage)}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${chalk.yellow(formattedMessage)}`);
        break;
      case 'success':
        console.log(`${prefix} ${chalk.green(formattedMessage)}`);
        break;
      case 'debug':
        console.log(`${prefix} ${chalk.gray(formattedMessage)}`);
        break;
      default:
        console.log(`${prefix} ${formattedMessage}`);
    }
  }

  debug(message: string, ...args: unknown[]): void {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.log('info', message, ...args);
  }

  success(message: string, ...args: unknown[]): void {
    this.log('success', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.log('error', message, ...args);
  }

  /**
   * Print a blank line
   */
  newline(): void {
    if (!this.silent) console.log();
  }

  /**
   * Print a title/header
   */
  title(text: string): void {
    if (this.silent) return;
    console.log();
    console.log(chalk.bold(chalk.cyan(text)));
    console.log(chalk.dim('─'.repeat(Math.min(text.length + 4, 60))));
  }

  /**
   * Print a subtitle
   */
  subtitle(text: string): void {
    if (this.silent) return;
    console.log();
    console.log(chalk.bold(text));
  }

  /**
   * Print a step in a process
   */
  step(stepNumber: number, totalSteps: number, message: string): void {
    if (this.silent) return;
    const progress = chalk.dim(`[${stepNumber}/${totalSteps}]`);
    console.log(`${progress} ${message}`);
  }

  /**
   * Print a list item
   */
  item(text: string, indent = 0): void {
    if (this.silent) return;
    const spaces = '  '.repeat(indent);
    console.log(`${spaces}${SYMBOLS.bullet} ${text}`);
  }

  /**
   * Print a key-value pair
   */
  keyValue(key: string, value: string, indent = 0): void {
    if (this.silent) return;
    const spaces = '  '.repeat(indent);
    console.log(`${spaces}${chalk.dim(`${key}:`)} ${value}`);
  }

  /**
   * Print an arrow item (for showing changes/actions)
   */
  arrow(text: string, indent = 0): void {
    if (this.silent) return;
    const spaces = '  '.repeat(indent);
    console.log(`${spaces}${SYMBOLS.arrow} ${text}`);
  }

  /**
   * Print a boxed message
   */
  box(title: string, content: string[]): void {
    if (this.silent) return;
    const maxLength = Math.max(title.length, ...content.map((line) => line.length));
    const width = Math.min(maxLength + 4, 70);
    const border = '─'.repeat(width - 2);

    console.log();
    console.log(chalk.cyan(`┌${border}┐`));
    console.log(chalk.cyan('│') + chalk.bold(` ${title.padEnd(width - 3)}`) + chalk.cyan('│'));
    console.log(chalk.cyan(`├${border}┤`));
    for (const line of content) {
      console.log(`${chalk.cyan('│')} ${line.padEnd(width - 3)}${chalk.cyan('│')}`);
    }
    console.log(chalk.cyan(`└${border}┘`));
    console.log();
  }

  /**
   * Print a table
   */
  table(headers: string[], rows: string[][]): void {
    if (this.silent) return;

    // Calculate column widths
    const colWidths = headers.map((h, i) => {
      const maxRowWidth = Math.max(...rows.map((r) => (r[i] || '').length));
      return Math.max(h.length, maxRowWidth);
    });

    // Print header
    const headerRow = headers.map((h, i) => chalk.bold(h.padEnd(colWidths[i]))).join('  ');
    console.log(headerRow);
    console.log(chalk.dim(colWidths.map((w) => '─'.repeat(w)).join('  ')));

    // Print rows
    for (const row of rows) {
      const rowStr = row.map((cell, i) => (cell || '').padEnd(colWidths[i])).join('  ');
      console.log(rowStr);
    }
  }

  /**
   * Print a colored status
   */
  status(label: string, status: 'success' | 'error' | 'warn' | 'pending' | 'skip'): void {
    if (this.silent) return;
    const statusColors = {
      success: chalk.green('✔ done'),
      error: chalk.red('✖ failed'),
      warn: chalk.yellow('⚠ warning'),
      pending: chalk.blue('◯ pending'),
      skip: chalk.dim('○ skipped'),
    };
    console.log(`  ${label}: ${statusColors[status]}`);
  }

  /**
   * Print instructions
   */
  instructions(title: string, steps: string[]): void {
    if (this.silent) return;
    console.log();
    console.log(chalk.bold(chalk.cyan(title)));
    console.log();
    steps.forEach((step, index) => {
      console.log(`  ${chalk.dim(`${index + 1}.`)} ${step}`);
    });
    console.log();
  }

  /**
   * Print a dimmed note
   */
  note(text: string): void {
    if (this.silent) return;
    console.log(chalk.dim(`   ${text}`));
  }

  /**
   * Print raw text without formatting
   */
  raw(text: string): void {
    if (this.silent) return;
    console.log(text);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export color utilities for direct use
export const colors = {
  primary: chalk.cyan,
  secondary: chalk.blue,
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  muted: chalk.dim,
  bold: chalk.bold,
  underline: chalk.underline,
};
