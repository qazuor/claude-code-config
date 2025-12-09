#!/usr/bin/env node
/**
 * CLI entry point for @qazuor/claude-code-config
 */

import { program } from './cli/index.js';

program.parse(process.argv);
