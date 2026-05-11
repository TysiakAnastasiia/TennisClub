from datetime import datetime, timedelta, timezone
from tests.conftest import auth_headers


def _dt(offset_days: int = 7) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=offset_days)).isoformat()


def _event_payload(**overrides) -> dict:
    base = {
        "title": "Тестовий турнір",
        "event_type": "tournament",
        "club_id": 1,
        "start_time": _dt(7),
        "end_time": _dt(8),
        "max_participants": 4,
        "price": 100.0,
    }
    base.update(overrides)
    return base


# ── listing ───────────────────────────────────────────────────────────────────

async def test_list_events_empty_initially(client):
    resp = await client.get("/events")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_list_events_returns_active_only(client):
    await client.post("/events", json=_event_payload(title="Active"), headers=auth_headers(1, "staff"))
    deact = (await client.post("/events", json=_event_payload(title="ToDeact"), headers=auth_headers(1, "staff"))).json()
    await client.delete(f"/events/{deact['id']}", headers=auth_headers(1, "staff"))

    resp = await client.get("/events")
    titles = [e["title"] for e in resp.json()]
    assert "Active" in titles
    assert "ToDeact" not in titles


# ── create event ──────────────────────────────────────────────────────────────

async def test_create_event_as_staff(client):
    resp = await client.post("/events", json=_event_payload(), headers=auth_headers(1, "staff"))
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Тестовий турнір"
    assert data["is_active"] is True
    assert data["participant_count"] == 0


async def test_create_event_as_admin(client):
    resp = await client.post("/events", json=_event_payload(), headers=auth_headers(1, "admin"))
    assert resp.status_code == 201


async def test_create_event_as_client_returns_403(client):
    resp = await client.post("/events", json=_event_payload(), headers=auth_headers(1, "client"))
    assert resp.status_code == 403


async def test_create_event_in_past_returns_400(client):
    payload = _event_payload()
    payload["start_time"] = _dt(-2)
    payload["end_time"] = _dt(-1)
    resp = await client.post("/events", json=payload, headers=auth_headers(1, "staff"))
    assert resp.status_code == 400


async def test_create_event_end_before_start_returns_400(client):
    payload = _event_payload()
    payload["start_time"] = _dt(8)
    payload["end_time"] = _dt(7)
    resp = await client.post("/events", json=payload, headers=auth_headers(1, "staff"))
    assert resp.status_code == 400


# ── get single event ──────────────────────────────────────────────────────────

async def test_get_event_by_id(client):
    event = (await client.post("/events", json=_event_payload(), headers=auth_headers(1, "staff"))).json()
    resp = await client.get(f"/events/{event['id']}")
    assert resp.status_code == 200
    assert resp.json()["id"] == event["id"]


async def test_get_nonexistent_event_returns_404(client):
    resp = await client.get("/events/9999")
    assert resp.status_code == 404


# ── registration ──────────────────────────────────────────────────────────────

async def test_register_for_event(client):
    event = (await client.post("/events", json=_event_payload(), headers=auth_headers(1, "staff"))).json()
    resp = await client.post(f"/events/{event['id']}/register", headers=auth_headers(2, "client", "c@test.com"))
    assert resp.status_code == 201
    data = resp.json()
    assert data["event_id"] == event["id"]
    assert data["user_id"] == 2


async def test_register_twice_returns_400(client):
    event = (await client.post("/events", json=_event_payload(), headers=auth_headers(1, "staff"))).json()
    headers = auth_headers(2, "client", "c@test.com")
    await client.post(f"/events/{event['id']}/register", headers=headers)
    resp = await client.post(f"/events/{event['id']}/register", headers=headers)
    assert resp.status_code == 400


async def test_register_updates_participant_count(client):
    event = (await client.post("/events", json=_event_payload(), headers=auth_headers(1, "staff"))).json()
    await client.post(f"/events/{event['id']}/register", headers=auth_headers(2, "client", "a@t.com"))
    await client.post(f"/events/{event['id']}/register", headers=auth_headers(3, "client", "b@t.com"))

    resp = await client.get(f"/events/{event['id']}")
    assert resp.json()["participant_count"] == 2


async def test_register_full_event_returns_400(client):
    event = (await client.post("/events", json=_event_payload(max_participants=1), headers=auth_headers(1, "staff"))).json()
    await client.post(f"/events/{event['id']}/register", headers=auth_headers(2, "client", "a@t.com"))
    resp = await client.post(f"/events/{event['id']}/register", headers=auth_headers(3, "client", "b@t.com"))
    assert resp.status_code == 400
    assert "full" in resp.json()["detail"].lower()


# ── unregistration ────────────────────────────────────────────────────────────

async def test_unregister_from_event(client):
    event = (await client.post("/events", json=_event_payload(), headers=auth_headers(1, "staff"))).json()
    h = auth_headers(2, "client", "c@test.com")
    await client.post(f"/events/{event['id']}/register", headers=h)
    resp = await client.delete(f"/events/{event['id']}/register", headers=h)
    assert resp.status_code == 204


async def test_unregister_not_registered_returns_404(client):
    event = (await client.post("/events", json=_event_payload(), headers=auth_headers(1, "staff"))).json()
    resp = await client.delete(f"/events/{event['id']}/register", headers=auth_headers(2))
    assert resp.status_code == 404


# ── my registrations ──────────────────────────────────────────────────────────

async def test_my_registrations_returns_own_only(client):
    e1 = (await client.post("/events", json=_event_payload(title="E1"), headers=auth_headers(1, "staff"))).json()
    e2 = (await client.post("/events", json=_event_payload(title="E2"), headers=auth_headers(1, "staff"))).json()

    await client.post(f"/events/{e1['id']}/register", headers=auth_headers(2, "client", "a@t.com"))
    await client.post(f"/events/{e2['id']}/register", headers=auth_headers(2, "client", "a@t.com"))
    await client.post(f"/events/{e1['id']}/register", headers=auth_headers(3, "client", "b@t.com"))

    resp = await client.get("/events/my-registrations", headers=auth_headers(2, "client", "a@t.com"))
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    assert all(r["user_id"] == 2 for r in data)


# ── participants (staff only) ─────────────────────────────────────────────────

async def test_participants_visible_to_staff(client):
    event = (await client.post("/events", json=_event_payload(), headers=auth_headers(1, "staff"))).json()
    await client.post(f"/events/{event['id']}/register", headers=auth_headers(2, "client", "x@t.com"))

    resp = await client.get(f"/events/{event['id']}/participants", headers=auth_headers(1, "staff"))
    assert resp.status_code == 200
    assert len(resp.json()) == 1


async def test_participants_hidden_from_client(client):
    event = (await client.post("/events", json=_event_payload(), headers=auth_headers(1, "staff"))).json()
    resp = await client.get(f"/events/{event['id']}/participants", headers=auth_headers(2, "client"))
    assert resp.status_code == 403
