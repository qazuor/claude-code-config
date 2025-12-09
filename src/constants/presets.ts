/**
 * Preset configurations
 */

import type { PresetDefinition, PresetName } from '../types/presets.js';

/**
 * All available presets
 */
export const PRESETS: Record<PresetName, PresetDefinition> = {
  fullstack: {
    name: 'fullstack',
    displayName: 'Full Stack',
    description:
      'Complete configuration for full-stack applications (all agents, skills, commands)',
    modules: {
      agents: ['core', 'product', 'backend', 'frontend', 'quality', 'design', 'specialized'],
      skills: ['testing', 'audit', 'patterns', 'tech', 'git', 'documentation', 'utils', 'qa'],
      commands: ['core', 'planning', 'audit', 'development', 'git', 'meta', 'formatting'],
      docs: ['workflows', 'standards', 'templates', 'diagrams', 'learnings', 'guides', 'examples'],
    },
    extras: { schemas: true, scripts: true, hooks: true, sessions: true },
  },

  frontend: {
    name: 'frontend',
    displayName: 'Frontend Only',
    description: 'Configuration for frontend applications (React, Astro, TanStack)',
    modules: {
      agents: ['core', 'frontend', 'quality', 'design'],
      skills: ['testing', 'patterns', 'tech', 'qa'],
      commands: ['core', 'git'],
      docs: ['workflows', 'standards'],
    },
    extras: { schemas: false, scripts: false, hooks: true, sessions: true },
  },

  backend: {
    name: 'backend',
    displayName: 'Backend Only',
    description: 'Configuration for backend/API applications (Hono, Drizzle, Node.js)',
    modules: {
      agents: ['core', 'product', 'backend', 'quality'],
      skills: ['testing', 'audit', 'patterns', 'git'],
      commands: ['core', 'planning', 'development', 'git'],
      docs: ['workflows', 'standards'],
    },
    extras: { schemas: true, scripts: true, hooks: true, sessions: true },
  },

  minimal: {
    name: 'minimal',
    displayName: 'Minimal',
    description: 'Bare essentials for any project (tech lead, quality, basic testing)',
    modules: {
      agents: ['core', 'quality'],
      skills: ['testing', 'git'],
      commands: ['core', 'git'],
      docs: ['workflows'],
    },
    extras: { schemas: false, scripts: false, hooks: false, sessions: false },
  },

  'api-only': {
    name: 'api-only',
    displayName: 'API Only',
    description: 'For pure API/microservice projects without frontend',
    modules: {
      agents: ['core', 'backend', 'quality'],
      skills: ['testing', 'audit', 'patterns'],
      commands: ['core', 'development', 'git'],
      docs: ['standards'],
    },
    extras: { schemas: true, scripts: false, hooks: true, sessions: false },
  },

  documentation: {
    name: 'documentation',
    displayName: 'Documentation Focus',
    description: 'For projects that need strong documentation capabilities',
    modules: {
      agents: ['core', 'specialized'],
      skills: ['documentation', 'tech'],
      commands: ['core', 'formatting', 'meta'],
      docs: ['workflows', 'standards', 'templates', 'diagrams', 'guides'],
    },
    extras: { schemas: false, scripts: false, hooks: false, sessions: true },
  },

  'quality-focused': {
    name: 'quality-focused',
    displayName: 'Quality Focused',
    description: 'Emphasis on testing, auditing, and code quality',
    modules: {
      agents: ['core', 'quality'],
      skills: ['testing', 'audit', 'qa', 'patterns'],
      commands: ['core', 'audit', 'git'],
      docs: ['standards'],
    },
    extras: { schemas: true, scripts: true, hooks: true, sessions: false },
  },
};

/**
 * Get preset by name
 */
export function getPreset(name: PresetName): PresetDefinition {
  return PRESETS[name];
}

/**
 * Get all preset names
 */
export function getPresetNames(): PresetName[] {
  return Object.keys(PRESETS) as PresetName[];
}

/**
 * Check if a module is included in a preset
 */
export function isModuleInPreset(
  preset: PresetName,
  category: keyof PresetDefinition['modules'],
  moduleId: string
): boolean {
  return PRESETS[preset].modules[category].includes(moduleId);
}
