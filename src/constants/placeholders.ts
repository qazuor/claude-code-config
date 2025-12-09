/**
 * Placeholder definitions for template processing
 */

import type { PlaceholderDefinition } from '../types/placeholders.js';

/**
 * All placeholder patterns that can be replaced in templates
 */
export const PLACEHOLDERS: PlaceholderDefinition[] = [
  // Project info placeholders
  {
    pattern: /\[Project Name\]/g,
    configKey: 'name',
    transform: 'none',
    description: 'Project name',
    example: 'My Awesome Project',
    required: true,
  },
  {
    pattern: /\[project-name\]/g,
    configKey: 'name',
    transform: 'lowercase',
    description: 'Project name in lowercase with dashes',
    example: 'my-awesome-project',
    required: true,
  },
  {
    pattern: /\[PROJECT_NAME\]/g,
    configKey: 'name',
    transform: 'uppercase',
    description: 'Project name in uppercase with underscores',
    example: 'MY_AWESOME_PROJECT',
    required: true,
  },
  {
    pattern: /\[Project Description\]/g,
    configKey: 'description',
    transform: 'none',
    description: 'Project description',
    example: 'A powerful CLI tool for managing configurations',
    required: true,
  },
  {
    pattern: /your-org/g,
    configKey: 'org',
    transform: 'lowercase',
    description: 'GitHub organization or username',
    example: 'acme-corp',
    required: true,
  },
  {
    pattern: /your-repo/g,
    configKey: 'repo',
    transform: 'lowercase',
    description: 'Repository name',
    example: 'my-project',
    required: true,
  },
  {
    pattern: /example\.com/g,
    configKey: 'domain',
    transform: 'lowercase',
    description: 'Project domain',
    example: 'myproject.com',
    required: false,
  },

  // Entity placeholders
  {
    pattern: /\[Entity\]/g,
    configKey: 'entityType',
    transform: 'capitalize',
    description: 'Primary entity type (capitalized)',
    example: 'Product',
    required: true,
  },
  {
    pattern: /\[entity\]/g,
    configKey: 'entityType',
    transform: 'lowercase',
    description: 'Primary entity type (lowercase)',
    example: 'product',
    required: true,
  },
  {
    pattern: /\[Entities\]/g,
    configKey: 'entityTypePlural',
    transform: 'capitalize',
    description: 'Primary entity type plural (capitalized)',
    example: 'Products',
    required: true,
  },
  {
    pattern: /\[entities\]/g,
    configKey: 'entityTypePlural',
    transform: 'lowercase',
    description: 'Primary entity type plural (lowercase)',
    example: 'products',
    required: true,
  },

  // Location placeholders
  {
    pattern: /\[City Name\]/g,
    configKey: 'location',
    transform: 'capitalize',
    description: 'City or location name',
    example: 'San Francisco',
    required: false,
  },
  {
    pattern: /\[Your Region\/Product\]/g,
    configKey: 'location',
    transform: 'none',
    description: 'Region or product area',
    example: 'Bay Area',
    required: false,
  },
  {
    pattern: /\[Your product\/service tagline here\]/g,
    configKey: 'description',
    transform: 'none',
    description: 'Product tagline',
    example: 'The best way to manage your projects',
    required: false,
  },
];

/**
 * Get placeholder by pattern string
 */
export function getPlaceholder(pattern: string): PlaceholderDefinition | undefined {
  return PLACEHOLDERS.find((p) => {
    if (p.pattern instanceof RegExp) {
      return p.pattern.source === pattern || p.pattern.source === new RegExp(pattern).source;
    }
    return p.pattern === pattern;
  });
}

/**
 * Get all required placeholders
 */
export function getRequiredPlaceholders(): PlaceholderDefinition[] {
  return PLACEHOLDERS.filter((p) => p.required);
}

/**
 * Get all optional placeholders
 */
export function getOptionalPlaceholders(): PlaceholderDefinition[] {
  return PLACEHOLDERS.filter((p) => !p.required);
}

/**
 * Apply transformation to a value
 */
export function applyTransform(
  value: string,
  transform: PlaceholderDefinition['transform']
): string {
  switch (transform) {
    case 'lowercase':
      return value.toLowerCase().replace(/\s+/g, '-');
    case 'uppercase':
      return value.toUpperCase().replace(/\s+/g, '_');
    case 'capitalize':
      return value
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    case 'pluralize':
      // Simple pluralization rules
      if (value.endsWith('y')) {
        return `${value.slice(0, -1)}ies`;
      }
      if (
        value.endsWith('s') ||
        value.endsWith('x') ||
        value.endsWith('ch') ||
        value.endsWith('sh')
      ) {
        return `${value}es`;
      }
      return `${value}s`;
    default:
      return value;
  }
}
