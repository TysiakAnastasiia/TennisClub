import os
import jwt
import pytest
import pytest_asyncio
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.db.database import Base, get_db
from main import app

_TEST_DB = "sqlite+aiosqlite:///:memory:"
_engine = create_async_engine(_TEST_DB, echo=False)
_SessionLocal = sessionmaker(_engine, class_=AsyncSession, expire_on_commit=False)

MOCK_COURT = {"id": 1, "name": "Court A1", "price_per_hour": 300.0, "is_active": True}


async def _override_get_db():
    async with _SessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = _override_get_db


def make_token(user_id: int = 1, role: str = "client", email: str = "u@test.com") -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    secret = os.getenv("JWT_SECRET", "my-super-secret-jwt-key-1234567890-abcdefghijklmnopqrstuvwxyz")
    return jwt.encode(payload, secret, algorithm="HS256")


def auth_headers(user_id: int = 1, role: str = "client") -> dict:
    return {"Authorization": f"Bearer {make_token(user_id, role)}"}


@pytest_asyncio.fixture(autouse=True)
async def _reset_db():
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(autouse=True)
def _silence_http():
    """Prevent any real HTTP calls — notification / club service."""
    mock_response = MagicMock(status_code=200, json=MagicMock(return_value={}))
    mock_response.raise_for_status = MagicMock()
    instance = AsyncMock()
    instance.get = AsyncMock(return_value=mock_response)
    instance.post = AsyncMock(return_value=mock_response)
    with patch("httpx.AsyncClient") as mock_cls:
        mock_cls.return_value.__aenter__ = AsyncMock(return_value=instance)
        mock_cls.return_value.__aexit__ = AsyncMock(return_value=None)
        yield instance


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
