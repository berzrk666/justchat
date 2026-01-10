# Chat

## Features

- Multi channel
- Multi user
- Persistent message history
- Authenticated and Guest Users
- User Presence
- Typing indicator
- Reactions
- Chat Commands (/command)
  - Kick user from channel
  - Mute user in channel (with duration and reason)

## TODOs

- [ ] Add **Redis** for *scaling* and improve *performance*
- [ ] Improve **Reactions**
  - [ ] Keep track of who reacted
  - [ ] Persistent reactions
- [ ] Make **message protocol payload** smaller for *efficiency*
  - [ ] Use *bit fields* instead of `StrEnum` for the `MessageType`
  - [ ] Smaller fields, e.g. `user` -> `u`
- [ ] Add **pagination** for the message history
- [X] Add typing indicator
- [X] Add **slash commands**
  - [X] Kick
  - [X] Mute / Unmute
  - [ ] Ban/Unban
- [ ] Add **more tests**

## Need fixing

-

## Message Protocol

The communication is done entirely in WebSockets.

### Creating new protocols

I focused in making easy and modular when implementing new protocols.

All you need is:

1. Create a `MessageType` enum in `server/protocol/enums.py`  that will be used
to identify this protocol.
2. Create the **Payload Body** in `server/protocol/messages.py` that will
contain all the data that is needed.
3. Create a `handler` for your protocol inside `server/handler/` that will contain
your **implementation** of the protocol.
4. And **register** this `handler` to a `MessageType` inside `server/handler/routes.py`

After this the server will send every request of this new `MessageType`
to the specified `handler`.

#### Dependency Injections

I also have some decorators (`server/handler/decorators.py`) that is commonly
used in the protocols, i.e., check if the user is currently in the channel,
if the user has permission, ...

- `@validate_message(MessageType)`: Validate if the message received from the
client is properly formatted.
- `@require_channel`: Check if the channel the client is requesting exists.
- `@require_membership`: Check if the user is currently in the channel.
- `@require_permission(permission)`: Check if the user has the `permission`.
- `@require_not_muted`: Check if the user is not muted.

## Design

- Top-Level Object is the `ConnectionManager` that will accept a WebSocket
connection and then process every data received.
  - Ensure the first message ("hello") by the user is correct.
  - Check if its an authenticated user or creates a guest user.
  - Validate all the subsequent messages and then send then to a router
  that will handle the message.
  - Handle the disconnect by the user.

### Services

- The `ConnectionManager` depends on some services objects that handle
certain features.
  - `AuthenticationService` is what will authenticate an user account or
  create a guest user.
  - `ChannelService`: contains the API needed to interact with a channel. You
  can "join" an User to a channel, check if a User is in a channel, ...
    - `MembershipService` "*low-level*" API to manage the relationship between a
    user/client and the channel connected.
  - `MessageBroker`: is the service to send messages to different targets like
  user, a channel, or, if needed, a WebSocket.
  - `ModerationService` manages the chat commands related to moderation
  (`mute`, `ban`)
