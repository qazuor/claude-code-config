/**
 * File conflict resolution utilities
 */

import { select } from './prompt-cancel.js';

export type FileConflictAction = 'overwrite' | 'skip' | 'merge' | 'backup';

export interface FileConflictOptions {
  /** File path (for display) */
  filePath: string;
  /** File type description */
  fileType?: string;
  /** Allow merge option */
  allowMerge?: boolean;
  /** Allow backup option */
  allowBackup?: boolean;
  /** Default action */
  defaultAction?: FileConflictAction;
}

export interface FileConflictResult {
  action: FileConflictAction;
}

/**
 * Prompt user for action when a file already exists
 */
export async function promptFileConflict(
  options: FileConflictOptions
): Promise<FileConflictResult> {
  const { filePath, fileType, allowMerge, allowBackup, defaultAction } = options;

  const typeLabel = fileType ? ` (${fileType})` : '';
  const message = `File already exists: ${filePath}${typeLabel}. What would you like to do?`;

  const choices: Array<{ name: string; value: FileConflictAction; description?: string }> = [
    {
      name: 'Skip',
      value: 'skip',
      description: 'Keep the existing file, do not make changes',
    },
    {
      name: 'Overwrite',
      value: 'overwrite',
      description: 'Replace the existing file with the new one',
    },
  ];

  if (allowMerge) {
    choices.push({
      name: 'Merge',
      value: 'merge',
      description: 'Merge new content with existing file',
    });
  }

  if (allowBackup) {
    choices.push({
      name: 'Backup & Overwrite',
      value: 'backup',
      description: 'Create a backup of the existing file, then overwrite',
    });
  }

  const action = await select<FileConflictAction>({
    message,
    choices,
    default: defaultAction || 'skip',
  });

  return { action };
}

/**
 * Get file conflict action for batch operations
 */
export type BatchConflictPolicy = 'ask-each' | 'skip-all' | 'overwrite-all' | 'merge-all';

export interface BatchConflictOptions {
  /** Files that have conflicts */
  conflictingFiles: string[];
  /** Allow merge option */
  allowMerge?: boolean;
}

/**
 * Prompt for batch conflict resolution policy
 */
export async function promptBatchConflictPolicy(
  options: BatchConflictOptions
): Promise<BatchConflictPolicy> {
  const { conflictingFiles, allowMerge } = options;

  const fileCount = conflictingFiles.length;
  const message = `${fileCount} file(s) already exist. How would you like to handle conflicts?`;

  const choices: Array<{ name: string; value: BatchConflictPolicy; description?: string }> = [
    {
      name: 'Ask for each file',
      value: 'ask-each',
      description: 'Prompt for each conflicting file individually',
    },
    {
      name: 'Skip all existing',
      value: 'skip-all',
      description: 'Keep all existing files, skip new ones',
    },
    {
      name: 'Overwrite all',
      value: 'overwrite-all',
      description: 'Replace all existing files with new ones',
    },
  ];

  if (allowMerge) {
    choices.push({
      name: 'Merge all',
      value: 'merge-all',
      description: 'Merge new content into all existing files',
    });
  }

  return select<BatchConflictPolicy>({
    message,
    choices,
    default: 'ask-each',
  });
}

/**
 * Create a backup file name
 */
export function getBackupFileName(filePath: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const parts = filePath.split('.');
  if (parts.length > 1) {
    const ext = parts.pop();
    return `${parts.join('.')}.backup-${timestamp}.${ext}`;
  }
  return `${filePath}.backup-${timestamp}`;
}
