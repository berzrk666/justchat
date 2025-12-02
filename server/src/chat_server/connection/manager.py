from datetime import datetime
import logging
from fastapi import WebSocket
from fastapi.websockets import WebSocketDisconnect
import jwt
from pydantic import ValidationError

from chat_server.connection.context import ConnectionContext
from chat_server.db import crud
from chat_server.db.db import async_session
from chat_server.protocol.enums import MessageType
from chat_server.protocol.message import (
    BaseMessage,
    ChannelJoin,
    ChannelJoinPayload,
    ChannelLeave,
    ChannelLeavePayload,
    Hello,
    ErrorMessage,
)
from chat_server.security.utils import ALGORITHM
from chat_server.settings import get_settings

SERVER_ONLY_MESSAGES = {
    MessageType.CHANNEL_JOIN,
}


class ConnectionManager:
    """
    Manages WebSocket connections.
    """

    def __init__(self) -> None:
        self.active_connections: dict[WebSocket, ConnectionContext] = {}
        self.connections_by_id: dict[int, ConnectionContext] = {}
        self._count: int = 0

    async def connect(self, websocket: WebSocket) -> None:
        """
        Accept and register a new WebSocket connection.

        If invalid connection raise a WebSocketDisconnect
        """

        await websocket.accept()
        self._count += 1

        helo = await websocket.receive_text()

        try:
            data = Hello.model_validate_json(helo)
        except ValidationError:
            logging.warning(f"Expected HELLO message. Got: {helo}")
            await websocket.close(reason="Invalid HELLO")
            raise WebSocketDisconnect

        access_token = data.payload.token
        if not access_token:
            # Handle Guest User
            logging.debug(f"No Access Access Token in Payload: {access_token =}")
            conn_data = ConnectionContext(
                websocket=websocket, username=data.payload.username
            )
        else:
            # Handle Authenticated User
            logging.debug(f"Access Token in Payload: {access_token =}")
            try:
                token = jwt.decode(
                    access_token,
                    get_settings().SECRET_KEY,
                    algorithms=[ALGORITHM],
                )
                logging.debug(f"Token Decoded: {token =}")
                user_id = token.get("sub")

                # Verify user exists in database
                async with async_session() as session:
                    user = await crud.get_user_by_id(session, user_id)
                    if not user:
                        await websocket.close(reason="User does not exist")
                        raise WebSocketDisconnect

                conn_data = ConnectionContext(
                    websocket=websocket, id=user.id, username=user.username
                )
            except Exception as e:
                logging.warning(f"Invalid authentication: {e}")
                await websocket.close(reason="Authentication failed")
                raise WebSocketDisconnect

        logging.info(f"Created ConnectionContext: {conn_data}")
        self.active_connections[websocket] = conn_data
        # self.connections_by_id[conn_data.id] = conn_data

    def get_connection(self, websocket: WebSocket) -> "ConnectionContext | None":
        """
        Get the ConnectionContext for a given WebSocket.
        """
        return self.active_connections.get(websocket)

    def get_connection_by_id(self, conn_id: int) -> "ConnectionContext | None":
        """
        Get the ConnectionContext for a given ID.
        """
        return self.connections_by_id.get(conn_id)

    async def disconnect(self, websocket: WebSocket) -> None:
        """
        Remove a WebSocket connection from active connections.
        """
        if websocket in self.active_connections:
            conn = self.active_connections.pop(websocket)
            # self.connections_by_id.pop(conn.id, None)

            logging.info(f"<{conn.username}> has disconnected.")

            # TODO: Announce User Leave
            await self.send_channel_leave(conn)

    async def send_error(self, websocket: WebSocket, msg: str) -> None:
        err = ErrorMessage(detail=msg)
        await websocket.send_text(err.model_dump_json())

    async def handle_message(self, websocket: WebSocket, data: str) -> None:
        """
        Handle the message received by client appropriately
        """
        from chat_server.handler import router

        logging.info(f"CLIENT SENT: {data}")
        msg = BaseMessage.from_json(data)
        if msg is None:
            logging.warning("Client sent a malformed data.")
            msg = BaseMessage.model_validate_json(data)
            logging.debug(f"{msg =}")
            if msg.type in SERVER_ONLY_MESSAGES:
                conn = self.get_connection(websocket)
                logging.warning(
                    f"Client attempted to send server-only message: <{conn.username}> "
                )
            await self.send_error(websocket, "Invalid message type")
            return

        ctx = self.get_connection(websocket)
        if ctx is not None:
            await router.dispatch(ctx, msg, self)
        else:
            logging.warning("Received message from unknown connection")

    async def broadcast(self, message: BaseMessage) -> None:
        msg_str = message.model_dump_json()

        for conn in self.active_connections:
            try:
                await conn.send_text(msg_str)
            except Exception as e:
                logging.error(
                    f"Error sending message to {self.active_connections.get(conn).username}: {e}"
                )

    async def send_channel_join(self, ctx: ConnectionContext) -> None:
        payload = ChannelJoinPayload(username=ctx.username, channel_id=0)
        join_msg = ChannelJoin(timestamp=datetime.now(), payload=payload)

        await self.broadcast(join_msg)

    async def send_channel_leave(self, ctx: ConnectionContext) -> None:
        payload = ChannelLeavePayload(username=ctx.username, channel_id=0)
        leave_msg = ChannelLeave(timestamp=datetime.now(), payload=payload)

        await self.broadcast(leave_msg)
