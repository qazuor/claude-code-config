/**
 * Template context builder
 * Creates a context object from config and module selections
 */

import type { ClaudeConfig } from '../../types/config.js';
import type { TemplateContext } from '../../types/templates.js';

/**
 * Build a template context from config
 */
export function buildTemplateContext(config: Partial<ClaudeConfig>): TemplateContext {
  // Extract module IDs from ModuleSelection objects
  const getModuleIds = (selection?: { selected?: string[] }): string[] => {
    return selection?.selected ?? [];
  };

  // Extract MCP server IDs from installations
  const getMcpServerIds = (servers?: Array<{ serverId: string }>): string[] => {
    return servers?.map((s) => s.serverId) ?? [];
  };

  const context: TemplateContext = {
    project: {
      name: config.project?.name,
      description: config.project?.description,
      org: config.project?.org,
      repo: config.project?.repo,
      domain: config.project?.domain,
      entityType: config.project?.entityType,
      location: config.project?.location,
    },
    modules: {
      agents: getModuleIds(config.modules?.agents),
      skills: getModuleIds(config.modules?.skills),
      commands: getModuleIds(config.modules?.commands),
      docs: getModuleIds(config.modules?.docs),
    },
    codeStyle: {
      formatter: config.extras?.codeStyle?.biome
        ? 'biome'
        : config.extras?.codeStyle?.prettier
          ? 'prettier'
          : 'none',
      linter: config.extras?.codeStyle?.biome ? 'biome' : 'none',
      editorConfig: config.extras?.codeStyle?.editorconfig,
      commitlint: config.extras?.codeStyle?.commitlint,
    },
    techStack: {},
    bundles: [],
    mcpServers: getMcpServerIds(config.mcp?.servers),
    custom: {},
  };

  // Infer tech stack from selected modules
  context.techStack = inferTechStack(context.modules);

  return context;
}

/**
 * Infer tech stack from module selections
 */
function inferTechStack(modules: TemplateContext['modules']): TemplateContext['techStack'] {
  const techStack: TemplateContext['techStack'] = {};

  const allModules = [
    ...modules.agents,
    ...modules.skills,
    ...modules.commands,
    ...modules.docs,
  ];

  // Framework detection
  if (allModules.some((m) => m.includes('nextjs'))) {
    techStack.framework = 'nextjs';
  } else if (allModules.some((m) => m.includes('astro'))) {
    techStack.framework = 'astro';
  } else if (allModules.some((m) => m.includes('tanstack-start'))) {
    techStack.framework = 'tanstack-start';
  } else if (allModules.some((m) => m.includes('react'))) {
    techStack.framework = 'react';
  }

  // Database/ORM detection
  if (allModules.some((m) => m.includes('prisma'))) {
    techStack.orm = 'prisma';
  } else if (allModules.some((m) => m.includes('drizzle'))) {
    techStack.orm = 'drizzle';
  } else if (allModules.some((m) => m.includes('mongoose'))) {
    techStack.orm = 'mongoose';
  }

  // API framework detection
  if (allModules.some((m) => m.includes('hono'))) {
    techStack.database = 'hono';
  } else if (allModules.some((m) => m.includes('express'))) {
    techStack.database = 'express';
  } else if (allModules.some((m) => m.includes('fastify'))) {
    techStack.database = 'fastify';
  } else if (allModules.some((m) => m.includes('nestjs'))) {
    techStack.database = 'nestjs';
  }

  // Testing detection
  if (allModules.some((m) => m.includes('testing') || m.includes('tdd'))) {
    techStack.testing = 'vitest';
  }

  // Deployment detection
  if (allModules.some((m) => m.includes('vercel'))) {
    techStack.deployment = 'vercel';
  }

  return techStack;
}

/**
 * Merge additional context values
 */
export function extendContext(
  context: TemplateContext,
  additions: Partial<TemplateContext>
): TemplateContext {
  return {
    ...context,
    project: {
      ...context.project,
      ...additions.project,
    },
    modules: {
      ...context.modules,
      ...additions.modules,
    },
    codeStyle: {
      ...context.codeStyle,
      ...additions.codeStyle,
    },
    techStack: {
      ...context.techStack,
      ...additions.techStack,
    },
    bundles: [...context.bundles, ...(additions.bundles ?? [])],
    mcpServers: [...context.mcpServers, ...(additions.mcpServers ?? [])],
    custom: {
      ...context.custom,
      ...additions.custom,
    },
  };
}

/**
 * Add custom variables to context
 */
export function addCustomVariable(
  context: TemplateContext,
  key: string,
  value: string | boolean | number | string[]
): TemplateContext {
  return {
    ...context,
    custom: {
      ...context.custom,
      [key]: value,
    },
  };
}

/**
 * Check if a module is in the context
 */
export function hasModule(context: TemplateContext, moduleId: string): boolean {
  return (
    context.modules.agents.includes(moduleId) ||
    context.modules.skills.includes(moduleId) ||
    context.modules.commands.includes(moduleId) ||
    context.modules.docs.includes(moduleId)
  );
}

/**
 * Check if any module in a list is in the context
 */
export function hasAnyModule(context: TemplateContext, moduleIds: string[]): boolean {
  return moduleIds.some((id) => hasModule(context, id));
}

/**
 * Check if all modules in a list are in the context
 */
export function hasAllModules(context: TemplateContext, moduleIds: string[]): boolean {
  return moduleIds.every((id) => hasModule(context, id));
}

/**
 * Get all selected modules as a flat list
 */
export function getAllModules(context: TemplateContext): string[] {
  return [
    ...context.modules.agents,
    ...context.modules.skills,
    ...context.modules.commands,
    ...context.modules.docs,
  ];
}
