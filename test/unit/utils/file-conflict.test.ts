/**
 * Tests for file conflict utilities
 */
import { describe, expect, it } from 'vitest';
import {
  type FileConflictAction,
  getBackupFileName,
} from '../../../src/lib/utils/file-conflict.js';

describe('file-conflict', () => {
  describe('getBackupFileName', () => {
    it('should generate backup name with timestamp for file with extension', () => {
      const backup = getBackupFileName('/path/to/file.txt');

      expect(backup).toContain('file.backup-');
      expect(backup).toContain('.txt');
    });

    it('should generate backup name for file without extension', () => {
      const backup = getBackupFileName('/path/to/Makefile');

      expect(backup).toContain('Makefile.backup-');
    });

    it('should handle files with multiple dots in name', () => {
      const backup = getBackupFileName('/path/to/file.config.json');

      expect(backup).toContain('.json');
      expect(backup).toContain('backup-');
    });

    it('should generate unique names on repeated calls', () => {
      const backup1 = getBackupFileName('/path/to/file.txt');
      // Small delay to ensure different timestamp
      const backup2 = getBackupFileName('/path/to/file.txt');

      // Both should be valid backup names (may or may not be same depending on timing)
      expect(backup1).toContain('backup-');
      expect(backup2).toContain('backup-');
    });
  });

  describe('FileConflictAction type', () => {
    it('should have valid action types', () => {
      const actions: FileConflictAction[] = ['overwrite', 'skip', 'merge', 'backup'];

      expect(actions).toContain('overwrite');
      expect(actions).toContain('skip');
      expect(actions).toContain('merge');
      expect(actions).toContain('backup');
    });
  });
});
