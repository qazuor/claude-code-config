/**
 * Template expression evaluator
 * Evaluates conditions and expressions against a context
 */

import type { TemplateContext } from '../../types/templates.js';
import { parseExpression } from './parser.js';

/**
 * Get a value from context using dot notation path
 */
export function getContextValue(
  context: TemplateContext,
  path: string
): string | boolean | number | string[] | undefined {
  const parts = path.split('.');
  // biome-ignore lint/suspicious/noExplicitAny: dynamic access required
  let current: any = context;

  for (const part of parts) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

/**
 * Evaluate a boolean expression
 */
export function evaluateCondition(expression: string, context: TemplateContext): boolean {
  const parsed = parseExpression(expression);

  // Handle AND/OR operators
  if (expression.includes('&&')) {
    const parts = expression.split('&&').map((p) => p.trim());
    return parts.every((part) => evaluateCondition(part, context));
  }

  if (expression.includes('||')) {
    const parts = expression.split('||').map((p) => p.trim());
    return parts.some((part) => evaluateCondition(part, context));
  }

  const value = getContextValue(context, parsed.variable);

  // Handle negation
  if (parsed.operator === '!') {
    return !isTruthy(value);
  }

  // Handle comparisons
  if (parsed.operator && parsed.compareValue !== undefined) {
    const compareValue = parsed.compareValue;

    switch (parsed.operator) {
      case '==':
        return String(value) === compareValue;
      case '!=':
        return String(value) !== compareValue;
      case '>':
        return Number(value) > Number(compareValue);
      case '>=':
        return Number(value) >= Number(compareValue);
      case '<':
        return Number(value) < Number(compareValue);
      case '<=':
        return Number(value) <= Number(compareValue);
      default:
        return false;
    }
  }

  // Handle array membership checks: modules.agents.includes("tech-lead")
  if (expression.includes('.includes(')) {
    const match = expression.match(/^(.+?)\.includes\(["'](.+?)["']\)$/);
    if (match) {
      const [, arrayPath, searchValue] = match;
      const arrayValue = getContextValue(context, arrayPath);
      if (Array.isArray(arrayValue)) {
        return arrayValue.includes(searchValue);
      }
    }
    return false;
  }

  // Handle "has" helper: has modules.agents "tech-lead"
  if (expression.startsWith('has ')) {
    const match = expression.match(/^has\s+(\S+)\s+["']?(.+?)["']?$/);
    if (match) {
      const [, arrayPath, searchValue] = match;
      const arrayValue = getContextValue(context, arrayPath);
      if (Array.isArray(arrayValue)) {
        return arrayValue.includes(searchValue);
      }
    }
    return false;
  }

  // Simple truthy check
  return isTruthy(value);
}

/**
 * Check if a value is truthy
 */
export function isTruthy(value: unknown): boolean {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.length > 0;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value).length > 0;
  }

  return Boolean(value);
}

/**
 * Get iterable for each loops
 */
export function getIterable(
  expression: string,
  context: TemplateContext
): Array<{ item: unknown; index: number; key?: string }> {
  const value = getContextValue(context, expression);

  if (Array.isArray(value)) {
    return value.map((item, index) => ({ item, index }));
  }

  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).map(([key, item], index) => ({
      item,
      index,
      key,
    }));
  }

  return [];
}

/**
 * Apply a transform to a value
 */
export function applyTemplateTransform(
  value: string | boolean | number | string[] | undefined,
  transform: string
): string {
  if (value === undefined || value === null) {
    return '';
  }

  const strValue = Array.isArray(value) ? value.join(', ') : String(value);

  switch (transform.toLowerCase()) {
    case 'lowercase':
    case 'lower':
      return strValue.toLowerCase();

    case 'uppercase':
    case 'upper':
      return strValue.toUpperCase();

    case 'capitalize':
    case 'title':
      return strValue
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    case 'kebab':
    case 'kebabcase':
      return strValue.toLowerCase().replace(/\s+/g, '-');

    case 'snake':
    case 'snakecase':
      return strValue.toLowerCase().replace(/\s+/g, '_');

    case 'camel':
    case 'camelcase':
      return strValue
        .split(/[\s-_]+/)
        .map((word, i) =>
          i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join('');

    case 'pascal':
    case 'pascalcase':
      return strValue
        .split(/[\s-_]+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');

    case 'json':
      return JSON.stringify(value);

    case 'count':
      return String(Array.isArray(value) ? value.length : strValue.length);

    case 'first':
      if (Array.isArray(value)) {
        return String(value[0] ?? '');
      }
      return strValue;

    case 'last':
      if (Array.isArray(value)) {
        return String(value[value.length - 1] ?? '');
      }
      return strValue;

    case 'join':
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return strValue;

    case 'joinlines':
      if (Array.isArray(value)) {
        return value.join('\n');
      }
      return strValue;

    case 'bullet':
    case 'bullets':
      if (Array.isArray(value)) {
        return value.map((v) => `- ${v}`).join('\n');
      }
      return `- ${strValue}`;

    case 'numbered':
      if (Array.isArray(value)) {
        return value.map((v, i) => `${i + 1}. ${v}`).join('\n');
      }
      return `1. ${strValue}`;

    default:
      return strValue;
  }
}

/**
 * Create a scoped context for loop iterations
 */
export function createLoopContext(
  parentContext: TemplateContext,
  itemValue: unknown,
  index: number,
  key?: string
): TemplateContext & { item: unknown; index: number; key?: string } {
  return {
    ...parentContext,
    item: itemValue,
    index,
    key,
  };
}
