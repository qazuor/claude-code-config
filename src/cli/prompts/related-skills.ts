/**
 * Related Skills Selection Prompts
 *
 * Handles the conditional selection of framework-specific skills
 * based on selected agents with relatedSkills.
 */

import { colors, logger } from '../../lib/utils/logger.js';
import { checkbox, select } from '../../lib/utils/prompt-cancel.js';
import type { ModuleDefinition, ModuleRegistry } from '../../types/modules.js';

export interface RelatedSkillsResult {
  /** Skills selected through agent relationships */
  relatedSkillsSelected: string[];
  /** Skills IDs that were related but not selected */
  relatedSkillsSkipped: string[];
  /** All skill IDs that are related to any agent (for filtering independent skills) */
  allRelatedSkillIds: string[];
}

/**
 * Get all skill IDs that are related to any agent
 */
export function getAllRelatedSkillIds(agentModules: ModuleDefinition[]): string[] {
  const relatedIds = new Set<string>();

  for (const agent of agentModules) {
    if (agent.relatedSkills) {
      for (const skillId of agent.relatedSkills) {
        relatedIds.add(skillId);
      }
    }
  }

  return Array.from(relatedIds);
}

/**
 * Get agents with related skills from selected agent IDs
 */
export function getAgentsWithRelatedSkills(
  selectedAgentIds: string[],
  agentModules: ModuleDefinition[]
): ModuleDefinition[] {
  return agentModules.filter(
    (agent) =>
      selectedAgentIds.includes(agent.id) && agent.relatedSkills && agent.relatedSkills.length > 0
  );
}

/**
 * Prompt for related skills selection for a specific agent
 */
export async function promptRelatedSkillsForAgent(
  agent: ModuleDefinition,
  skillModules: ModuleDefinition[],
  options?: {
    preselected?: string[];
    allowMultiple?: boolean;
  }
): Promise<string[]> {
  if (!agent.relatedSkills || agent.relatedSkills.length === 0) {
    return [];
  }

  // Get skill definitions for related skills
  const relatedSkillDefs = agent.relatedSkills
    .map((skillId) => skillModules.find((s) => s.id === skillId))
    .filter((s): s is ModuleDefinition => s !== undefined);

  if (relatedSkillDefs.length === 0) {
    return [];
  }

  // If only one skill, ask if they want to install it
  if (relatedSkillDefs.length === 1) {
    const skill = relatedSkillDefs[0];
    const action = await select<'install' | 'skip'>({
      message: `${colors.primary(agent.name)} has a related skill. Install it?`,
      choices: [
        {
          name: `Install ${skill.name}`,
          value: 'install',
          description: skill.description,
        },
        {
          name: 'Skip',
          value: 'skip',
          description: 'Do not install this skill',
        },
      ],
      default: 'install',
    });

    return action === 'install' ? [skill.id] : [];
  }

  // Multiple skills - let user choose
  const choices = relatedSkillDefs.map((skill) => ({
    name: skill.name,
    value: skill.id,
    description: skill.description,
    checked: options?.preselected?.includes(skill.id) ?? false,
  }));

  if (options?.allowMultiple !== false) {
    // Multi-select
    const selected = await checkbox({
      message: `${colors.primary(agent.name)} supports multiple frameworks. Select which patterns to install:`,
      choices,
      required: false,
    });

    return selected;
  }

  // Single select with skip option
  const choicesWithSkip = [
    ...choices.map((c) => ({ name: c.name, value: c.value, description: c.description })),
    {
      name: colors.muted('Skip (none)'),
      value: '__skip__',
      description: 'Do not install any related skill for this agent',
    },
  ];

  const selected = await select<string>({
    message: `${colors.primary(agent.name)} supports multiple frameworks. Select which patterns to use:`,
    choices: choicesWithSkip,
    default: choicesWithSkip[0]?.value,
  });

  return selected === '__skip__' ? [] : [selected];
}

/**
 * Prompt for all related skills based on selected agents
 *
 * This function:
 * 1. Identifies agents with relatedSkills
 * 2. For each agent, prompts user to select which related skills to install
 * 3. Returns the combined selection and list of all related skill IDs
 */
export async function promptAllRelatedSkills(
  selectedAgentIds: string[],
  registry: ModuleRegistry,
  options?: {
    preselectedSkills?: string[];
    allowMultiplePerAgent?: boolean;
  }
): Promise<RelatedSkillsResult> {
  const agentsWithRelated = getAgentsWithRelatedSkills(selectedAgentIds, registry.agents);
  const allRelatedSkillIds = getAllRelatedSkillIds(registry.agents);

  if (agentsWithRelated.length === 0) {
    return {
      relatedSkillsSelected: [],
      relatedSkillsSkipped: [],
      allRelatedSkillIds,
    };
  }

  logger.newline();
  logger.subtitle('Framework-Specific Skills');
  logger.info(
    'The selected agents support framework-specific patterns. Select which ones to install.'
  );
  logger.newline();

  const selectedSkills: string[] = [];
  const skippedSkills: string[] = [];

  for (const agent of agentsWithRelated) {
    const selected = await promptRelatedSkillsForAgent(agent, registry.skills, {
      preselected: options?.preselectedSkills,
      allowMultiple: options?.allowMultiplePerAgent,
    });

    selectedSkills.push(...selected);

    // Track skipped skills
    const agentRelatedIds = agent.relatedSkills || [];
    const skipped = agentRelatedIds.filter((id) => !selected.includes(id));
    skippedSkills.push(...skipped);
  }

  // Remove duplicates (in case same skill is related to multiple agents)
  const uniqueSelected = [...new Set(selectedSkills)];
  const uniqueSkipped = [...new Set(skippedSkills)].filter((id) => !uniqueSelected.includes(id));

  return {
    relatedSkillsSelected: uniqueSelected,
    relatedSkillsSkipped: uniqueSkipped,
    allRelatedSkillIds,
  };
}

/**
 * Get independent skills (not related to any agent)
 */
export function getIndependentSkills(skillModules: ModuleDefinition[]): ModuleDefinition[] {
  const allRelatedIds = getAllRelatedSkillIds(skillModules);
  return skillModules.filter((skill) => !allRelatedIds.includes(skill.id));
}

/**
 * Filter skill modules to exclude related skills
 */
export function filterOutRelatedSkills(
  skillModules: ModuleDefinition[],
  relatedSkillIds: string[]
): ModuleDefinition[] {
  const relatedSet = new Set(relatedSkillIds);
  return skillModules.filter((skill) => !relatedSet.has(skill.id));
}
