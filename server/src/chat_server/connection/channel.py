from pydantic import BaseModel


# NOTE: Should this be a BaseModel instead of just a normal class ?
# What if I need to add some methods here ?
class Channel(BaseModel):
    id: int
    name: str
