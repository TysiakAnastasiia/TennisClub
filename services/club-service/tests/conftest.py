import os
import jwt
import pytest_asyncio
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.db.database import Base, get_db
from main import app

_TEST_DB = "sqlite+aiosqlite:///:memory:"
_engine = create_async_engine(_TEST_DB, echo=False)
_SessionLocal = sessionmaker(_engine, class_=AsyncSession, expire_on_commit=False)


async def _override_get_db():
    async with _SessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = _override_get_db


def make_token(user_id: int = 1, role: str = "staff") -> str:
    payload = {
        "sub": str(user_id),
        "email": "u@test.com",
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    secret = os.getenv("JWT_SECRET", "my-super-secret-jwt-key-1234567890-abcdefghijklmnopqrstuvwxyz")
    return jwt.encode(payload, secret, algorithm="HS256")


def auth_headers(role: str = "staff") -> dict:
    return {"Authorization": f"Bearer {make_token(role=role)}"}


@pytest_asyncio.fixture(autouse=True)
async def _reset_db():
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture
async def club(client):
    """Create a club and return its JSON."""
    resp = await client.post("/clubs", json={
        "name": "Тестовий клуб",
        "address": "вул. Тестова, 1",
    }, headers=auth_headers())
    return resp.json()
