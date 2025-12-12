/**
 * Wizard History Tracking
 *
 * Utilities for tracking and querying the history of step modifications
 * throughout the wizard lifecycle.
 */

import type { StepHistoryEntry, StepState, WizardState } from './types.js';

/**
 * Get the last recorded value for a step
 * Returns the most recent value from history, or the current value if no history
 */
export function getLastValue<T>(stepState: StepState<T>): T | undefined {
  if (stepState.history.length === 0) {
    return stepState.value;
  }
  return stepState.history[stepState.history.length - 1].value;
}

/**
 * Get the initial value that was first set for a step
 */
export function getInitialValue<T>(stepState: StepState<T>): T | undefined {
  if (stepState.history.length === 0) {
    return stepState.value;
  }
  return stepState.history[0].value;
}

/**
 * Get all steps that have been modified at least once
 */
export function getModifiedSteps(
  state: WizardState
): Array<{ stepId: string; step: StepState<unknown> }> {
  return state.stepOrder
    .map((stepId) => ({
      stepId,
      step: state.steps[stepId],
    }))
    .filter(({ step }) => step.isModified);
}

/**
 * Get steps that have been visited more than once (went back and reconfigured)
 */
export function getRevisitedSteps(
  state: WizardState
): Array<{ stepId: string; step: StepState<unknown> }> {
  return state.stepOrder
    .map((stepId) => ({
      stepId,
      step: state.steps[stepId],
    }))
    .filter(({ step }) => step.history.length > 1);
}

/**
 * Count total visits across all steps
 */
export function getTotalVisits(state: WizardState): number {
  return state.stepOrder.reduce((total, stepId) => {
    const step = state.steps[stepId];
    // Count history entries, minimum 1 if step has a value
    return total + Math.max(step.history.length, step.value !== undefined ? 1 : 0);
  }, 0);
}

/**
 * Get completed steps count
 */
export function getCompletedStepsCount(state: WizardState): number {
  return state.stepOrder.filter((stepId) => {
    const step = state.steps[stepId];
    return step.status === 'completed' || step.status === 'skipped';
  }).length;
}

/**
 * Generate a summary of the wizard history for display
 */
export function getHistorySummary(state: WizardState): string[] {
  const summary: string[] = [];
  const revisited = getRevisitedSteps(state);

  if (revisited.length === 0) {
    return summary;
  }

  summary.push('Steps that were reconfigured:');

  for (const { step } of revisited) {
    summary.push(`  • ${step.metadata.name}: modified ${step.history.length} times`);
  }

  return summary;
}

/**
 * Get the full history for a specific step
 */
export function getStepHistory<T>(stepState: StepState<T>): StepHistoryEntry<T>[] {
  return [...stepState.history];
}

/**
 * Check if a step has been previously completed (has history or completed status)
 */
export function wasStepCompleted<T>(stepState: StepState<T>): boolean {
  return stepState.status === 'completed' || stepState.history.length > 0;
}

/**
 * Get the time spent on a step based on history timestamps
 * Returns milliseconds between first and last entry, or 0 if not enough data
 */
export function getTimeOnStep<T>(stepState: StepState<T>): number {
  if (stepState.history.length < 2) {
    return 0;
  }

  const firstEntry = stepState.history[0];
  const lastEntry = stepState.history[stepState.history.length - 1];

  return lastEntry.timestamp.getTime() - firstEntry.timestamp.getTime();
}

/**
 * Get wizard duration in milliseconds
 */
export function getWizardDuration(state: WizardState): number {
  return Date.now() - state.metadata.startTime.getTime();
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}
