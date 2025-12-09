/**
 * Filesystem utility functions
 */

import path from 'node:path';
import fs from 'fs-extra';
import { glob } from 'glob';

/**
 * Check if a path exists
 */
export async function pathExists(filePath: string): Promise<boolean> {
  return fs.pathExists(filePath);
}

/**
 * Check if a path is a directory
 */
export async function isDirectory(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if a path is a file
 */
export async function isFile(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

/**
 * Read a JSON file
 */
export async function readJson<T = unknown>(filePath: string): Promise<T> {
  return fs.readJson(filePath);
}

/**
 * Write a JSON file
 */
export async function writeJson(
  filePath: string,
  data: unknown,
  options?: { spaces?: number }
): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeJson(filePath, data, { spaces: options?.spaces ?? 2 });
}

/**
 * Read a text file
 */
export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

/**
 * Write a text file
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Copy a file or directory
 */
export async function copy(
  src: string,
  dest: string,
  options?: { overwrite?: boolean }
): Promise<void> {
  await fs.ensureDir(path.dirname(dest));
  await fs.copy(src, dest, { overwrite: options?.overwrite ?? false });
}

/**
 * Copy a directory recursively
 */
export async function copyDir(
  src: string,
  dest: string,
  options?: { overwrite?: boolean; filter?: (src: string) => boolean }
): Promise<void> {
  await fs.copy(src, dest, {
    overwrite: options?.overwrite ?? false,
    filter: options?.filter,
  });
}

/**
 * Create a directory (and parents if needed)
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

/**
 * Remove a file or directory
 */
export async function remove(filePath: string): Promise<void> {
  await fs.remove(filePath);
}

/**
 * List files matching a pattern
 */
export async function listFiles(
  pattern: string,
  options?: { cwd?: string; ignore?: string[] }
): Promise<string[]> {
  return glob(pattern, {
    cwd: options?.cwd,
    ignore: options?.ignore,
    nodir: true,
  });
}

/**
 * List directories matching a pattern
 */
export async function listDirs(pattern: string, options?: { cwd?: string }): Promise<string[]> {
  const matches = await glob(pattern, {
    cwd: options?.cwd,
  });

  const dirs: string[] = [];
  for (const match of matches) {
    const fullPath = options?.cwd ? path.join(options.cwd, match) : match;
    if (await isDirectory(fullPath)) {
      dirs.push(match);
    }
  }

  return dirs;
}

/**
 * Get file info
 */
export async function getFileInfo(filePath: string): Promise<{
  exists: boolean;
  isFile: boolean;
  isDirectory: boolean;
  size: number;
  modified: Date;
} | null> {
  try {
    const stat = await fs.stat(filePath);
    return {
      exists: true,
      isFile: stat.isFile(),
      isDirectory: stat.isDirectory(),
      size: stat.size,
      modified: stat.mtime,
    };
  } catch {
    return null;
  }
}

/**
 * Read all files in a directory recursively
 */
export async function readDirRecursive(
  dirPath: string,
  options?: { extensions?: string[] }
): Promise<string[]> {
  const pattern = options?.extensions ? `**/*.{${options.extensions.join(',')}}` : '**/*';

  return glob(pattern, {
    cwd: dirPath,
    nodir: true,
  });
}

/**
 * Calculate hash of a file for comparison
 */
export async function getFileHash(filePath: string): Promise<string> {
  const crypto = await import('node:crypto');
  const content = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Compare two files
 */
export async function filesAreEqual(file1: string, file2: string): Promise<boolean> {
  try {
    const [hash1, hash2] = await Promise.all([getFileHash(file1), getFileHash(file2)]);
    return hash1 === hash2;
  } catch {
    return false;
  }
}

/**
 * Get relative path from base
 */
export function relativePath(from: string, to: string): string {
  return path.relative(from, to);
}

/**
 * Resolve path segments
 */
export function resolvePath(...segments: string[]): string {
  return path.resolve(...segments);
}

/**
 * Join path segments
 */
export function joinPath(...segments: string[]): string {
  return path.join(...segments);
}

/**
 * Get directory name
 */
export function dirname(filePath: string): string {
  return path.dirname(filePath);
}

/**
 * Get base name
 */
export function basename(filePath: string, ext?: string): string {
  return path.basename(filePath, ext);
}

/**
 * Get file extension
 */
export function extname(filePath: string): string {
  return path.extname(filePath);
}

/**
 * Backup a file or directory
 */
export async function backup(src: string, suffix = '.backup'): Promise<string> {
  const backupPath = `${src}${suffix}`;
  await copy(src, backupPath, { overwrite: true });
  return backupPath;
}

/**
 * Make a file executable (Unix only)
 */
export async function makeExecutable(filePath: string): Promise<void> {
  try {
    await fs.chmod(filePath, 0o755);
  } catch {
    // Ignore on Windows
  }
}

/**
 * Temporary directory utilities
 */
export async function createTempDir(prefix = 'claude-config-'): Promise<string> {
  const os = await import('node:os');
  const tempBase = os.tmpdir();
  const tempDir = path.join(tempBase, `${prefix}${Date.now()}`);
  await ensureDir(tempDir);
  return tempDir;
}

export async function cleanTempDir(tempDir: string): Promise<void> {
  await remove(tempDir);
}
