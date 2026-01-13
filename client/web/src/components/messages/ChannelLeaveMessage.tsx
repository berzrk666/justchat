import type { ChannelLeaveMessageServerToClient } from '../../types/messages';

interface ChannelLeaveMessageProps {
  message: ChannelLeaveMessageServerToClient;
}

export function ChannelLeaveMessage({ message }: ChannelLeaveMessageProps) {
  const { payload, timestamp } = message;
  const username = payload.user?.username || 'Someone';

  return (
    <div className="flex justify-center my-3">
      <div className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm">
        <span className="font-semibold">{username}</span>
        {' left the channel'}
        <span className="text-xs text-red-500 ml-2">
          {new Date(timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
