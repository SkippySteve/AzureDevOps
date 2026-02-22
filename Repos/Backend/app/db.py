from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from typing import Annotated, AsyncGenerator
from fastapi import Depends, FastAPI
from contextlib import asynccontextmanager
from sqlmodel import SQLModel

sqlite_url = "sqlite+aiosqlite:///./app/sql_app.db"
engine = create_async_engine(sqlite_url)    # set echo=True for debugging SQL in console
async_session = async_sessionmaker(engine, expire_on_commit=False)

# Dependency
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session

SessionDep = Annotated[AsyncSession, Depends(get_session)]

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    yield