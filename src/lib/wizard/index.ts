/**
 * Wizard State Machine
 *
 * A reusable wizard engine for multi-step configuration flows with
 * back navigation, history tracking, and keep-or-reconfigure support.
 *
 * @example
 * ```typescript
 * import { runWizard, type WizardConfig } from './lib/wizard/index.js';
 *
 * interface MyWizardValues {
 *   step1: string;
 *   step2: number;
 * }
 *
 * const config: WizardConfig<MyWizardValues> = {
 *   id: 'my-wizard',
 *   title: 'My Configuration Wizard',
 *   steps: [
 *     {
 *       id: 'step1',
 *       definition: {
 *         metadata: { id: 'step1', name: 'Step 1', description: '...', required: true },
 *         computeDefaults: () => 'default',
 *         execute: async (ctx, defaults) => ({
 *           value: await promptForValue(defaults),
 *           navigation: 'next',
 *           wasModified: true,
 *         }),
 *       },
 *     },
 *     // ... more steps
 *   ],
 * };
 *
 * const result = await runWizard(config);
 * if (!result.cancelled) {
 *   console.log(result.values);
 * }
 * ```
 */

// Types
export type {
  NavigationDirection,
  RevisitAction,
  StepHistoryEntry,
  StepMetadata,
  StepState,
  StepStatus,
  WizardChoice,
  WizardMetadata,
  WizardResult,
  WizardState,
} from './types.js';

// Step utilities
export type {
  DefaultsComputer,
  StepExecutionResult,
  StepExecutor,
  StepValidator,
  WizardStepDefinition,
} from './step.js';

export {
  createStepState,
  getVisitCount,
  hasBeenVisited,
  recordStepHistory,
  shouldSkipStep,
  updateStepStatus,
  validateStep,
} from './step.js';

// Navigation
export type { BackOptionValue, NextStepResult } from './navigator.js';

export {
  applyNavigation,
  BACK_OPTION_VALUE,
  calculateNextStep,
  createBackOption,
  createBackSeparator,
  injectBackOption,
  isBackSelected,
  promptKeepOrReconfigure,
  showStepProgress,
} from './navigator.js';

// History tracking
export {
  formatDuration,
  getCompletedStepsCount,
  getHistorySummary,
  getInitialValue,
  getLastValue,
  getModifiedSteps,
  getRevisitedSteps,
  getStepHistory,
  getTimeOnStep,
  getTotalVisits,
  getWizardDuration,
  wasStepCompleted,
} from './history.js';

// Engine
export type { WizardConfig, WizardStepConfig } from './engine.js';

export { createWizardState, runWizard, showWizardSummary } from './engine.js';
