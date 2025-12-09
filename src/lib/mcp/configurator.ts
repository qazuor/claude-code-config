/**
 * MCP configurator - generates MCP server configuration
 */

import * as os from 'node:os';
import { MCP_SERVERS, getMcpServer } from '../../constants/mcp-servers.js';
import type { McpConfig, McpInstallation } from '../../types/config.js';
import type { McpServerDefinition } from '../../types/mcp.js';
import { ensureDir, joinPath, pathExists, readJson, writeJson } from '../utils/fs.js';
import { logger } from '../utils/logger.js';

const PROJECT_SETTINGS_FILE = '.claude/settings.local.json';
const USER_SETTINGS_FILE = '.claude/settings.json';

interface SettingsJson {
  mcpServers?: Record<string, McpServerEntry>;
  permissions?: {
    allow?: string[];
    deny?: string[];
  };
  [key: string]: unknown;
}

interface McpServerEntry {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

/**
 * Install MCP servers configuration
 */
export async function installMcpServers(
  projectPath: string,
  config: McpConfig
): Promise<{ success: boolean; path: string; errors: string[] }> {
  const errors: string[] = [];

  if (config.servers.length === 0) {
    return { success: true, path: '', errors };
  }

  // Determine settings file path
  const settingsPath =
    config.level === 'user'
      ? joinPath(os.homedir(), USER_SETTINGS_FILE)
      : joinPath(projectPath, PROJECT_SETTINGS_FILE);

  try {
    // Ensure directory exists
    const dir = settingsPath.substring(0, settingsPath.lastIndexOf('/'));
    await ensureDir(dir);

    // Read existing settings or create new
    let settings: SettingsJson = {};
    if (await pathExists(settingsPath)) {
      try {
        settings = await readJson<SettingsJson>(settingsPath);
      } catch {
        // Start with empty settings
      }
    }

    // Initialize mcpServers if needed
    if (!settings.mcpServers) {
      settings.mcpServers = {};
    }

    // Add server configurations
    for (const installation of config.servers) {
      try {
        const entry = generateServerEntry(installation);
        if (entry) {
          settings.mcpServers[installation.serverId] = entry;
        }
      } catch (error) {
        errors.push(`${installation.serverId}: ${error}`);
      }
    }

    // Write settings
    await writeJson(settingsPath, settings, { spaces: 2 });

    return { success: errors.length === 0, path: settingsPath, errors };
  } catch (error) {
    return {
      success: false,
      path: settingsPath,
      errors: [`Failed to write settings: ${error}`],
    };
  }
}

/**
 * Generate MCP server entry for settings.json
 */
function generateServerEntry(installation: McpInstallation): McpServerEntry | null {
  const serverDef = getMcpServer(installation.serverId);

  // For known servers, use the package name
  const packageName = serverDef?.package || (installation.config.package as string);

  if (!packageName) {
    return null;
  }

  const entry: McpServerEntry = {
    command: 'npx',
    args: ['-y', packageName],
  };

  // Add environment variables from config
  const env: Record<string, string> = {};

  if (serverDef?.configFields) {
    for (const field of serverDef.configFields) {
      const value = installation.config[field.name];
      if (value !== undefined && field.envVar) {
        env[field.envVar] = String(value);
      }
    }
  }

  // Add any additional config as env vars
  for (const [key, value] of Object.entries(installation.config)) {
    if (key === 'package') continue;

    // Convert config key to env var format if not already an env var
    const envKey = key.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    if (!env[envKey] && value !== undefined) {
      env[envKey] = String(value);
    }
  }

  if (Object.keys(env).length > 0) {
    entry.env = env;
  }

  return entry;
}

/**
 * Get currently installed MCP servers
 */
export async function getInstalledMcpServers(
  projectPath: string
): Promise<{ project: string[]; user: string[] }> {
  const result = { project: [] as string[], user: [] as string[] };

  // Check project settings
  const projectSettings = joinPath(projectPath, PROJECT_SETTINGS_FILE);
  if (await pathExists(projectSettings)) {
    try {
      const settings = await readJson<SettingsJson>(projectSettings);
      result.project = Object.keys(settings.mcpServers || {});
    } catch {
      // Ignore
    }
  }

  // Check user settings
  const userSettings = joinPath(os.homedir(), USER_SETTINGS_FILE);
  if (await pathExists(userSettings)) {
    try {
      const settings = await readJson<SettingsJson>(userSettings);
      result.user = Object.keys(settings.mcpServers || {});
    } catch {
      // Ignore
    }
  }

  return result;
}

/**
 * Remove MCP server from configuration
 */
export async function removeMcpServer(
  projectPath: string,
  serverId: string,
  level: 'user' | 'project'
): Promise<boolean> {
  const settingsPath =
    level === 'user'
      ? joinPath(os.homedir(), USER_SETTINGS_FILE)
      : joinPath(projectPath, PROJECT_SETTINGS_FILE);

  if (!(await pathExists(settingsPath))) {
    return false;
  }

  try {
    const settings = await readJson<SettingsJson>(settingsPath);

    if (!settings.mcpServers || !settings.mcpServers[serverId]) {
      return false;
    }

    delete settings.mcpServers[serverId];
    await writeJson(settingsPath, settings, { spaces: 2 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get available MCP servers (grouped by category)
 */
export function getAvailableMcpServers(): Record<string, McpServerDefinition[]> {
  const grouped: Record<string, McpServerDefinition[]> = {};

  for (const server of MCP_SERVERS) {
    if (!grouped[server.category]) {
      grouped[server.category] = [];
    }
    grouped[server.category].push(server);
  }

  return grouped;
}

/**
 * Validate MCP server configuration
 */
export function validateMcpConfig(installation: McpInstallation): {
  valid: boolean;
  missing: string[];
} {
  const serverDef = getMcpServer(installation.serverId);

  if (!serverDef) {
    // Custom server - just check it has a package
    return {
      valid: !!installation.config.package,
      missing: installation.config.package ? [] : ['package'],
    };
  }

  const missing: string[] = [];

  if (serverDef.requiresConfig && serverDef.configFields) {
    for (const field of serverDef.configFields) {
      if (field.required && !installation.config[field.name]) {
        missing.push(field.name);
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
