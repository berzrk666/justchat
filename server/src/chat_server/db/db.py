from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.sql import insert, select
from chat_server.db.models import Base, UserTable
from chat_server.security.utils import get_password_hash
from chat_server.settings import get_settings

settings = get_settings()

async_engine = create_async_engine(settings.DATABASE_URL.unicode_string())

async_session = async_sessionmaker(async_engine, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency that provides an async database session.
    """
    async with async_session() as session:
        yield session


async def init_db() -> None:
    """Creates all database tables."""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        res = await conn.execute(
            select(UserTable).where(UserTable.username == settings.SUPERUSER_USERNAME)
        )
        if res.scalar_one_or_none() is None:
            await conn.execute(
                insert(UserTable).values(
                    username=settings.SUPERUSER_USERNAME,
                    hashed_password=get_password_hash(settings.SUPERUSER_PASSWORD),
                )
            )
