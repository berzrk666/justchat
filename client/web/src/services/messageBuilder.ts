import { MessageType } from '../types/messages';
import type {
  HelloMessageClientToServer,
  ChatSendMessageClientToServer,
  ChannelJoinMessageClientToServer,
  ReactAddMessageClientToServer,
  ReactRemoveMessageClientToServer,
  TypingStartMessageClientToServer,
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

  /**
   * Build REACT_ADD message (Client → Server).
   * Add a reaction to a message.
   */
  static reactAdd(channelId: number, messageId: string, emote: string): ReactAddMessageClientToServer {
    return {
      type: MessageType.REACT_ADD,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID(),
      payload: {
        channel_id: channelId,
        message_id: messageId,
        emote: emote,
      },
    };
  }

  /**
   * Build REACT_REMOVE message (Client → Server).
   * Remove a reaction from a message.
   */
  static reactRemove(channelId: number, messageId: string, emote: string): ReactRemoveMessageClientToServer {
    return {
      type: MessageType.REACT_REMOVE,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID(),
      payload: {
        channel_id: channelId,
        message_id: messageId,
        emote: emote,
      },
    };
  }

  /**
   * Build TYPING_START message (Client → Server).
   * Notify server that user started typing in a channel.
   */
  static typingStart(channelId: number): TypingStartMessageClientToServer {
    return {
      type: MessageType.TYPING_START,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID(),
      payload: {
        channel_id: channelId,
      },
    };
  }

  // Note: channelLeave is not needed - server automatically handles disconnections
}
