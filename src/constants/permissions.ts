/**
 * Permission preset definitions
 */

import type {
  BashPermissions,
  FilePermissions,
  GitPermissions,
  PermissionPreset,
  PermissionsConfig,
  WebPermissions,
} from '../types/permissions.js';

/**
 * Default file permissions
 */
const DEFAULT_FILE_PERMISSIONS: FilePermissions = {
  readAll: true,
  writeCode: true,
  writeConfig: true,
  writeMarkdown: true,
  writeOther: false,
  editTool: true,
};

/**
 * Trust file permissions
 */
const TRUST_FILE_PERMISSIONS: FilePermissions = {
  readAll: true,
  writeCode: true,
  writeConfig: true,
  writeMarkdown: true,
  writeOther: true,
  editTool: true,
};

/**
 * Restrictive file permissions
 */
const RESTRICTIVE_FILE_PERMISSIONS: FilePermissions = {
  readAll: true,
  writeCode: false,
  writeConfig: false,
  writeMarkdown: true,
  writeOther: false,
  editTool: false,
};

/**
 * Default git permissions
 */
const DEFAULT_GIT_PERMISSIONS: GitPermissions = {
  readOnly: true,
  staging: false,
  commit: false,
  push: false,
  branching: false,
};

/**
 * Trust git permissions
 */
const TRUST_GIT_PERMISSIONS: GitPermissions = {
  readOnly: true,
  staging: true,
  commit: true,
  push: false,
  branching: true,
};

/**
 * Restrictive git permissions
 */
const RESTRICTIVE_GIT_PERMISSIONS: GitPermissions = {
  readOnly: true,
  staging: false,
  commit: false,
  push: false,
  branching: false,
};

/**
 * Default bash permissions
 */
const DEFAULT_BASH_PERMISSIONS: BashPermissions = {
  packageManager: true,
  testing: true,
  building: true,
  docker: false,
  arbitrary: false,
};

/**
 * Trust bash permissions
 */
const TRUST_BASH_PERMISSIONS: BashPermissions = {
  packageManager: true,
  testing: true,
  building: true,
  docker: true,
  arbitrary: true,
};

/**
 * Restrictive bash permissions
 */
const RESTRICTIVE_BASH_PERMISSIONS: BashPermissions = {
  packageManager: false,
  testing: false,
  building: false,
  docker: false,
  arbitrary: false,
};

/**
 * Default web permissions
 */
const DEFAULT_WEB_PERMISSIONS: WebPermissions = {
  fetch: true,
  search: true,
};

/**
 * All permission presets
 */
export const PERMISSION_PRESETS: Record<
  PermissionPreset,
  Omit<PermissionsConfig, 'preset' | 'custom'>
> = {
  default: {
    files: DEFAULT_FILE_PERMISSIONS,
    git: DEFAULT_GIT_PERMISSIONS,
    bash: DEFAULT_BASH_PERMISSIONS,
    web: DEFAULT_WEB_PERMISSIONS,
  },
  trust: {
    files: TRUST_FILE_PERMISSIONS,
    git: TRUST_GIT_PERMISSIONS,
    bash: TRUST_BASH_PERMISSIONS,
    web: DEFAULT_WEB_PERMISSIONS,
  },
  restrictive: {
    files: RESTRICTIVE_FILE_PERMISSIONS,
    git: RESTRICTIVE_GIT_PERMISSIONS,
    bash: RESTRICTIVE_BASH_PERMISSIONS,
    web: DEFAULT_WEB_PERMISSIONS,
  },
  custom: {
    files: DEFAULT_FILE_PERMISSIONS,
    git: DEFAULT_GIT_PERMISSIONS,
    bash: DEFAULT_BASH_PERMISSIONS,
    web: DEFAULT_WEB_PERMISSIONS,
  },
};

/**
 * Default deny rules (always applied)
 */
export const DEFAULT_DENY_RULES: string[] = [
  // Directories
  'Write(node_modules/**)',
  'Write(.git/**)',
  'Write(dist/**)',
  'Write(build/**)',
  'Write(.next/**)',
  'Write(.nuxt/**)',
  'Write(.output/**)',

  // System files
  'Write(/etc/**)',
  'Write(/usr/**)',
  'Write(/bin/**)',
  'Write(/sbin/**)',
  'Write(/var/**)',
  'Write(/tmp/**)',

  // Dangerous commands
  'Bash(rm -rf /)',
  'Bash(sudo *)',
  'Bash(chmod 777 *)',
  'Bash(curl * | bash)',
  'Bash(wget * | bash)',

  // Sensitive files
  'Write(.env)',
  'Write(.env.*)',
  'Write(**/secrets/**)',
  'Write(**/credentials/**)',
  'Read(.env)',
  'Read(.env.*)',
];

/**
 * Get permissions for a preset
 */
export function getPresetPermissions(
  preset: PermissionPreset
): Omit<PermissionsConfig, 'preset' | 'custom'> {
  return PERMISSION_PRESETS[preset];
}

/**
 * Generate allow rules from permissions config
 */
export function generateAllowRules(config: PermissionsConfig): string[] {
  const rules: string[] = [];

  // File permissions
  if (config.files.readAll) {
    rules.push(
      'Read(**/*)',
      'Glob(**/*)',
      'Grep(**/*)',
      'LS(**/*)',
      'TodoRead',
      'WebFetch',
      'WebSearch'
    );
  }
  if (config.files.writeCode) {
    rules.push(
      'Write(**/*.ts)',
      'Write(**/*.tsx)',
      'Write(**/*.js)',
      'Write(**/*.jsx)',
      'Write(**/*.mts)',
      'Write(**/*.mjs)',
      'Write(**/*.vue)',
      'Write(**/*.svelte)'
    );
  }
  if (config.files.writeConfig) {
    rules.push(
      'Write(**/*.json)',
      'Write(**/*.yaml)',
      'Write(**/*.yml)',
      'Write(**/*.toml)',
      'Write(**/*.xml)',
      'Write(**/.env.example)',
      'Write(**/.gitignore)',
      'Write(**/.npmrc)',
      'Write(**/.nvmrc)'
    );
  }
  if (config.files.writeMarkdown) {
    rules.push('Write(**/*.md)', 'Write(**/*.mdx)');
  }
  if (config.files.writeOther) {
    rules.push(
      'Write(**/*.css)',
      'Write(**/*.scss)',
      'Write(**/*.less)',
      'Write(**/*.html)',
      'Write(**/*.sql)',
      'Write(**/*.graphql)',
      'Write(**/*.prisma)'
    );
  }
  if (config.files.editTool) {
    rules.push('Edit(**/*)', 'MultiEdit(**/*)', 'NotebookEdit(**/*)', 'TodoWrite');
  }

  // Git permissions
  if (config.git.readOnly) {
    rules.push(
      'Bash(git status*)',
      'Bash(git diff*)',
      'Bash(git log*)',
      'Bash(git show*)',
      'Bash(git branch*)'
    );
  }
  if (config.git.staging) {
    rules.push('Bash(git add*)');
  }
  if (config.git.commit) {
    rules.push('Bash(git commit*)');
  }
  if (config.git.push) {
    rules.push('Bash(git push*)');
  }
  if (config.git.branching) {
    rules.push('Bash(git checkout*)', 'Bash(git branch*)', 'Bash(git merge*)', 'Bash(git rebase*)');
  }

  // Bash permissions
  if (config.bash.packageManager) {
    rules.push(
      'Bash(pnpm *)',
      'Bash(npm *)',
      'Bash(yarn *)',
      'Bash(bun *)',
      'Bash(npx *)',
      'Bash(bunx *)'
    );
  }
  if (config.bash.testing) {
    rules.push(
      'Bash(vitest*)',
      'Bash(jest*)',
      'Bash(playwright*)',
      'Bash(cypress*)',
      'Bash(pnpm test*)',
      'Bash(npm test*)',
      'Bash(pnpm run test*)',
      'Bash(npm run test*)'
    );
  }
  if (config.bash.building) {
    rules.push(
      'Bash(pnpm build*)',
      'Bash(npm run build*)',
      'Bash(pnpm run build*)',
      'Bash(tsc*)',
      'Bash(tsup*)',
      'Bash(vite build*)',
      'Bash(next build*)',
      'Bash(astro build*)'
    );
  }
  if (config.bash.docker) {
    rules.push('Bash(docker *)', 'Bash(docker-compose *)');
  }
  if (config.bash.arbitrary) {
    rules.push('Bash(*)');
  }

  // Web permissions
  if (config.web.fetch) {
    rules.push('WebFetch');
  }
  if (config.web.search) {
    rules.push('WebSearch');
  }

  // Add custom allow rules
  if (config.custom?.allow) {
    rules.push(...config.custom.allow);
  }

  return [...new Set(rules)]; // Remove duplicates
}

/**
 * Generate deny rules from permissions config
 */
export function generateDenyRules(config: PermissionsConfig): string[] {
  const rules = [...DEFAULT_DENY_RULES];

  // Add custom deny rules
  if (config.custom?.deny) {
    rules.push(...config.custom.deny);
  }

  return [...new Set(rules)]; // Remove duplicates
}

/**
 * Preset descriptions for UI
 */
export const PRESET_DESCRIPTIONS: Record<PermissionPreset, { name: string; description: string }> =
  {
    default: {
      name: 'Default',
      description:
        'Balanced permissions - read all, write code/config/docs, basic git, package manager & testing',
    },
    trust: {
      name: 'Trust',
      description:
        'Extended permissions - full file access, git staging/commit/branching, docker, arbitrary bash',
    },
    restrictive: {
      name: 'Restrictive',
      description:
        'Minimal permissions - read only, markdown writing, no git operations, no bash commands',
    },
    custom: {
      name: 'Custom',
      description: 'Configure each permission individually',
    },
  };
