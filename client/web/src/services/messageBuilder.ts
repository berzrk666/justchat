import { MessageType } from '../types/messages';
import type {
  HelloMessageClientToServer,
  ChatSendMessageClientToServer,
  ChannelJoinMessageClientToServer,
} from '../types/messages';

export class MessageBuilder {
  /**
   * Build HELLO message (Client → Server).
   * Server will respond with HELLO containing assigned username for guests.
   */
  static hello(token?: string): HelloMessageClientToServer {
    return {
      type: MessageType.HELLO,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID(),
      payload: {
        ...(token && { token }), // Include token only if provided
      },
    };
  }

  /**
   * Build CHAT_SEND message (Client → Server).
   * Server will broadcast to channel with sender info.
   */
  static chatSend(channelId: number, content: string): ChatSendMessageClientToServer {
    return {
      type: MessageType.CHAT_SEND,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID(),
      payload: {
        channel_id: channelId,
        content: content,
      },
    };
  }

  /**
   * Build CHANNEL_JOIN message (Client → Server).
   * Server will broadcast join notification to channel members.
   */
  static channelJoin(channelId: number): ChannelJoinMessageClientToServer {
    return {
      type: MessageType.CHANNEL_JOIN,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID(),
      payload: {
        channel_id: channelId,
      },
    };
  }

  // Note: channelLeave is not needed - server automatically handles disconnections
  // Future: Add more builder methods here
}
