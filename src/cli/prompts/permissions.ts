/**
 * Permission configuration prompts
 */

import { confirm, input, select } from '@inquirer/prompts';
import {
  PERMISSION_PRESETS,
  PRESET_DESCRIPTIONS,
  generateAllowRules,
  generateDenyRules,
} from '../../constants/permissions.js';
import { colors, logger } from '../../lib/utils/logger.js';
import type {
  BashPermissions,
  CustomPermissions,
  FilePermissions,
  GitPermissions,
  PermissionPreset,
  PermissionsConfig,
  WebPermissions,
} from '../../types/permissions.js';

interface PermissionsPromptOptions {
  defaults?: Partial<PermissionsConfig>;
}

/**
 * Prompt for permissions configuration
 */
export async function promptPermissionsConfig(
  options?: PermissionsPromptOptions
): Promise<PermissionsConfig> {
  logger.subtitle('Permissions Configuration');

  const configurePermissions = await confirm({
    message: 'Do you want to configure Claude Code permissions?',
    default: true,
  });

  if (!configurePermissions) {
    return {
      preset: 'default',
      ...PERMISSION_PRESETS.default,
      custom: { allow: [], deny: [] },
    };
  }

  // Select preset or custom
  const preset = await promptPresetSelection();

  if (preset !== 'custom') {
    const presetConfig = PERMISSION_PRESETS[preset];

    // Ask if they want to customize the preset
    const customize = await confirm({
      message: 'Do you want to customize these permissions?',
      default: false,
    });

    if (!customize) {
      return {
        preset,
        ...presetConfig,
        custom: { allow: [], deny: [] },
      };
    }
  }

  // Custom configuration
  logger.newline();
  logger.info('Configure permissions for each category:');

  const files = await promptFilePermissions(options?.defaults?.files);
  const git = await promptGitPermissions(options?.defaults?.git);
  const bash = await promptBashPermissions(options?.defaults?.bash);
  const web = await promptWebPermissions(options?.defaults?.web);
  const custom = await promptCustomPermissions(options?.defaults?.custom);

  return {
    preset: 'custom',
    files,
    git,
    bash,
    web,
    custom,
  };
}

/**
 * Prompt for permission preset selection
 */
async function promptPresetSelection(): Promise<PermissionPreset> {
  const choices = Object.entries(PRESET_DESCRIPTIONS).map(([key, info]) => ({
    name: info.name,
    value: key as PermissionPreset,
    description: info.description,
  }));

  return select({
    message: 'Select a permission preset:',
    choices,
    default: 'default',
  });
}

/**
 * Prompt for file permissions
 */
async function promptFilePermissions(
  defaults?: Partial<FilePermissions>
): Promise<FilePermissions> {
  logger.newline();
  logger.info(colors.bold('📁 File Operations'));

  const readAll = await confirm({
    message: 'Allow Read on all files?',
    default: defaults?.readAll ?? true,
  });

  const writeCode = await confirm({
    message: 'Allow Write on code files (*.ts, *.js, *.tsx, *.jsx, etc.)?',
    default: defaults?.writeCode ?? true,
  });

  const writeConfig = await confirm({
    message: 'Allow Write on config files (*.json, *.yaml, *.toml)?',
    default: defaults?.writeConfig ?? true,
  });

  const writeMarkdown = await confirm({
    message: 'Allow Write on markdown files (*.md)?',
    default: defaults?.writeMarkdown ?? true,
  });

  const writeOther = await confirm({
    message: 'Allow Write on other files (*.css, *.html, *.sql, etc.)?',
    default: defaults?.writeOther ?? false,
  });

  const editTool = await confirm({
    message: 'Allow Edit tool (inline file editing)?',
    default: defaults?.editTool ?? true,
  });

  return {
    readAll,
    writeCode,
    writeConfig,
    writeMarkdown,
    writeOther,
    editTool,
  };
}

/**
 * Prompt for git permissions
 */
async function promptGitPermissions(defaults?: Partial<GitPermissions>): Promise<GitPermissions> {
  logger.newline();
  logger.info(colors.bold('🔄 Git Operations'));

  const readOnly = await confirm({
    message: 'Allow git read operations (status, diff, log)?',
    default: defaults?.readOnly ?? true,
  });

  const staging = await confirm({
    message: 'Allow git add (staging)?',
    default: defaults?.staging ?? false,
  });

  const commit = await confirm({
    message: 'Allow git commit?',
    default: defaults?.commit ?? false,
  });

  let push = false;
  if (commit) {
    push = await confirm({
      message: '⚠️  Allow git push? (use with caution)',
      default: defaults?.push ?? false,
    });
  }

  const branching = await confirm({
    message: 'Allow git branching (checkout, branch, merge)?',
    default: defaults?.branching ?? false,
  });

  return {
    readOnly,
    staging,
    commit,
    push,
    branching,
  };
}

/**
 * Prompt for bash permissions
 */
async function promptBashPermissions(
  defaults?: Partial<BashPermissions>
): Promise<BashPermissions> {
  logger.newline();
  logger.info(colors.bold('💻 Bash/Terminal Operations'));

  const packageManager = await confirm({
    message: 'Allow package manager commands (pnpm, npm, yarn)?',
    default: defaults?.packageManager ?? true,
  });

  const testing = await confirm({
    message: 'Allow test commands (vitest, jest, playwright)?',
    default: defaults?.testing ?? true,
  });

  const building = await confirm({
    message: 'Allow build commands (tsc, vite build, etc.)?',
    default: defaults?.building ?? true,
  });

  const docker = await confirm({
    message: 'Allow docker commands?',
    default: defaults?.docker ?? false,
  });

  const arbitrary = await confirm({
    message: '⚠️  Allow arbitrary bash commands? (dangerous)',
    default: defaults?.arbitrary ?? false,
  });

  return {
    packageManager,
    testing,
    building,
    docker,
    arbitrary,
  };
}

/**
 * Prompt for web permissions
 */
async function promptWebPermissions(defaults?: Partial<WebPermissions>): Promise<WebPermissions> {
  logger.newline();
  logger.info(colors.bold('🌐 Web Operations'));

  const fetch = await confirm({
    message: 'Allow WebFetch (fetch web pages)?',
    default: defaults?.fetch ?? true,
  });

  const search = await confirm({
    message: 'Allow WebSearch?',
    default: defaults?.search ?? true,
  });

  return {
    fetch,
    search,
  };
}

/**
 * Prompt for custom permissions
 */
async function promptCustomPermissions(
  defaults?: Partial<CustomPermissions>
): Promise<CustomPermissions> {
  logger.newline();
  logger.info(colors.bold('⚙️  Custom Rules'));

  const wantCustom = await confirm({
    message: 'Do you want to add custom allow/deny rules?',
    default: false,
  });

  if (!wantCustom) {
    return {
      allow: defaults?.allow ?? [],
      deny: defaults?.deny ?? [],
    };
  }

  const allow: string[] = [...(defaults?.allow ?? [])];
  const deny: string[] = [...(defaults?.deny ?? [])];

  // Add allow rules
  let addMoreAllow = true;
  while (addMoreAllow) {
    const rule = await input({
      message: 'Add allow rule (e.g., "Bash(npm run *)"):',
    });

    if (rule.trim()) {
      allow.push(rule.trim());
    }

    addMoreAllow = await confirm({
      message: 'Add another allow rule?',
      default: false,
    });
  }

  // Add deny rules
  let addMoreDeny = await confirm({
    message: 'Do you want to add custom deny rules?',
    default: false,
  });

  while (addMoreDeny) {
    const rule = await input({
      message: 'Add deny rule (e.g., "Write(secrets/*)"):',
    });

    if (rule.trim()) {
      deny.push(rule.trim());
    }

    addMoreDeny = await confirm({
      message: 'Add another deny rule?',
      default: false,
    });
  }

  return { allow, deny };
}

/**
 * Show permissions summary
 */
export function showPermissionsSummary(config: PermissionsConfig): void {
  logger.newline();
  logger.subtitle('Permissions Summary');

  logger.keyValue('Preset', PRESET_DESCRIPTIONS[config.preset].name);
  logger.newline();

  // Files
  logger.info('📁 Files:');
  logger.keyValue('  Read all', config.files.readAll ? '✔' : '✖');
  logger.keyValue('  Write code', config.files.writeCode ? '✔' : '✖');
  logger.keyValue('  Write config', config.files.writeConfig ? '✔' : '✖');
  logger.keyValue('  Write markdown', config.files.writeMarkdown ? '✔' : '✖');
  logger.keyValue('  Write other', config.files.writeOther ? '✔' : '✖');
  logger.keyValue('  Edit tool', config.files.editTool ? '✔' : '✖');

  // Git
  logger.newline();
  logger.info('🔄 Git:');
  logger.keyValue('  Read only', config.git.readOnly ? '✔' : '✖');
  logger.keyValue('  Staging', config.git.staging ? '✔' : '✖');
  logger.keyValue('  Commit', config.git.commit ? '✔' : '✖');
  logger.keyValue('  Push', config.git.push ? '✔' : '✖');
  logger.keyValue('  Branching', config.git.branching ? '✔' : '✖');

  // Bash
  logger.newline();
  logger.info('💻 Bash:');
  logger.keyValue('  Package manager', config.bash.packageManager ? '✔' : '✖');
  logger.keyValue('  Testing', config.bash.testing ? '✔' : '✖');
  logger.keyValue('  Building', config.bash.building ? '✔' : '✖');
  logger.keyValue('  Docker', config.bash.docker ? '✔' : '✖');
  logger.keyValue('  Arbitrary', config.bash.arbitrary ? '✔' : '✖');

  // Web
  logger.newline();
  logger.info('🌐 Web:');
  logger.keyValue('  Fetch', config.web.fetch ? '✔' : '✖');
  logger.keyValue('  Search', config.web.search ? '✔' : '✖');

  // Custom rules
  if (config.custom?.allow?.length || config.custom?.deny?.length) {
    logger.newline();
    logger.info('⚙️  Custom rules:');
    if (config.custom?.allow?.length) {
      logger.keyValue('  Allow', config.custom.allow.join(', '));
    }
    if (config.custom?.deny?.length) {
      logger.keyValue('  Deny', config.custom.deny.join(', '));
    }
  }
}

/**
 * Confirm permissions configuration
 */
export async function confirmPermissionsConfig(config: PermissionsConfig): Promise<boolean> {
  showPermissionsSummary(config);
  logger.newline();

  return confirm({
    message: 'Is this permission configuration correct?',
    default: true,
  });
}

/**
 * Generate the rules that will be written to settings.json
 */
export function generatePermissionRules(config: PermissionsConfig): {
  allow: string[];
  deny: string[];
} {
  return {
    allow: generateAllowRules(config),
    deny: generateDenyRules(config),
  };
}
