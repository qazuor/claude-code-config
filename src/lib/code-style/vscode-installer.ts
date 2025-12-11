/**
 * VSCode settings.json generator for code style tools
 */

import type { CodeStyleConfig } from '../../types/config.js';
import { ensureDir, joinPath, pathExists, readFile, writeFile } from '../utils/fs.js';
import { logger } from '../utils/logger.js';

export interface VSCodeSettings {
  [key: string]: unknown;
}

export interface VSCodeInstallResult {
  /** Whether settings file was created */
  created: boolean;
  /** Whether settings file was updated */
  updated: boolean;
  /** Whether settings file was skipped */
  skipped: boolean;
  /** Path to the file */
  path: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Generate VSCode settings for code style tools
 */
export function generateVSCodeSettings(config: CodeStyleConfig): VSCodeSettings {
  const settings: VSCodeSettings = {};

  if (config.biome) {
    // Set Biome as the default formatter
    settings['editor.defaultFormatter'] = 'biomejs.biome';
    settings['editor.formatOnSave'] = true;

    // Language-specific settings for Biome
    settings['[javascript]'] = {
      'editor.defaultFormatter': 'biomejs.biome',
    };
    settings['[javascriptreact]'] = {
      'editor.defaultFormatter': 'biomejs.biome',
    };
    settings['[typescript]'] = {
      'editor.defaultFormatter': 'biomejs.biome',
    };
    settings['[typescriptreact]'] = {
      'editor.defaultFormatter': 'biomejs.biome',
    };
    settings['[json]'] = {
      'editor.defaultFormatter': 'biomejs.biome',
    };
    settings['[jsonc]'] = {
      'editor.defaultFormatter': 'biomejs.biome',
    };

    // Disable ESLint if using Biome for linting
    settings['eslint.enable'] = false;

    // Biome extension settings
    settings['biome.enabled'] = true;
    settings['biome.lintOnSave'] = true;
  }

  if (config.prettier && !config.biome) {
    // Set Prettier as the default formatter (only if Biome is not enabled)
    settings['editor.defaultFormatter'] = 'esbenp.prettier-vscode';
    settings['editor.formatOnSave'] = true;

    // Language-specific settings for Prettier
    settings['[javascript]'] = {
      'editor.defaultFormatter': 'esbenp.prettier-vscode',
    };
    settings['[javascriptreact]'] = {
      'editor.defaultFormatter': 'esbenp.prettier-vscode',
    };
    settings['[typescript]'] = {
      'editor.defaultFormatter': 'esbenp.prettier-vscode',
    };
    settings['[typescriptreact]'] = {
      'editor.defaultFormatter': 'esbenp.prettier-vscode',
    };
    settings['[json]'] = {
      'editor.defaultFormatter': 'esbenp.prettier-vscode',
    };
    settings['[markdown]'] = {
      'editor.defaultFormatter': 'esbenp.prettier-vscode',
    };
  }

  // EditorConfig is automatically picked up by VSCode with the extension
  if (config.editorconfig) {
    settings['editor.detectIndentation'] = false;
  }

  return settings;
}

/**
 * Generate VSCode extensions recommendations
 */
export function generateVSCodeExtensions(config: CodeStyleConfig): { recommendations: string[] } {
  const recommendations: string[] = [];

  if (config.biome) {
    recommendations.push('biomejs.biome');
  }

  if (config.prettier && !config.biome) {
    recommendations.push('esbenp.prettier-vscode');
  }

  if (config.editorconfig) {
    recommendations.push('EditorConfig.EditorConfig');
  }

  // Always recommend these for TypeScript projects
  recommendations.push('dbaeumer.vscode-eslint'); // In case they want to use it later

  return { recommendations };
}

/**
 * Install VSCode settings.json
 */
export async function installVSCodeSettings(
  projectPath: string,
  config: CodeStyleConfig,
  options?: { overwrite?: boolean; merge?: boolean }
): Promise<VSCodeInstallResult> {
  if (!config.enabled) {
    return {
      created: false,
      updated: false,
      skipped: true,
      path: '',
    };
  }

  const vscodeDir = joinPath(projectPath, '.vscode');
  const settingsPath = joinPath(vscodeDir, 'settings.json');

  try {
    // Generate new settings
    const newSettings = generateVSCodeSettings(config);

    // Check if file exists
    const exists = await pathExists(settingsPath);

    if (exists) {
      if (options?.merge) {
        // Merge with existing settings
        const existingContent = await readFile(settingsPath);
        let existingSettings: VSCodeSettings = {};
        try {
          existingSettings = JSON.parse(existingContent);
        } catch {
          logger.warn('Could not parse existing settings.json, will overwrite');
        }

        const mergedSettings = { ...existingSettings, ...newSettings };
        await writeFile(settingsPath, JSON.stringify(mergedSettings, null, 2));

        return {
          created: false,
          updated: true,
          skipped: false,
          path: settingsPath,
        };
      }

      if (!options?.overwrite) {
        return {
          created: false,
          updated: false,
          skipped: true,
          path: settingsPath,
        };
      }
    }

    // Ensure .vscode directory exists
    await ensureDir(vscodeDir);

    // Write settings file
    await writeFile(settingsPath, JSON.stringify(newSettings, null, 2));

    return {
      created: !exists,
      updated: exists,
      skipped: false,
      path: settingsPath,
    };
  } catch (error) {
    return {
      created: false,
      updated: false,
      skipped: false,
      path: settingsPath,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Install VSCode extensions.json
 */
export async function installVSCodeExtensions(
  projectPath: string,
  config: CodeStyleConfig,
  options?: { overwrite?: boolean; merge?: boolean }
): Promise<VSCodeInstallResult> {
  if (!config.enabled) {
    return {
      created: false,
      updated: false,
      skipped: true,
      path: '',
    };
  }

  const vscodeDir = joinPath(projectPath, '.vscode');
  const extensionsPath = joinPath(vscodeDir, 'extensions.json');

  try {
    // Generate extensions
    const newExtensions = generateVSCodeExtensions(config);

    // Check if file exists
    const exists = await pathExists(extensionsPath);

    if (exists) {
      if (options?.merge) {
        // Merge with existing extensions
        const existingContent = await readFile(extensionsPath);
        let existingExtensions: { recommendations: string[] } = { recommendations: [] };
        try {
          existingExtensions = JSON.parse(existingContent);
        } catch {
          logger.warn('Could not parse existing extensions.json, will overwrite');
        }

        const mergedRecommendations = [
          ...new Set([
            ...(existingExtensions.recommendations || []),
            ...newExtensions.recommendations,
          ]),
        ];
        await writeFile(
          extensionsPath,
          JSON.stringify({ recommendations: mergedRecommendations }, null, 2)
        );

        return {
          created: false,
          updated: true,
          skipped: false,
          path: extensionsPath,
        };
      }

      if (!options?.overwrite) {
        return {
          created: false,
          updated: false,
          skipped: true,
          path: extensionsPath,
        };
      }
    }

    // Ensure .vscode directory exists
    await ensureDir(vscodeDir);

    // Write extensions file
    await writeFile(extensionsPath, JSON.stringify(newExtensions, null, 2));

    return {
      created: !exists,
      updated: exists,
      skipped: false,
      path: extensionsPath,
    };
  } catch (error) {
    return {
      created: false,
      updated: false,
      skipped: false,
      path: extensionsPath,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Install all VSCode configuration files
 */
export async function installVSCodeConfig(
  projectPath: string,
  config: CodeStyleConfig,
  options?: { overwrite?: boolean; merge?: boolean }
): Promise<{
  settings: VSCodeInstallResult;
  extensions: VSCodeInstallResult;
}> {
  const [settingsResult, extensionsResult] = await Promise.all([
    installVSCodeSettings(projectPath, config, options),
    installVSCodeExtensions(projectPath, config, options),
  ]);

  return {
    settings: settingsResult,
    extensions: extensionsResult,
  };
}
