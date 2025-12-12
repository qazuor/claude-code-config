/**
 * Wizard Engine
 *
 * Main orchestrator for running multi-step wizards with back navigation,
 * history tracking, and keep-or-reconfigure flows.
 */

import { logger } from '../utils/logger.js';
import { getLastValue, wasStepCompleted } from './history.js';
import { applyNavigation, promptKeepOrReconfigure, showStepProgress } from './navigator.js';
import {
  type WizardStepDefinition,
  createStepState,
  recordStepHistory,
  shouldSkipStep,
} from './step.js';
import type { StepState, WizardMetadata, WizardResult, WizardState } from './types.js';

/**
 * Step configuration for a wizard
 */
export interface WizardStepConfig<TContext = Record<string, unknown>> {
  /** Step ID */
  id: string;
  /** Step definition */
  definition: WizardStepDefinition<unknown, TContext>;
}

/**
 * Configuration for creating a wizard
 */
export interface WizardConfig<TContext = Record<string, unknown>> {
  /** Unique wizard identifier */
  id: string;
  /** Title displayed to user */
  title: string;
  /** Ordered list of step definitions */
  steps: WizardStepConfig<TContext>[];
  /** Allow skipping optional steps (default: true) */
  allowSkip?: boolean;
  /** Show progress indicator (default: true) */
  showProgress?: boolean;
}

/**
 * Create initial wizard state from configuration
 */
export function createWizardState<TContext>(config: WizardConfig<TContext>): WizardState {
  const stepOrder = config.steps.map((s) => s.id);

  // Create state for each step
  const steps: Record<string, StepState<unknown>> = {};
  for (let i = 0; i < config.steps.length; i++) {
    const step = config.steps[i];
    steps[step.id] = createStepState(step.definition as WizardStepDefinition<unknown, unknown>, i);
  }

  const metadata: WizardMetadata = {
    id: config.id,
    title: config.title,
    totalSteps: config.steps.length,
    startTime: new Date(),
    allowSkip: config.allowSkip ?? true,
    showProgress: config.showProgress ?? true,
  };

  return {
    steps,
    currentStepId: stepOrder[0],
    stepOrder,
    isComplete: false,
    isCancelled: false,
    metadata,
  };
}

/**
 * Run a wizard to completion
 *
 * @param config - Wizard configuration
 * @param initialContext - Optional initial values to seed the context
 * @returns Result containing all collected values and final state
 */
export async function runWizard<TValues extends Record<string, unknown>, TContext = TValues>(
  config: WizardConfig<TContext>,
  initialContext: Partial<TContext> = {}
): Promise<WizardResult<TValues>> {
  // Initialize state
  let state = createWizardState(config);

  // Build step map for quick lookup
  const stepMap = new Map<string, WizardStepDefinition<unknown, TContext>>();
  for (const step of config.steps) {
    stepMap.set(step.id, step.definition);
  }

  // Accumulated context (starts with initial, grows as steps complete)
  let context = { ...initialContext } as TContext;

  // Track if we're moving forward from a back navigation
  let movingForwardAfterBack = false;

  // Main wizard loop
  while (!state.isComplete && !state.isCancelled) {
    const currentStepId = state.currentStepId;
    const stepDef = stepMap.get(currentStepId);
    if (!stepDef) {
      throw new Error(`Step definition not found for: ${currentStepId}`);
    }
    const stepState = state.steps[currentStepId];

    // Check if step should be skipped
    if (shouldSkipStep(stepDef, context)) {
      state = applyNavigation(state, 'skip', undefined);
      continue;
    }

    // Check if this is a previously completed step we're returning to while moving forward
    const previouslyCompleted = wasStepCompleted(stepState);

    if (movingForwardAfterBack && previouslyCompleted) {
      // Ask user if they want to keep or reconfigure
      const action = await promptKeepOrReconfigure(stepState.metadata.name);

      if (action === 'keep') {
        // Keep existing value and move to next step
        state = applyNavigation(state, 'next', stepState.value);
        continue;
      }
      // User chose to reconfigure, fall through to execute the step
    }

    // Determine if this is a revisit
    const isRevisit = stepState.history.length > 0;

    // Show progress indicator
    showStepProgress(state, isRevisit);

    // Compute defaults - use last value if revisiting, otherwise compute
    const previousValue = getLastValue(stepState);
    const defaults = previousValue ?? stepDef.computeDefaults(context);

    // Execute the step
    const result = await stepDef.execute(context, defaults);

    // Only update context and history if NOT going back
    // When going back, the step wasn't actually completed
    if (result.navigation !== 'back') {
      // Update context with result
      context = {
        ...context,
        [currentStepId]: result.value,
      };

      // Record in history
      const updatedStepState = recordStepHistory(stepState, result.value, result.navigation);

      state = {
        ...state,
        steps: {
          ...state.steps,
          [currentStepId]: updatedStepState,
        },
      };
    }

    // Track direction for next iteration
    if (result.navigation === 'back') {
      movingForwardAfterBack = false;
    } else if (result.navigation === 'next') {
      // If we're going forward and previously went back, we're now moving forward after back
      movingForwardAfterBack = isRevisit || movingForwardAfterBack;
    }

    // Apply navigation
    state = applyNavigation(state, result.navigation, result.value);
  }

  // Extract final values from state
  const values = {} as TValues;
  for (const stepId of state.stepOrder) {
    const step = state.steps[stepId];
    if (step.value !== undefined) {
      (values as Record<string, unknown>)[stepId] = step.value;
    }
  }

  return {
    values,
    state,
    cancelled: state.isCancelled,
  };
}

/**
 * Show wizard completion summary
 */
export function showWizardSummary(state: WizardState): void {
  const completed = state.stepOrder.filter((id) => {
    const step = state.steps[id];
    return step.status === 'completed';
  }).length;

  const skipped = state.stepOrder.filter((id) => {
    const step = state.steps[id];
    return step.status === 'skipped';
  }).length;

  const revisited = state.stepOrder.filter((id) => {
    const step = state.steps[id];
    return step.history.length > 1;
  }).length;

  logger.newline();
  logger.success(`Wizard completed: ${completed} steps configured`);

  if (skipped > 0) {
    logger.info(`  ${skipped} steps skipped`);
  }

  if (revisited > 0) {
    logger.info(`  ${revisited} steps were reconfigured`);
  }
}
