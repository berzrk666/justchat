from datetime import datetime
import logging
from uuid import uuid4

from pydantic import ValidationError

from chat_server.connection.context import ConnectionContext
from chat_server.connection.manager import ConnectionManager
from chat_server.protocol.basemessage import BaseMessage
from chat_server.protocol.messages import KickCommand, KickCommandPayload


async def handler_kick(
    ctx: ConnectionContext, message: BaseMessage, manager: ConnectionManager
):
    """
    Handle kick command
    """
    try:
        msg_in = KickCommand.model_validate(message)
        channel = manager.channel_srvc.get_channel_by_id(msg_in.payload.channel_id)

        # Check if channel exists
        if channel is None:
            await manager.send_error(ctx.websocket, "Channel does not exist.")
            logging.error(
                f"{repr(ctx.user)} attempted to send a message to a channel that does not exist: {msg_in.payload.channel_id}"
            )
            return

        # Check if the MOD is in the channel
        if not manager.channel_srvc.is_member(ctx.user, channel):
            logging.warning(
                f"{repr(ctx.user)} tried to send a message to channel {repr(channel)} without being a member."
            )
            await manager.send_error(
                ctx.websocket,
                "You must join this channel before sending messages",
            )
            return

        # TODO: Check permission

        target = manager.channel_srvc.find_member_by_username(
            msg_in.payload.channel_id, msg_in.payload.target
        )

        if target:
            payload = msg_in.payload
            kick_msg = KickCommand(
                timestamp=datetime.now(), id=uuid4(), payload=payload
            )
            await manager.channel_srvc.send_to_channel(channel, kick_msg)
            await manager.channel_srvc.leave_channel(target, channel)
    except ValidationError:
        await manager.send_error(ctx.websocket, "Malformed message")
    except Exception as e:
        logging.error(f"Error handling CHAT_SEND: {e}")


async def handler_mute(
    ctx: ConnectionContext, message: BaseMessage, manager: ConnectionManager
):
    """
    Handle mute command
    """
    pass
