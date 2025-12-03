from typing import Literal

from pydantic import BaseModel
from chat_server.protocol.enums import MessageType
from chat_server.protocol.message import BaseMessage


class ChatSendPayload(BaseModel):
    channel_id: int
    sender: str


class ChatSend(BaseMessage):
    type: Literal[MessageType.CHAT_SEND] = MessageType.CHAT_SEND
    payload: ChatSendPayload
