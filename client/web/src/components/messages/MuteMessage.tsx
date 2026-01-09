import type { ChatMuteMessageServerToClient } from '../../types/messages';

interface MuteMessageProps {
  message: ChatMuteMessageServerToClient;
  currentUsername?: string;
}

export function MuteMessage({ message, currentUsername }: MuteMessageProps) {
  const { payload, timestamp } = message;
  const target = payload.target;
  const duration = payload.duration;
  const reason = payload.reason;

  const isCurrentUser = currentUsername === target;

  // Format duration for display
  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'indefinitely';
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  return (
    <div className="flex justify-center my-3">
      <div
        className={`px-4 py-2 rounded-lg text-sm ${
          isCurrentUser
            ? 'bg-orange-600 text-white font-medium'
            : 'bg-yellow-100 text-yellow-800'
        }`}
      >
        {isCurrentUser ? (
          <>
            <span className="font-bold">🔇 You have been muted {duration ? `for ${formatDuration(duration)}` : 'indefinitely'}</span>
            {reason && (
              <span className="block mt-1 text-xs opacity-90">
                Reason: {reason}
              </span>
            )}
          </>
        ) : (
          <>
            <span className="font-semibold">{target}</span>
            {' has been muted '}
            {duration ? `for ${formatDuration(duration)}` : 'indefinitely'}
            {reason && (
              <span className="block mt-1 text-xs opacity-75">
                Reason: {reason}
              </span>
            )}
          </>
        )}
        <span className={`text-xs ml-2 ${isCurrentUser ? 'opacity-75' : 'opacity-50'}`}>
          {new Date(timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
