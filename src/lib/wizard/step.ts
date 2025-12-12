/**
 * Wizard Step Definition and Utilities
 *
 * Provides the foundation for defining wizard steps and managing
 * their execution within the wizard engine.
 */

import type { NavigationDirection, StepHistoryEntry, StepMetadata, StepState } from './types.js';

/**
 * Result of executing a step's prompt
 */
export interface StepExecutionResult<T> {
  /** The value collected from user */
  value: T;
  /** How user wants to proceed */
  navigation: NavigationDirection;
  /** Whether the value differs from default */
  wasModified: boolean;
}

/**
 * Function to compute default values for a step
 */
export type DefaultsComputer<T, TContext> = (context: TContext) => T | undefined;

/**
 * Function to validate a step's value
 * Returns true if valid, or error message string if invalid
 */
export type StepValidator<T, TContext> = (value: T, context: TContext) => boolean | string;

/**
 * Function to execute the step's prompts
 * Receives context (accumulated values) and optional defaults
 */
export type StepExecutor<T, TContext> = (
  context: TContext,
  defaults?: T
) => Promise<StepExecutionResult<T>>;

/**
 * Complete definition for a wizard step
 */
export interface WizardStepDefinition<T, TContext = Record<string, unknown>> {
  /** Step metadata (without index, which is assigned by wizard) */
  metadata: Omit<StepMetadata, 'index'>;

  /** Function to compute defaults from accumulated context */
  computeDefaults: DefaultsComputer<T, TContext>;

  /** Function to execute the step's prompts */
  execute: StepExecutor<T, TContext>;

  /** Optional validation function */
  validate?: StepValidator<T, TContext>;

  /** Optional: skip this step if condition returns true */
  skipCondition?: (context: TContext) => boolean;
}

/**
 * Create initial state for a step from its definition
 */
export function createStepState<T>(
  definition: WizardStepDefinition<T, unknown>,
  index: number
): StepState<T> {
  return {
    metadata: {
      ...definition.metadata,
      index,
    },
    status: index === 0 ? 'current' : 'pending',
    value: undefined,
    history: [],
    isModified: false,
  };
}

/**
 * Record a new history entry for a step
 */
export function recordStepHistory<T>(
  state: StepState<T>,
  value: T,
  exitDirection: NavigationDirection
): StepState<T> {
  const entry: StepHistoryEntry<T> = {
    timestamp: new Date(),
    value,
    exitDirection,
    visitCount: state.history.length + 1,
  };

  return {
    ...state,
    value,
    history: [...state.history, entry],
    isModified: true,
  };
}

/**
 * Update step status
 */
export function updateStepStatus<T>(
  state: StepState<T>,
  status: StepState<T>['status']
): StepState<T> {
  return {
    ...state,
    status,
  };
}

/**
 * Check if step has been visited before
 */
export function hasBeenVisited<T>(state: StepState<T>): boolean {
  return state.history.length > 0 || state.status === 'completed';
}

/**
 * Get the number of times a step has been visited
 */
export function getVisitCount<T>(state: StepState<T>): number {
  return state.history.length;
}

/**
 * Check if step value passes validation
 */
export function validateStep<T, TContext>(
  definition: WizardStepDefinition<T, TContext>,
  value: T,
  context: TContext
): { valid: boolean; error?: string } {
  if (!definition.validate) {
    return { valid: true };
  }

  const result = definition.validate(value, context);

  if (result === true) {
    return { valid: true };
  }

  if (result === false) {
    return { valid: false, error: 'Validation failed' };
  }

  return { valid: false, error: result };
}

/**
 * Check if step should be skipped based on context
 */
export function shouldSkipStep<T, TContext>(
  definition: WizardStepDefinition<T, TContext>,
  context: TContext
): boolean {
  return definition.skipCondition?.(context) ?? false;
}
