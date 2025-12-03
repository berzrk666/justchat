from pydantic import BaseModel


class User(BaseModel):
    id: int | None = None
    username: str

    @property
    def is_guest(self) -> bool:
        return self.id is None
