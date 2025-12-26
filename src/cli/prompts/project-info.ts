/**
 * Project information prompts
 */

import { logger } from '../../lib/utils/logger.js';
import { confirm, input } from '../../lib/utils/prompt-cancel.js';
import type { ProjectInfo } from '../../types/config.js';

interface ProjectInfoOptions {
  defaults?: Partial<ProjectInfo>;
  skipOptional?: boolean;
}

/**
 * Prompt for project information
 */
export async function promptProjectInfo(options?: ProjectInfoOptions): Promise<ProjectInfo> {
  logger.section('Project Information', '📋');

  const name = await input({
    message: 'Project name:',
    default: options?.defaults?.name,
    validate: (value) => {
      if (!value.trim()) return 'Project name is required';
      if (!/^[a-zA-Z0-9-_.\s]+$/.test(value)) {
        return 'Project name can only contain letters, numbers, dashes, underscores, dots, and spaces';
      }
      return true;
    },
  });

  const description = await input({
    message: 'Project description:',
    default: options?.defaults?.description || '',
    validate: (value) => {
      if (!value.trim()) return 'Description is required';
      return true;
    },
  });

  const org = await input({
    message: 'GitHub organization/username:',
    default: options?.defaults?.org || '',
    validate: (value) => {
      if (!value.trim()) return 'Organization is required';
      if (!/^[a-zA-Z0-9-]+$/.test(value)) {
        return 'Organization can only contain letters, numbers, and dashes';
      }
      return true;
    },
  });

  const repo = await input({
    message: 'Repository name:',
    default: options?.defaults?.repo || name.toLowerCase().replace(/\s+/g, '-'),
    validate: (value) => {
      if (!value.trim()) return 'Repository name is required';
      if (!/^[a-zA-Z0-9-_.]+$/.test(value)) {
        return 'Repository name can only contain letters, numbers, dashes, underscores, and dots';
      }
      return true;
    },
  });

  // Ask for author (optional)
  const author = await input({
    message: 'Author (name or "Name <email>"):',
    default: options?.defaults?.author || '',
  });

  // Ask if user wants to configure entity type
  let entityType = 'item';
  let entityTypePlural = 'items';

  const wantEntityConfig = await confirm({
    message: 'Configure primary entity type? (Used for code examples and templates)',
    default: false,
  });

  if (wantEntityConfig) {
    logger.info('The entity type is used in code examples and templates throughout the project.');
    logger.info(
      'For example, if your project manages "products", code examples will use product-related names.'
    );
    logger.newline();

    entityType = await input({
      message: 'Primary entity type (e.g., product, article, user, listing):',
      default: options?.defaults?.entityType || 'item',
      validate: (value) => {
        if (!value.trim()) return 'Entity type is required';
        return true;
      },
    });

    entityTypePlural = await input({
      message: 'Entity type plural:',
      default: options?.defaults?.entityTypePlural || pluralize(entityType),
    });
  } else if (options?.defaults?.entityType) {
    entityType = options.defaults.entityType;
    entityTypePlural = options.defaults.entityTypePlural || pluralize(entityType);
  }

  let domain: string | undefined;
  let location: string | undefined;

  if (!options?.skipOptional) {
    const wantDomain = await confirm({
      message: 'Do you want to specify a domain?',
      default: false,
    });

    if (wantDomain) {
      domain = await input({
        message: 'Domain (e.g., myproject.com):',
        default: options?.defaults?.domain || '',
        validate: (value) => {
          if (value && !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
            return 'Please enter a valid domain';
          }
          return true;
        },
      });
    }

    const wantLocation = await confirm({
      message: 'Do you want to specify a location/region?',
      default: false,
    });

    if (wantLocation) {
      location = await input({
        message: 'Location/Region:',
        default: options?.defaults?.location || '',
      });
    }
  }

  return {
    name: name.trim(),
    description: description.trim(),
    org: org.trim(),
    repo: repo.trim(),
    domain,
    entityType: entityType.trim().toLowerCase(),
    entityTypePlural: entityTypePlural.trim().toLowerCase(),
    location,
    author: author.trim() || undefined,
  };
}

/**
 * Simple pluralization helper
 */
function pluralize(word: string): string {
  const lower = word.toLowerCase();
  if (lower.endsWith('y')) {
    return `${lower.slice(0, -1)}ies`;
  }
  if (lower.endsWith('s') || lower.endsWith('x') || lower.endsWith('ch') || lower.endsWith('sh')) {
    return `${lower}es`;
  }
  return `${lower}s`;
}

/**
 * Confirm project info summary
 */
export async function confirmProjectInfo(info: ProjectInfo): Promise<boolean> {
  logger.newline();
  logger.subtitle('Project Summary');
  logger.keyValue('Name', info.name);
  logger.keyValue('Description', info.description);
  logger.keyValue('GitHub', `${info.org}/${info.repo}`);
  if (info.author) logger.keyValue('Author', info.author);
  logger.keyValue('Entity', `${info.entityType} / ${info.entityTypePlural}`);
  if (info.domain) logger.keyValue('Domain', info.domain);
  if (info.location) logger.keyValue('Location', info.location);
  logger.newline();

  return confirm({
    message: 'Is this information correct?',
    default: true,
  });
}
