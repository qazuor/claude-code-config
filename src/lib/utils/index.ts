/**
 * Utility exports
 */

// Logger
export { logger, colors, type LogLevel } from './logger.js';

// Spinner
export { spinner, withSpinner, createProgressTracker } from './spinner.js';

// Filesystem
export {
  pathExists,
  isDirectory,
  isFile,
  readJson,
  writeJson,
  readFile,
  writeFile,
  copy,
  copyDir,
  ensureDir,
  remove,
  listFiles,
  listDirs,
  getFileInfo,
  readDirRecursive,
  getFileHash,
  filesAreEqual,
  relativePath,
  resolvePath,
  joinPath,
  dirname,
  basename,
  extname,
  backup,
  makeExecutable,
  createTempDir,
  cleanTempDir,
} from './fs.js';

// Git
export {
  createGit,
  isGitRepo,
  isGitInstalled,
  initRepo,
  cloneRepo,
  getCurrentBranch,
  getRemoteBranches,
  getTags,
  fetch,
  pull,
  checkout,
  getRemoteUrl,
  getLatestCommit,
  getChangedFiles,
  hasUncommittedChanges,
  parseGitUrl,
  isValidRemoteUrl,
  getRepoInfo,
  cloneOrUpdateRepo,
} from './git.js';
