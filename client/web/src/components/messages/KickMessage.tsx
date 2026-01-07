import type { ChatKickMessageServerToClient } from '../../types/messages';

interface KickMessageProps {
  message: ChatKickMessageServerToClient;
  currentUsername?: string;
}

export function KickMessage({ message, currentUsername }: KickMessageProps) {
  const { payload, timestamp } = message;
  const target = payload.target;
  const reason = payload.reason;

  const isCurrentUser = currentUsername === target;

  return (
    <div className="flex justify-center my-3">
      <div
        className={`px-4 py-2 rounded-lg text-sm ${
          isCurrentUser
            ? 'bg-red-600 text-white font-medium'
            : 'bg-orange-100 text-orange-800'
        }`}
      >
        {isCurrentUser ? (
          <>
            <span className="font-bold">⚠️ You have been kicked from the channel</span>
            {reason && (
              <span className="block mt-1 text-xs opacity-90">
                Reason: {reason}
              </span>
            )}
          </>
        ) : (
          <>
            <span className="font-semibold">{target}</span>
            {' was kicked from the channel'}
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
