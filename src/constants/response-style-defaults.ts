/**
 * Default values for response style configurations
 */

import type { ResponseStyleConfig } from '../types/config.js';

/**
 * Default response style configuration
 */
export const DEFAULT_RESPONSE_STYLE: ResponseStyleConfig = {
  tone: 'professional',
  verbosity: 'balanced',
  responseLanguage: 'es',
  useEmojis: false,
  errorStyle: 'neutral',
  explainReasoning: true,
  offerAlternatives: true,
  proactivity: 'moderate',
  confirmBeforeBigChanges: true,
};

/**
 * Response style presets for quick selection
 */
export type ResponseStylePreset = 'friendly' | 'professional' | 'strict' | 'mentor' | 'custom';

export interface ResponseStylePresetConfig {
  name: string;
  description: string;
  config: ResponseStyleConfig;
}

export const RESPONSE_STYLE_PRESETS: Record<ResponseStylePreset, ResponseStylePresetConfig> = {
  friendly: {
    name: 'Friendly',
    description: 'Casual and approachable, uses emojis, supportive error messages',
    config: {
      tone: 'friendly',
      verbosity: 'balanced',
      responseLanguage: 'es',
      useEmojis: true,
      errorStyle: 'supportive',
      explainReasoning: true,
      offerAlternatives: true,
      proactivity: 'moderate',
      confirmBeforeBigChanges: true,
    },
  },
  professional: {
    name: 'Professional',
    description: 'Professional but accessible, balanced explanations',
    config: DEFAULT_RESPONSE_STYLE,
  },
  strict: {
    name: 'Strict',
    description: 'Direct and concise, no fluff, minimal explanations',
    config: {
      tone: 'strict',
      verbosity: 'concise',
      responseLanguage: 'es',
      useEmojis: false,
      errorStyle: 'direct',
      explainReasoning: false,
      offerAlternatives: false,
      proactivity: 'minimal',
      confirmBeforeBigChanges: false,
    },
  },
  mentor: {
    name: 'Mentor',
    description: 'Educational tone, explains the why, detailed guidance',
    config: {
      tone: 'mentor',
      verbosity: 'detailed',
      responseLanguage: 'es',
      useEmojis: false,
      errorStyle: 'supportive',
      explainReasoning: true,
      offerAlternatives: true,
      proactivity: 'high',
      confirmBeforeBigChanges: true,
    },
  },
  custom: {
    name: 'Custom',
    description: 'Configure each option manually',
    config: DEFAULT_RESPONSE_STYLE,
  },
};

/**
 * Generate response style guidelines for CLAUDE.md
 */
export function generateResponseStyleGuidelines(config: ResponseStyleConfig): string {
  const lines: string[] = [];

  lines.push('## Response Style');
  lines.push('');
  lines.push('<!-- AUTO-GENERATED: Do not edit manually -->');
  lines.push('');

  // Basic settings
  lines.push(`**Tone:** ${capitalizeFirst(config.tone)}`);
  lines.push(`**Verbosity:** ${capitalizeFirst(config.verbosity)}`);
  lines.push(
    `**Language:** ${config.responseLanguage === 'es' ? 'Spanish' : config.responseLanguage === 'en' ? 'English' : 'Auto-detect'} (code in English)`
  );
  lines.push(`**Emojis:** ${config.useEmojis ? 'Yes' : 'No'}`);
  lines.push(`**Error Style:** ${capitalizeFirst(config.errorStyle)}`);
  lines.push(`**Explain Reasoning:** ${config.explainReasoning ? 'Yes' : 'No'}`);
  lines.push(`**Offer Alternatives:** ${config.offerAlternatives ? 'Yes' : 'No'}`);
  lines.push(`**Proactivity:** ${capitalizeFirst(config.proactivity)}`);
  lines.push(`**Confirm Big Changes:** ${config.confirmBeforeBigChanges ? 'Yes' : 'No'}`);
  lines.push('');

  // Guidelines based on configuration
  lines.push('### Guidelines');
  lines.push('');

  // Language guideline
  if (config.responseLanguage === 'es') {
    lines.push('- Respond in Spanish, write code/comments in English');
  } else if (config.responseLanguage === 'en') {
    lines.push('- Respond in English, write code/comments in English');
  } else {
    lines.push('- Match the language of the user, write code/comments in English');
  }

  // Tone guidelines
  switch (config.tone) {
    case 'friendly':
      lines.push('- Be warm and approachable in responses');
      lines.push('- Use casual language when appropriate');
      break;
    case 'professional':
      lines.push('- Be professional but accessible');
      lines.push('- Maintain a helpful and respectful tone');
      break;
    case 'formal':
      lines.push('- Use formal, technical language');
      lines.push('- Avoid colloquialisms and casual expressions');
      break;
    case 'strict':
      lines.push('- Be direct and to the point');
      lines.push('- Focus on facts and solutions without elaboration');
      break;
    case 'mentor':
      lines.push('- Take an educational approach');
      lines.push('- Explain concepts and reasoning behind suggestions');
      break;
  }

  // Reasoning guideline
  if (config.explainReasoning) {
    lines.push('- Explain the "why" behind decisions and recommendations');
  }

  // Alternatives guideline
  if (config.offerAlternatives) {
    lines.push('- Present alternatives when multiple valid approaches exist');
  }

  // Confirmation guideline
  if (config.confirmBeforeBigChanges) {
    lines.push('- Ask for confirmation before architectural or significant changes');
  }

  // Proactivity guideline
  switch (config.proactivity) {
    case 'minimal':
      lines.push('- Only address what was explicitly asked');
      break;
    case 'moderate':
      lines.push('- Suggest related improvements when relevant');
      break;
    case 'high':
      lines.push('- Proactively suggest improvements and best practices');
      break;
  }

  lines.push('');
  lines.push('<!-- END AUTO-GENERATED -->');

  return lines.join('\n');
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
