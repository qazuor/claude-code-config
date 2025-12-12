/**
 * Version check utility
 *
 * Checks npm registry for newer versions and notifies the user.
 */

import chalk from 'chalk';

const PACKAGE_NAME = '@qazuor/claude-code-config';
const NPM_REGISTRY_URL = `https://registry.npmjs.org/${PACKAGE_NAME}/latest`;
const CHECK_TIMEOUT_MS = 3000; // 3 seconds timeout

/**
 * Compare two semver versions
 * Returns: 1 if a > b, -1 if a < b, 0 if equal
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.replace(/^v/, '').split('.').map(Number);
  const partsB = b.replace(/^v/, '').split('.').map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;

    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }

  return 0;
}

/**
 * Fetch the latest version from npm registry
 */
async function fetchLatestVersion(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

    const response = await fetch(NPM_REGISTRY_URL, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { version?: string };
    return data.version || null;
  } catch {
    // Silently fail - network issues shouldn't affect CLI usage
    return null;
  }
}

/**
 * Check for updates and display notification if available
 * This runs asynchronously and doesn't block the CLI
 */
export async function checkForUpdates(currentVersion: string): Promise<void> {
  try {
    const latestVersion = await fetchLatestVersion();

    if (!latestVersion) {
      return;
    }

    if (compareVersions(latestVersion, currentVersion) > 0) {
      displayUpdateNotification(currentVersion, latestVersion);
    }
  } catch {
    // Silently fail
  }
}

/**
 * Display update notification
 */
function displayUpdateNotification(currentVersion: string, latestVersion: string): void {
  const boxWidth = 50;
  const border = chalk.yellow('│');
  const topBorder = chalk.yellow(`╭${'─'.repeat(boxWidth)}╮`);
  const bottomBorder = chalk.yellow(`╰${'─'.repeat(boxWidth)}╯`);

  const padLine = (text: string, rawLength: number): string => {
    const padding = boxWidth - rawLength;
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    return border + ' '.repeat(leftPad) + text + ' '.repeat(rightPad) + border;
  };

  const emptyLine = border + ' '.repeat(boxWidth) + border;

  const updateText = 'Update available!';
  const versionText = `${chalk.gray(currentVersion)} → ${chalk.green(latestVersion)}`;
  const versionRawLength = currentVersion.length + ' → '.length + latestVersion.length;

  const commandText = `npm i -g ${PACKAGE_NAME}`;
  const runText = `Run: ${chalk.cyan(commandText)}`;
  const runRawLength = 'Run: '.length + commandText.length;

  console.log();
  console.log(topBorder);
  console.log(emptyLine);
  console.log(padLine(chalk.yellow.bold(updateText), updateText.length));
  console.log(padLine(versionText, versionRawLength));
  console.log(emptyLine);
  console.log(padLine(runText, runRawLength));
  console.log(emptyLine);
  console.log(bottomBorder);
  console.log();
}

/**
 * Start version check in background (non-blocking)
 * Returns a promise that resolves when check is complete
 */
export function startBackgroundVersionCheck(currentVersion: string): Promise<void> {
  return checkForUpdates(currentVersion);
}
