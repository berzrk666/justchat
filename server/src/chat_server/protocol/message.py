"""Message Protocol"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel
from pydantic.types import UUID4

from .enums import MessageType


class BaseMessage(BaseModel):
    """
    Base Message Class containg absolute necessary information.
    """

    type: MessageType
    # NOTE: Maybe add a subtype ? E.g. type: SYSTEM, subtype: BROADCAST
    timestamp: datetime
    correlation_id: UUID4 | None = None
    payload: Any

    @classmethod
    def from_json(cls, json_str: str) -> "BaseMessage":
        """
        Deserialize a JSON String to a Message.
        """
        import json

        data = json.loads(json_str)

        msg_type = data.get("type")

        if msg_type == MessageType.CHAT_SEND:
            print(f"{msg_type =}")
            print(f"{data =}")
            return ChatSend.model_validate_json(json_str)

        return BaseMessage.model_validate_json(json_str)

    @classmethod
    def to_json(cls, **kwargs) -> str:
        """
        Serialize message to JSON string.
        """
        return cls.model_dump_json(**kwargs)


###################
# Type: CHAT_SEND #
###################
class ChatSendPayload(BaseModel):
    room_id: UUID4
    content: str


class ChatSend(BaseMessage):
    type: MessageType = MessageType.CHAT_SEND
    payload: ChatSendPayload


########################
# Type: CHAT_BROADCAST #
########################
class ChatBroadcastPayload(BaseModel):
    content: str


class ChatBroadcast(BaseMessage):
    type: MessageType = MessageType.CHAT_BROADCAST
    payload: ChatBroadcastPayload
