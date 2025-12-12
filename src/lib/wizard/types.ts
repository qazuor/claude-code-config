/**
 * Wizard State Machine Types
 *
 * Type definitions for the wizard navigation system that enables
 * back/forward navigation through multi-step configuration flows.
 */

/**
 * Status of a wizard step
 */
export type StepStatus = 'pending' | 'current' | 'completed' | 'skipped';

/**
 * Direction of navigation within the wizard
 */
export type NavigationDirection = 'next' | 'back' | 'skip' | 'cancel';

/**
 * Action when revisiting a completed step
 */
export type RevisitAction = 'keep' | 'reconfigure';

/**
 * Metadata describing a wizard step
 */
export interface StepMetadata {
  /** Unique identifier for the step */
  id: string;
  /** Human-readable name displayed to user */
  name: string;
  /** Brief description of what this step configures */
  description: string;
  /** Position in the wizard (0-based) */
  index: number;
  /** Whether this step must be completed */
  required: boolean;
  /** IDs of steps this one depends on for computing defaults */
  dependsOn?: string[];
}

/**
 * Record of a step completion in the history
 */
export interface StepHistoryEntry<T = unknown> {
  /** When this entry was recorded */
  timestamp: Date;
  /** The value that was set */
  value: T;
  /** How the user navigated away from this step */
  exitDirection: NavigationDirection;
  /** Visit number (1-based) */
  visitCount: number;
}

/**
 * Complete state for a single wizard step
 */
export interface StepState<T = unknown> {
  /** Step metadata */
  metadata: StepMetadata;
  /** Current status of the step */
  status: StepStatus;
  /** Current value (if completed or in progress) */
  value?: T;
  /** History of all values set for this step */
  history: StepHistoryEntry<T>[];
  /** Whether user has modified from initial/default value */
  isModified: boolean;
}

/**
 * Global wizard metadata
 */
export interface WizardMetadata {
  /** Wizard identifier */
  id: string;
  /** Title displayed to user */
  title: string;
  /** Total number of steps */
  totalSteps: number;
  /** When wizard was started */
  startTime: Date;
  /** Allow skipping optional steps */
  allowSkip: boolean;
  /** Show progress indicator */
  showProgress: boolean;
}

/**
 * Complete wizard state tracking all steps
 */
export interface WizardState {
  /** State for each step, indexed by step ID */
  steps: Record<string, StepState<unknown>>;
  /** ID of the currently active step */
  currentStepId: string;
  /** Ordered list of all step IDs */
  stepOrder: string[];
  /** Whether wizard has completed successfully */
  isComplete: boolean;
  /** Whether wizard was cancelled */
  isCancelled: boolean;
  /** Global wizard metadata */
  metadata: WizardMetadata;
}

/**
 * Result returned when wizard completes
 */
export interface WizardResult<TValues = Record<string, unknown>> {
  /** All collected values indexed by step ID */
  values: TValues;
  /** Final wizard state (for inspection/debugging) */
  state: WizardState;
  /** Whether wizard was cancelled */
  cancelled: boolean;
}

/**
 * Choice option for select/checkbox prompts with back support
 */
export interface WizardChoice<T = unknown> {
  /** Display name */
  name: string;
  /** Value when selected */
  value: T;
  /** Optional description */
  description?: string;
  /** Whether this is a separator */
  type?: 'separator';
}
