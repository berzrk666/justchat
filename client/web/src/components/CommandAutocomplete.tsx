import type { Command } from '../config/commandRegistry';

interface CommandAutocompleteProps {
  commands: Command[];
  selectedIndex: number;
  onSelect: (command: Command) => void;
  position?: { top: number; left: number };
}

export function CommandAutocomplete({
  commands,
  selectedIndex,
  onSelect,
  position
}: CommandAutocompleteProps) {
  if (commands.length === 0) {
    return null;
  }

  return (
    <div
      className="absolute bottom-full mb-2 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden z-50 min-w-[300px] max-w-[400px]"
      style={position ? { bottom: 'auto', top: position.top, left: position.left } : undefined}
    >
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
        <span className="text-xs font-semibold text-gray-600 uppercase">Commands</span>
      </div>
      <div className="max-h-[300px] overflow-y-auto">
        {commands.map((command, index) => (
          <button
            key={command.name}
            onClick={() => onSelect(command)}
            className={`w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors ${
              index === selectedIndex ? 'bg-blue-100' : ''
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-mono text-sm mt-0.5">/</span>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm text-gray-800">
                  {command.format}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {command.description}
                </div>
                {command.arguments.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {command.arguments.map(arg => (
                      <div key={arg.name} className="text-xs text-gray-400">
                        <span className="font-mono">
                          {arg.required ? '<' : '['}
                          {arg.name}
                          {arg.required ? '>' : ']'}
                        </span>
                        {' - '}
                        {arg.description}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="bg-gray-50 px-3 py-1.5 border-t border-gray-200 text-xs text-gray-500">
        Use <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">↑</kbd> <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">↓</kbd> to navigate, <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Enter</kbd> to select
      </div>
    </div>
  );
}
