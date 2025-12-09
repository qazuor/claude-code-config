/**
 * Project scaffold generator - creates project structure
 */

import type {
  PackageManager,
  ProjectType,
  ScaffoldOptions,
  ScaffoldResult,
} from '../../types/scaffold.js';
import { ensureDir, joinPath, pathExists, writeFile, writeJson } from '../utils/fs.js';
import { initRepo } from '../utils/git.js';
import { logger } from '../utils/logger.js';
import { withSpinner } from '../utils/spinner.js';

/**
 * Generate project scaffold
 */
export async function generateScaffold(
  projectPath: string,
  options: ScaffoldOptions
): Promise<ScaffoldResult> {
  const result: ScaffoldResult = {
    createdFiles: [],
    createdDirs: [],
    instructions: [],
  };

  // Create base .claude directory
  const claudeDir = joinPath(projectPath, '.claude');
  await ensureDir(claudeDir);
  result.createdDirs.push('.claude');

  // Create subdirectories
  const subdirs = ['agents', 'commands', 'skills', 'docs'];
  for (const dir of subdirs) {
    await ensureDir(joinPath(claudeDir, dir));
    result.createdDirs.push(`.claude/${dir}`);
  }

  // If claude-only, we're done with structure
  if (options.type === 'claude-only') {
    return result;
  }

  // Full project scaffold
  if (options.projectType) {
    const projectResult = await generateProjectStructure(projectPath, options);
    result.createdFiles.push(...projectResult.createdFiles);
    result.createdDirs.push(...projectResult.createdDirs);
    result.instructions.push(...projectResult.instructions);
  }

  // Init git if requested
  if (options.initGit) {
    const gitExists = await pathExists(joinPath(projectPath, '.git'));
    if (!gitExists) {
      await initRepo(projectPath);
      result.createdDirs.push('.git');
    }
  }

  // Create README
  if (options.createReadme) {
    const readmePath = joinPath(projectPath, 'README.md');
    if (!(await pathExists(readmePath))) {
      await writeFile(readmePath, generateReadme(options));
      result.createdFiles.push('README.md');
    }
  }

  // Create .gitignore
  if (options.createGitignore) {
    const gitignorePath = joinPath(projectPath, '.gitignore');
    if (!(await pathExists(gitignorePath))) {
      await writeFile(gitignorePath, generateGitignore(options.projectType));
      result.createdFiles.push('.gitignore');
    }
  }

  return result;
}

/**
 * Generate project-specific structure
 */
async function generateProjectStructure(
  projectPath: string,
  options: ScaffoldOptions
): Promise<ScaffoldResult> {
  const result: ScaffoldResult = {
    createdFiles: [],
    createdDirs: [],
    instructions: [],
  };

  const packageManager = options.packageManager || 'pnpm';

  switch (options.projectType) {
    case 'node':
      await generateNodeProject(projectPath, packageManager, result);
      break;

    case 'monorepo':
      await generateMonorepoProject(projectPath, packageManager, result);
      break;

    case 'hono':
      await generateHonoProject(projectPath, packageManager, result);
      break;

    // For framework projects, just provide instructions
    case 'astro':
    case 'nextjs':
    case 'vite-react':
      result.instructions.push(
        `Run: ${packageManager} create ${options.projectType === 'astro' ? 'astro@latest' : options.projectType === 'nextjs' ? 'next-app@latest' : 'vite@latest'}`
      );
      break;
  }

  return result;
}

/**
 * Generate basic Node.js TypeScript project
 */
async function generateNodeProject(
  projectPath: string,
  packageManager: PackageManager,
  result: ScaffoldResult
): Promise<void> {
  // Create src directory
  await ensureDir(joinPath(projectPath, 'src'));
  result.createdDirs.push('src');

  // Create test directory
  await ensureDir(joinPath(projectPath, 'test'));
  result.createdDirs.push('test');

  // Create package.json if it doesn't exist
  const packageJsonPath = joinPath(projectPath, 'package.json');
  if (!(await pathExists(packageJsonPath))) {
    await writeJson(packageJsonPath, {
      name: 'my-project',
      version: '0.1.0',
      type: 'module',
      scripts: {
        build: 'tsc',
        dev: 'tsx watch src/index.ts',
        test: 'vitest',
        lint: 'biome check .',
        'lint:fix': 'biome check --write .',
      },
      devDependencies: {
        typescript: '^5.0.0',
        tsx: '^4.0.0',
        vitest: '^2.0.0',
        '@biomejs/biome': '^1.9.0',
        '@types/node': '^22.0.0',
      },
    });
    result.createdFiles.push('package.json');
  }

  // Create tsconfig.json
  const tsconfigPath = joinPath(projectPath, 'tsconfig.json');
  if (!(await pathExists(tsconfigPath))) {
    await writeJson(tsconfigPath, {
      compilerOptions: {
        target: 'ES2022',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        outDir: 'dist',
        rootDir: 'src',
        declaration: true,
      },
      include: ['src'],
      exclude: ['node_modules', 'dist'],
    });
    result.createdFiles.push('tsconfig.json');
  }

  // Create src/index.ts
  const indexPath = joinPath(projectPath, 'src/index.ts');
  if (!(await pathExists(indexPath))) {
    await writeFile(indexPath, `// Entry point\nconsole.log('Hello, World!');\n`);
    result.createdFiles.push('src/index.ts');
  }

  result.instructions.push(`Run: ${packageManager} install`);
  result.instructions.push(`Start development: ${packageManager} dev`);
}

/**
 * Generate monorepo structure
 */
async function generateMonorepoProject(
  projectPath: string,
  packageManager: PackageManager,
  result: ScaffoldResult
): Promise<void> {
  // Create directories
  const dirs = ['apps', 'packages', 'packages/shared'];
  for (const dir of dirs) {
    await ensureDir(joinPath(projectPath, dir));
    result.createdDirs.push(dir);
  }

  // Create package.json
  const packageJsonPath = joinPath(projectPath, 'package.json');
  if (!(await pathExists(packageJsonPath))) {
    await writeJson(packageJsonPath, {
      name: 'my-monorepo',
      private: true,
      scripts: {
        build: 'turbo build',
        dev: 'turbo dev',
        lint: 'turbo lint',
        test: 'turbo test',
      },
      devDependencies: {
        turbo: '^2.0.0',
        typescript: '^5.0.0',
      },
    });
    result.createdFiles.push('package.json');
  }

  // Create pnpm-workspace.yaml
  if (packageManager === 'pnpm') {
    const workspacePath = joinPath(projectPath, 'pnpm-workspace.yaml');
    if (!(await pathExists(workspacePath))) {
      await writeFile(workspacePath, 'packages:\n  - "apps/*"\n  - "packages/*"\n');
      result.createdFiles.push('pnpm-workspace.yaml');
    }
  }

  // Create turbo.json
  const turboPath = joinPath(projectPath, 'turbo.json');
  if (!(await pathExists(turboPath))) {
    await writeJson(turboPath, {
      $schema: 'https://turbo.build/schema.json',
      tasks: {
        build: {
          dependsOn: ['^build'],
          outputs: ['dist/**'],
        },
        dev: {
          cache: false,
          persistent: true,
        },
        lint: {},
        test: {},
      },
    });
    result.createdFiles.push('turbo.json');
  }

  result.instructions.push(`Run: ${packageManager} install`);
  result.instructions.push('Create apps and packages in their respective directories');
}

/**
 * Generate Hono API project
 */
async function generateHonoProject(
  projectPath: string,
  packageManager: PackageManager,
  result: ScaffoldResult
): Promise<void> {
  // Create directories
  const dirs = ['src', 'src/routes', 'test'];
  for (const dir of dirs) {
    await ensureDir(joinPath(projectPath, dir));
    result.createdDirs.push(dir);
  }

  // Create package.json
  const packageJsonPath = joinPath(projectPath, 'package.json');
  if (!(await pathExists(packageJsonPath))) {
    await writeJson(packageJsonPath, {
      name: 'my-api',
      version: '0.1.0',
      type: 'module',
      scripts: {
        dev: 'tsx watch src/index.ts',
        build: 'tsc',
        start: 'node dist/index.js',
        test: 'vitest',
      },
      dependencies: {
        hono: '^4.0.0',
        '@hono/node-server': '^1.0.0',
      },
      devDependencies: {
        typescript: '^5.0.0',
        tsx: '^4.0.0',
        vitest: '^2.0.0',
        '@types/node': '^22.0.0',
      },
    });
    result.createdFiles.push('package.json');
  }

  // Create src/index.ts
  const indexPath = joinPath(projectPath, 'src/index.ts');
  if (!(await pathExists(indexPath))) {
    await writeFile(
      indexPath,
      `import { Hono } from 'hono';
import { serve } from '@hono/node-server';

const app = new Hono();

app.get('/', (c) => c.json({ message: 'Hello, World!' }));

const port = 3000;
console.log(\`Server running on http://localhost:\${port}\`);

serve({ fetch: app.fetch, port });
`
    );
    result.createdFiles.push('src/index.ts');
  }

  result.instructions.push(`Run: ${packageManager} install`);
  result.instructions.push(`Start server: ${packageManager} dev`);
}

/**
 * Generate README content
 */
function generateReadme(options: ScaffoldOptions): string {
  return `# My Project

## Description

Add your project description here.

## Getting Started

\`\`\`bash
${options.packageManager || 'pnpm'} install
${options.packageManager || 'pnpm'} dev
\`\`\`

## License

MIT
`;
}

/**
 * Generate .gitignore content
 */
function generateGitignore(projectType?: ProjectType): string {
  const common = `# Dependencies
node_modules/

# Build outputs
dist/
build/
.next/
.nuxt/
.output/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# Test coverage
coverage/

# Turbo
.turbo/
`;

  return common;
}

/**
 * Generate scaffold with progress
 */
export async function generateScaffoldWithProgress(
  projectPath: string,
  options: ScaffoldOptions
): Promise<ScaffoldResult> {
  return withSpinner(
    'Generating project structure...',
    () => generateScaffold(projectPath, options),
    { successText: 'Project structure created' }
  );
}
