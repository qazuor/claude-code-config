/**
 * Dependency checker - checks system dependencies
 */

import { exec } from 'node:child_process';
import * as os from 'node:os';
import { promisify } from 'node:util';
import { DEPENDENCIES, getDependenciesForFeature } from '../../constants/dependencies.js';
import type {
  DependencyCheckResult,
  DependencyInfo,
  DependencyReport,
  Platform,
} from '../../types/dependencies.js';
import { logger } from '../utils/logger.js';

const execAsync = promisify(exec);

/**
 * Get current platform
 */
export function getCurrentPlatform(): Platform {
  const platform = os.platform();
  switch (platform) {
    case 'darwin':
      return 'macos';
    case 'win32':
      return 'windows';
    default:
      return 'linux';
  }
}

/**
 * Check if a single dependency is installed
 */
export async function checkDependency(dep: DependencyInfo): Promise<DependencyCheckResult> {
  try {
    const { stdout } = await execAsync(dep.checkCommand);
    const version = extractVersion(stdout);

    return {
      id: dep.id,
      installed: true,
      version,
    };
  } catch (error) {
    return {
      id: dep.id,
      installed: false,
      error: error instanceof Error ? error.message : 'Check failed',
    };
  }
}

/**
 * Extract version from command output
 */
function extractVersion(output: string): string | undefined {
  // Common version patterns
  const patterns = [
    /(\d+\.\d+\.\d+)/, // 1.2.3
    /v(\d+\.\d+\.\d+)/, // v1.2.3
    /version\s+(\d+\.\d+\.\d+)/i, // version 1.2.3
  ];

  for (const pattern of patterns) {
    const match = output.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return undefined;
}

/**
 * Check all dependencies
 */
export async function checkAllDependencies(): Promise<DependencyReport> {
  const platform = getCurrentPlatform();
  const checked: DependencyCheckResult[] = [];
  const missing: DependencyInfo[] = [];
  const instructions = new Map<string, NonNullable<DependencyInfo['platforms'][Platform]>>();

  for (const dep of DEPENDENCIES) {
    const result = await checkDependency(dep);
    checked.push(result);

    if (!result.installed) {
      missing.push(dep);

      const platformInstructions = dep.platforms[platform];
      if (platformInstructions) {
        instructions.set(dep.id, platformInstructions);
      }
    }
  }

  return {
    checked,
    missing,
    instructions,
  };
}

/**
 * Check dependencies for specific features
 */
export async function checkFeatureDependencies(features: string[]): Promise<DependencyReport> {
  const platform = getCurrentPlatform();
  const checked: DependencyCheckResult[] = [];
  const missing: DependencyInfo[] = [];
  const instructions = new Map<string, NonNullable<DependencyInfo['platforms'][Platform]>>();

  // Get unique dependencies for all features
  const deps = new Set<DependencyInfo>();
  for (const feature of features) {
    const featureDeps = getDependenciesForFeature(feature);
    for (const dep of featureDeps) {
      deps.add(dep);
    }
  }

  for (const dep of deps) {
    const result = await checkDependency(dep);
    checked.push(result);

    if (!result.installed) {
      missing.push(dep);

      const platformInstructions = dep.platforms[platform];
      if (platformInstructions) {
        instructions.set(dep.id, platformInstructions);
      }
    }
  }

  return {
    checked,
    missing,
    instructions,
  };
}

/**
 * Get installation instructions for a dependency
 */
export function getInstallInstructions(dep: DependencyInfo, platform?: Platform): string[] {
  const targetPlatform = platform || getCurrentPlatform();
  const instructions = dep.platforms[targetPlatform];

  if (!instructions) {
    return [`No installation instructions available for ${targetPlatform}`];
  }

  return instructions.commands;
}

/**
 * Format dependency report for display
 */
export function formatDependencyReport(report: DependencyReport): void {
  if (report.missing.length === 0) {
    logger.success('All dependencies are installed');
    return;
  }

  logger.warn(`Missing ${report.missing.length} dependencies:`);
  logger.newline();

  for (const dep of report.missing) {
    logger.subtitle(dep.name);
    logger.note(dep.description);
    logger.note(`Required for: ${dep.requiredFor.join(', ')}`);

    const instructions = report.instructions.get(dep.id);
    if (instructions) {
      logger.newline();
      logger.info('Installation:');
      for (const cmd of instructions.commands) {
        logger.raw(`  ${cmd}`);
      }
      if (instructions.notes) {
        logger.note(instructions.notes);
      }
    }
    logger.newline();
  }
}

/**
 * Get required features based on configuration
 */
export function getRequiredFeatures(config: {
  hooks?: { enabled?: boolean; notification?: { audio?: boolean; desktop?: boolean } };
  mcp?: { servers?: Array<{ serverId: string }> };
}): string[] {
  const features: string[] = [];

  if (config.hooks?.enabled) {
    features.push('hooks');

    if (config.hooks.notification?.audio) {
      features.push('hook:notification:audio');
    }
    if (config.hooks.notification?.desktop) {
      features.push('hook:notification:desktop');
    }
  }

  if (config.mcp?.servers && config.mcp.servers.length > 0) {
    features.push('mcp-servers');
  }

  return features;
}

/**
 * Result of dependency installation attempt
 */
export interface DependencyInstallResult {
  dep: DependencyInfo;
  success: boolean;
  error?: string;
}

/**
 * Try to install a single dependency
 */
export async function installDependency(dep: DependencyInfo): Promise<DependencyInstallResult> {
  const platform = getCurrentPlatform();
  const platformInstructions = dep.platforms[platform];

  if (!platformInstructions) {
    return {
      dep,
      success: false,
      error: `No installation instructions for ${platform}`,
    };
  }

  // Get the first install command (usually the most common method)
  const installCommand = platformInstructions.commands[0];
  if (!installCommand) {
    return {
      dep,
      success: false,
      error: 'No install command available',
    };
  }

  try {
    await execAsync(installCommand, { timeout: 120000 }); // 2 min timeout

    // Verify installation
    const checkResult = await checkDependency(dep);
    if (checkResult.installed) {
      return { dep, success: true };
    }

    return {
      dep,
      success: false,
      error: 'Installation completed but dependency not found',
    };
  } catch (error) {
    return {
      dep,
      success: false,
      error: error instanceof Error ? error.message : 'Installation failed',
    };
  }
}

/**
 * Install multiple dependencies
 */
export async function installDependencies(
  deps: DependencyInfo[],
  options?: {
    onProgress?: (dep: DependencyInfo, index: number, total: number) => void;
  }
): Promise<DependencyInstallResult[]> {
  const results: DependencyInstallResult[] = [];

  for (let i = 0; i < deps.length; i++) {
    const dep = deps[i];
    if (options?.onProgress) {
      options.onProgress(dep, i, deps.length);
    }

    const result = await installDependency(dep);
    results.push(result);
  }

  return results;
}

/**
 * Format installation instructions for manual installation
 */
export function formatManualInstallInstructions(report: DependencyReport): string[] {
  const lines: string[] = [];

  lines.push('');
  lines.push('To install the missing dependencies manually, run the following commands:');
  lines.push('');

  for (const dep of report.missing) {
    const instructions = report.instructions.get(dep.id);
    if (instructions) {
      lines.push(`# ${dep.name}`);
      for (const cmd of instructions.commands) {
        lines.push(cmd);
      }
      lines.push('');
    }
  }

  return lines;
}
