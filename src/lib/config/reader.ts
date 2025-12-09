/**
 * Configuration reader - reads Claude config files
 */

import type { ClaudeConfig, PartialClaudeConfig } from '../../types/config.js';
import { joinPath, pathExists, readJson } from '../utils/fs.js';
import { logger } from '../utils/logger.js';

const CONFIG_FILE = 'config.json';
const CLAUDE_DIR = '.claude';

/**
 * Read Claude configuration from a project
 */
export async function readConfig(projectPath: string): Promise<ClaudeConfig | null> {
  const configPath = joinPath(projectPath, CLAUDE_DIR, CONFIG_FILE);

  if (!(await pathExists(configPath))) {
    return null;
  }

  try {
    return await readJson<ClaudeConfig>(configPath);
  } catch (error) {
    logger.debug(`Failed to read config: ${error}`);
    return null;
  }
}

/**
 * Check if a Claude configuration exists
 */
export async function hasConfig(projectPath: string): Promise<boolean> {
  const configPath = joinPath(projectPath, CLAUDE_DIR, CONFIG_FILE);
  return pathExists(configPath);
}

/**
 * Check if Claude directory exists
 */
export async function hasClaudeDir(projectPath: string): Promise<boolean> {
  const claudePath = joinPath(projectPath, CLAUDE_DIR);
  return pathExists(claudePath);
}

/**
 * Get config file path
 */
export function getConfigPath(projectPath: string): string {
  return joinPath(projectPath, CLAUDE_DIR, CONFIG_FILE);
}

/**
 * Get Claude directory path
 */
export function getClaudeDirPath(projectPath: string): string {
  return joinPath(projectPath, CLAUDE_DIR);
}

/**
 * Read partial config (for updates/merges)
 */
export async function readPartialConfig(projectPath: string): Promise<PartialClaudeConfig | null> {
  return readConfig(projectPath) as Promise<PartialClaudeConfig | null>;
}

/**
 * Get installed module IDs from config
 */
export function getInstalledModulesFromConfig(config: ClaudeConfig): Record<string, string[]> {
  return {
    agents: config.modules.agents.selected,
    skills: config.modules.skills.selected,
    commands: config.modules.commands.selected,
    docs: config.modules.docs.selected,
  };
}

/**
 * Get config version
 */
export function getConfigVersion(config: ClaudeConfig): string {
  return config.version;
}

/**
 * Check if config needs migration
 */
export function needsMigration(config: ClaudeConfig, currentVersion: string): boolean {
  const configVersion = config.version;

  // Simple semver comparison
  const [configMajor, configMinor] = configVersion.split('.').map(Number);
  const [currentMajor, currentMinor] = currentVersion.split('.').map(Number);

  return configMajor < currentMajor || (configMajor === currentMajor && configMinor < currentMinor);
}
