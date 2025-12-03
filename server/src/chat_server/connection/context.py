from fastapi import WebSocket
from pydantic import BaseModel

from chat_server.connection.user import User


# NOTE: Should this be a BaseModel instead of just a normal class ?
# What if I need to add some methods here ?
class ConnectionContext(BaseModel):
    # Required for WebSocket
    model_config = {"arbitrary_types_allowed": True}

    websocket: WebSocket
    user: User
