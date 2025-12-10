/**
 * Bundle display utilities with ASCII box formatting
 * Provides rich visual display of bundle information
 */

import type { BundleDefinition, BundleValidationResult } from '../../types/bundles.js';
import { colors } from '../utils/logger.js';
import { resolveBundle } from './resolver.js';

// Box drawing characters
const BOX = {
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  horizontal: '─',
  vertical: '│',
  horizontalDown: '┬',
  horizontalUp: '┴',
  verticalRight: '├',
  verticalLeft: '┤',
  cross: '┼',
};

// Icons for different sections
const ICONS = {
  bundle: '📦',
  responsibilities: '🎯',
  useCases: '📋',
  agents: '🤖',
  skills: '⚡',
  commands: '💻',
  docs: '📚',
  tags: '🏷️',
  complexity: '📊',
  tech: '🔧',
  warning: '⚠️',
  error: '🔴',
  recommended: '🟡',
  check: '✓',
  bullet: '•',
};

/**
 * Default terminal width for box formatting
 */
const DEFAULT_WIDTH = 70;

/**
 * Create a horizontal line for boxes
 */
function horizontalLine(width: number, left: string, right: string, fill = BOX.horizontal): string {
  return left + fill.repeat(width - 2) + right;
}

/**
 * Pad a string to fit within box width
 */
function padLine(content: string, width: number): string {
  const visibleLength = stripAnsi(content).length;
  const padding = Math.max(0, width - 2 - visibleLength);
  return `${BOX.vertical} ${content}${' '.repeat(padding)}${BOX.vertical}`;
}

/**
 * Strip ANSI codes for length calculation
 */
function stripAnsi(str: string): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape codes use control characters
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Wrap text to fit within a maximum width
 */
function wrapText(text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxWidth) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines;
}

/**
 * Format complexity level with color
 */
function formatComplexity(complexity?: string): string {
  switch (complexity) {
    case 'minimal':
      return colors.success('Minimal');
    case 'standard':
      return colors.primary('Standard');
    case 'comprehensive':
      return colors.warning('Comprehensive');
    default:
      return colors.muted('Standard');
  }
}

/**
 * Format a bundle for rich visual display
 * Returns an array of lines to be printed
 */
export function formatBundleVisualDisplay(
  bundle: BundleDefinition,
  width: number = DEFAULT_WIDTH
): string[] {
  const lines: string[] = [];
  const contentWidth = width - 4; // Account for box borders and padding
  const resolved = resolveBundle(bundle);

  // Top border with title
  lines.push(horizontalLine(width, BOX.topLeft, BOX.topRight));

  // Bundle name with icon
  const title = `${ICONS.bundle} ${colors.primary(bundle.name)}`;
  lines.push(padLine(title, width));

  // Separator
  lines.push(horizontalLine(width, BOX.verticalRight, BOX.verticalLeft));

  // Description (wrapped)
  const descLines = wrapText(bundle.description, contentWidth);
  for (const line of descLines) {
    lines.push(padLine(line, width));
  }

  // Tech stack if available
  if (bundle.techStack && bundle.techStack.length > 0) {
    lines.push(padLine('', width)); // Empty line
    lines.push(
      padLine(`${ICONS.tech} ${colors.muted('Tech:')} ${bundle.techStack.join(', ')}`, width)
    );
  }

  // Responsibilities if available
  if (bundle.responsibilities && bundle.responsibilities.length > 0) {
    lines.push(padLine('', width));
    lines.push(padLine(`${ICONS.responsibilities} ${colors.primary('RESPONSIBILITIES:')}`, width));
    for (const resp of bundle.responsibilities) {
      const respLines = wrapText(`${ICONS.bullet} ${resp}`, contentWidth - 2);
      for (const line of respLines) {
        lines.push(padLine(`  ${line}`, width));
      }
    }
  }

  // Use cases if available
  if (bundle.useCases && bundle.useCases.length > 0) {
    lines.push(padLine('', width));
    lines.push(padLine(`${ICONS.useCases} ${colors.primary('USE CASES:')}`, width));
    for (const useCase of bundle.useCases) {
      const ucLines = wrapText(`${ICONS.bullet} ${useCase}`, contentWidth - 2);
      for (const line of ucLines) {
        lines.push(padLine(`  ${line}`, width));
      }
    }
  }

  // Agents section
  if (resolved.modules.agents.length > 0) {
    lines.push(padLine('', width));
    lines.push(
      padLine(
        `${ICONS.agents} ${colors.primary('AGENTS')} (${resolved.modules.agents.length}):`,
        width
      )
    );

    if (bundle.moduleDetails?.agents) {
      for (const agent of bundle.moduleDetails.agents) {
        lines.push(
          padLine(`  ${ICONS.bullet} ${colors.secondary(agent.id)} - ${agent.role}`, width)
        );
      }
    } else {
      lines.push(padLine(`  ${resolved.modules.agents.join(', ')}`, width));
    }
  }

  // Skills section
  if (resolved.modules.skills.length > 0) {
    lines.push(padLine('', width));
    lines.push(
      padLine(
        `${ICONS.skills} ${colors.primary('SKILLS')} (${resolved.modules.skills.length}):`,
        width
      )
    );

    if (bundle.moduleDetails?.skills) {
      for (const skill of bundle.moduleDetails.skills) {
        lines.push(
          padLine(`  ${ICONS.bullet} ${colors.secondary(skill.id)} - ${skill.purpose}`, width)
        );
      }
    } else {
      lines.push(padLine(`  ${resolved.modules.skills.join(', ')}`, width));
    }
  }

  // Commands section
  if (resolved.modules.commands.length > 0) {
    lines.push(padLine('', width));
    lines.push(
      padLine(
        `${ICONS.commands} ${colors.primary('COMMANDS')} (${resolved.modules.commands.length}):`,
        width
      )
    );

    if (bundle.moduleDetails?.commands) {
      for (const cmd of bundle.moduleDetails.commands) {
        lines.push(padLine(`  ${ICONS.bullet} ${colors.secondary(cmd.usage)}`, width));
      }
    } else {
      const cmdList = resolved.modules.commands.map((c) => `/${c}`).join(', ');
      lines.push(padLine(`  ${cmdList}`, width));
    }
  }

  // Docs section
  if (resolved.modules.docs.length > 0) {
    lines.push(padLine('', width));
    lines.push(
      padLine(`${ICONS.docs} ${colors.primary('DOCS')} (${resolved.modules.docs.length}):`, width)
    );

    if (bundle.moduleDetails?.docs) {
      for (const doc of bundle.moduleDetails.docs) {
        lines.push(padLine(`  ${ICONS.bullet} ${colors.secondary(doc.id)} - ${doc.topic}`, width));
      }
    } else {
      // Show first few and indicate more
      const maxShow = 5;
      const docsToShow = resolved.modules.docs.slice(0, maxShow);
      const remaining = resolved.modules.docs.length - maxShow;
      let docsText = docsToShow.join(', ');
      if (remaining > 0) {
        docsText += `, +${remaining} more`;
      }
      lines.push(padLine(`  ${docsText}`, width));
    }
  }

  // Tags and complexity footer
  lines.push(padLine('', width));
  const footerParts: string[] = [];
  if (bundle.tags && bundle.tags.length > 0) {
    footerParts.push(`${ICONS.tags} ${colors.muted('Tags:')} ${bundle.tags.join(', ')}`);
  }
  footerParts.push(
    `${ICONS.complexity} ${colors.muted('Complexity:')} ${formatComplexity(bundle.complexity)}`
  );
  lines.push(padLine(footerParts.join('  '), width));

  // Bottom border
  lines.push(horizontalLine(width, BOX.bottomLeft, BOX.bottomRight));

  return lines;
}

/**
 * Format validation warnings for display
 */
export function formatValidationWarnings(
  validation: BundleValidationResult,
  width: number = DEFAULT_WIDTH
): string[] {
  if (validation.errors.length === 0 && validation.warnings.length === 0) {
    return [];
  }

  const lines: string[] = [];

  // Top border
  lines.push(horizontalLine(width, BOX.topLeft, BOX.topRight));
  lines.push(padLine(`${ICONS.warning} ${colors.warning('DEPENDENCY WARNINGS')}`, width));
  lines.push(horizontalLine(width, BOX.verticalRight, BOX.verticalLeft));

  // Required (will be auto-included)
  if (validation.errors.length > 0) {
    lines.push(
      padLine(`${ICONS.error} ${colors.error('REQUIRED (will be auto-included):')}`, width)
    );
    for (const error of validation.errors) {
      lines.push(padLine(`  ${ICONS.bullet} ${error.message}`, width));
    }
  }

  // Recommended (optional)
  if (validation.warnings.length > 0) {
    if (validation.errors.length > 0) {
      lines.push(padLine('', width));
    }
    lines.push(padLine(`${ICONS.recommended} ${colors.warning('RECOMMENDED (optional):')}`, width));
    for (const warning of validation.warnings) {
      lines.push(padLine(`  ${ICONS.bullet} ${warning.message}`, width));
    }
  }

  // Bottom border
  lines.push(horizontalLine(width, BOX.bottomLeft, BOX.bottomRight));

  return lines;
}

/**
 * Format a compact bundle summary for list views
 */
export function formatBundleCompact(bundle: BundleDefinition): string {
  const resolved = resolveBundle(bundle);
  const counts: string[] = [];

  if (resolved.modules.agents.length > 0) {
    counts.push(`${resolved.modules.agents.length} agents`);
  }
  if (resolved.modules.skills.length > 0) {
    counts.push(`${resolved.modules.skills.length} skills`);
  }
  if (resolved.modules.commands.length > 0) {
    counts.push(`${resolved.modules.commands.length} commands`);
  }
  if (resolved.modules.docs.length > 0) {
    counts.push(`${resolved.modules.docs.length} docs`);
  }

  return `${bundle.name} (${counts.join(', ')})`;
}

/**
 * Print bundle visual display to console
 */
export function printBundleDisplay(bundle: BundleDefinition, width?: number): void {
  const lines = formatBundleVisualDisplay(bundle, width);
  for (const line of lines) {
    console.log(line);
  }
}

/**
 * Print validation warnings to console
 */
export function printValidationWarnings(validation: BundleValidationResult, width?: number): void {
  const lines = formatValidationWarnings(validation, width);
  for (const line of lines) {
    console.log(line);
  }
}
