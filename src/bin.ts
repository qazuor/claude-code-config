#!/usr/bin/env node
/**
 * CLI entry point for @qazuor/claude-code-config
 */

import { program } from './cli/index.js';
import { showBanner } from './lib/utils/banner.js';
import { setupGracefulCancellation } from './lib/utils/prompt-cancel.js';

// Set up graceful cancellation handlers
setupGracefulCancellation();

// Show banner on startup (only for init command or no args)
const args = process.argv.slice(2);
const showBannerCommands = ['init', 'help', '--help', '-h', ''];
const shouldShowBanner = args.length === 0 || showBannerCommands.includes(args[0] || '');

if (shouldShowBanner) {
  showBanner();
}

program.parse(process.argv);
