/**
 * Code style configuration installer
 */

import path from 'node:path';
import fse from 'fs-extra';
import type { CodeStyleConfig } from '../../types/config.js';
import { logger } from '../utils/logger.js';
import { getTemplatesPath } from '../utils/paths.js';
import { spinner } from '../utils/spinner.js';

interface InstallResult {
  installed: string[];
  skipped: string[];
  errors: string[];
}

const CODE_STYLE_FILES: Record<string, string> = {
  editorconfig: '.editorconfig',
  commitlint: 'commitlint.config.js',
  biome: 'biome.json',
  prettier: '.prettierrc',
};

const PRETTIER_IGNORE = '.prettierignore';

/**
 * Install code style configuration files
 */
export async function installCodeStyle(
  targetPath: string,
  config: CodeStyleConfig,
  options?: { overwrite?: boolean }
): Promise<InstallResult> {
  const result: InstallResult = {
    installed: [],
    skipped: [],
    errors: [],
  };

  if (!config.enabled) {
    return result;
  }

  const templatesPath = getTemplatesPath();
  const codeStylePath = path.join(templatesPath, 'code-style');

  spinner.start('Installing code style configurations...');

  // Install each enabled tool's config
  const toolsToInstall: Array<[string, string]> = [];
  if (config.editorconfig) toolsToInstall.push(['editorconfig', CODE_STYLE_FILES.editorconfig]);
  if (config.commitlint) toolsToInstall.push(['commitlint', CODE_STYLE_FILES.commitlint]);
  if (config.biome) toolsToInstall.push(['biome', CODE_STYLE_FILES.biome]);
  if (config.prettier) toolsToInstall.push(['prettier', CODE_STYLE_FILES.prettier]);

  for (const [tool, filename] of toolsToInstall) {
    try {
      const sourcePath = path.join(codeStylePath, filename);
      const destPath = path.join(targetPath, filename);

      // Check if file already exists
      if (await fse.pathExists(destPath)) {
        if (!options?.overwrite) {
          result.skipped.push(filename);
          continue;
        }
      }

      // Copy the file
      await fse.copy(sourcePath, destPath);
      result.installed.push(filename);

      // If prettier, also install .prettierignore
      if (tool === 'prettier') {
        const ignoreSource = path.join(codeStylePath, PRETTIER_IGNORE);
        const ignoreDest = path.join(targetPath, PRETTIER_IGNORE);

        if (!(await fse.pathExists(ignoreDest)) || options?.overwrite) {
          await fse.copy(ignoreSource, ignoreDest);
          result.installed.push(PRETTIER_IGNORE);
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      result.errors.push(`${tool}: ${errorMsg}`);
    }
  }

  if (result.errors.length > 0) {
    spinner.fail('Code style installation completed with errors');
  } else if (result.installed.length > 0) {
    spinner.succeed(`Installed ${result.installed.length} code style config(s)`);
  } else {
    spinner.stop();
    logger.info('No code style configs to install (all skipped)');
  }

  return result;
}

/**
 * Get dependencies needed for the code style tools
 */
export function getCodeStyleDependencies(config: CodeStyleConfig): {
  devDependencies: string[];
  instructions: string[];
} {
  const devDependencies: string[] = [];
  const instructions: string[] = [];

  if (config.commitlint) {
    devDependencies.push('@commitlint/cli', '@commitlint/config-conventional');
    instructions.push(
      'For commitlint with git hooks, install Husky:',
      '  pnpm add -D husky',
      '  npx husky init',
      '  echo "npx --no -- commitlint --edit \\${1}" > .husky/commit-msg'
    );
  }

  if (config.biome) {
    devDependencies.push('@biomejs/biome');
    instructions.push(
      'Add Biome scripts to package.json:',
      '  "lint": "biome check .",',
      '  "lint:fix": "biome check --write .",',
      '  "format": "biome format --write ."'
    );
  }

  if (config.prettier) {
    devDependencies.push('prettier');
    instructions.push(
      'Add Prettier scripts to package.json:',
      '  "format": "prettier --write .",',
      '  "format:check": "prettier --check ."'
    );
  }

  return { devDependencies, instructions };
}

/**
 * Show installation instructions for code style tools
 */
export function showCodeStyleInstructions(config: CodeStyleConfig): void {
  if (!config.enabled) return;

  const { devDependencies, instructions } = getCodeStyleDependencies(config);

  if (devDependencies.length > 0) {
    logger.newline();
    logger.subtitle('Code Style Dependencies');
    logger.info('Install the following dev dependencies:');
    logger.newline();
    logger.raw(`  pnpm add -D ${devDependencies.join(' ')}`);
    logger.newline();

    if (instructions.length > 0) {
      logger.subtitle('Additional Setup');
      for (const instruction of instructions) {
        logger.raw(`  ${instruction}`);
      }
    }
  }
}
