/**
 * Project scaffold prompts
 */

import { checkbox, confirm, select } from '@inquirer/prompts';
import { logger } from '../../lib/utils/logger.js';
import type {
  PackageManager,
  ProjectType,
  ScaffoldOptions,
  ScaffoldType,
} from '../../types/scaffold.js';

interface ScaffoldPromptOptions {
  existingProject?: boolean;
  detectedType?: ProjectType;
  detectedPackageManager?: PackageManager;
}

/**
 * Prompt for scaffold type
 */
export async function promptScaffoldType(options?: ScaffoldPromptOptions): Promise<ScaffoldType> {
  logger.subtitle('Configuration Scope');

  if (options?.existingProject) {
    logger.info('Existing project detected');
    logger.newline();

    const choice = await select({
      message: 'What would you like to do?',
      choices: [
        {
          name: 'Add Claude config only (recommended)',
          value: 'claude-only' as const,
          description: 'Creates .claude/ folder without touching existing files',
        },
        {
          name: 'Full project setup (⚠️ may overwrite files)',
          value: 'full-project' as const,
          description: 'Includes project scaffolding - use with caution',
        },
      ],
      default: 'claude-only',
    });

    if (choice === 'full-project') {
      const confirmed = await confirm({
        message: '⚠️  This may overwrite existing files. Are you sure?',
        default: false,
      });
      if (!confirmed) {
        return 'claude-only';
      }
    }

    return choice;
  }

  return select({
    message: 'What would you like to configure?',
    choices: [
      {
        name: 'Claude configuration only',
        value: 'claude-only' as const,
        description: 'Only creates .claude/ folder with agents, commands, skills, docs',
      },
      {
        name: 'Full project setup',
        value: 'full-project' as const,
        description: 'Creates project structure + Claude configuration',
      },
    ],
    default: 'claude-only',
  });
}

/**
 * Prompt for project type
 */
export async function promptProjectType(detectedType?: ProjectType): Promise<ProjectType> {
  const choices = [
    {
      name: 'Node.js (TypeScript)',
      value: 'node' as const,
      description: 'Basic Node.js project with TypeScript',
    },
    {
      name: 'Monorepo (TurboRepo + pnpm)',
      value: 'monorepo' as const,
      description: 'Multi-package monorepo setup',
    },
    {
      name: 'Astro',
      value: 'astro' as const,
      description: 'Astro static/SSR site',
    },
    {
      name: 'Next.js',
      value: 'nextjs' as const,
      description: 'Next.js full-stack React framework',
    },
    {
      name: 'Vite + React',
      value: 'vite-react' as const,
      description: 'Vite bundled React SPA',
    },
    {
      name: 'Hono API',
      value: 'hono' as const,
      description: 'Hono lightweight API server',
    },
    {
      name: 'Custom',
      value: 'custom' as const,
      description: 'Define your own project structure',
    },
  ];

  if (detectedType) {
    const detected = choices.find((c) => c.value === detectedType);
    if (detected) {
      detected.name = `${detected.name} (detected)`;
    }
  }

  return select({
    message: 'Project type:',
    choices,
    default: detectedType || 'node',
  });
}

/**
 * Prompt for package manager
 */
export async function promptPackageManager(detected?: PackageManager): Promise<PackageManager> {
  const choices = [
    { name: 'pnpm (recommended)', value: 'pnpm' as const },
    { name: 'npm', value: 'npm' as const },
    { name: 'yarn', value: 'yarn' as const },
    { name: 'bun', value: 'bun' as const },
  ];

  if (detected) {
    const detectedChoice = choices.find((c) => c.value === detected);
    if (detectedChoice) {
      detectedChoice.name = `${detectedChoice.name} (detected)`;
    }
  }

  return select({
    message: 'Package manager:',
    choices,
    default: detected || 'pnpm',
  });
}

/**
 * Prompt for scaffold options
 */
export async function promptScaffoldOptions(
  options?: ScaffoldPromptOptions
): Promise<ScaffoldOptions> {
  const type = await promptScaffoldType(options);

  if (type === 'claude-only') {
    return { type };
  }

  const projectType = await promptProjectType(options?.detectedType);
  const packageManager = await promptPackageManager(options?.detectedPackageManager);

  logger.newline();
  logger.subtitle('Additional Options');

  const additionalOptions = await checkbox({
    message: 'Select additional options:',
    choices: [
      { name: 'Initialize git repository', value: 'initGit', checked: true },
      { name: 'Create README.md', value: 'createReadme', checked: true },
      { name: 'Create .gitignore', value: 'createGitignore', checked: true },
    ],
  });

  return {
    type,
    projectType,
    packageManager,
    initGit: additionalOptions.includes('initGit'),
    createReadme: additionalOptions.includes('createReadme'),
    createGitignore: additionalOptions.includes('createGitignore'),
  };
}

/**
 * Confirm scaffold options
 */
export async function confirmScaffoldOptions(scaffoldOptions: ScaffoldOptions): Promise<boolean> {
  logger.newline();
  logger.subtitle('Scaffold Summary');
  logger.keyValue(
    'Type',
    scaffoldOptions.type === 'claude-only' ? 'Claude config only' : 'Full project'
  );

  if (scaffoldOptions.type === 'full-project') {
    logger.keyValue('Project type', scaffoldOptions.projectType || 'node');
    logger.keyValue('Package manager', scaffoldOptions.packageManager || 'pnpm');
    logger.keyValue('Init git', scaffoldOptions.initGit ? 'Yes' : 'No');
    logger.keyValue('Create README', scaffoldOptions.createReadme ? 'Yes' : 'No');
    logger.keyValue('Create .gitignore', scaffoldOptions.createGitignore ? 'Yes' : 'No');
  }

  logger.newline();

  return confirm({
    message: 'Proceed with these options?',
    default: true,
  });
}
