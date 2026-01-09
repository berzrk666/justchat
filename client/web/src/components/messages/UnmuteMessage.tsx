import type { ChatUnmuteMessageServerToClient } from '../../types/messages';

interface UnmuteMessageProps {
  message: ChatUnmuteMessageServerToClient;
  currentUsername?: string;
}

export function UnmuteMessage({ message, currentUsername }: UnmuteMessageProps) {
  const { payload, timestamp } = message;
  const target = payload.target;

  const isCurrentUser = currentUsername === target;

  return (
    <div className="flex justify-center my-3">
      <div
        className={`px-4 py-2 rounded-lg text-sm ${
          isCurrentUser
            ? 'bg-green-600 text-white font-medium'
            : 'bg-green-100 text-green-800'
        }`}
      >
        {isCurrentUser ? (
          <span className="font-bold">🔊 You have been unmuted</span>
        ) : (
          <>
            <span className="font-semibold">{target}</span>
            {' has been unmuted'}
          </>
        )}
        <span className={`text-xs ml-2 ${isCurrentUser ? 'opacity-75' : 'opacity-50'}`}>
          {new Date(timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
