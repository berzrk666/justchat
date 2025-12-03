"""Server-to-Client Protocol Messages"""

from typing import Literal

from pydantic import BaseModel

from .enums import MessageType
from .message import BaseMessage


# ==================
# Type: CHAT_SEND (Server broadcasts this with sender info)
# ==================
class ChatSendPayload(BaseModel):
    model_config = {"extra": "forbid"}
    channel_id: int
    sender: str
    content: str


class ChatSend(BaseMessage):
    type: Literal[MessageType.CHAT_SEND] = MessageType.CHAT_SEND
    payload: ChatSendPayload


# ========================
# Type: CHAT_BROADCAST
# ========================
class ChatBroadcastPayload(BaseModel):
    model_config = {"extra": "forbid"}
    content: str


class ChatBroadcast(BaseMessage):
    type: Literal[MessageType.CHAT_BROADCAST] = MessageType.CHAT_BROADCAST
    payload: ChatBroadcastPayload


# ========================
# Type: CHANNEL_JOIN (Server confirms join)
# ========================
class ChannelJoinPayload(BaseModel):
    model_config = {"extra": "forbid"}
    username: str
    channel_id: int


class ChannelJoin(BaseMessage):
    type: Literal[MessageType.CHANNEL_JOIN] = MessageType.CHANNEL_JOIN
    payload: ChannelJoinPayload


# ========================
# Type: CHANNEL_LEAVE
# ========================
class ChannelLeavePayload(BaseModel):
    model_config = {"extra": "forbid"}
    username: str
    channel_id: int


class ChannelLeave(BaseMessage):
    type: Literal[MessageType.CHANNEL_LEAVE] = MessageType.CHANNEL_LEAVE
    payload: ChannelLeavePayload
