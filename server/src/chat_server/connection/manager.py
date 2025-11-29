import logging
from fastapi import WebSocket
from fastapi.websockets import WebSocketDisconnect

from chat_server.connection.context import ConnectionMetadata
from chat_server.handler import router
from chat_server.protocol.message import BaseMessage


class ConnectionManager:
    """
    Manages WebSocket connections.
    """

    def __init__(self) -> None:
        self.active_connections: list[ConnectionMetadata] = []
        self._count: int = 0

    async def connect(self, websocket: WebSocket) -> None:
        """
        Accept and register a new WebSocket connection.

        If invalid connection raise a WebSocketDisconnect
        """

        await websocket.accept()
        self._count += 1
        conn_data = ConnectionMetadata(websocket=websocket, id=self._count)
        if await conn_data.establish_connection():
            logging.info(f"Created ConnectionMetadata: {conn_data}")
            self.active_connections.append(conn_data)
        else:
            await websocket.close(reason="Invalid HELLO")
            raise WebSocketDisconnect

    async def disconnect(self, websocket: WebSocket) -> None:
        """
        Remove a WebSocket connection from active connections.
        """
        # PERF: Not the most efficient lookup
        for conn in self.active_connections:
            if conn.websocket == websocket:
                self.active_connections.remove(conn)
                break
        logging.info("Connection disconnected.")

    async def send_personal_message(self, message: str, websocket: WebSocket) -> None:
        """
        Send a message to a specific WebSocket connection.
        """
        await websocket.send_text(f"You: {message}")

    async def broadcast_message(self, message: str) -> None:
        """
        Broadcast a message to all active connections.
        """
        for conn in self.active_connections:
            await conn.websocket.send_text(f"[BROADCAST]: {message}")

    async def handle_message(self, data: str) -> None:
        """
        Handle the message received by client appropriately
        """
        logging.info(f"CLIENT SEND: {data}")
        msg = BaseMessage.from_json(data)
        if msg is not None:
            await router.dispatch(self.active_connections, msg)

    @property
    def active_count(self) -> int:
        """
        Get the number of active connections.
        """
        return len(self.active_connections)
