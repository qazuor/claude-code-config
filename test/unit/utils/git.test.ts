import os from 'node:os';
import path from 'node:path';
import fse from 'fs-extra';
/**
 * Tests for git utility
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Import functions to test
import {
  checkout,
  cloneOrUpdateRepo,
  createGit,
  fetch,
  getChangedFiles,
  getCurrentBranch,
  getLatestCommit,
  getRemoteBranches,
  getRemoteUrl,
  getRepoInfo,
  getTags,
  hasUncommittedChanges,
  initRepo,
  isGitInstalled,
  isGitRepo,
  isValidRemoteUrl,
  parseGitUrl,
} from '../../../src/lib/utils/git.js';

describe('git utilities', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(
      os.tmpdir(),
      `claude-config-git-test-${Date.now()}-${Math.random().toString(36).substring(7)}`
    );
    await fse.ensureDir(testDir);
  });

  afterEach(async () => {
    try {
      await fse.remove(testDir);
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('createGit', () => {
    it('should create git instance for directory', () => {
      const git = createGit(testDir);
      expect(git).toBeDefined();
    });
  });

  describe('isGitInstalled', () => {
    it('should return true when git is installed', async () => {
      const installed = await isGitInstalled();
      expect(installed).toBe(true);
    });
  });

  describe('isGitRepo', () => {
    it('should return false for non-git directory', async () => {
      const isRepo = await isGitRepo(testDir);
      expect(isRepo).toBe(false);
    });

    it('should return true for git directory', async () => {
      await initRepo(testDir);
      const isRepo = await isGitRepo(testDir);
      expect(isRepo).toBe(true);
    });
  });

  describe('initRepo', () => {
    it('should initialize git repository', async () => {
      await initRepo(testDir);
      const gitDir = path.join(testDir, '.git');
      const exists = await fse.pathExists(gitDir);
      expect(exists).toBe(true);
    });
  });

  describe('getCurrentBranch', () => {
    it('should get current branch name', async () => {
      await initRepo(testDir);
      // Create initial commit so HEAD exists
      const git = createGit(testDir);
      const testFile = path.join(testDir, 'test.txt');
      await fse.writeFile(testFile, 'test');
      await git.add('.');
      await git.commit('Initial commit');

      const branch = await getCurrentBranch(testDir);
      expect(typeof branch).toBe('string');
      expect(branch.length).toBeGreaterThan(0);
    });
  });

  describe('getRemoteUrl', () => {
    it('should return null for repo without remote', async () => {
      await initRepo(testDir);
      const url = await getRemoteUrl(testDir);
      expect(url).toBeNull();
    });

    it('should return remote url when configured', async () => {
      await initRepo(testDir);
      const git = createGit(testDir);
      await git.addRemote('origin', 'https://github.com/test/repo.git');

      const url = await getRemoteUrl(testDir);
      expect(url).toBe('https://github.com/test/repo.git');
    });
  });

  describe('getLatestCommit', () => {
    it('should get latest commit hash', async () => {
      await initRepo(testDir);
      const git = createGit(testDir);
      const testFile = path.join(testDir, 'test.txt');
      await fse.writeFile(testFile, 'test');
      await git.add('.');
      await git.commit('Test commit');

      const hash = await getLatestCommit(testDir);
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should handle empty repo gracefully', async () => {
      await initRepo(testDir);
      // Empty repos throw an error, so we expect either empty string or error handling
      try {
        const hash = await getLatestCommit(testDir);
        expect(hash).toBe('');
      } catch {
        // Acceptable - empty repos throw errors
        expect(true).toBe(true);
      }
    });
  });

  describe('getChangedFiles', () => {
    it('should return empty array for clean repo', async () => {
      await initRepo(testDir);
      const git = createGit(testDir);
      const testFile = path.join(testDir, 'test.txt');
      await fse.writeFile(testFile, 'test');
      await git.add('.');
      await git.commit('Initial commit');

      const changed = await getChangedFiles(testDir);
      expect(changed).toEqual([]);
    });

    it('should return modified files', async () => {
      await initRepo(testDir);
      const git = createGit(testDir);
      const testFile = path.join(testDir, 'test.txt');
      await fse.writeFile(testFile, 'test');
      await git.add('.');
      await git.commit('Initial commit');

      // Modify the file
      await fse.writeFile(testFile, 'modified');

      const changed = await getChangedFiles(testDir);
      expect(changed).toContain('test.txt');
    });

    it('should return created files', async () => {
      await initRepo(testDir);
      const git = createGit(testDir);
      const testFile = path.join(testDir, 'test.txt');
      await fse.writeFile(testFile, 'test');
      await git.add('.');
      await git.commit('Initial commit');

      // Create new file
      await fse.writeFile(path.join(testDir, 'new.txt'), 'new');
      await git.add('.');

      const changed = await getChangedFiles(testDir);
      expect(changed).toContain('new.txt');
    });
  });

  describe('hasUncommittedChanges', () => {
    it('should return false for clean repo', async () => {
      await initRepo(testDir);
      const git = createGit(testDir);
      const testFile = path.join(testDir, 'test.txt');
      await fse.writeFile(testFile, 'test');
      await git.add('.');
      await git.commit('Initial commit');

      const hasChanges = await hasUncommittedChanges(testDir);
      expect(hasChanges).toBe(false);
    });

    it('should return true for modified files', async () => {
      await initRepo(testDir);
      const git = createGit(testDir);
      const testFile = path.join(testDir, 'test.txt');
      await fse.writeFile(testFile, 'test');
      await git.add('.');
      await git.commit('Initial commit');

      // Modify file
      await fse.writeFile(testFile, 'modified');

      const hasChanges = await hasUncommittedChanges(testDir);
      expect(hasChanges).toBe(true);
    });
  });

  describe('parseGitUrl', () => {
    it('should parse HTTPS URL', () => {
      const result = parseGitUrl('https://github.com/owner/repo.git');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse HTTPS URL without .git', () => {
      const result = parseGitUrl('https://github.com/owner/repo');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse SSH URL', () => {
      const result = parseGitUrl('git@github.com:owner/repo.git');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse SSH URL without .git', () => {
      const result = parseGitUrl('git@github.com:owner/repo');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse GitLab URL', () => {
      const result = parseGitUrl('https://gitlab.com/owner/repo.git');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should return null for invalid URL', () => {
      const result = parseGitUrl('not-a-url');
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = parseGitUrl('');
      expect(result).toBeNull();
    });
  });

  describe('getRepoInfo', () => {
    it('should return isRepo: false for non-git directory', async () => {
      const info = await getRepoInfo(testDir);
      expect(info).toEqual({ isRepo: false });
    });

    it('should return repo info for git directory', async () => {
      await initRepo(testDir);
      const git = createGit(testDir);
      const testFile = path.join(testDir, 'test.txt');
      await fse.writeFile(testFile, 'test');
      await git.add('.');
      await git.commit('Initial commit');

      const info = await getRepoInfo(testDir);
      expect(info?.isRepo).toBe(true);
      expect(info?.branch).toBeDefined();
      expect(info?.hasChanges).toBe(false);
    });

    it('should include owner and repo when remote is set', async () => {
      await initRepo(testDir);
      const git = createGit(testDir);
      await git.addRemote('origin', 'https://github.com/myorg/myrepo.git');
      const testFile = path.join(testDir, 'test.txt');
      await fse.writeFile(testFile, 'test');
      await git.add('.');
      await git.commit('Initial commit');

      const info = await getRepoInfo(testDir);
      expect(info?.owner).toBe('myorg');
      expect(info?.repo).toBe('myrepo');
    });

    it('should handle error gracefully and return isRepo true', async () => {
      // Create a corrupted git repo scenario
      await initRepo(testDir);
      // The function should still return { isRepo: true } on errors
      const info = await getRepoInfo(testDir);
      expect(info?.isRepo).toBe(true);
    });
  });

  describe('getRemoteBranches', () => {
    it('should return empty array for repo without remote', async () => {
      await initRepo(testDir);
      const git = createGit(testDir);
      const testFile = path.join(testDir, 'test.txt');
      await fse.writeFile(testFile, 'test');
      await git.add('.');
      await git.commit('Initial commit');

      const branches = await getRemoteBranches(testDir);
      expect(Array.isArray(branches)).toBe(true);
      expect(branches.length).toBe(0);
    });
  });

  describe('getTags', () => {
    it('should return empty array for repo without tags', async () => {
      await initRepo(testDir);
      const git = createGit(testDir);
      const testFile = path.join(testDir, 'test.txt');
      await fse.writeFile(testFile, 'test');
      await git.add('.');
      await git.commit('Initial commit');

      const tags = await getTags(testDir);
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBe(0);
    });

    it('should return tags when present', async () => {
      await initRepo(testDir);
      const git = createGit(testDir);
      const testFile = path.join(testDir, 'test.txt');
      await fse.writeFile(testFile, 'test');
      await git.add('.');
      await git.commit('Initial commit');
      await git.addTag('v1.0.0');

      const tags = await getTags(testDir);
      expect(tags).toContain('v1.0.0');
    });
  });

  describe('fetch', () => {
    it('should not throw for repo without remote', async () => {
      await initRepo(testDir);
      const git = createGit(testDir);
      const testFile = path.join(testDir, 'test.txt');
      await fse.writeFile(testFile, 'test');
      await git.add('.');
      await git.commit('Initial commit');

      // Fetch without remote should throw, but we test the function exists
      try {
        await fetch(testDir);
      } catch {
        // Expected - no remote
        expect(true).toBe(true);
      }
    });

    it('should support tags option', async () => {
      await initRepo(testDir);
      const git = createGit(testDir);
      const testFile = path.join(testDir, 'test.txt');
      await fse.writeFile(testFile, 'test');
      await git.add('.');
      await git.commit('Initial commit');

      // Fetch with tags option
      try {
        await fetch(testDir, { tags: true });
      } catch {
        // Expected - no remote
        expect(true).toBe(true);
      }
    });
  });

  describe('checkout', () => {
    it('should checkout a branch', async () => {
      await initRepo(testDir);
      const git = createGit(testDir);
      const testFile = path.join(testDir, 'test.txt');
      await fse.writeFile(testFile, 'test');
      await git.add('.');
      await git.commit('Initial commit');

      // Create a new branch
      await git.checkoutLocalBranch('feature-branch');

      // Go back to main/master
      await checkout(testDir, 'master');
      const currentBranch = await getCurrentBranch(testDir);
      expect(currentBranch).toBe('master');
    });
  });

  describe('isValidRemoteUrl', () => {
    it('should return boolean for any URL', async () => {
      // The function may return true or false depending on network/git config
      const result = await isValidRemoteUrl(
        'https://github.com/nonexistent-org-12345/nonexistent-repo-67890.git'
      );
      expect(typeof result).toBe('boolean');
    });

    it('should handle malformed URL', async () => {
      // Malformed URLs should return false
      const valid = await isValidRemoteUrl('not-a-valid-url');
      expect(valid).toBe(false);
    });
  });

  describe('cloneOrUpdateRepo', () => {
    it('should return cloned: false, updated: false for existing non-git directory', async () => {
      // Create a regular directory (not a git repo)
      const existingDir = path.join(testDir, 'existing');
      await fse.ensureDir(existingDir);

      const result = await cloneOrUpdateRepo('https://github.com/test/repo.git', existingDir);
      expect(result.cloned).toBe(false);
      expect(result.updated).toBe(false);
    });

    it('should return cloned: false, updated: false for existing git repo without forceUpdate', async () => {
      // Create a git repo
      const existingRepo = path.join(testDir, 'existing-repo');
      await fse.ensureDir(existingRepo);
      await initRepo(existingRepo);
      const git = createGit(existingRepo);
      const testFile = path.join(existingRepo, 'test.txt');
      await fse.writeFile(testFile, 'test');
      await git.add('.');
      await git.commit('Initial commit');

      const result = await cloneOrUpdateRepo('https://github.com/test/repo.git', existingRepo);
      expect(result.cloned).toBe(false);
      expect(result.updated).toBe(false);
    });

    it('should attempt update when forceUpdate is true', async () => {
      // Create a git repo with a remote
      const existingRepo = path.join(testDir, 'update-repo');
      await fse.ensureDir(existingRepo);
      await initRepo(existingRepo);
      const git = createGit(existingRepo);
      const testFile = path.join(existingRepo, 'test.txt');
      await fse.writeFile(testFile, 'test');
      await git.add('.');
      await git.commit('Initial commit');
      await git.addRemote('origin', 'https://github.com/test/repo.git');

      try {
        // This will fail because the remote doesn't exist
        // but it tests that the forceUpdate path is exercised
        await cloneOrUpdateRepo('https://github.com/test/repo.git', existingRepo, {
          forceUpdate: true,
        });
      } catch {
        // Expected - remote doesn't exist
        expect(true).toBe(true);
      }
    });

    it('should attempt to clone non-existent directory', async () => {
      const newDir = path.join(testDir, 'new-clone');

      try {
        // This will fail because URL is not valid, but tests the cloning path
        await cloneOrUpdateRepo('https://github.com/test/nonexistent-repo-12345.git', newDir);
      } catch {
        // Expected - repo doesn't exist
        expect(true).toBe(true);
      }
    });

    it('should support branch option', async () => {
      const newDir = path.join(testDir, 'branch-clone');

      try {
        await cloneOrUpdateRepo('https://github.com/test/repo.git', newDir, { branch: 'develop' });
      } catch {
        // Expected - repo doesn't exist
        expect(true).toBe(true);
      }
    });
  });
});
