/**
 * System dependency types
 */

/**
 * Platform identifiers
 */
export type Platform = 'linux' | 'macos' | 'windows';

/**
 * Installation instructions for a platform
 */
export interface InstallInstructions {
  /** Commands to run */
  commands: string[];
  /** Additional notes */
  notes?: string;
  /** Useful links */
  links?: string[];
}

/**
 * System dependency information
 */
export interface DependencyInfo {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description of what this dependency provides */
  description: string;
  /** Features that require this dependency */
  requiredFor: string[];
  /** Command to check if installed */
  checkCommand: string;
  /** Platform-specific installation instructions */
  platforms: Partial<Record<Platform, InstallInstructions>>;
}

/**
 * Dependency check result
 */
export interface DependencyCheckResult {
  /** Dependency ID */
  id: string;
  /** Whether it's installed */
  installed: boolean;
  /** Version if detected */
  version?: string;
  /** Error message if check failed */
  error?: string;
}

/**
 * Overall dependency check report
 */
export interface DependencyReport {
  /** All dependencies that were checked */
  checked: DependencyCheckResult[];
  /** Missing dependencies */
  missing: DependencyInfo[];
  /** Installation instructions for missing deps */
  instructions: Map<string, InstallInstructions>;
}
