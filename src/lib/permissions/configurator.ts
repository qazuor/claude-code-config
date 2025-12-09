/**
 * Permissions configurator - generates Claude Code permission settings
 */

import * as os from 'node:os';
import {
  PERMISSION_PRESETS,
  generateAllowRules,
  generateDenyRules,
} from '../../constants/permissions.js';
import type { PermissionsConfig } from '../../types/permissions.js';
import { ensureDir, joinPath, pathExists, readJson, writeJson } from '../utils/fs.js';

const PROJECT_SETTINGS_FILE = '.claude/settings.local.json';
const USER_SETTINGS_FILE = '.claude/settings.json';

interface SettingsJson {
  mcpServers?: Record<string, unknown>;
  permissions?: {
    allow?: string[];
    deny?: string[];
  };
  includeCoAuthoredBy?: boolean;
  [key: string]: unknown;
}

/**
 * Install permissions configuration
 */
export async function installPermissions(
  projectPath: string,
  config: PermissionsConfig,
  level: 'user' | 'project' = 'project'
): Promise<{ success: boolean; path: string; errors: string[] }> {
  const errors: string[] = [];

  const settingsPath =
    level === 'user'
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

    // Generate permission rules
    const allowRules = generateAllowRules(config);
    const denyRules = generateDenyRules(config);

    // Set permissions
    settings.permissions = {
      allow: allowRules,
      deny: denyRules,
    };

    // Write settings
    await writeJson(settingsPath, settings, { spaces: 2 });

    return { success: true, path: settingsPath, errors };
  } catch (error) {
    return {
      success: false,
      path: settingsPath,
      errors: [`Failed to write permissions: ${error}`],
    };
  }
}

/**
 * Get current permissions from settings
 */
export async function getCurrentPermissions(
  projectPath: string
): Promise<{ project: SettingsJson['permissions']; user: SettingsJson['permissions'] }> {
  const result = {
    project: undefined as SettingsJson['permissions'],
    user: undefined as SettingsJson['permissions'],
  };

  // Check project settings
  const projectSettings = joinPath(projectPath, PROJECT_SETTINGS_FILE);
  if (await pathExists(projectSettings)) {
    try {
      const settings = await readJson<SettingsJson>(projectSettings);
      result.project = settings.permissions;
    } catch {
      // Ignore
    }
  }

  // Check user settings
  const userSettings = joinPath(os.homedir(), USER_SETTINGS_FILE);
  if (await pathExists(userSettings)) {
    try {
      const settings = await readJson<SettingsJson>(userSettings);
      result.user = settings.permissions;
    } catch {
      // Ignore
    }
  }

  return result;
}

/**
 * Set co-author setting
 */
export async function setCoAuthorSetting(
  projectPath: string,
  includeCoAuthor: boolean,
  level: 'user' | 'project' = 'project'
): Promise<boolean> {
  const settingsPath =
    level === 'user'
      ? joinPath(os.homedir(), USER_SETTINGS_FILE)
      : joinPath(projectPath, PROJECT_SETTINGS_FILE);

  try {
    const dir = settingsPath.substring(0, settingsPath.lastIndexOf('/'));
    await ensureDir(dir);

    let settings: SettingsJson = {};
    if (await pathExists(settingsPath)) {
      try {
        settings = await readJson<SettingsJson>(settingsPath);
      } catch {
        // Start fresh
      }
    }

    settings.includeCoAuthoredBy = includeCoAuthor;
    await writeJson(settingsPath, settings, { spaces: 2 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Merge permissions with existing settings
 */
export async function mergePermissions(
  projectPath: string,
  additionalAllow: string[],
  additionalDeny: string[],
  level: 'user' | 'project' = 'project'
): Promise<boolean> {
  const settingsPath =
    level === 'user'
      ? joinPath(os.homedir(), USER_SETTINGS_FILE)
      : joinPath(projectPath, PROJECT_SETTINGS_FILE);

  try {
    let settings: SettingsJson = {};
    if (await pathExists(settingsPath)) {
      settings = await readJson<SettingsJson>(settingsPath);
    }

    const existingAllow = settings.permissions?.allow || [];
    const existingDeny = settings.permissions?.deny || [];

    settings.permissions = {
      allow: [...new Set([...existingAllow, ...additionalAllow])],
      deny: [...new Set([...existingDeny, ...additionalDeny])],
    };

    await writeJson(settingsPath, settings, { spaces: 2 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Reset permissions to a preset
 */
export async function resetPermissionsToPreset(
  projectPath: string,
  preset: keyof typeof PERMISSION_PRESETS,
  level: 'user' | 'project' = 'project'
): Promise<boolean> {
  const presetConfig = PERMISSION_PRESETS[preset];

  const config: PermissionsConfig = {
    preset,
    files: presetConfig.files,
    git: presetConfig.git,
    bash: presetConfig.bash,
    web: presetConfig.web,
    custom: { allow: [], deny: [] },
  };

  const result = await installPermissions(projectPath, config, level);
  return result.success;
}

/**
 * Analyze current permissions and suggest improvements
 */
export function analyzePermissions(config: PermissionsConfig): {
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check for dangerous permissions
  if (config.bash.arbitrary) {
    warnings.push('Arbitrary bash commands are allowed - this gives Claude full shell access');
  }

  if (config.git.push) {
    warnings.push('Git push is allowed - Claude can push changes to remote repositories');
  }

  if (config.files.writeOther) {
    warnings.push('Writing to non-code files is allowed - includes CSS, HTML, SQL, etc.');
  }

  // Suggestions based on common patterns
  if (config.bash.testing && !config.bash.packageManager) {
    suggestions.push('Consider enabling package manager for installing test dependencies');
  }

  if (config.files.writeCode && !config.files.editTool) {
    suggestions.push('Consider enabling Edit tool for more efficient code modifications');
  }

  if (!config.git.readOnly) {
    suggestions.push('Git read operations are disabled - Claude cannot show diffs or status');
  }

  return { warnings, suggestions };
}
