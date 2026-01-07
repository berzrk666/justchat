/**
 * Command Registry for Slash Commands
 *
 * Defines all available chat commands with their arguments and descriptions.
 * New commands should be added to this registry.
 */

export interface CommandArgument {
  name: string;
  description: string;
  required: boolean;
  type: 'string' | 'number' | 'user';
}

export interface Command {
  name: string;
  description: string;
  arguments: CommandArgument[];
  // Format string for display in autocomplete (e.g., "/kick <target> [reason]")
  format: string;
}

// Registry of all available commands
export const COMMANDS: Record<string, Command> = {
  kick: {
    name: 'kick',
    description: 'Kick a user from the channel',
    arguments: [
      {
        name: 'target',
        description: 'Username of the user to kick',
        required: true,
        type: 'user',
      },
      {
        name: 'reason',
        description: 'Optional reason for kicking',
        required: false,
        type: 'string',
      },
    ],
    format: '/kick <target> [reason]',
  },
  // Future commands go here
  // Example:
  // mute: {
  //   name: 'mute',
  //   description: 'Mute a user in the channel',
  //   arguments: [
  //     { name: 'target', description: 'Username to mute', required: true, type: 'user' },
  //     { name: 'duration', description: 'Duration in minutes', required: false, type: 'number' },
  //   ],
  //   format: '/mute <target> [duration]',
  // },
};

// Get all command names (for autocomplete filtering)
export function getCommandNames(): string[] {
  return Object.keys(COMMANDS);
}

// Get command by name
export function getCommand(name: string): Command | undefined {
  return COMMANDS[name.toLowerCase()];
}

// Filter commands by prefix (for autocomplete)
export function filterCommands(prefix: string): Command[] {
  const lowerPrefix = prefix.toLowerCase();
  return Object.values(COMMANDS).filter(cmd =>
    cmd.name.startsWith(lowerPrefix)
  );
}

// Parse a command string into command name and arguments
export interface ParsedCommand {
  command: string;
  args: string[];
  raw: string;
}

export function parseCommand(input: string): ParsedCommand | null {
  // Remove leading slash and trim
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) {
    return null;
  }

  const withoutSlash = trimmed.slice(1);
  const parts = withoutSlash.split(/\s+/);

  if (parts.length === 0) {
    return null;
  }

  return {
    command: parts[0].toLowerCase(),
    args: parts.slice(1),
    raw: input,
  };
}
