import logging

from chat_server.connection.context import ConnectionContext
from chat_server.connection.manager import ConnectionManager
from chat_server.protocol import client, server
from chat_server.protocol.message import BaseMessage


async def handler_chat_send(
    ctx: ConnectionContext, message: BaseMessage, manager: ConnectionManager
):
    """
    Handle an incoming message of the type ChatSend
    """
    try:
        msg_in = client.ChatSend.model_validate(message)
        logging.info(f"SERVER SEND -> {msg_in.model_dump_json()}")

        msg = server.ChatSend(
            timestamp=msg_in.timestamp,
            payload=server.ChatSendPayload(
                channel_id=msg_in.payload.channel_id,
                sender=ctx.user.username,
                content=msg_in.payload.content
            ),
        )
        await manager.send_msg_to_channel(msg, msg_in.payload.channel_id)
    except Exception as e:
        await manager.send_error(ctx.websocket, "Invalid message")
        logging.error(f"Couldn't process User <ChatSend>: {e}")
