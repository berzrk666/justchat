from typing import Annotated
from chat_server.deps import DBSession


TokenDeps = Annotated[str, Depends]

def get_current_user(session: DBSession, token: Token)
