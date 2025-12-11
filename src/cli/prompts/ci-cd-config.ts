/**
 * CI/CD configuration prompts
 */

import type { CICDConfig } from '../../lib/ci-cd/index.js';
import { logger } from '../../lib/utils/logger.js';
import { checkbox, confirm, input, select } from '../../lib/utils/prompt-cancel.js';
import type { PackageManager } from '../../types/scaffold.js';

/**
 * Prompt for CI/CD configuration
 */
export async function promptCICDConfig(options?: {
  packageManager?: PackageManager;
  defaults?: Partial<CICDConfig>;
}): Promise<CICDConfig> {
  logger.section('CI/CD Configuration', '🚀');
  logger.info('Configure continuous integration and deployment workflows');
  logger.newline();

  // Ask if user wants to configure CI/CD
  const enableCICD = await confirm({
    message: 'Would you like to set up GitHub Actions workflows?',
    default: true,
  });

  if (!enableCICD) {
    return {
      enabled: false,
      provider: 'github-actions',
      ci: false,
      cd: false,
      packageManager: options?.packageManager || 'pnpm',
      nodeVersion: '22',
      enableCaching: true,
      runTests: true,
      runLint: true,
      runTypecheck: true,
      runBuild: true,
    };
  }

  // Select which workflows to create
  const workflows = await checkbox<'ci' | 'cd'>({
    message: 'Which workflows would you like to create?',
    choices: [
      {
        name: 'CI (Continuous Integration) - Lint, test, build on PRs',
        value: 'ci',
        checked: true,
      },
      {
        name: 'Release - Create releases on version tags',
        value: 'cd',
        checked: false,
      },
    ],
  });

  if (workflows.length === 0) {
    return {
      enabled: false,
      provider: 'github-actions',
      ci: false,
      cd: false,
      packageManager: options?.packageManager || 'pnpm',
      nodeVersion: '22',
      enableCaching: true,
      runTests: true,
      runLint: true,
      runTypecheck: true,
      runBuild: true,
    };
  }

  const hasCi = workflows.includes('ci');
  const hasCd = workflows.includes('cd');

  // CI configuration
  let runTests = true;
  let runLint = true;
  let runTypecheck = true;
  let runBuild = true;

  if (hasCi) {
    const ciSteps = await checkbox<'tests' | 'lint' | 'typecheck' | 'build'>({
      message: 'Which steps should the CI workflow run?',
      choices: [
        { name: 'Lint', value: 'lint', checked: true },
        { name: 'Type checking', value: 'typecheck', checked: true },
        { name: 'Tests', value: 'tests', checked: true },
        { name: 'Build', value: 'build', checked: true },
      ],
    });

    runTests = ciSteps.includes('tests');
    runLint = ciSteps.includes('lint');
    runTypecheck = ciSteps.includes('typecheck');
    runBuild = ciSteps.includes('build');
  }

  // Node.js version
  const nodeVersion = await select<string>({
    message: 'Node.js version:',
    choices: [
      { name: '22 (LTS - Recommended)', value: '22' },
      { name: '20 (LTS)', value: '20' },
      { name: '18 (LTS)', value: '18' },
      { name: 'Custom', value: 'custom' },
    ],
    default: '22',
  });

  let finalNodeVersion = nodeVersion;
  if (nodeVersion === 'custom') {
    finalNodeVersion = await input({
      message: 'Enter Node.js version:',
      default: '22',
      validate: (v) => {
        if (!/^\d+(\.\d+)?$/.test(v)) {
          return 'Please enter a valid version (e.g., "20" or "20.10")';
        }
        return true;
      },
    });
  }

  // Caching
  const enableCaching = await confirm({
    message: 'Enable dependency caching for faster builds?',
    default: true,
  });

  return {
    enabled: true,
    provider: 'github-actions',
    ci: hasCi,
    cd: hasCd,
    packageManager: options?.packageManager || 'pnpm',
    nodeVersion: finalNodeVersion,
    enableCaching,
    runTests,
    runLint,
    runTypecheck,
    runBuild,
  };
}

/**
 * Show CI/CD configuration summary
 */
export function showCICDSummary(config: CICDConfig): void {
  if (!config.enabled) {
    logger.item('CI/CD: Not configured');
    return;
  }

  const workflows: string[] = [];
  if (config.ci) workflows.push('CI');
  if (config.cd) workflows.push('Release');

  logger.item(`CI/CD: ${workflows.join(', ')}`);

  if (config.ci) {
    const steps: string[] = [];
    if (config.runLint) steps.push('lint');
    if (config.runTypecheck) steps.push('typecheck');
    if (config.runTests) steps.push('test');
    if (config.runBuild) steps.push('build');
    logger.info(`  CI steps: ${steps.join(', ')}`);
  }

  logger.info(`  Node.js: ${config.nodeVersion}`);
  logger.info(`  Caching: ${config.enableCaching ? 'enabled' : 'disabled'}`);
}
