/**
 * Configuration writer - writes Claude config files
 */

import type { ClaudeConfig, PartialClaudeConfig } from '../../types/config.js';
import { backup, ensureDir, joinPath, pathExists, writeJson } from '../utils/fs.js';
import { logger } from '../utils/logger.js';
import { readConfig } from './reader.js';

const CONFIG_FILE = 'config.json';
const CLAUDE_DIR = '.claude';

/**
 * Write Claude configuration
 */
export async function writeConfig(
  projectPath: string,
  config: ClaudeConfig,
  options?: { backup?: boolean }
): Promise<void> {
  const claudePath = joinPath(projectPath, CLAUDE_DIR);
  const configPath = joinPath(claudePath, CONFIG_FILE);

  // Create .claude directory if needed
  await ensureDir(claudePath);

  // Backup existing config if requested
  if (options?.backup && (await pathExists(configPath))) {
    const backupPath = await backup(configPath, `.backup.${Date.now()}`);
    logger.debug(`Config backed up to: ${backupPath}`);
  }

  // Write config
  await writeJson(configPath, config, { spaces: 2 });
  logger.debug(`Config written to: ${configPath}`);
}

/**
 * Update existing configuration (merge)
 */
export async function updateConfig(
  projectPath: string,
  updates: PartialClaudeConfig
): Promise<ClaudeConfig | null> {
  const existing = await readConfig(projectPath);

  if (!existing) {
    logger.warn('No existing config to update');
    return null;
  }

  const updated = mergeConfig(existing, updates);
  updated.customizations.lastUpdated = new Date().toISOString();

  await writeConfig(projectPath, updated);
  return updated;
}

/**
 * Merge partial config into existing config
 */
export function mergeConfig(existing: ClaudeConfig, updates: PartialClaudeConfig): ClaudeConfig {
  return {
    version: updates.version || existing.version,
    templateSource: updates.templateSource || existing.templateSource,
    project: {
      ...existing.project,
      ...updates.project,
    },
    preferences: {
      ...existing.preferences,
      ...updates.preferences,
    },
    mcp: updates.mcp || existing.mcp,
    modules: {
      agents: updates.modules?.agents || existing.modules.agents,
      skills: updates.modules?.skills || existing.modules.skills,
      commands: updates.modules?.commands || existing.modules.commands,
      docs: updates.modules?.docs || existing.modules.docs,
    },
    extras: {
      ...existing.extras,
      ...updates.extras,
      hooks: updates.extras?.hooks || existing.extras.hooks,
    },
    scaffold: updates.scaffold || existing.scaffold,
    customizations: {
      ...existing.customizations,
      ...updates.customizations,
      lastUpdated: new Date().toISOString(),
    },
  };
}

/**
 * Create a default configuration
 */
export function createDefaultConfig(options: {
  version: string;
  projectInfo: ClaudeConfig['project'];
  preferences: ClaudeConfig['preferences'];
}): ClaudeConfig {
  return {
    version: options.version,
    templateSource: {
      type: 'local',
      installedAt: new Date().toISOString(),
    },
    project: options.projectInfo,
    preferences: options.preferences,
    mcp: {
      level: 'project',
      servers: [],
    },
    modules: {
      agents: { selected: [], excluded: [] },
      skills: { selected: [], excluded: [] },
      commands: { selected: [], excluded: [] },
      docs: { selected: [], excluded: [] },
    },
    extras: {
      schemas: false,
      scripts: false,
      hooks: { enabled: false },
      sessions: false,
    },
    scaffold: {
      type: 'claude-only',
      createdStructure: [],
    },
    customizations: {
      placeholdersReplaced: false,
      lastUpdated: new Date().toISOString(),
      customFiles: [],
    },
  };
}

/**
 * Add selected modules to config
 */
export function addModulesToConfig(
  config: ClaudeConfig,
  category: keyof ClaudeConfig['modules'],
  moduleIds: string[]
): ClaudeConfig {
  const existing = new Set(config.modules[category].selected);

  for (const id of moduleIds) {
    existing.add(id);
  }

  return {
    ...config,
    modules: {
      ...config.modules,
      [category]: {
        ...config.modules[category],
        selected: Array.from(existing),
      },
    },
  };
}

/**
 * Remove modules from config
 */
export function removeModulesFromConfig(
  config: ClaudeConfig,
  category: keyof ClaudeConfig['modules'],
  moduleIds: string[]
): ClaudeConfig {
  const toRemove = new Set(moduleIds);
  const remaining = config.modules[category].selected.filter((id) => !toRemove.has(id));

  return {
    ...config,
    modules: {
      ...config.modules,
      [category]: {
        ...config.modules[category],
        selected: remaining,
        excluded: [...config.modules[category].excluded, ...moduleIds],
      },
    },
  };
}

/**
 * Update MCP configuration
 */
export function updateMcpConfig(config: ClaudeConfig, mcp: ClaudeConfig['mcp']): ClaudeConfig {
  return {
    ...config,
    mcp,
  };
}

/**
 * Update extras configuration
 */
export function updateExtrasConfig(
  config: ClaudeConfig,
  extras: Partial<ClaudeConfig['extras']>
): ClaudeConfig {
  return {
    ...config,
    extras: {
      ...config.extras,
      ...extras,
    },
  };
}
