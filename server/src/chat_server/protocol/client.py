"""Client-to-Server Protocol Messages"""

from typing import Literal

from pydantic import BaseModel

from .enums import MessageType
from .message import BaseMessage


# ==================
# Type: HELLO
# ==================
class HelloPayload(BaseModel):
    model_config = {"extra": "forbid"}
    username: str
    token: str | None = None


class Hello(BaseMessage):
    type: Literal[MessageType.HELLO] = MessageType.HELLO
    payload: HelloPayload


# ==================
# Type: CHAT_SEND
# ==================
class ChatSendPayload(BaseModel):
    model_config = {"extra": "forbid"}
    channel_id: int
    content: str


class ChatSend(BaseMessage):
    type: Literal[MessageType.CHAT_SEND] = MessageType.CHAT_SEND
    payload: ChatSendPayload


# ========================
# Type: CHANNEL_JOIN_REQUEST
# ========================
class ChannelJoinPayload(BaseModel):
    model_config = {"extra": "forbid"}
    # TODO: Why send an username? The server should keep track of the username
    username: str
    channel_id: int


class ChannelJoin(BaseMessage):
    type: Literal[MessageType.CHANNEL_JOIN_REQUEST] = MessageType.CHANNEL_JOIN_REQUEST
    payload: ChannelJoinPayload
