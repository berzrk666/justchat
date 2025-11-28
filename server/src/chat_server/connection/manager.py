from fastapi import WebSocket


class ConnectionManager:
    """
    Manages WebSocket connections.
    """

    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        """
        Accept and register a new WebSocket connection.
        """

        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        """
        Remove a WebSocket connection from active connections.
        """
        self.active_connections.remove(websocket)

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
            await conn.send_text(f"[BROADCAST]: {message}")

    @property
    def active_count(self) -> int:
        """
        Get the number of active connections.
        """
        return len(self.active_connections)
