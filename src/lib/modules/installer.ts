/**
 * Module installer - copies and configures module files
 */

import type { ModuleCategory, ModuleDefinition } from '../../types/modules.js';
import {
  copy,
  dirname,
  ensureDir,
  joinPath,
  pathExists,
  readFile,
  writeFile,
} from '../utils/fs.js';
import { logger } from '../utils/logger.js';
import { withSpinner } from '../utils/spinner.js';

/**
 * Remove config_required section from YAML frontmatter in markdown files
 * This cleans up template files after installation
 */
export function removeConfigRequiredFromFrontmatter(content: string): string {
  // Match YAML frontmatter (starts with ---, ends with ---)
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return content;
  }

  const frontmatter = match[1];

  // Remove config_required section from frontmatter
  // It can be multi-line with indented items like:
  // config_required:
  //   - KEY: "description"
  //   - KEY2: "description2"
  // The regex needs to match the key and all following indented lines
  const configRequiredRegex = /config_required:\s*\n(?:\s+-\s+[^\n]+\n?)*/g;
  const cleanedFrontmatter = frontmatter.replace(configRequiredRegex, '').trim();

  // Reconstruct the file
  const restOfFile = content.slice(match[0].length);

  // If frontmatter is now empty except for required fields, keep it minimal
  if (cleanedFrontmatter.trim() === '') {
    return restOfFile.trim();
  }

  return `---\n${cleanedFrontmatter}\n---${restOfFile}`;
}

/**
 * Process a module file after copying to clean up config_required
 */
async function processModuleFile(filePath: string): Promise<void> {
  // Only process markdown files
  if (!filePath.endsWith('.md')) {
    return;
  }

  try {
    const content = await readFile(filePath);
    const cleanedContent = removeConfigRequiredFromFrontmatter(content);

    // Only write if content changed
    if (cleanedContent !== content) {
      await writeFile(filePath, cleanedContent);
      logger.debug(`Cleaned config_required from: ${filePath}`);
    }
  } catch (error) {
    logger.debug(`Failed to process module file ${filePath}: ${error}`);
  }
}

export interface InstallOptions {
  templatesPath: string;
  targetPath: string;
  overwrite?: boolean;
  dryRun?: boolean;
}

export interface InstallResult {
  success: boolean;
  installed: string[];
  skipped: string[];
  failed: Array<{ id: string; error: string }>;
}

/**
 * Install modules for a category
 */
export async function installModules(
  category: ModuleCategory,
  modules: ModuleDefinition[],
  options: InstallOptions
): Promise<InstallResult> {
  const result: InstallResult = {
    success: true,
    installed: [],
    skipped: [],
    failed: [],
  };

  const categorySourcePath = joinPath(options.templatesPath, category);
  const categoryTargetPath = joinPath(options.targetPath, '.claude', category);

  // Ensure target directory exists
  if (!options.dryRun) {
    await ensureDir(categoryTargetPath);
  }

  for (const module of modules) {
    try {
      const sourcePath = joinPath(categorySourcePath, module.file);
      const targetPath = joinPath(categoryTargetPath, module.file);

      // Check if source exists
      if (!(await pathExists(sourcePath))) {
        result.failed.push({ id: module.id, error: `Source file not found: ${sourcePath}` });
        result.success = false;
        continue;
      }

      // Check if target exists
      const targetExists = await pathExists(targetPath);
      if (targetExists && !options.overwrite) {
        result.skipped.push(module.id);
        continue;
      }

      if (options.dryRun) {
        logger.debug(`Would install: ${module.id} -> ${targetPath}`);
        result.installed.push(module.id);
        continue;
      }

      // Ensure target directory exists
      await ensureDir(dirname(targetPath));

      // Copy file
      await copy(sourcePath, targetPath, { overwrite: options.overwrite });

      // Process the file to clean up config_required
      await processModuleFile(targetPath);

      result.installed.push(module.id);

      logger.debug(`Installed: ${module.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.failed.push({ id: module.id, error: errorMessage });
      result.success = false;
    }
  }

  return result;
}

/**
 * Install README file for a category
 */
async function installCategoryReadme(
  category: ModuleCategory,
  options: InstallOptions
): Promise<void> {
  const sourceReadme = joinPath(options.templatesPath, category, 'README.md');
  const targetReadme = joinPath(options.targetPath, '.claude', category, 'README.md');

  // Check if source README exists
  if (!(await pathExists(sourceReadme))) {
    logger.debug(`No README found for category: ${category}`);
    return;
  }

  // Check if target exists
  const targetExists = await pathExists(targetReadme);
  if (targetExists && !options.overwrite) {
    logger.debug(`README already exists for ${category}, skipping`);
    return;
  }

  if (options.dryRun) {
    logger.debug(`Would install README for ${category}`);
    return;
  }

  try {
    await copy(sourceReadme, targetReadme, { overwrite: options.overwrite });
    logger.debug(`Installed README for ${category}`);
  } catch (error) {
    logger.debug(`Failed to install README for ${category}: ${error}`);
  }
}

/**
 * Install all modules with progress tracking
 */
export async function installAllModules(
  modulesByCategory: Record<ModuleCategory, ModuleDefinition[]>,
  options: InstallOptions
): Promise<Record<ModuleCategory, InstallResult>> {
  const results: Record<ModuleCategory, InstallResult> = {} as Record<
    ModuleCategory,
    InstallResult
  >;
  const categories: ModuleCategory[] = ['agents', 'skills', 'commands', 'docs'];

  for (const category of categories) {
    const modules = modulesByCategory[category] || [];
    if (modules.length === 0) {
      results[category] = {
        success: true,
        installed: [],
        skipped: [],
        failed: [],
      };
      continue;
    }

    results[category] = await withSpinner(
      `Installing ${category} (${modules.length} modules)...`,
      () => installModules(category, modules, options),
      {
        successText: `Installed ${modules.length} ${category}`,
        silent: options.dryRun,
      }
    );

    // Install README for this category
    await installCategoryReadme(category, options);
  }

  return results;
}

/**
 * Uninstall a module
 */
export async function uninstallModule(
  category: ModuleCategory,
  moduleId: string,
  targetPath: string
): Promise<{ success: boolean; error?: string }> {
  const { remove } = await import('../utils/fs.js');

  try {
    const modulePath = joinPath(targetPath, '.claude', category, `${moduleId}.md`);

    if (!(await pathExists(modulePath))) {
      return { success: false, error: 'Module file not found' };
    }

    await remove(modulePath);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if a module is installed
 */
export async function isModuleInstalled(
  category: ModuleCategory,
  moduleId: string,
  targetPath: string
): Promise<boolean> {
  // Try common file patterns
  const patterns = [
    joinPath(targetPath, '.claude', category, `${moduleId}.md`),
    joinPath(targetPath, '.claude', category, '**', `${moduleId}.md`),
  ];

  for (const pattern of patterns) {
    if (await pathExists(pattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Get installed modules for a category
 */
export async function getInstalledModules(
  category: ModuleCategory,
  targetPath: string
): Promise<string[]> {
  const { listFiles } = await import('../utils/fs.js');

  const categoryPath = joinPath(targetPath, '.claude', category);
  if (!(await pathExists(categoryPath))) {
    return [];
  }

  const files = await listFiles('**/*.md', { cwd: categoryPath });
  return files
    .filter((f) => !f.startsWith('_') && f !== 'README.md')
    .map((f) => {
      const parts = f.replace(/\.md$/, '').split('/');
      return parts[parts.length - 1] ?? '';
    })
    .filter(Boolean);
}

/**
 * Copy extra files (schemas, scripts, hooks, sessions)
 */
export async function installExtras(
  extras: { schemas?: boolean; scripts?: boolean; hooks?: boolean; sessions?: boolean },
  options: InstallOptions
): Promise<InstallResult> {
  const result: InstallResult = {
    success: true,
    installed: [],
    skipped: [],
    failed: [],
  };

  const extraDirs = [
    { name: 'schemas', enabled: extras.schemas },
    { name: 'scripts', enabled: extras.scripts },
    { name: 'hooks', enabled: extras.hooks },
    { name: 'sessions', enabled: extras.sessions },
  ];

  for (const { name, enabled } of extraDirs) {
    if (!enabled) continue;

    const sourcePath = joinPath(options.templatesPath, name);
    const targetPath = joinPath(options.targetPath, '.claude', name);

    if (!(await pathExists(sourcePath))) {
      logger.debug(`Extra directory not found: ${sourcePath}`);
      continue;
    }

    try {
      if (options.dryRun) {
        logger.debug(`Would copy: ${name} -> ${targetPath}`);
        result.installed.push(name);
        continue;
      }

      const targetExists = await pathExists(targetPath);
      if (targetExists && !options.overwrite) {
        result.skipped.push(name);
        continue;
      }

      await copy(sourcePath, targetPath, { overwrite: options.overwrite });
      result.installed.push(name);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.failed.push({ id: name, error: errorMessage });
      result.success = false;
    }
  }

  return result;
}
