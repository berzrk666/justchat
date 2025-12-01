from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.types import String

USERNAME_MAX_LENGTH = 30


class Base(DeclarativeBase):
    pass


class UserTable(Base):
    __tablename__ = "user"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(USERNAME_MAX_LENGTH), unique=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
