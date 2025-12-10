/**
 * Module registry - reads and manages module definitions from templates
 */

import type {
  ModuleCategory,
  ModuleDefinition,
  ModuleRegistry,
  RegistryFile,
} from '../../types/modules.js';
import { joinPath, listDirs, pathExists, readJson } from '../utils/fs.js';
import { logger } from '../utils/logger.js';

const REGISTRY_FILE = '_registry.json';

/**
 * Load module registry from a templates directory
 */
export async function loadRegistry(templatesPath: string): Promise<ModuleRegistry> {
  const registry: ModuleRegistry = {
    agents: [],
    skills: [],
    commands: [],
    docs: [],
  };

  const categories: ModuleCategory[] = ['agents', 'skills', 'commands', 'docs'];

  for (const category of categories) {
    const categoryPath = joinPath(templatesPath, category);

    if (!(await pathExists(categoryPath))) {
      logger.debug(`Category path not found: ${categoryPath}`);
      continue;
    }

    const modules = await loadCategoryModules(categoryPath, category);
    registry[category] = modules;
  }

  return registry;
}

/**
 * Load modules for a specific category
 */
async function loadCategoryModules(
  categoryPath: string,
  category: ModuleCategory
): Promise<ModuleDefinition[]> {
  const registryPath = joinPath(categoryPath, REGISTRY_FILE);

  // Try to load from _registry.json first
  if (await pathExists(registryPath)) {
    try {
      const registryFile = await readJson<RegistryFile>(registryPath);
      return registryFile.modules.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        category,
        file: item.file,
        dependencies: item.dependencies || [],
        tags: item.tags || [],
      }));
    } catch (error) {
      logger.debug(`Failed to load registry from ${registryPath}: ${error}`);
    }
  }

  // Fallback: scan directory for .md files
  return scanCategoryDirectory(categoryPath, category);
}

/**
 * Scan directory for module files when no registry exists
 */
async function scanCategoryDirectory(
  categoryPath: string,
  category: ModuleCategory
): Promise<ModuleDefinition[]> {
  const modules: ModuleDefinition[] = [];

  // Get subdirectories (groups like 'engineering', 'quality', etc.)
  const subdirs = await listDirs('*', { cwd: categoryPath });

  for (const subdir of subdirs) {
    if (subdir.startsWith('_')) continue; // Skip special directories

    const subdirPath = joinPath(categoryPath, subdir);
    const files = await scanForModuleFiles(subdirPath);

    for (const file of files) {
      const id = file.replace('.md', '');
      modules.push({
        id,
        name: formatName(id),
        description: '',
        category,
        file: `${subdir}/${file}`,
        dependencies: [],
        tags: [subdir],
      });
    }
  }

  // Also scan root of category
  const rootFiles = await scanForModuleFiles(categoryPath);
  for (const file of rootFiles) {
    if (file === REGISTRY_FILE) continue;

    const id = file.replace('.md', '');
    modules.push({
      id,
      name: formatName(id),
      description: '',
      category,
      file,
      dependencies: [],
      tags: [],
    });
  }

  return modules;
}

/**
 * Scan a directory for module files (.md)
 */
async function scanForModuleFiles(dirPath: string): Promise<string[]> {
  const { glob } = await import('glob');
  const files = await glob('*.md', { cwd: dirPath });
  return files.filter((f) => !f.startsWith('_') && f !== 'README.md');
}

/**
 * Format ID to display name
 */
function formatName(id: string): string {
  return id
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get module by ID from registry
 */
export function getModule(
  registry: ModuleRegistry,
  category: ModuleCategory,
  id: string
): ModuleDefinition | undefined {
  return registry[category].find((m) => m.id === id);
}

/**
 * Get all modules from registry
 */
export function getAllModules(registry: ModuleRegistry): ModuleDefinition[] {
  return [...registry.agents, ...registry.skills, ...registry.commands, ...registry.docs];
}

/**
 * Get modules by tag
 */
export function getModulesByTag(
  registry: ModuleRegistry,
  category: ModuleCategory,
  tag: string
): ModuleDefinition[] {
  return registry[category].filter((m) => m.tags?.includes(tag));
}

/**
 * Filter modules by IDs or tags
 * Presets use tags (e.g., 'core', 'quality'), so we match both IDs and tags
 */
export function filterModules(
  registry: ModuleRegistry,
  category: ModuleCategory,
  idsOrTags: string[]
): ModuleDefinition[] {
  const filterSet = new Set(idsOrTags);
  return registry[category].filter((m) => {
    // Match by ID
    if (filterSet.has(m.id)) return true;
    // Match by any tag
    if (m.tags?.some((tag) => filterSet.has(tag))) return true;
    return false;
  });
}

/**
 * Get module IDs for a category
 */
export function getModuleIds(registry: ModuleRegistry, category: ModuleCategory): string[] {
  return registry[category].map((m) => m.id);
}

/**
 * Validate that all requested modules exist
 */
export function validateModuleIds(
  registry: ModuleRegistry,
  category: ModuleCategory,
  ids: string[]
): { valid: string[]; invalid: string[] } {
  const available = new Set(getModuleIds(registry, category));
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const id of ids) {
    if (available.has(id)) {
      valid.push(id);
    } else {
      invalid.push(id);
    }
  }

  return { valid, invalid };
}
