/**
 * Wizard Navigation Logic
 *
 * Handles navigation between wizard steps, including back/forward movement,
 * computing next steps, and managing the "keep or reconfigure" flow.
 */

import { Separator } from '@inquirer/prompts';
import { colors, logger } from '../utils/logger.js';
import { select } from '../utils/prompt-cancel.js';
import type {
  NavigationDirection,
  RevisitAction,
  StepState,
  WizardChoice,
  WizardState,
} from './types.js';

/**
 * Special value used to detect "Back" selection in prompts
 */
export const BACK_OPTION_VALUE = '__wizard_back__' as const;

/**
 * Type for the back option value
 */
export type BackOptionValue = typeof BACK_OPTION_VALUE;

/**
 * Create the "Back" option to inject at the start of select/checkbox prompts
 */
export function createBackOption<T>(): WizardChoice<T | BackOptionValue> {
  return {
    name: `${colors.muted('←')} Back to previous step`,
    value: BACK_OPTION_VALUE as T | BackOptionValue,
    description: 'Return to the previous step',
  };
}

/**
 * Create a separator for visual distinction after the back option
 */
export function createBackSeparator(): { type: 'separator'; separator: string } {
  return {
    type: 'separator',
    separator: colors.muted('─'.repeat(30)),
  };
}

/**
 * Inject back option into choices array for select/checkbox prompts
 * Only adds if not on the first step
 */
type SeparatorItem = { type: 'separator'; separator?: string };

function isSeparatorItem<T>(choice: WizardChoice<T> | SeparatorItem): choice is SeparatorItem {
  return 'type' in choice && choice.type === 'separator';
}

export function injectBackOption<T>(
  choices: Array<WizardChoice<T> | SeparatorItem>,
  stepIndex: number
): Array<WizardChoice<T | BackOptionValue> | Separator> {
  if (stepIndex === 0) {
    // First step, no back option
    return choices.map((c) => {
      if (isSeparatorItem(c)) {
        return new Separator(c.separator);
      }
      return c as WizardChoice<T | BackOptionValue>;
    });
  }

  const backOption = createBackOption<T>();
  const separator = new Separator(colors.muted('─'.repeat(30)));

  return [
    backOption,
    separator,
    ...choices.map((c) => {
      if (isSeparatorItem(c)) {
        return new Separator(c.separator);
      }
      return c as WizardChoice<T | BackOptionValue>;
    }),
  ];
}

/**
 * Check if the selected value is the back option
 */
export function isBackSelected<T>(value: T | BackOptionValue): value is BackOptionValue {
  return value === BACK_OPTION_VALUE;
}

/**
 * Result of calculating the next step
 */
export interface NextStepResult {
  /** ID of the next step, or null if wizard should end */
  nextStepId: string | null;
  /** New status for the current step */
  currentStepNewStatus: StepState<unknown>['status'];
}

/**
 * Calculate the next step based on navigation direction
 */
export function calculateNextStep(
  state: WizardState,
  direction: NavigationDirection
): NextStepResult {
  const currentIndex = state.stepOrder.indexOf(state.currentStepId);
  const totalSteps = state.stepOrder.length;

  switch (direction) {
    case 'next': {
      if (currentIndex >= totalSteps - 1) {
        // Last step, wizard complete
        return {
          nextStepId: null,
          currentStepNewStatus: 'completed',
        };
      }
      return {
        nextStepId: state.stepOrder[currentIndex + 1],
        currentStepNewStatus: 'completed',
      };
    }

    case 'back': {
      if (currentIndex <= 0) {
        // First step, can't go back
        return {
          nextStepId: state.currentStepId,
          currentStepNewStatus: 'current',
        };
      }
      // When going back, don't mark as completed - the step wasn't finished
      return {
        nextStepId: state.stepOrder[currentIndex - 1],
        currentStepNewStatus: 'pending',
      };
    }

    case 'skip': {
      if (currentIndex >= totalSteps - 1) {
        // Last step, wizard complete
        return {
          nextStepId: null,
          currentStepNewStatus: 'skipped',
        };
      }
      return {
        nextStepId: state.stepOrder[currentIndex + 1],
        currentStepNewStatus: 'skipped',
      };
    }

    case 'cancel': {
      return {
        nextStepId: null,
        currentStepNewStatus: 'pending',
      };
    }
  }
}

/**
 * Apply navigation to the wizard state
 */
export function applyNavigation(
  state: WizardState,
  direction: NavigationDirection,
  currentValue: unknown
): WizardState {
  const { nextStepId, currentStepNewStatus } = calculateNextStep(state, direction);

  // Update current step state
  const currentStepState = state.steps[state.currentStepId];
  const updatedCurrentStep: StepState<unknown> = {
    ...currentStepState,
    status: currentStepNewStatus,
    value: currentValue,
  };

  // Build updated steps
  const updatedSteps = {
    ...state.steps,
    [state.currentStepId]: updatedCurrentStep,
  };

  if (nextStepId === null) {
    // Wizard is ending
    return {
      ...state,
      steps: updatedSteps,
      isComplete: direction === 'next' || direction === 'skip',
      isCancelled: direction === 'cancel',
    };
  }

  // Update next step to current
  const nextStepState = state.steps[nextStepId];
  const updatedNextStep: StepState<unknown> = {
    ...nextStepState,
    status: 'current',
  };

  return {
    ...state,
    steps: {
      ...updatedSteps,
      [nextStepId]: updatedNextStep,
    },
    currentStepId: nextStepId,
  };
}

/**
 * Prompt user to keep existing values or reconfigure a previously completed step
 */
export async function promptKeepOrReconfigure(stepName: string): Promise<RevisitAction> {
  logger.newline();

  const result = await select<RevisitAction>({
    message: `"${stepName}" was already configured. What would you like to do?`,
    choices: [
      {
        name: 'Keep current values and continue',
        value: 'keep' as const,
        description: 'Skip this step and proceed to the next one',
      },
      {
        name: 'Re-configure this step',
        value: 'reconfigure' as const,
        description: 'Show the prompts again with your previous values as defaults',
      },
    ],
    default: 'keep',
  });

  return result;
}

/**
 * Show progress indicator for current step
 */
export function showStepProgress(state: WizardState, isRevisit: boolean): void {
  if (!state.metadata.showProgress) {
    return;
  }

  const currentIndex = state.stepOrder.indexOf(state.currentStepId);
  const total = state.metadata.totalSteps;
  const currentStep = state.steps[state.currentStepId];

  // Build progress bar
  const progressChars = state.stepOrder.map((_stepId, idx) => {
    if (idx < currentIndex) {
      return colors.success('●'); // Completed
    }
    if (idx === currentIndex) {
      return colors.primary('◉'); // Current
    }
    return colors.muted('○'); // Pending
  });

  const progressBar = progressChars.join(' ');
  const stepIndicator = `[${currentIndex + 1}/${total}]`;
  const revisitBadge = isRevisit ? colors.warning(' (revisiting)') : '';

  logger.newline();
  logger.info(`${colors.muted(stepIndicator)} ${progressBar}${revisitBadge}`);
  logger.subtitle(currentStep.metadata.name);

  if (currentStep.metadata.description) {
    logger.info(colors.muted(currentStep.metadata.description));
  }
}
