from contextlib import asynccontextmanager
from typing import Annotated
from fastapi import Depends, FastAPI, WebSocket, status
from fastapi.exceptions import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.websockets import WebSocketDisconnect
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from chat_server.api.models import UserCreate
from chat_server.connection.manager import ConnectionManager
from chat_server.db import crud
from chat_server.db.db import get_db, init_db
from chat_server.settings import get_settings

import logging

logging.basicConfig(
    level=logging.DEBUG,
    format="{asctime} - {levelname} - ({filename}::{funcName}) - {message}",
    style="{",
    datefmt="%d-%m-%Y %H:%M",
)

settings = get_settings()

DBSession = Annotated[AsyncSession, Depends(get_db)]


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


# Create FastAPI app with settings
app = FastAPI(
    title="Chat Server API",
    version="0.1.0",
    debug=settings.is_development,
    lifespan=lifespan,
)


origins = ["http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.is_development else origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "Chat Server API",
        "environment": settings.ENVIRONMENT,
    }


manager = ConnectionManager()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    try:
        await manager.connect(websocket)
        try:
            while True:
                data = await websocket.receive_text()
                await manager.handle_message(websocket, data)
        except WebSocketDisconnect:
            await manager.disconnect(websocket)
    except WebSocketDisconnect:
        logging.info("Connection closed by the server: Invalid HELO initiaition")


@app.post("/auth/signup", status_code=status.HTTP_201_CREATED)
async def signup(session: DBSession, user_in: UserCreate):
    """
    Register an account.
    """
    try:
        user = await crud.create_user(session, user_in)
        # FIX: Do not return UserTable, but create a Public model.
        return user
    except IntegrityError:
        raise HTTPException(status.HTTP_409_CONFLICT, "Username already exists.")
