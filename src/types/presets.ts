/**
 * Preset configuration types
 */

/**
 * Available preset names
 */
export type PresetName =
  | 'fullstack'
  | 'frontend'
  | 'backend'
  | 'minimal'
  | 'api-only'
  | 'documentation'
  | 'quality-focused';

/**
 * Preset definition
 */
export interface PresetDefinition {
  /** Preset identifier */
  name: PresetName;
  /** Display name for UI */
  displayName: string;
  /** Description of what this preset includes */
  description: string;
  /** Modules included in this preset */
  modules: {
    /** Agent module IDs */
    agents: string[];
    /** Skill module IDs */
    skills: string[];
    /** Command module IDs */
    commands: string[];
    /** Docs module IDs */
    docs: string[];
  };
  /** Extra components included */
  extras: {
    /** Include JSON schemas */
    schemas: boolean;
    /** Include automation scripts */
    scripts: boolean;
    /** Include hooks */
    hooks: boolean;
    /** Include planning sessions structure */
    sessions: boolean;
  };
}

/**
 * Preset selection result
 */
export interface PresetSelectionResult {
  /** Selected preset name or 'custom' */
  preset: PresetName | 'custom';
  /** Whether to customize after preset selection */
  customize: boolean;
}
