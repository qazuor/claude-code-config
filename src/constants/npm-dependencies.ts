/**
 * NPM dependencies configuration for code style and development tools
 */

/**
 * NPM package definition
 */
export interface NpmPackage {
  /** Package name */
  name: string;
  /** Recommended version (semver range) */
  version: string;
  /** Whether it's a dev dependency */
  isDev: boolean;
  /** Description of what it does */
  description: string;
}

/**
 * Scripts definition for package.json
 */
export interface PackageScript {
  /** Script name */
  name: string;
  /** Script command */
  command: string;
  /** Description of what it does */
  description: string;
}

/**
 * Tool configuration with its dependencies and scripts
 */
export interface ToolDependencies {
  /** Packages required for this tool */
  packages: NpmPackage[];
  /** Scripts to add to package.json */
  scripts: PackageScript[];
  /** Additional setup instructions */
  setupInstructions?: string[];
}

/**
 * Linter dependencies
 */
export const LINTER_DEPENDENCIES: Record<string, ToolDependencies> = {
  biome: {
    packages: [
      {
        name: '@biomejs/biome',
        version: '^1.9.0',
        isDev: true,
        description: 'Fast linter and formatter',
      },
    ],
    scripts: [
      { name: 'lint', command: 'biome check .', description: 'Run linter' },
      { name: 'lint:fix', command: 'biome check --write .', description: 'Fix linting issues' },
    ],
  },
  eslint: {
    packages: [
      { name: 'eslint', version: '^9.0.0', isDev: true, description: 'JavaScript linter' },
      {
        name: 'typescript-eslint',
        version: '^8.0.0',
        isDev: true,
        description: 'TypeScript ESLint parser and plugin',
      },
      { name: 'globals', version: '^15.0.0', isDev: true, description: 'ESLint globals' },
    ],
    scripts: [
      { name: 'lint', command: 'eslint .', description: 'Run linter' },
      { name: 'lint:fix', command: 'eslint . --fix', description: 'Fix linting issues' },
    ],
  },
  oxlint: {
    packages: [
      { name: 'oxlint', version: '^0.10.0', isDev: true, description: 'Oxidation Compiler linter' },
    ],
    scripts: [{ name: 'lint', command: 'oxlint .', description: 'Run linter' }],
  },
};

/**
 * Formatter dependencies
 */
export const FORMATTER_DEPENDENCIES: Record<string, ToolDependencies> = {
  biome: {
    packages: [
      // Biome package is shared with linter, will be deduplicated
      {
        name: '@biomejs/biome',
        version: '^1.9.0',
        isDev: true,
        description: 'Fast linter and formatter',
      },
    ],
    scripts: [
      { name: 'format', command: 'biome format --write .', description: 'Format code' },
      { name: 'format:check', command: 'biome format .', description: 'Check formatting' },
    ],
  },
  prettier: {
    packages: [{ name: 'prettier', version: '^3.0.0', isDev: true, description: 'Code formatter' }],
    scripts: [
      { name: 'format', command: 'prettier --write .', description: 'Format code' },
      { name: 'format:check', command: 'prettier --check .', description: 'Check formatting' },
    ],
  },
};

/**
 * Test runner dependencies
 */
export const TEST_RUNNER_DEPENDENCIES: Record<string, ToolDependencies> = {
  vitest: {
    packages: [
      {
        name: 'vitest',
        version: '^2.0.0',
        isDev: true,
        description: 'Vite-native testing framework',
      },
      {
        name: '@vitest/coverage-v8',
        version: '^2.0.0',
        isDev: true,
        description: 'V8 coverage provider for Vitest',
      },
    ],
    scripts: [
      { name: 'test', command: 'vitest', description: 'Run tests in watch mode' },
      { name: 'test:run', command: 'vitest run', description: 'Run tests once' },
      {
        name: 'test:coverage',
        command: 'vitest run --coverage',
        description: 'Run tests with coverage',
      },
    ],
  },
  jest: {
    packages: [
      {
        name: 'jest',
        version: '^29.0.0',
        isDev: true,
        description: 'JavaScript testing framework',
      },
      {
        name: '@types/jest',
        version: '^29.0.0',
        isDev: true,
        description: 'Jest type definitions',
      },
      {
        name: 'ts-jest',
        version: '^29.0.0',
        isDev: true,
        description: 'TypeScript preprocessor for Jest',
      },
    ],
    scripts: [
      { name: 'test', command: 'jest', description: 'Run tests' },
      { name: 'test:watch', command: 'jest --watch', description: 'Run tests in watch mode' },
      { name: 'test:coverage', command: 'jest --coverage', description: 'Run tests with coverage' },
    ],
    setupInstructions: ['Create jest.config.js with ts-jest preset'],
  },
  playwright: {
    packages: [
      {
        name: '@playwright/test',
        version: '^1.45.0',
        isDev: true,
        description: 'Playwright Test framework',
      },
    ],
    scripts: [
      { name: 'test:e2e', command: 'playwright test', description: 'Run E2E tests' },
      {
        name: 'test:e2e:ui',
        command: 'playwright test --ui',
        description: 'Run E2E tests with UI',
      },
    ],
    setupInstructions: ['Run `npx playwright install` to install browsers'],
  },
};

/**
 * Commitlint dependencies
 */
export const COMMITLINT_DEPENDENCIES: ToolDependencies = {
  packages: [
    {
      name: '@commitlint/cli',
      version: '^19.0.0',
      isDev: true,
      description: 'Commit message linter',
    },
    {
      name: '@commitlint/config-conventional',
      version: '^19.0.0',
      isDev: true,
      description: 'Conventional commits config',
    },
  ],
  scripts: [],
  setupInstructions: [
    'For git hooks integration, install Husky:',
    '  pnpm add -D husky',
    '  npx husky init',
    '  echo "npx --no -- commitlint --edit ${1}" > .husky/commit-msg',
  ],
};

/**
 * Husky dependencies
 */
export const HUSKY_DEPENDENCIES: ToolDependencies = {
  packages: [{ name: 'husky', version: '^9.0.0', isDev: true, description: 'Git hooks manager' }],
  scripts: [{ name: 'prepare', command: 'husky', description: 'Install git hooks' }],
};

/**
 * TypeScript dependencies
 */
export const TYPESCRIPT_DEPENDENCIES: ToolDependencies = {
  packages: [
    { name: 'typescript', version: '^5.5.0', isDev: true, description: 'TypeScript compiler' },
    {
      name: '@types/node',
      version: '^22.0.0',
      isDev: true,
      description: 'Node.js type definitions',
    },
  ],
  scripts: [
    { name: 'typecheck', command: 'tsc --noEmit', description: 'Type check without emitting' },
    { name: 'build', command: 'tsc', description: 'Compile TypeScript' },
  ],
};

/**
 * Get dependencies for a linter
 */
export function getLinterDependencies(linter: string): ToolDependencies | undefined {
  return LINTER_DEPENDENCIES[linter];
}

/**
 * Get dependencies for a formatter
 */
export function getFormatterDependencies(formatter: string): ToolDependencies | undefined {
  return FORMATTER_DEPENDENCIES[formatter];
}

/**
 * Get dependencies for a test runner
 */
export function getTestRunnerDependencies(testRunner: string): ToolDependencies | undefined {
  return TEST_RUNNER_DEPENDENCIES[testRunner];
}

/**
 * Merge multiple tool dependencies, deduplicating packages
 */
export function mergeToolDependencies(
  ...tools: (ToolDependencies | undefined)[]
): ToolDependencies {
  const packageMap = new Map<string, NpmPackage>();
  const scriptMap = new Map<string, PackageScript>();
  const allInstructions: string[] = [];

  for (const tool of tools) {
    if (!tool) continue;

    // Add packages (deduplicate by name)
    for (const pkg of tool.packages) {
      if (!packageMap.has(pkg.name)) {
        packageMap.set(pkg.name, pkg);
      }
    }

    // Add scripts (deduplicate by name, later ones win)
    for (const script of tool.scripts) {
      scriptMap.set(script.name, script);
    }

    // Add setup instructions
    if (tool.setupInstructions) {
      allInstructions.push(...tool.setupInstructions);
    }
  }

  return {
    packages: Array.from(packageMap.values()),
    scripts: Array.from(scriptMap.values()),
    setupInstructions: allInstructions.length > 0 ? allInstructions : undefined,
  };
}

/**
 * Format packages as install command
 */
export function formatInstallCommand(
  packages: NpmPackage[],
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun' = 'pnpm'
): string {
  const devPackages = packages.filter((p) => p.isDev);
  const prodPackages = packages.filter((p) => !p.isDev);

  const commands: string[] = [];

  if (devPackages.length > 0) {
    const pkgNames = devPackages.map((p) => p.name).join(' ');
    switch (packageManager) {
      case 'npm':
        commands.push(`npm install -D ${pkgNames}`);
        break;
      case 'yarn':
        commands.push(`yarn add -D ${pkgNames}`);
        break;
      case 'pnpm':
        commands.push(`pnpm add -D ${pkgNames}`);
        break;
      case 'bun':
        commands.push(`bun add -D ${pkgNames}`);
        break;
    }
  }

  if (prodPackages.length > 0) {
    const pkgNames = prodPackages.map((p) => p.name).join(' ');
    switch (packageManager) {
      case 'npm':
        commands.push(`npm install ${pkgNames}`);
        break;
      case 'yarn':
        commands.push(`yarn add ${pkgNames}`);
        break;
      case 'pnpm':
        commands.push(`pnpm add ${pkgNames}`);
        break;
      case 'bun':
        commands.push(`bun add ${pkgNames}`);
        break;
    }
  }

  return commands.join('\n');
}
