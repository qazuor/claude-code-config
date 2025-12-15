/**
 * Husky installer - creates git hooks for commit linting and other automation
 */

import type { CodeStyleConfig, PreCommitConfig } from '../../types/config.js';
import { ensureDir, joinPath, makeExecutable, pathExists, writeFile } from '../utils/fs.js';
import { withSpinner } from '../utils/spinner.js';
import { generatePreCommitScript, generateSimplePreCommitHook } from './precommit-generator.js';

export interface HuskyConfig {
  /** Enable commitlint hook */
  commitlint: boolean;
  /** Enable pre-commit hook for linting */
  preCommit: boolean;
  /** Linter command for pre-commit (simple mode) */
  lintCommand?: string;
  /** Advanced pre-commit configuration */
  preCommitConfig?: PreCommitConfig;
  /** Enable pre-push hook */
  prePush: boolean;
  /** Test command for pre-push */
  testCommand?: string;
}

export interface HuskyInstallResult {
  /** Files that were created */
  created: string[];
  /** Files that were skipped */
  skipped: string[];
  /** Errors encountered */
  errors: string[];
  /** Whether husky directory was initialized */
  initialized: boolean;
}

/**
 * Generate commit-msg hook content
 */
function generateCommitMsgHook(): string {
  return `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit "\${1}"
`;
}

/**
 * Generate pre-commit hook content
 */
function generatePreCommitHook(lintCommand?: string, preCommitConfig?: PreCommitConfig): string {
  // Use advanced config if provided
  if (preCommitConfig) {
    return generatePreCommitScript(preCommitConfig);
  }

  // Fall back to simple hook
  const command = lintCommand || 'pnpm lint-staged';
  return generateSimplePreCommitHook(command);
}

/**
 * Generate pre-push hook content
 */
function generatePrePushHook(testCommand?: string): string {
  const command = testCommand || 'pnpm test';
  return `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

${command}
`;
}

/**
 * Generate husky.sh helper script
 */
function generateHuskyScript(): string {
  return `#!/usr/bin/env sh
if [ -z "$husky_skip_init" ]; then
  debug () {
    if [ "$HUSKY_DEBUG" = "1" ]; then
      echo "husky (debug) - $1"
    fi
  }

  readonly hook_name="\$(basename -- "$0")"
  debug "starting $hook_name..."

  if [ "$HUSKY" = "0" ]; then
    debug "HUSKY env variable is set to 0, skipping hook"
    exit 0
  fi

  if [ -f ~/.huskyrc ]; then
    debug "sourcing ~/.huskyrc"
    . ~/.huskyrc
  fi

  readonly husky_skip_init=1
  export husky_skip_init
  sh -e "$0" "$@"
  exitCode="$?"

  if [ $exitCode != 0 ]; then
    echo "husky - $hook_name hook exited with code $exitCode (error)"
  fi

  if [ $exitCode = 127 ]; then
    echo "husky - command not found in PATH=$PATH"
  fi

  exit $exitCode
fi
`;
}

/**
 * Generate .gitignore for husky directory
 */
function generateHuskyGitignore(): string {
  return `_
`;
}

/**
 * Install Husky hooks
 */
export async function installHusky(
  projectPath: string,
  config: HuskyConfig,
  options?: { overwrite?: boolean }
): Promise<HuskyInstallResult> {
  const result: HuskyInstallResult = {
    created: [],
    skipped: [],
    errors: [],
    initialized: false,
  };

  const huskyDir = joinPath(projectPath, '.husky');
  const huskyInternalDir = joinPath(huskyDir, '_');

  try {
    // Create .husky directory
    await ensureDir(huskyDir);
    await ensureDir(huskyInternalDir);
    result.initialized = true;

    // Create internal husky.sh script
    const huskyScriptPath = joinPath(huskyInternalDir, 'husky.sh');
    if (!(await pathExists(huskyScriptPath)) || options?.overwrite) {
      await writeFile(huskyScriptPath, generateHuskyScript());
      await makeExecutable(huskyScriptPath);
      result.created.push('_/husky.sh');
    } else {
      result.skipped.push('_/husky.sh');
    }

    // Create .gitignore in husky internal directory
    const gitignorePath = joinPath(huskyInternalDir, '.gitignore');
    if (!(await pathExists(gitignorePath)) || options?.overwrite) {
      await writeFile(gitignorePath, generateHuskyGitignore());
      result.created.push('_/.gitignore');
    }

    // Create commit-msg hook
    if (config.commitlint) {
      const commitMsgPath = joinPath(huskyDir, 'commit-msg');
      if (!(await pathExists(commitMsgPath)) || options?.overwrite) {
        await writeFile(commitMsgPath, generateCommitMsgHook());
        await makeExecutable(commitMsgPath);
        result.created.push('commit-msg');
      } else {
        result.skipped.push('commit-msg');
      }
    }

    // Create pre-commit hook
    if (config.preCommit) {
      const preCommitPath = joinPath(huskyDir, 'pre-commit');
      if (!(await pathExists(preCommitPath)) || options?.overwrite) {
        await writeFile(
          preCommitPath,
          generatePreCommitHook(config.lintCommand, config.preCommitConfig)
        );
        await makeExecutable(preCommitPath);
        result.created.push('pre-commit');
      } else {
        result.skipped.push('pre-commit');
      }
    }

    // Create pre-push hook
    if (config.prePush) {
      const prePushPath = joinPath(huskyDir, 'pre-push');
      if (!(await pathExists(prePushPath)) || options?.overwrite) {
        await writeFile(prePushPath, generatePrePushHook(config.testCommand));
        await makeExecutable(prePushPath);
        result.created.push('pre-push');
      } else {
        result.skipped.push('pre-push');
      }
    }
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
  }

  return result;
}

/**
 * Install Husky with spinner
 */
export async function installHuskyWithSpinner(
  projectPath: string,
  config: HuskyConfig,
  options?: { overwrite?: boolean }
): Promise<HuskyInstallResult> {
  return withSpinner(
    'Installing Husky hooks...',
    () => installHusky(projectPath, config, options),
    {
      successText: 'Installed Husky hooks',
    }
  );
}

/**
 * Derive Husky config from code style config
 */
export function deriveHuskyConfigFromCodeStyle(codeStyle: CodeStyleConfig): HuskyConfig | null {
  if (!codeStyle.enabled) {
    return null;
  }

  // Only install husky if commitlint with husky integration is enabled
  const commitlintEnabled = codeStyle.commitlint && codeStyle.commitlintOptions?.huskyIntegration;

  if (!commitlintEnabled) {
    return null;
  }

  // Determine lint command based on tools
  let lintCommand: string | undefined;
  if (codeStyle.biome) {
    lintCommand = 'pnpm biome check --staged';
  } else if (codeStyle.prettier) {
    lintCommand = 'pnpm lint-staged';
  }

  return {
    commitlint: true,
    preCommit: !!lintCommand,
    lintCommand,
    prePush: false, // Don't run tests on push by default
  };
}

/**
 * Get lint-staged configuration for package.json
 */
export function getLintStagedConfig(
  codeStyle: CodeStyleConfig
): Record<string, string | string[]> | null {
  if (!codeStyle.enabled) {
    return null;
  }

  const config: Record<string, string | string[]> = {};

  if (codeStyle.biome) {
    config['*.{js,jsx,ts,tsx,json}'] = ['biome check --write --no-errors-on-unmatched'];
  } else if (codeStyle.prettier) {
    config['*.{js,jsx,ts,tsx,json,md,css,scss}'] = ['prettier --write'];
  }

  if (Object.keys(config).length === 0) {
    return null;
  }

  return config;
}

/**
 * Get Husky dependencies for package.json
 */
export function getHuskyDependencies(): string[] {
  return ['husky'];
}

/**
 * Get Husky setup instructions
 */
export function getHuskySetupInstructions(): string[] {
  return ['Run `pnpm exec husky init` to initialize Husky (or hooks were pre-configured)'];
}
