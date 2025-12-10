/**
 * Template directive parser
 * Parses template directives like {{#if}}, {{#each}}, etc.
 */

import type { TemplateDirective, TemplateDirectiveType } from '../../types/templates.js';

/**
 * Directive patterns
 *
 * Supported syntax:
 * - {{#if condition}}...{{/if}}
 * - {{#unless condition}}...{{/unless}}
 * - {{#each items}}...{{/each}}
 * - {{#section name}}...{{/section}}
 * - {{> partialName}}
 * - {{variable}}
 * - {{variable | transform}}
 */

const DIRECTIVE_PATTERNS = {
  // Block directives: {{#type expression}}...{{/type}}
  block: /\{\{#(if|unless|each|section)\s+([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,

  // Include directive: {{> partialName}}
  include: /\{\{>\s*([^}]+)\}\}/g,

  // Variable with optional transform: {{variable}} or {{variable | transform}}
  variable: /\{\{([^#/>][^}|]*?)(?:\s*\|\s*(\w+))?\}\}/g,
};

/**
 * Parse template content for directives
 */
export function parseDirectives(content: string): TemplateDirective[] {
  const directives: TemplateDirective[] = [];

  // Parse block directives
  const blockMatches = content.matchAll(DIRECTIVE_PATTERNS.block);
  for (const match of blockMatches) {
    const [fullMatch, type, expression, innerContent] = match;
    const startIndex = match.index ?? 0;

    directives.push({
      type: type as TemplateDirectiveType,
      match: fullMatch,
      expression: expression.trim(),
      content: innerContent,
      startIndex,
      endIndex: startIndex + fullMatch.length,
      nested: parseDirectives(innerContent), // Recursive parse for nested directives
    });
  }

  // Parse include directives
  const includeMatches = content.matchAll(DIRECTIVE_PATTERNS.include);
  for (const match of includeMatches) {
    const [fullMatch, partialName] = match;
    const startIndex = match.index ?? 0;

    directives.push({
      type: 'include',
      match: fullMatch,
      expression: partialName.trim(),
      startIndex,
      endIndex: startIndex + fullMatch.length,
    });
  }

  return directives;
}

/**
 * Parse a single expression into its parts
 */
export function parseExpression(expression: string): {
  variable: string;
  path: string[];
  operator?: string;
  compareValue?: string;
} {
  // Handle comparison operators: variable == value, variable != value
  const comparisonMatch = expression.match(/^(\S+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
  if (comparisonMatch) {
    const [, variable, operator, compareValue] = comparisonMatch;
    return {
      variable: variable.trim(),
      path: variable.trim().split('.'),
      operator,
      compareValue: compareValue.trim().replace(/^["']|["']$/g, ''),
    };
  }

  // Handle negation: !variable
  if (expression.startsWith('!')) {
    const variable = expression.slice(1).trim();
    return {
      variable,
      path: variable.split('.'),
      operator: '!',
    };
  }

  // Simple variable path
  const variable = expression.trim();
  return {
    variable,
    path: variable.split('.'),
  };
}

/**
 * Parse variable reference with optional transform
 */
export function parseVariable(match: string): {
  variable: string;
  transform?: string;
} {
  // Remove {{ and }}
  const inner = match.slice(2, -2).trim();

  // Check for transform pipe
  const pipeIndex = inner.indexOf('|');
  if (pipeIndex !== -1) {
    return {
      variable: inner.slice(0, pipeIndex).trim(),
      transform: inner.slice(pipeIndex + 1).trim(),
    };
  }

  return { variable: inner };
}

/**
 * Find all variable references in content
 */
export function findVariables(content: string): Array<{
  match: string;
  variable: string;
  transform?: string;
  index: number;
}> {
  const variables: Array<{
    match: string;
    variable: string;
    transform?: string;
    index: number;
  }> = [];

  const matches = content.matchAll(DIRECTIVE_PATTERNS.variable);
  for (const match of matches) {
    const [fullMatch, variable, transform] = match;

    // Skip if it looks like a block directive
    if (variable.startsWith('#') || variable.startsWith('/') || variable.startsWith('>')) {
      continue;
    }

    variables.push({
      match: fullMatch,
      variable: variable.trim(),
      transform: transform?.trim(),
      index: match.index ?? 0,
    });
  }

  return variables;
}

/**
 * Check if content has any template directives
 */
export function hasDirectives(content: string): boolean {
  return /\{\{[#/>]?\s*\w/.test(content);
}

/**
 * Validate template syntax
 */
export function validateTemplate(content: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for unmatched block directives
  const openBlocks: Array<{ type: string; index: number }> = [];

  // Find opening blocks
  const openMatches = content.matchAll(/\{\{#(if|unless|each|section)\s+[^}]+\}\}/g);
  for (const match of openMatches) {
    openBlocks.push({
      type: match[1],
      index: match.index ?? 0,
    });
  }

  // Find closing blocks and match them
  const closeMatches = content.matchAll(/\{\{\/(if|unless|each|section)\}\}/g);
  const closeBlocks: string[] = [];
  for (const match of closeMatches) {
    closeBlocks.push(match[1]);
  }

  // Check for mismatched blocks
  if (openBlocks.length !== closeBlocks.length) {
    errors.push(
      `Mismatched block directives: ${openBlocks.length} opening, ${closeBlocks.length} closing`
    );
  }

  // Check for unclosed variables
  const unclosedVars = content.match(/\{\{(?![^}]*\}\})/g);
  if (unclosedVars) {
    errors.push(`Found ${unclosedVars.length} unclosed variable reference(s)`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
