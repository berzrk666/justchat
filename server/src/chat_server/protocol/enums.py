from enum import StrEnum


class MessageType(StrEnum):
    """
    Types of messages that can be send.
    """

    CHAT_SEND = "chat_send"  # Used when a user send a normal message
    CHAT_BROADCAST = "chat_broadcast"  # Means the message is a broadcast

    # Channel
    CHANNEL_JOIN = "channel_join"  # Used when a user joins a channel
    CHANNEL_LEAVE = "channel_leave"  # used when a user leaves a channel

    # User
    USER_ONLINE = "user_online"  # State user is online
    USER_AFK = "user_afk"  # User is AFK
    USER_OFFLINE = "user_offline"  # State user is offlline
    USER_TYPING_START = "typing_start"  # User started typing
    USER_TYPING_STOP = "typing_stop"  # User stopped typing
