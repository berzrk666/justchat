from pydantic import BaseModel


class User(BaseModel):
    id: int | None = None
    is_guest: bool
    username: str
