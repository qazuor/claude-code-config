/**
 * ASCII Banner utility using figlet and chalk
 */

import chalk from 'chalk';
import figlet from 'figlet';

/**
 * Display the CLI banner
 */
export function showBanner(): void {
  const bannerText = figlet.textSync('Qazuor', {
    font: 'Standard',
    horizontalLayout: 'default',
    verticalLayout: 'default',
  });

  // Create gradient effect with chalk
  const lines = bannerText.split('\n');
  const colors = [
    chalk.hex('#FF6B6B'), // Coral red
    chalk.hex('#FF8E53'), // Orange
    chalk.hex('#FED330'), // Yellow
    chalk.hex('#26DE81'), // Green
    chalk.hex('#4BCFFA'), // Light blue
    chalk.hex('#A55EEA'), // Purple
  ];

  const coloredBanner = lines
    .map((line, index) => {
      const colorIndex = index % colors.length;
      return colors[colorIndex](line);
    })
    .join('\n');

  console.log(coloredBanner);
  console.log(chalk.gray('  Claude Code Configuration & Project Setup'));
  console.log(chalk.gray('  ─────────────────────────────────────'));
  console.log();
}

/**
 * Display a smaller inline banner for commands
 */
export function showInlineBanner(): void {
  console.log();
  console.log(chalk.hex('#4BCFFA').bold('  ⚡ Qazuor Claude Config'));
  console.log(chalk.gray('  ─────────────────────────────────'));
  console.log();
}
