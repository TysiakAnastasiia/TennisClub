from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch
from tests.conftest import auth_headers, MOCK_COURT
from app.services.booking_service import booking_service


def _dt(offset_hours: int = 24) -> datetime:
    """Return a UTC datetime offset_hours from now."""
    return datetime.now(timezone.utc) + timedelta(hours=offset_hours)


def _booking_payload(start_offset: int = 24, duration: int = 2) -> dict:
    start = _dt(start_offset)
    end = _dt(start_offset + duration)
    return {
        "court_id": 1,
        "club_id": 1,
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
    }


def _mock_court():
    return patch.object(booking_service, "get_court_info", return_value=MOCK_COURT)


def _mock_notify():
    return patch.object(booking_service, "_notify_booking", new_callable=AsyncMock)


# ── create booking ────────────────────────────────────────────────────────────

async def test_create_booking_success(client):
    with _mock_court(), _mock_notify():
        resp = await client.post("/bookings", json=_booking_payload(), headers=auth_headers())

    assert resp.status_code == 201
    data = resp.json()
    assert data["court_id"] == 1
    assert data["club_id"] == 1
    assert data["total_price"] == 600.0   # 2h × 300 грн/год
    assert data["is_paid"] is False
    assert data["status"] == "confirmed"
    assert data["user_id"] == 1


async def test_create_booking_calculates_price_for_3h(client):
    with _mock_court(), _mock_notify():
        resp = await client.post("/bookings", json=_booking_payload(duration=3), headers=auth_headers())
    assert resp.status_code == 201
    assert resp.json()["total_price"] == 900.0   # 3h × 300


async def test_create_booking_conflict_returns_400(client):
    payload = _booking_payload()
    with _mock_court(), _mock_notify():
        await client.post("/bookings", json=payload, headers=auth_headers())
        resp = await client.post("/bookings", json=payload, headers=auth_headers())
    assert resp.status_code == 400
    assert "booked" in resp.json()["detail"].lower()


async def test_create_booking_in_past_returns_400(client):
    payload = {
        "court_id": 1, "club_id": 1,
        "start_time": _dt(-2).isoformat(),
        "end_time": _dt(-1).isoformat(),
    }
    with _mock_court():
        resp = await client.post("/bookings", json=payload, headers=auth_headers())
    assert resp.status_code == 400


async def test_create_booking_end_before_start_returns_400(client):
    payload = {
        "court_id": 1, "club_id": 1,
        "start_time": _dt(26).isoformat(),
        "end_time": _dt(24).isoformat(),
    }
    with _mock_court():
        resp = await client.post("/bookings", json=payload, headers=auth_headers())
    assert resp.status_code == 400


async def test_create_booking_requires_auth(client):
    resp = await client.post("/bookings", json=_booking_payload())
    assert resp.status_code == 401


# ── payment ───────────────────────────────────────────────────────────────────

async def test_pay_booking_marks_as_paid(client):
    with _mock_court(), _mock_notify():
        booking = (await client.post("/bookings", json=_booking_payload(), headers=auth_headers())).json()

    resp = await client.post(f"/bookings/{booking['id']}/pay", headers=auth_headers())
    assert resp.status_code == 200
    assert resp.json()["is_paid"] is True


async def test_pay_booking_twice_returns_400(client):
    with _mock_court(), _mock_notify():
        booking = (await client.post("/bookings", json=_booking_payload(), headers=auth_headers())).json()

    await client.post(f"/bookings/{booking['id']}/pay", headers=auth_headers())
    resp = await client.post(f"/bookings/{booking['id']}/pay", headers=auth_headers())
    assert resp.status_code == 400


async def test_pay_nonexistent_booking_returns_404(client):
    resp = await client.post("/bookings/9999/pay", headers=auth_headers())
    assert resp.status_code == 404


# ── cancellation ──────────────────────────────────────────────────────────────

async def test_cancel_own_booking(client):
    with _mock_court(), _mock_notify():
        booking = (await client.post("/bookings", json=_booking_payload(), headers=auth_headers())).json()

    resp = await client.delete(f"/bookings/{booking['id']}", headers=auth_headers())
    assert resp.status_code == 204


async def test_cancel_another_users_booking_returns_403(client):
    with _mock_court(), _mock_notify():
        booking = (await client.post("/bookings", json=_booking_payload(), headers=auth_headers(1))).json()

    resp = await client.delete(f"/bookings/{booking['id']}", headers=auth_headers(2))
    assert resp.status_code == 403


async def test_admin_can_cancel_any_booking(client):
    with _mock_court(), _mock_notify():
        booking = (await client.post("/bookings", json=_booking_payload(), headers=auth_headers(1))).json()

    resp = await client.delete(f"/bookings/{booking['id']}", headers=auth_headers(99, "admin"))
    assert resp.status_code == 204


# ── listing ───────────────────────────────────────────────────────────────────

async def test_list_bookings_returns_only_own(client):
    with _mock_court(), _mock_notify():
        await client.post("/bookings", json=_booking_payload(24), headers=auth_headers(1))
        await client.post("/bookings", json=_booking_payload(30), headers=auth_headers(2))

    resp = await client.get("/bookings", headers=auth_headers(1))
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["user_id"] == 1


async def test_admin_sees_all_bookings(client):
    with _mock_court(), _mock_notify():
        await client.post("/bookings", json=_booking_payload(24), headers=auth_headers(1))
        await client.post("/bookings", json=_booking_payload(30), headers=auth_headers(2))

    resp = await client.get("/bookings", headers=auth_headers(99, "admin"))
    assert resp.status_code == 200
    assert len(resp.json()) == 2


async def test_court_bookings_excludes_cancelled(client):
    with _mock_court(), _mock_notify():
        booking = (await client.post("/bookings", json=_booking_payload(), headers=auth_headers())).json()

    await client.delete(f"/bookings/{booking['id']}", headers=auth_headers())

    resp = await client.get("/bookings/court/1")
    assert resp.status_code == 200
    assert len(resp.json()) == 0


async def test_court_bookings_includes_active(client):
    with _mock_court(), _mock_notify():
        await client.post("/bookings", json=_booking_payload(), headers=auth_headers())

    resp = await client.get("/bookings/court/1")
    assert resp.status_code == 200
    assert len(resp.json()) == 1
