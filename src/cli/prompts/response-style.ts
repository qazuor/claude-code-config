/**
 * Response style configuration prompts
 */

import {
  DEFAULT_RESPONSE_STYLE,
  RESPONSE_STYLE_PRESETS,
  type ResponseStylePreset,
} from '../../constants/response-style-defaults.js';
import { colors, logger } from '../../lib/utils/logger.js';
import { confirm, select } from '../../lib/utils/prompt-cancel.js';
import type {
  ErrorResponseStyle,
  ProactivityLevel,
  ResponseStyleConfig,
  ResponseTone,
  ResponseVerbosity,
} from '../../types/config.js';

/**
 * Prompt for response style configuration
 */
export async function promptResponseStyleConfig(options?: {
  defaults?: Partial<ResponseStyleConfig>;
}): Promise<ResponseStyleConfig> {
  logger.section('Response Style', '💬');
  logger.info('Configure how Claude responds in this project');
  logger.newline();

  // Ask if user wants to configure response style
  const enableConfig = await confirm({
    message: "Would you like to configure Claude's response style?",
    default: true,
  });

  if (!enableConfig) {
    return DEFAULT_RESPONSE_STYLE;
  }

  // Offer preset selection
  const preset = await promptResponseStylePreset();

  if (preset !== 'custom') {
    const presetConfig = RESPONSE_STYLE_PRESETS[preset];
    logger.success(`Using "${presetConfig.name}" style`);
    return presetConfig.config;
  }

  // Custom configuration
  logger.newline();
  logger.info('Configure response style options:');

  const tone = await select<ResponseTone>({
    message: 'Response tone:',
    choices: [
      { name: 'Friendly - Casual and approachable', value: 'friendly' },
      { name: 'Professional - Professional but accessible', value: 'professional' },
      { name: 'Formal - Formal and technical', value: 'formal' },
      { name: 'Strict - Direct, no fluff', value: 'strict' },
      { name: 'Mentor - Educational, explains the why', value: 'mentor' },
    ],
    default: options?.defaults?.tone ?? DEFAULT_RESPONSE_STYLE.tone,
  });

  const verbosity = await select<ResponseVerbosity>({
    message: 'Response verbosity:',
    choices: [
      { name: 'Concise - Minimum necessary', value: 'concise' },
      { name: 'Balanced - Mix of brevity and detail', value: 'balanced' },
      { name: 'Detailed - Complete explanations', value: 'detailed' },
    ],
    default: options?.defaults?.verbosity ?? DEFAULT_RESPONSE_STYLE.verbosity,
  });

  const responseLanguage = await select<'es' | 'en' | 'auto'>({
    message: 'Response language (code always in English):',
    choices: [
      { name: 'Spanish', value: 'es' },
      { name: 'English', value: 'en' },
      { name: 'Auto-detect (match user)', value: 'auto' },
    ],
    default: options?.defaults?.responseLanguage ?? DEFAULT_RESPONSE_STYLE.responseLanguage,
  });

  const useEmojis = await confirm({
    message: 'Use emojis in responses?',
    default: options?.defaults?.useEmojis ?? DEFAULT_RESPONSE_STYLE.useEmojis,
  });

  const errorStyle = await select<ErrorResponseStyle>({
    message: 'Error reporting style:',
    choices: [
      { name: 'Supportive - "Don\'t worry, this is common..."', value: 'supportive' },
      { name: 'Neutral - "The error indicates that..."', value: 'neutral' },
      { name: 'Direct - "Error: X. Solution: Y."', value: 'direct' },
    ],
    default: options?.defaults?.errorStyle ?? DEFAULT_RESPONSE_STYLE.errorStyle,
  });

  const explainReasoning = await confirm({
    message: 'Explain the "why" behind decisions?',
    default: options?.defaults?.explainReasoning ?? DEFAULT_RESPONSE_STYLE.explainReasoning,
  });

  const offerAlternatives = await confirm({
    message: 'Offer alternatives when multiple solutions exist?',
    default: options?.defaults?.offerAlternatives ?? DEFAULT_RESPONSE_STYLE.offerAlternatives,
  });

  const proactivity = await select<ProactivityLevel>({
    message: 'Proactivity level (suggesting unsolicited improvements):',
    choices: [
      { name: 'Minimal - Only address what was asked', value: 'minimal' },
      { name: 'Moderate - Suggest related improvements', value: 'moderate' },
      { name: 'High - Proactively suggest best practices', value: 'high' },
    ],
    default: options?.defaults?.proactivity ?? DEFAULT_RESPONSE_STYLE.proactivity,
  });

  const confirmBeforeBigChanges = await confirm({
    message: 'Ask for confirmation before big changes?',
    default:
      options?.defaults?.confirmBeforeBigChanges ?? DEFAULT_RESPONSE_STYLE.confirmBeforeBigChanges,
  });

  return {
    tone,
    verbosity,
    responseLanguage,
    useEmojis,
    errorStyle,
    explainReasoning,
    offerAlternatives,
    proactivity,
    confirmBeforeBigChanges,
  };
}

/**
 * Prompt for response style preset selection
 */
async function promptResponseStylePreset(): Promise<ResponseStylePreset> {
  return select<ResponseStylePreset>({
    message: 'Choose a response style preset:',
    choices: Object.entries(RESPONSE_STYLE_PRESETS).map(([key, preset]) => ({
      name: `${preset.name} - ${preset.description}`,
      value: key as ResponseStylePreset,
    })),
    default: 'professional',
  });
}

/**
 * Show response style summary
 */
export function showResponseStyleSummary(config: ResponseStyleConfig): void {
  const languageMap = {
    es: 'Spanish',
    en: 'English',
    auto: 'Auto-detect',
  };

  logger.item(`Response style: ${capitalizeFirst(config.tone)}`);
  logger.info(colors.muted(`  Verbosity: ${capitalizeFirst(config.verbosity)}`));
  logger.info(colors.muted(`  Language: ${languageMap[config.responseLanguage]}`));
  logger.info(colors.muted(`  Emojis: ${config.useEmojis ? 'Yes' : 'No'}`));
  logger.info(colors.muted(`  Error style: ${capitalizeFirst(config.errorStyle)}`));
  logger.info(colors.muted(`  Explain reasoning: ${config.explainReasoning ? 'Yes' : 'No'}`));
  logger.info(colors.muted(`  Offer alternatives: ${config.offerAlternatives ? 'Yes' : 'No'}`));
  logger.info(colors.muted(`  Proactivity: ${capitalizeFirst(config.proactivity)}`));
  logger.info(
    colors.muted(`  Confirm big changes: ${config.confirmBeforeBigChanges ? 'Yes' : 'No'}`)
  );
}

/**
 * Confirm response style configuration
 */
export async function confirmResponseStyleConfig(config: ResponseStyleConfig): Promise<boolean> {
  showResponseStyleSummary(config);
  logger.newline();

  return confirm({
    message: 'Apply this response style?',
    default: true,
  });
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
