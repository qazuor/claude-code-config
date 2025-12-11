/**
 * GitHub Actions workflow generator
 */

import type { PackageManager } from '../../types/scaffold.js';
import { ensureDir, joinPath, pathExists, writeFile } from '../utils/fs.js';
import { withSpinner } from '../utils/spinner.js';

export interface CICDConfig {
  /** Enable CI/CD configuration */
  enabled: boolean;
  /** CI provider */
  provider: 'github-actions';
  /** Enable CI workflow (lint, test, build) */
  ci: boolean;
  /** Enable CD workflow (deploy) */
  cd: boolean;
  /** Package manager to use */
  packageManager: PackageManager;
  /** Node.js version */
  nodeVersion: string;
  /** Enable caching */
  enableCaching: boolean;
  /** Run tests */
  runTests: boolean;
  /** Run linting */
  runLint: boolean;
  /** Run typecheck */
  runTypecheck: boolean;
  /** Run build */
  runBuild: boolean;
}

export interface CICDInstallResult {
  /** Files that were created */
  created: string[];
  /** Files that were skipped */
  skipped: string[];
  /** Errors encountered */
  errors: string[];
}

/**
 * Get package manager install command
 */
function getInstallCommand(packageManager: PackageManager): string {
  switch (packageManager) {
    case 'npm':
      return 'npm ci';
    case 'yarn':
      return 'yarn install --frozen-lockfile';
    case 'pnpm':
      return 'pnpm install --frozen-lockfile';
    case 'bun':
      return 'bun install --frozen-lockfile';
    default:
      return 'npm ci';
  }
}

/**
 * Get package manager run command
 */
function getRunCommand(packageManager: PackageManager, script: string): string {
  switch (packageManager) {
    case 'npm':
      return `npm run ${script}`;
    case 'yarn':
      return `yarn ${script}`;
    case 'pnpm':
      return `pnpm ${script}`;
    case 'bun':
      return `bun run ${script}`;
    default:
      return `npm run ${script}`;
  }
}

/**
 * Get cache configuration for package manager
 */
function getCacheConfig(packageManager: PackageManager): { path: string; key: string } {
  switch (packageManager) {
    case 'npm':
      return {
        path: '~/.npm',
        key: "npm-${{ hashFiles('**/package-lock.json') }}",
      };
    case 'yarn':
      return {
        path: '.yarn/cache',
        key: "yarn-${{ hashFiles('**/yarn.lock') }}",
      };
    case 'pnpm':
      return {
        path: '~/.local/share/pnpm/store',
        key: "pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}",
      };
    case 'bun':
      return {
        path: '~/.bun/install/cache',
        key: "bun-${{ hashFiles('**/bun.lockb') }}",
      };
    default:
      return {
        path: '~/.npm',
        key: "npm-${{ hashFiles('**/package-lock.json') }}",
      };
  }
}

/**
 * Generate CI workflow content
 */
function generateCIWorkflow(config: CICDConfig): string {
  const { packageManager, nodeVersion, enableCaching, runTests, runLint, runTypecheck, runBuild } =
    config;

  const cache = getCacheConfig(packageManager);
  const installCmd = getInstallCommand(packageManager);

  const steps: string[] = [];

  // Checkout
  steps.push(`      - name: Checkout
        uses: actions/checkout@v4`);

  // Setup pnpm if needed
  if (packageManager === 'pnpm') {
    steps.push(`
      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: latest`);
  }

  // Setup Bun if needed
  if (packageManager === 'bun') {
    steps.push(`
      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest`);
  }

  // Setup Node.js
  if (packageManager !== 'bun') {
    steps.push(`
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '${nodeVersion}'${
            enableCaching
              ? `
          cache: '${packageManager}'`
              : ''
          }`);
  }

  // Cache (if not using built-in node cache)
  if (enableCaching && packageManager === 'bun') {
    steps.push(`
      - name: Cache dependencies
        uses: actions/cache@v4
        with:
          path: ${cache.path}
          key: ${cache.key}`);
  }

  // Install dependencies
  steps.push(`
      - name: Install dependencies
        run: ${installCmd}`);

  // Lint
  if (runLint) {
    steps.push(`
      - name: Lint
        run: ${getRunCommand(packageManager, 'lint')}`);
  }

  // Typecheck
  if (runTypecheck) {
    steps.push(`
      - name: Type check
        run: ${getRunCommand(packageManager, 'typecheck')}`);
  }

  // Test
  if (runTests) {
    steps.push(`
      - name: Run tests
        run: ${getRunCommand(packageManager, 'test')}`);
  }

  // Build
  if (runBuild) {
    steps.push(`
      - name: Build
        run: ${getRunCommand(packageManager, 'build')}`);
  }

  return `name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  ci:
    runs-on: ubuntu-latest

    steps:
${steps.join('\n')}
`;
}

/**
 * Generate Release workflow content
 */
function generateReleaseWorkflow(config: CICDConfig): string {
  const { packageManager, nodeVersion } = config;
  const installCmd = getInstallCommand(packageManager);

  let setupSteps = '';
  if (packageManager === 'pnpm') {
    setupSteps = `
      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: latest
`;
  }

  return `name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
${setupSteps}
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '${nodeVersion}'
          cache: '${packageManager}'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: ${installCmd}

      - name: Build
        run: ${getRunCommand(packageManager, 'build')}

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          generate_release_notes: true
`;
}

/**
 * Install CI/CD workflows
 */
export async function installCICD(
  projectPath: string,
  config: CICDConfig,
  options?: { overwrite?: boolean }
): Promise<CICDInstallResult> {
  const result: CICDInstallResult = {
    created: [],
    skipped: [],
    errors: [],
  };

  if (!config.enabled) {
    return result;
  }

  const workflowsDir = joinPath(projectPath, '.github', 'workflows');

  try {
    // Ensure workflows directory exists
    await ensureDir(workflowsDir);

    // Install CI workflow
    if (config.ci) {
      const ciPath = joinPath(workflowsDir, 'ci.yml');
      if (!(await pathExists(ciPath)) || options?.overwrite) {
        const content = generateCIWorkflow(config);
        await writeFile(ciPath, content);
        result.created.push('ci.yml');
      } else {
        result.skipped.push('ci.yml');
      }
    }

    // Install CD/Release workflow
    if (config.cd) {
      const releasePath = joinPath(workflowsDir, 'release.yml');
      if (!(await pathExists(releasePath)) || options?.overwrite) {
        const content = generateReleaseWorkflow(config);
        await writeFile(releasePath, content);
        result.created.push('release.yml');
      } else {
        result.skipped.push('release.yml');
      }
    }
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
  }

  return result;
}

/**
 * Install CI/CD with spinner
 */
export async function installCICDWithSpinner(
  projectPath: string,
  config: CICDConfig,
  options?: { overwrite?: boolean }
): Promise<CICDInstallResult> {
  return withSpinner(
    'Installing GitHub Actions workflows...',
    () => installCICD(projectPath, config, options),
    {
      successText: 'Installed GitHub Actions workflows',
    }
  );
}

/**
 * Get default CI/CD configuration
 */
export function getDefaultCICDConfig(packageManager: PackageManager): CICDConfig {
  return {
    enabled: true,
    provider: 'github-actions',
    ci: true,
    cd: false,
    packageManager,
    nodeVersion: '22',
    enableCaching: true,
    runTests: true,
    runLint: true,
    runTypecheck: true,
    runBuild: true,
  };
}
