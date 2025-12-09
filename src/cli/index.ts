import { Command } from 'commander';

import {
  createAddCommand,
  createInitCommand,
  createListCommand,
  createRemoveCommand,
  createStatusCommand,
  createUpdateCommand,
} from './commands/index.js';

const VERSION = '0.1.0';

export const program = new Command()
  .name('claude-config')
  .description('CLI tool to install and manage Claude Code configurations')
  .version(VERSION);

// Register all commands
program.addCommand(createInitCommand());
program.addCommand(createListCommand());
program.addCommand(createAddCommand());
program.addCommand(createRemoveCommand());
program.addCommand(createStatusCommand());
program.addCommand(createUpdateCommand());

export { VERSION };
