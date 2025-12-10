/**
 * Code style configuration installer
 */

import path from 'node:path';
import fse from 'fs-extra';
import {
  DEFAULT_BIOME_OPTIONS,
  DEFAULT_COMMITLINT_OPTIONS,
  DEFAULT_EDITORCONFIG_OPTIONS,
  DEFAULT_PRETTIER_OPTIONS,
} from '../../constants/code-style-defaults.js';
import type { CodeStyleConfig } from '../../types/config.js';
import { logger } from '../utils/logger.js';
import { spinner } from '../utils/spinner.js';
import {
  generateBiomeConfig,
  generateCommitlintConfig,
  generateEditorConfig,
  generatePrettierConfig,
  generatePrettierIgnore,
} from './generator.js';

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
 * Generates files based on user options, or copies templates as fallback
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

  spinner.start('Installing code style configurations...');

  // Install EditorConfig
  if (config.editorconfig) {
    const filename = CODE_STYLE_FILES.editorconfig;
    const destPath = path.join(targetPath, filename);

    try {
      if ((await fse.pathExists(destPath)) && !options?.overwrite) {
        result.skipped.push(filename);
      } else {
        const editorconfigOptions = config.editorconfigOptions ?? DEFAULT_EDITORCONFIG_OPTIONS;
        const content = generateEditorConfig(editorconfigOptions);
        await fse.writeFile(destPath, content, 'utf-8');
        result.installed.push(filename);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      result.errors.push(`editorconfig: ${errorMsg}`);
    }
  }

  // Install Biome
  if (config.biome) {
    const filename = CODE_STYLE_FILES.biome;
    const destPath = path.join(targetPath, filename);

    try {
      if ((await fse.pathExists(destPath)) && !options?.overwrite) {
        result.skipped.push(filename);
      } else {
        const biomeOptions = config.biomeOptions ?? DEFAULT_BIOME_OPTIONS;
        const content = generateBiomeConfig(biomeOptions);
        await fse.writeFile(destPath, content, 'utf-8');
        result.installed.push(filename);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      result.errors.push(`biome: ${errorMsg}`);
    }
  }

  // Install Prettier
  if (config.prettier) {
    const filename = CODE_STYLE_FILES.prettier;
    const destPath = path.join(targetPath, filename);

    try {
      if ((await fse.pathExists(destPath)) && !options?.overwrite) {
        result.skipped.push(filename);
      } else {
        const prettierOptions = config.prettierOptions ?? DEFAULT_PRETTIER_OPTIONS;
        const content = generatePrettierConfig(prettierOptions);
        await fse.writeFile(destPath, content, 'utf-8');
        result.installed.push(filename);
      }

      // Also install .prettierignore
      const ignoreDest = path.join(targetPath, PRETTIER_IGNORE);
      if (!(await fse.pathExists(ignoreDest)) || options?.overwrite) {
        const ignoreContent = generatePrettierIgnore();
        await fse.writeFile(ignoreDest, ignoreContent, 'utf-8');
        result.installed.push(PRETTIER_IGNORE);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      result.errors.push(`prettier: ${errorMsg}`);
    }
  }

  // Install Commitlint
  if (config.commitlint) {
    const filename = CODE_STYLE_FILES.commitlint;
    const destPath = path.join(targetPath, filename);

    try {
      if ((await fse.pathExists(destPath)) && !options?.overwrite) {
        result.skipped.push(filename);
      } else {
        const commitlintOptions = config.commitlintOptions ?? DEFAULT_COMMITLINT_OPTIONS;
        const content = generateCommitlintConfig(commitlintOptions);
        await fse.writeFile(destPath, content, 'utf-8');
        result.installed.push(filename);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      result.errors.push(`commitlint: ${errorMsg}`);
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

    const huskyEnabled = config.commitlintOptions?.huskyIntegration ?? true;
    if (huskyEnabled) {
      instructions.push(
        'For commitlint with git hooks, install Husky:',
        '  pnpm add -D husky',
        '  npx husky init',
        '  echo "npx --no -- commitlint --edit \\${1}" > .husky/commit-msg'
      );
    }
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
