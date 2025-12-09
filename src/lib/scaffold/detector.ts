/**
 * Project detector - detects existing project type and configuration
 */

import type { PresetName } from '../../types/presets.js';
import type {
  DetectionSignal,
  PackageManager,
  ProjectDetectionResult,
  ProjectType,
} from '../../types/scaffold.js';
import { joinPath, pathExists, readJson } from '../utils/fs.js';

interface PackageJson {
  name?: string;
  description?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  workspaces?: string[] | { packages: string[] };
}

/**
 * Detect project type and configuration
 */
export async function detectProject(projectPath: string): Promise<ProjectDetectionResult> {
  const signals: DetectionSignal[] = [];

  // Check for package.json
  const packageJsonPath = joinPath(projectPath, 'package.json');
  const hasPackageJson = await pathExists(packageJsonPath);

  if (!hasPackageJson) {
    return {
      detected: false,
      confidence: 'low',
      signals: [{ file: 'package.json', exists: false, indicates: 'not a Node.js project' }],
    };
  }

  signals.push({ file: 'package.json', exists: true, indicates: 'Node.js project' });

  // Read package.json
  const packageJson = await readJson<PackageJson>(packageJsonPath).catch(() => ({}) as PackageJson);

  // Detect package manager
  const packageManager = await detectPackageManager(projectPath);
  if (packageManager) {
    signals.push({
      file: `${packageManager}-lock`,
      exists: true,
      indicates: `${packageManager} package manager`,
    });
  }

  // Detect project type
  const typeResult = await detectProjectType(projectPath, packageJson);
  const projectType = typeResult.type;
  signals.push(...typeResult.signals);

  // Determine confidence
  const confidence: 'high' | 'medium' | 'low' =
    projectType && packageManager ? 'high' : projectType || packageManager ? 'medium' : 'low';

  // Suggest preset based on project type
  const suggestedPreset = suggestPreset(projectType, packageJson);

  return {
    detected: true,
    projectType,
    packageManager,
    suggestedPreset,
    confidence,
    signals,
  };
}

/**
 * Detect package manager
 */
async function detectPackageManager(projectPath: string): Promise<PackageManager | undefined> {
  const lockFiles: Array<{ file: string; manager: PackageManager }> = [
    { file: 'pnpm-lock.yaml', manager: 'pnpm' },
    { file: 'yarn.lock', manager: 'yarn' },
    { file: 'package-lock.json', manager: 'npm' },
    { file: 'bun.lockb', manager: 'bun' },
  ];

  for (const { file, manager } of lockFiles) {
    if (await pathExists(joinPath(projectPath, file))) {
      return manager;
    }
  }

  return undefined;
}

/**
 * Detect project type from configuration files
 */
async function detectProjectType(
  projectPath: string,
  packageJson: PackageJson
): Promise<{ type: ProjectType | undefined; signals: DetectionSignal[] }> {
  const signals: DetectionSignal[] = [];
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

  // Check for monorepo
  if (
    (await pathExists(joinPath(projectPath, 'turbo.json'))) ||
    (await pathExists(joinPath(projectPath, 'pnpm-workspace.yaml'))) ||
    packageJson.workspaces
  ) {
    signals.push({ file: 'turbo.json/pnpm-workspace.yaml', exists: true, indicates: 'monorepo' });
    return { type: 'monorepo', signals };
  }

  // Check for Astro
  if (
    (await pathExists(joinPath(projectPath, 'astro.config.mjs'))) ||
    (await pathExists(joinPath(projectPath, 'astro.config.ts'))) ||
    deps.astro
  ) {
    signals.push({ file: 'astro.config.*', exists: true, indicates: 'Astro project' });
    return { type: 'astro', signals };
  }

  // Check for Next.js
  if (
    (await pathExists(joinPath(projectPath, 'next.config.js'))) ||
    (await pathExists(joinPath(projectPath, 'next.config.mjs'))) ||
    (await pathExists(joinPath(projectPath, 'next.config.ts'))) ||
    deps.next
  ) {
    signals.push({ file: 'next.config.*', exists: true, indicates: 'Next.js project' });
    return { type: 'nextjs', signals };
  }

  // Check for Vite + React
  if (
    ((await pathExists(joinPath(projectPath, 'vite.config.ts'))) ||
      (await pathExists(joinPath(projectPath, 'vite.config.js')))) &&
    (deps.react || deps['react-dom'])
  ) {
    signals.push({ file: 'vite.config.*', exists: true, indicates: 'Vite project' });
    signals.push({ file: 'react dependency', exists: true, indicates: 'React project' });
    return { type: 'vite-react', signals };
  }

  // Check for Hono
  if (deps.hono) {
    signals.push({ file: 'hono dependency', exists: true, indicates: 'Hono API project' });
    return { type: 'hono', signals };
  }

  // Default to Node.js
  if (deps.typescript || (await pathExists(joinPath(projectPath, 'tsconfig.json')))) {
    signals.push({ file: 'tsconfig.json', exists: true, indicates: 'TypeScript project' });
    return { type: 'node', signals };
  }

  return { type: 'node', signals };
}

/**
 * Suggest preset based on project type
 */
function suggestPreset(
  projectType: ProjectType | undefined,
  packageJson: PackageJson
): PresetName | undefined {
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

  // Full-stack indicators
  const hasBackend =
    deps.express || deps.fastify || deps.hono || deps.koa || deps['@hono/node-server'];
  const hasFrontend = deps.react || deps.vue || deps.svelte || deps.astro || deps.next;
  const hasDatabase =
    deps.prisma || deps.drizzle || deps['drizzle-orm'] || deps.sequelize || deps.typeorm;

  if (hasBackend && hasFrontend) {
    return 'fullstack';
  }

  switch (projectType) {
    case 'astro':
    case 'nextjs':
    case 'vite-react':
      return 'frontend';

    case 'hono':
      return hasDatabase ? 'backend' : 'api-only';

    case 'monorepo':
      return 'fullstack';

    case 'node':
      if (hasBackend && hasDatabase) {
        return 'backend';
      }
      if (hasBackend) {
        return 'api-only';
      }
      return 'minimal';

    default:
      return 'minimal';
  }
}

/**
 * Get project name from package.json or directory
 */
export async function getProjectName(projectPath: string): Promise<string | undefined> {
  try {
    const packageJson = await readJson<PackageJson>(joinPath(projectPath, 'package.json'));
    return packageJson.name;
  } catch {
    // Return directory name
    const parts = projectPath.split('/');
    return parts[parts.length - 1];
  }
}

/**
 * Get project description from package.json
 */
export async function getProjectDescription(projectPath: string): Promise<string | undefined> {
  try {
    const packageJson = await readJson<PackageJson>(joinPath(projectPath, 'package.json'));
    return packageJson.description;
  } catch {
    return undefined;
  }
}

/**
 * Check if project has existing Claude configuration
 */
export async function hasExistingClaudeConfig(projectPath: string): Promise<boolean> {
  return pathExists(joinPath(projectPath, '.claude'));
}
