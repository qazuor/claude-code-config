/**
 * System dependency definitions
 */

import type { DependencyInfo } from '../types/dependencies.js';

/**
 * System dependencies required for various features
 */
export const DEPENDENCIES: DependencyInfo[] = [
  {
    id: 'piper-tts',
    name: 'Piper TTS',
    description: 'Text-to-speech for audio notifications',
    requiredFor: ['hook:notification:audio'],
    checkCommand: 'command -v piper',
    platforms: {
      linux: {
        commands: [
          'pip install piper-tts',
          'mkdir -p ~/.local/share/piper/voices',
          'wget -O ~/.local/share/piper/voices/en_US-hfc_male-medium.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/hfc_male/medium/en_US-hfc_male-medium.onnx',
          'wget -O ~/.local/share/piper/voices/en_US-hfc_male-medium.onnx.json https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/hfc_male/medium/en_US-hfc_male-medium.onnx.json',
        ],
        notes: 'Requires Python 3.9+ and pip',
        links: ['https://github.com/rhasspy/piper'],
      },
      macos: {
        commands: [
          'pip3 install piper-tts',
          'mkdir -p ~/.local/share/piper/voices',
          '# Download voice files from https://github.com/rhasspy/piper/releases',
        ],
        notes: 'May need to install portaudio: brew install portaudio',
        links: ['https://github.com/rhasspy/piper'],
      },
    },
  },
  {
    id: 'notify-send',
    name: 'libnotify',
    description: 'Desktop notifications for Linux',
    requiredFor: ['hook:notification:desktop'],
    checkCommand: 'command -v notify-send',
    platforms: {
      linux: {
        commands: [
          '# Ubuntu/Debian:',
          'sudo apt install libnotify-bin',
          '# Fedora:',
          'sudo dnf install libnotify',
          '# Arch:',
          'sudo pacman -S libnotify',
        ],
      },
    },
  },
  {
    id: 'terminal-notifier',
    name: 'terminal-notifier',
    description: 'Desktop notifications for macOS',
    requiredFor: ['hook:notification:desktop'],
    checkCommand: 'command -v terminal-notifier',
    platforms: {
      macos: {
        commands: ['brew install terminal-notifier'],
        links: ['https://github.com/julienXX/terminal-notifier'],
      },
    },
  },
  {
    id: 'jq',
    name: 'jq',
    description: 'JSON processor for hook scripts',
    requiredFor: ['hooks'],
    checkCommand: 'command -v jq',
    platforms: {
      linux: {
        commands: [
          '# Ubuntu/Debian:',
          'sudo apt install jq',
          '# Fedora:',
          'sudo dnf install jq',
          '# Arch:',
          'sudo pacman -S jq',
        ],
      },
      macos: {
        commands: ['brew install jq'],
      },
      windows: {
        commands: ['choco install jq', '# Or: winget install jqlang.jq'],
      },
    },
  },
  {
    id: 'aplay',
    name: 'ALSA Utils',
    description: 'Audio playback for Linux',
    requiredFor: ['hook:notification:audio'],
    checkCommand: 'command -v aplay',
    platforms: {
      linux: {
        commands: [
          '# Ubuntu/Debian:',
          'sudo apt install alsa-utils',
          '# Fedora:',
          'sudo dnf install alsa-utils',
          '# Arch:',
          'sudo pacman -S alsa-utils',
        ],
      },
    },
  },
  {
    id: 'afplay',
    name: 'afplay',
    description: 'Audio playback for macOS (built-in)',
    requiredFor: ['hook:notification:audio'],
    checkCommand: 'command -v afplay',
    platforms: {
      macos: {
        commands: ['# Built-in on macOS, no installation needed'],
        notes: 'afplay is included with macOS by default',
      },
    },
  },
  {
    id: 'git',
    name: 'Git',
    description: 'Version control system',
    requiredFor: ['version-control', 'remote-templates'],
    checkCommand: 'git --version',
    platforms: {
      linux: {
        commands: [
          '# Ubuntu/Debian:',
          'sudo apt install git',
          '# Fedora:',
          'sudo dnf install git',
          '# Arch:',
          'sudo pacman -S git',
        ],
      },
      macos: {
        commands: ['brew install git', '# Or: xcode-select --install'],
      },
      windows: {
        commands: ['choco install git', '# Or: winget install Git.Git'],
        links: ['https://git-scm.com/download/win'],
      },
    },
  },
  {
    id: 'node',
    name: 'Node.js',
    description: 'JavaScript runtime',
    requiredFor: ['cli', 'mcp-servers'],
    checkCommand: 'node --version',
    platforms: {
      linux: {
        commands: [
          '# Using nvm (recommended):',
          'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash',
          'nvm install --lts',
          '# Or using package manager:',
          'sudo apt install nodejs npm',
        ],
        links: ['https://nodejs.org/', 'https://github.com/nvm-sh/nvm'],
      },
      macos: {
        commands: [
          '# Using nvm (recommended):',
          'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash',
          'nvm install --lts',
          '# Or using Homebrew:',
          'brew install node',
        ],
        links: ['https://nodejs.org/', 'https://github.com/nvm-sh/nvm'],
      },
      windows: {
        commands: ['choco install nodejs-lts', '# Or: winget install OpenJS.NodeJS.LTS'],
        links: ['https://nodejs.org/'],
      },
    },
  },
];

/**
 * Get dependency by ID
 */
export function getDependency(id: string): DependencyInfo | undefined {
  return DEPENDENCIES.find((d) => d.id === id);
}

/**
 * Get dependencies required for a feature
 */
export function getDependenciesForFeature(feature: string): DependencyInfo[] {
  return DEPENDENCIES.filter((d) => d.requiredFor.includes(feature));
}

/**
 * Get all dependency IDs
 */
export function getDependencyIds(): string[] {
  return DEPENDENCIES.map((d) => d.id);
}
