"""Message Protocol"""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel
from pydantic.types import UUID4

from .enums import MessageType


class ErrorMessage(BaseModel):
    detail: str


class BaseMessage(BaseModel):
    """
    Base Message Class containg absolute necessary information.
    """

    type: Any
    # NOTE: Maybe add a subtype ? E.g. type: SYSTEM, subtype: BROADCAST
    timestamp: datetime
    correlation_id: UUID4 | None = None
    payload: Any

    @classmethod
    def from_json(cls, json_str: str) -> "BaseMessage | None":
        """
        Deserialize a JSON String to a client Message.

        Raise ValidationError in case of invalid format
        """
        import json
        from . import client

        data = json.loads(json_str)

        match data["type"]:
            case MessageType.HELLO:
                return client.Hello.model_validate_json(json_str)
            case MessageType.CHAT_SEND:
                return client.ChatSend.model_validate_json(json_str)
            case MessageType.CHANNEL_JOIN_REQUEST:
                return client.ChannelJoin.model_validate_json(json_str)
            case _:
                return None

    @classmethod
    def to_json(cls, **kwargs) -> str:
        # FIX: Not working, just use model_dump_json directly for now.
        """
        Serialize Message to JSON string.
        """
        return cls.model_dump_json(**kwargs)


# Message classes have been moved to client.py and server.py
# Import them from there:
# from chat_server.protocol import client
# from chat_server.protocol import server
