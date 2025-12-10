/**
 * Package path utilities
 * Handles resolving paths relative to the installed package
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Get the root directory of the installed package
 * Works both in development (src/) and when bundled (dist/)
 */
export function getPackageRoot(): string {
  const currentFilePath = fileURLToPath(import.meta.url);
  let currentDir = path.dirname(currentFilePath);

  // Walk up the directory tree until we find package.json
  // This works for both:
  // - Development: src/lib/utils/paths.ts -> walk up to find package.json
  // - Production: dist/bin.js -> walk up to find package.json
  while (currentDir !== path.dirname(currentDir)) {
    const packageJsonPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  // Fallback: should not reach here in normal usage
  throw new Error('Could not find package root (no package.json found in parent directories)');
}

/**
 * Get the templates directory path
 * Templates are bundled with the package at package-root/templates/
 */
export function getTemplatesPath(): string {
  return path.join(getPackageRoot(), 'templates');
}
