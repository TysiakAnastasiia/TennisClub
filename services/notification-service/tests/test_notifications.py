from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport
from main import app
import pytest_asyncio


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


def _mock_smtp():
    """Patch aiosmtplib.send so no real SMTP connection is attempted."""
    return patch("aiosmtplib.send", new_callable=AsyncMock)


# ── registration confirmation ─────────────────────────────────────────────────

async def test_send_confirmation_returns_sent_true(client):
    with _mock_smtp():
        resp = await client.post("/notifications/send-confirmation", json={
            "email": "user@test.com",
            "user_id": 1,
            "cancel_token": "abc123",
        })
    assert resp.status_code == 200
    assert resp.json()["sent"] is True


async def test_send_confirmation_calls_smtp(client):
    with _mock_smtp() as mock_send:
        await client.post("/notifications/send-confirmation", json={
            "email": "user@test.com",
            "user_id": 1,
            "cancel_token": "abc123",
        })
    mock_send.assert_called_once()
    call_args = mock_send.call_args
    msg = call_args[0][0]
    assert msg["To"] == "user@test.com"


# ── booking confirmed ─────────────────────────────────────────────────────────

async def test_booking_confirmed_returns_sent_true(client):
    with _mock_smtp():
        resp = await client.post("/notifications/booking-confirmed", json={
            "email": "user@test.com",
            "booking_id": 42,
            "court_name": "Корт A1",
            "start_time": "2026-06-01T10:00:00",
            "end_time": "2026-06-01T12:00:00",
            "total_price": 600.0,
        })
    assert resp.status_code == 200
    assert resp.json()["sent"] is True


async def test_booking_confirmed_subject_contains_id(client):
    with _mock_smtp() as mock_send:
        await client.post("/notifications/booking-confirmed", json={
            "email": "u@t.com",
            "booking_id": 77,
            "total_price": 300.0,
        })
    msg = mock_send.call_args[0][0]
    assert "77" in msg["Subject"]


# ── booking paid ──────────────────────────────────────────────────────────────

async def test_booking_paid_returns_sent_true(client):
    with _mock_smtp():
        resp = await client.post("/notifications/booking-paid", json={
            "email": "user@test.com",
            "booking_id": 10,
            "total_price": 900.0,
        })
    assert resp.status_code == 200
    assert resp.json()["sent"] is True


# ── booking refunded ──────────────────────────────────────────────────────────

async def test_booking_refunded_returns_sent_true(client):
    with _mock_smtp():
        resp = await client.post("/notifications/booking-refunded", json={
            "email": "user@test.com",
            "booking_id": 5,
            "total_price": 450.0,
        })
    assert resp.status_code == 200
    assert resp.json()["sent"] is True


# ── event registered ──────────────────────────────────────────────────────────

async def test_event_registered_returns_sent_true(client):
    with _mock_smtp():
        resp = await client.post("/notifications/event-registered", json={
            "email": "user@test.com",
            "event_title": "Літній турнір",
            "start_time": "2026-07-15T09:00:00",
        })
    assert resp.status_code == 200
    assert resp.json()["sent"] is True


async def test_event_registered_subject_contains_title(client):
    with _mock_smtp() as mock_send:
        await client.post("/notifications/event-registered", json={
            "email": "u@t.com",
            "event_title": "Майстер-клас",
            "start_time": "2026-07-01T10:00:00",
        })
    msg = mock_send.call_args[0][0]
    assert "Майстер-клас" in msg["Subject"]


# ── smtp failure graceful ─────────────────────────────────────────────────────

async def test_smtp_error_returns_sent_false(client):
    with patch("aiosmtplib.send", side_effect=Exception("SMTP timeout")):
        resp = await client.post("/notifications/send-confirmation", json={
            "email": "fail@test.com",
            "user_id": 1,
            "cancel_token": "tok",
        })
    assert resp.status_code == 200
    body = resp.json()
    assert body["sent"] is False
    assert "error" in body
