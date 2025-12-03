from datetime import datetime
import logging
from fastapi import WebSocket
from fastapi.websockets import WebSocketDisconnect
import jwt
from pydantic import ValidationError

from chat_server.connection.channel import Channel
from chat_server.connection.context import ConnectionContext
from chat_server.connection.user import User
from chat_server.db import crud
from chat_server.db.db import async_session
from chat_server.protocol import client, server
from chat_server.protocol.enums import MessageType
from chat_server.protocol.message import BaseMessage, ErrorMessage
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
        # Keep track of all connections and its metadata using ConnectionContext
        self._active_connections: dict[WebSocket, ConnectionContext] = {}
        # Faster lookup for a connection using an User ID
        self._connections_by_user_id: dict[int, ConnectionContext] = {}
        # Map a Channel ID to its own Channel for fast lookups
        self._channels: dict[int, Channel] = {}

        self.subsmanager = SubscriptionManager()

    async def connect(self, websocket: WebSocket) -> None:
        """
        Accept and register a new WebSocket connection.

        For the connection to be accepted it needs to send
        a proper message (HELLO) to the server.

        If the connection is proper, a ConnectionContext will
        be created that will hold a reference to this connection
        and metadata about this.

        If invalid connection raise a WebSocketDisconnect
        """

        await websocket.accept()

        helo = await websocket.receive_text()

        # Validate the message received is a proper HELLO
        try:
            data = client.Hello.model_validate_json(helo)
        except ValidationError:
            logging.warning(f"Expected HELLO message. Got: {helo}")
            await websocket.close(reason="Invalid HELLO")
            raise WebSocketDisconnect

        access_token = data.payload.token
        # Check if there is a JWT token in the HELLO message
        if not access_token:
            # Handle Guest User
            user = User(username=data.payload.username)
            ctx = ConnectionContext(websocket=websocket, user=user)
        else:
            # Handle Authenticated User
            try:
                token = jwt.decode(
                    access_token,
                    get_settings().SECRET_KEY,
                    algorithms=[ALGORITHM],
                )
                user_id = token.get("sub")

                # Verify user exists in database
                async with async_session() as session:
                    user_db = await crud.get_user_by_id(session, user_id)
                    if not user_db:
                        await websocket.close(reason="User does not exist")
                        raise WebSocketDisconnect

                user = User(id=user_db.id, username=user_db.username)
                ctx = ConnectionContext(websocket=websocket, user=user)
            except Exception as e:
                logging.warning(f"Invalid authentication: {e}")
                await websocket.close(reason="Authentication failed")
                raise WebSocketDisconnect

        logging.info(f"A user has connected to the server: {repr(ctx)}")
        self._active_connections[websocket] = ctx
        # FIX: If the user is a guest there will be an error
        self._connections_by_user_id[user.id] = ctx

    def get_connection_context(
        self, websocket: WebSocket
    ) -> "ConnectionContext | None":
        """
        Get the ConnectionContext for a given WebSocket.
        """
        return self._active_connections.get(websocket)

    def get_connection_by_user_id(self, user_id: int) -> "WebSocket | None":
        """
        Get the ConnectionContext for a given User ID.
        """
        user = self._connections_by_user_id.get(user_id)
        return user.websocket if user else None

    def add_channel(self, channel: Channel):
        """
        Add a channel
        """
        self._channels[channel.id] = channel
        logging.debug(f"{channel = }")
        logging.debug(f"{self._channels[channel.id] = }")
        logging.debug(f"{self._channels = }")

    def get_channel(self, channel_id: int) -> Channel:
        """
        Get a channel using its ID
        """
        return self._channels[channel_id]

    async def disconnect(self, websocket: WebSocket) -> None:
        """
        Remove a WebSocket connection from active connections.
        """
        if websocket in self._active_connections:
            ctx = self._active_connections.pop(websocket)
            # self.connections_by_id.pop(conn.id, None)

            logging.info(f"{repr(ctx.user)} has disconnected.")

            await self.send_channel_leave(ctx)

    async def send_error(self, websocket: WebSocket, msg: str) -> None:
        err = ErrorMessage(detail=msg)
        await websocket.send_text(err.model_dump_json())

    async def handle_message(self, websocket: WebSocket, data: str) -> None:
        """
        Handle all the messages/data received from the client.
        """
        from chat_server.handler import router

        logging.info(f"CLIENT SENT: {data}")

        msg = BaseMessage.from_json(data)
        if msg is None:
            logging.warning("Client sent a malformed data.")
            msg = BaseMessage.model_validate_json(data)
            logging.debug(f"{msg =}")
            if msg.type in SERVER_ONLY_MESSAGES:
                ctx = self.get_connection_context(websocket)
                logging.warning(
                    f"Client attempted to send server-only message: {repr(ctx.user)} "
                )
            return await self.send_error(websocket, "Invalid message type")

        ctx = self.get_connection_context(websocket)
        if ctx:
            await router.dispatch(ctx, msg, self)
        else:
            logging.warning("Received message from connection without a Context")

    async def broadcast(self, message: BaseMessage) -> None:
        msg_str = message.model_dump_json()

        for conn in self._active_connections:
            try:
                await conn.send_text(msg_str)
            except Exception as e:
                logging.error(
                    f"Error sending message to {self._active_connections.get(conn).user}: {e}"
                )

    # NOTE: Rename to message_channel() ?
    # Maybe it should just send a message and let whoever
    # call it to handle the proper validation of the message ?
    async def send_msg_to_channel(self, message: BaseMessage, channel_id: int) -> None:
        channel = self.get_channel(channel_id)
        # Retrieve all users that is in the channel
        users_id_in_channel = self.subsmanager.get_users_in_channel(channel)

        for user_id in users_id_in_channel:
            conn = self.get_connection_by_user_id(user_id)
            if conn:
                await conn.send_text(message.model_dump_json())
            else:
                logging.error(f"Couldn't send message to UserID: {user_id}")

    async def send_channel_join(self, ctx: ConnectionContext, channel: Channel) -> None:
        payload = server.ChannelJoinPayload(
            username=ctx.user.username, channel_id=channel.id
        )
        join_msg = server.ChannelJoin(timestamp=datetime.now(), payload=payload)
        logging.info(f"Server sending {join_msg}")

        await self.send_msg_to_channel(join_msg, channel.id)

    async def send_channel_leave(self, ctx: ConnectionContext) -> None:
        timestamp = datetime.now()

        user_channels = self.subsmanager.get_channels_from_user(ctx.user).copy()

        logging.info(f"{repr(ctx.user)} has left the channels: {user_channels}")

        for channel_id in user_channels:
            self.subsmanager.remove_user_from_channel(ctx.user, channel_id)

            payload = server.ChannelLeavePayload(
                username=ctx.user.username, channel_id=channel_id
            )
            leave_msg = server.ChannelLeave(timestamp=timestamp, payload=payload)
            await self.send_msg_to_channel(leave_msg, channel_id)


class SubscriptionManager:
    """
    Manage the User and Channel relation. Keep track of "who" is connected to "where".
    """

    def __init__(self) -> None:
        # Maps Channel_ID to a Set of User_ID
        self._channel_members: dict[int, set[int]] = {}
        # Maps User_ID to a set of Channel_ID
        self._user_channels: dict[int, set[int]] = {}

    def add_user_to_channel(self, user: User, channel: Channel):
        """
        Add a User to a Channel
        """

        # TODO: Create a unique ID so you can handle Guest
        # Something like user_key = str(id) if authenticated or str(random_username) if guest
        if not user.id:
            raise ValueError("Guest users can not join a channel.")

        logging.info(f"Subscribing {repr(user)} to {repr(channel)}")
        if channel.id not in self._channel_members:
            self._channel_members[channel.id] = set()
        self._channel_members[channel.id].add(user.id)

        if user.id not in self._user_channels:
            self._user_channels[user.id] = set()
        self._user_channels[user.id].add(channel.id)

        logging.debug(f"Add: {self._channel_members = }")
        logging.debug(f"Add: {self._user_channels = }")

    def remove_user_from_channel(self, user: User, channel_id: int):
        """
        Remove a User from a Channel
        """
        logging.info(f"Removing {repr(user)} from {repr(channel_id)}")

        # Remove the user from the channel
        if channel_id in self._channel_members:
            self._channel_members[channel_id].discard(user.id)

        # Remove the channel from the user's channel
        if user.id in self._user_channels:
            self._user_channels[user.id].discard(channel_id)

        logging.debug(f"Removal: {self._channel_members = }")
        logging.debug(f"Removal: {self._user_channels = }")

    def get_users_in_channel(self, channel: Channel) -> set[int]:
        """
        Retrieve all Users ID connected to a Channel.

        Returns empty set if channel has no members.
        """
        return self._channel_members.get(channel.id, set())

    def get_channels_from_user(self, user: User) -> set[int]:
        """
        Retrieve all channels a User is connected to.

        Returns empty set if user hasn't joined any channels.
        """
        logging.debug(f"{self._user_channels = }")
        return self._user_channels.get(user.id, set())
