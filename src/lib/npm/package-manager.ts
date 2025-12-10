/**
 * Package.json management utilities
 */

import {
  COMMITLINT_DEPENDENCIES,
  HUSKY_DEPENDENCIES,
  TYPESCRIPT_DEPENDENCIES,
  getFormatterDependencies,
  getLinterDependencies,
  getTestRunnerDependencies,
  mergeToolDependencies,
} from '../../constants/npm-dependencies.js';
import type {
  DependencyGenerationConfig,
  PackageJson,
  PackageJsonChanges,
  PackageJsonUpdateOptions,
  PackageJsonUpdateResult,
  ToolSelection,
} from '../../types/package-json.js';
import type { PackageManager } from '../../types/scaffold.js';
import { joinPath, pathExists, readFile, writeFile } from '../utils/fs.js';
import { logger } from '../utils/logger.js';

/**
 * Read package.json from a directory
 */
export async function readPackageJson(projectPath: string): Promise<PackageJson | null> {
  const packageJsonPath = joinPath(projectPath, 'package.json');

  if (!(await pathExists(packageJsonPath))) {
    return null;
  }

  try {
    const content = await readFile(packageJsonPath);
    return JSON.parse(content) as PackageJson;
  } catch (error) {
    logger.debug(`Failed to parse package.json: ${error}`);
    return null;
  }
}

/**
 * Write package.json to a directory
 */
export async function writePackageJson(
  projectPath: string,
  packageJson: PackageJson
): Promise<void> {
  const packageJsonPath = joinPath(projectPath, 'package.json');
  const content = `${JSON.stringify(packageJson, null, 2)}\n`;
  await writeFile(packageJsonPath, content);
}

/**
 * Create a minimal package.json
 */
export function createMinimalPackageJson(options: {
  name?: string;
  description?: string;
  version?: string;
  type?: 'module' | 'commonjs';
  author?: string;
  license?: string;
}): PackageJson {
  return {
    name: options.name || 'my-project',
    version: options.version || '0.0.1',
    description: options.description || '',
    type: options.type || 'module',
    scripts: {},
    dependencies: {},
    devDependencies: {},
    ...(options.author ? { author: options.author } : {}),
    ...(options.license ? { license: options.license } : {}),
  };
}

/**
 * Generate package.json changes based on tool selection
 */
export function generatePackageJsonChanges(config: DependencyGenerationConfig): PackageJsonChanges {
  const { tools, project } = config;
  const changes: PackageJsonChanges = {
    scripts: {},
    dependencies: {},
    devDependencies: {},
  };

  // Collect all tool dependencies
  const toolDeps = mergeToolDependencies(
    tools.linter && tools.linter !== 'none' ? getLinterDependencies(tools.linter) : undefined,
    tools.formatter && tools.formatter !== 'none'
      ? getFormatterDependencies(tools.formatter)
      : undefined,
    tools.testRunner && tools.testRunner !== 'none'
      ? getTestRunnerDependencies(tools.testRunner)
      : undefined,
    tools.commitlint ? COMMITLINT_DEPENDENCIES : undefined,
    tools.husky ? HUSKY_DEPENDENCIES : undefined,
    tools.typescript ? TYPESCRIPT_DEPENDENCIES : undefined
  );

  // Add packages to changes
  for (const pkg of toolDeps.packages) {
    if (pkg.isDev) {
      if (changes.devDependencies) {
        changes.devDependencies[pkg.name] = pkg.version;
      }
    } else {
      if (changes.dependencies) {
        changes.dependencies[pkg.name] = pkg.version;
      }
    }
  }

  // Add scripts to changes
  for (const script of toolDeps.scripts) {
    if (changes.scripts) {
      changes.scripts[script.name] = script.command;
    }
  }

  // Add metadata if provided
  if (project) {
    changes.metadata = {
      name: project.name,
      description: project.description,
      author: project.author,
      license: project.license,
      repository: project.repository,
    };
  }

  return changes;
}

/**
 * Apply changes to package.json
 */
export async function updatePackageJson(
  projectPath: string,
  changes: PackageJsonChanges,
  options: PackageJsonUpdateOptions = {}
): Promise<PackageJsonUpdateResult> {
  const {
    scriptsMerge = 'skip-existing',
    dependenciesMerge = 'skip-existing',
    createIfMissing = true,
    backup = false,
    dryRun = false,
  } = options;

  const result: PackageJsonUpdateResult = {
    success: false,
    path: joinPath(projectPath, 'package.json'),
    created: false,
    modified: false,
    addedScripts: [],
    skippedScripts: [],
    addedDependencies: [],
    skippedDependencies: [],
    addedDevDependencies: [],
    skippedDevDependencies: [],
  };

  try {
    let packageJson = await readPackageJson(projectPath);

    // Create if missing
    if (!packageJson) {
      if (!createIfMissing) {
        result.error = 'package.json not found and createIfMissing is false';
        return result;
      }
      packageJson = createMinimalPackageJson({
        name: changes.metadata?.name,
        description: changes.metadata?.description,
        author: typeof changes.metadata?.author === 'string' ? changes.metadata.author : undefined,
        license: changes.metadata?.license,
      });
      result.created = true;
    }

    // Backup if requested
    if (backup && !dryRun && !result.created) {
      const backupPath = joinPath(projectPath, 'package.json.backup');
      await writeFile(backupPath, JSON.stringify(packageJson, null, 2));
    }

    // Apply metadata changes
    if (changes.metadata) {
      if (changes.metadata.name && !packageJson.name) {
        packageJson.name = changes.metadata.name;
        result.modified = true;
      }
      if (changes.metadata.description && !packageJson.description) {
        packageJson.description = changes.metadata.description;
        result.modified = true;
      }
      if (changes.metadata.author && !packageJson.author) {
        packageJson.author = changes.metadata.author;
        result.modified = true;
      }
      if (changes.metadata.license && !packageJson.license) {
        packageJson.license = changes.metadata.license;
        result.modified = true;
      }
      if (changes.metadata.repository && !packageJson.repository) {
        packageJson.repository = changes.metadata.repository;
        result.modified = true;
      }
      if (changes.metadata.type && !packageJson.type) {
        packageJson.type = changes.metadata.type;
        result.modified = true;
      }
      if (changes.metadata.engines && !packageJson.engines) {
        packageJson.engines = changes.metadata.engines;
        result.modified = true;
      }
      if (changes.metadata.packageManager && !packageJson.packageManager) {
        packageJson.packageManager = changes.metadata.packageManager;
        result.modified = true;
      }
    }

    // Apply scripts
    if (changes.scripts) {
      packageJson.scripts = packageJson.scripts || {};
      for (const [name, command] of Object.entries(changes.scripts)) {
        const exists = name in packageJson.scripts;
        if (exists) {
          if (scriptsMerge === 'skip-existing') {
            result.skippedScripts.push(name);
            continue;
          }
          if (scriptsMerge === 'replace') {
            // Only add new ones, don't touch existing
            result.skippedScripts.push(name);
            continue;
          }
        }
        packageJson.scripts[name] = command;
        result.addedScripts.push(name);
        result.modified = true;
      }
    }

    // Apply dependencies
    if (changes.dependencies) {
      packageJson.dependencies = packageJson.dependencies || {};
      for (const [name, version] of Object.entries(changes.dependencies)) {
        const exists = name in packageJson.dependencies;
        if (exists) {
          if (dependenciesMerge === 'skip-existing') {
            result.skippedDependencies.push(name);
            continue;
          }
          if (dependenciesMerge === 'replace') {
            result.skippedDependencies.push(name);
            continue;
          }
        }
        packageJson.dependencies[name] = version;
        result.addedDependencies.push(name);
        result.modified = true;
      }
    }

    // Apply devDependencies
    if (changes.devDependencies) {
      packageJson.devDependencies = packageJson.devDependencies || {};
      for (const [name, version] of Object.entries(changes.devDependencies)) {
        const exists = name in packageJson.devDependencies;
        if (exists) {
          if (dependenciesMerge === 'skip-existing') {
            result.skippedDevDependencies.push(name);
            continue;
          }
          if (dependenciesMerge === 'replace') {
            result.skippedDevDependencies.push(name);
            continue;
          }
        }
        packageJson.devDependencies[name] = version;
        result.addedDevDependencies.push(name);
        result.modified = true;
      }
    }

    // Write changes
    if (!dryRun && (result.created || result.modified)) {
      await writePackageJson(projectPath, packageJson);
    }

    result.success = true;
    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    return result;
  }
}

/**
 * Get install command for the package manager
 */
export function getInstallCommand(packageManager: PackageManager): string {
  switch (packageManager) {
    case 'npm':
      return 'npm install';
    case 'yarn':
      return 'yarn';
    case 'pnpm':
      return 'pnpm install';
    case 'bun':
      return 'bun install';
    default:
      return 'npm install';
  }
}

/**
 * Format package manager string for package.json
 */
export function formatPackageManagerField(
  packageManager: PackageManager,
  version?: string
): string {
  const versions: Record<PackageManager, string> = {
    npm: version || '10.0.0',
    yarn: version || '4.0.0',
    pnpm: version || '9.0.0',
    bun: version || '1.0.0',
  };
  return `${packageManager}@${versions[packageManager]}`;
}

/**
 * Derive tool selection from code style config
 */
export function deriveToolSelectionFromCodeStyle(codeStyle: {
  biome?: boolean;
  prettier?: boolean;
  commitlint?: boolean;
}): Partial<ToolSelection> {
  const selection: Partial<ToolSelection> = {};

  if (codeStyle.biome) {
    selection.linter = 'biome';
    selection.formatter = 'biome';
  }

  if (codeStyle.prettier) {
    // If both biome and prettier are enabled, prettier takes formatter role
    selection.formatter = 'prettier';
  }

  if (codeStyle.commitlint) {
    selection.commitlint = true;
    selection.husky = true; // Commitlint typically needs husky
  }

  return selection;
}

/**
 * Get setup instructions for tools
 */
export function getSetupInstructions(tools: ToolSelection): string[] {
  const instructions: string[] = [];

  const toolDeps = mergeToolDependencies(
    tools.linter && tools.linter !== 'none' ? getLinterDependencies(tools.linter) : undefined,
    tools.formatter && tools.formatter !== 'none'
      ? getFormatterDependencies(tools.formatter)
      : undefined,
    tools.testRunner && tools.testRunner !== 'none'
      ? getTestRunnerDependencies(tools.testRunner)
      : undefined,
    tools.commitlint ? COMMITLINT_DEPENDENCIES : undefined,
    tools.husky ? HUSKY_DEPENDENCIES : undefined,
    tools.typescript ? TYPESCRIPT_DEPENDENCIES : undefined
  );

  if (toolDeps.setupInstructions) {
    instructions.push(...toolDeps.setupInstructions);
  }

  return instructions;
}
