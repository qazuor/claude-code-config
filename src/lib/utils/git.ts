/**
 * Git utility functions
 */

import { type SimpleGit, type SimpleGitOptions, simpleGit } from 'simple-git';
import { isDirectory, pathExists } from './fs.js';
import { joinPath } from './fs.js';

/**
 * Create a git instance for a directory
 */
export function createGit(baseDir: string): SimpleGit {
  const options: Partial<SimpleGitOptions> = {
    baseDir,
    binary: 'git',
    maxConcurrentProcesses: 6,
  };
  return simpleGit(options);
}

/**
 * Check if a directory is a git repository
 */
export async function isGitRepo(dir: string): Promise<boolean> {
  try {
    const git = createGit(dir);
    await git.status();
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if git is installed
 */
export async function isGitInstalled(): Promise<boolean> {
  try {
    const git = simpleGit();
    await git.version();
    return true;
  } catch {
    return false;
  }
}

/**
 * Initialize a git repository
 */
export async function initRepo(dir: string): Promise<void> {
  const git = createGit(dir);
  await git.init();
}

/**
 * Clone a repository
 */
export async function cloneRepo(
  url: string,
  dest: string,
  options?: {
    branch?: string;
    depth?: number;
  }
): Promise<void> {
  const git = simpleGit();
  const cloneOptions: string[] = [];

  if (options?.branch) {
    cloneOptions.push('--branch', options.branch);
  }
  if (options?.depth) {
    cloneOptions.push('--depth', String(options.depth));
  }

  await git.clone(url, dest, cloneOptions);
}

/**
 * Get current branch name
 */
export async function getCurrentBranch(dir: string): Promise<string> {
  const git = createGit(dir);
  const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
  return branch.trim();
}

/**
 * Get list of remote branches
 */
export async function getRemoteBranches(dir: string): Promise<string[]> {
  const git = createGit(dir);
  const result = await git.branch(['-r']);
  return result.all.map((b) => b.replace('origin/', ''));
}

/**
 * Get list of tags
 */
export async function getTags(dir: string): Promise<string[]> {
  const git = createGit(dir);
  const result = await git.tags();
  return result.all;
}

/**
 * Fetch from remote
 */
export async function fetch(dir: string, options?: { tags?: boolean }): Promise<void> {
  const git = createGit(dir);
  const fetchOptions = options?.tags ? ['--tags'] : [];
  await git.fetch(fetchOptions);
}

/**
 * Pull from remote
 */
export async function pull(dir: string, remote = 'origin', branch?: string): Promise<void> {
  const git = createGit(dir);
  await git.pull(remote, branch);
}

/**
 * Checkout a branch or tag
 */
export async function checkout(dir: string, ref: string): Promise<void> {
  const git = createGit(dir);
  await git.checkout(ref);
}

/**
 * Get the remote URL
 */
export async function getRemoteUrl(dir: string, remote = 'origin'): Promise<string | null> {
  try {
    const git = createGit(dir);
    const remotes = await git.getRemotes(true);
    const remoteInfo = remotes.find((r) => r.name === remote);
    return remoteInfo?.refs.fetch || null;
  } catch {
    return null;
  }
}

/**
 * Get latest commit hash
 */
export async function getLatestCommit(dir: string): Promise<string> {
  const git = createGit(dir);
  const log = await git.log({ maxCount: 1 });
  return log.latest?.hash || '';
}

/**
 * Get list of changed files
 */
export async function getChangedFiles(dir: string): Promise<string[]> {
  const git = createGit(dir);
  const status = await git.status();
  return [
    ...status.modified,
    ...status.created,
    ...status.deleted,
    ...status.renamed.map((r) => r.to),
  ];
}

/**
 * Check if there are uncommitted changes
 */
export async function hasUncommittedChanges(dir: string): Promise<boolean> {
  const git = createGit(dir);
  const status = await git.status();
  return !status.isClean();
}

/**
 * Parse a git URL to extract owner and repo
 */
export function parseGitUrl(url: string): { owner: string; repo: string } | null {
  // Handle various git URL formats:
  // https://github.com/owner/repo.git
  // git@github.com:owner/repo.git
  // https://github.com/owner/repo

  const httpsMatch = url.match(/https?:\/\/[^/]+\/([^/]+)\/([^/.]+)(\.git)?/);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  const sshMatch = url.match(/git@[^:]+:([^/]+)\/([^/.]+)(\.git)?/);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  return null;
}

/**
 * Check if a remote URL is valid (can be accessed)
 */
export async function isValidRemoteUrl(url: string): Promise<boolean> {
  try {
    const git = simpleGit();
    await git.listRemote([url]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get repository info from a directory
 */
export async function getRepoInfo(dir: string): Promise<{
  isRepo: boolean;
  branch?: string;
  remoteUrl?: string;
  hasChanges?: boolean;
  owner?: string;
  repo?: string;
} | null> {
  if (!(await isGitRepo(dir))) {
    return { isRepo: false };
  }

  try {
    const [branch, remoteUrl, hasChanges] = await Promise.all([
      getCurrentBranch(dir),
      getRemoteUrl(dir),
      hasUncommittedChanges(dir),
    ]);

    const parsed = remoteUrl ? parseGitUrl(remoteUrl) : null;

    return {
      isRepo: true,
      branch,
      remoteUrl: remoteUrl || undefined,
      hasChanges,
      owner: parsed?.owner,
      repo: parsed?.repo,
    };
  } catch {
    return { isRepo: true };
  }
}

/**
 * Clone or update a repository for templates
 */
export async function cloneOrUpdateRepo(
  url: string,
  dest: string,
  options?: {
    branch?: string;
    forceUpdate?: boolean;
  }
): Promise<{ cloned: boolean; updated: boolean }> {
  const exists = await pathExists(dest);

  if (!exists) {
    await cloneRepo(url, dest, { branch: options?.branch, depth: 1 });
    return { cloned: true, updated: false };
  }

  if (await isGitRepo(dest)) {
    if (options?.forceUpdate) {
      await fetch(dest, { tags: true });
      if (options?.branch) {
        await checkout(dest, options.branch);
      }
      await pull(dest);
      return { cloned: false, updated: true };
    }
  }

  return { cloned: false, updated: false };
}
