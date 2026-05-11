from tests.conftest import auth_headers


# ── clubs: listing ────────────────────────────────────────────────────────────

async def test_list_clubs_empty_initially(client):
    resp = await client.get("/clubs")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_list_clubs_returns_active_only(client):
    c1 = (await client.post("/clubs", json={"name": "Active", "address": "A"}, headers=auth_headers())).json()
    c2 = (await client.post("/clubs", json={"name": "Deleted", "address": "B"}, headers=auth_headers())).json()
    await client.delete(f"/clubs/{c2['id']}", headers=auth_headers())

    resp = await client.get("/clubs")
    names = [c["name"] for c in resp.json()]
    assert "Active" in names
    assert "Deleted" not in names


# ── clubs: create ─────────────────────────────────────────────────────────────

async def test_create_club_as_staff(client):
    resp = await client.post("/clubs", json={
        "name": "Новий клуб",
        "address": "вул. Нова, 1",
        "phone": "+380991234567",
    }, headers=auth_headers("staff"))
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Новий клуб"
    assert data["is_active"] is True
    assert data["courts"] == []


async def test_create_club_as_admin(client):
    resp = await client.post("/clubs", json={"name": "Admin Club", "address": "A"}, headers=auth_headers("admin"))
    assert resp.status_code == 201


async def test_create_club_as_client_returns_403(client):
    resp = await client.post("/clubs", json={"name": "X", "address": "Y"}, headers=auth_headers("client"))
    assert resp.status_code == 403


async def test_create_club_without_auth_returns_401(client):
    resp = await client.post("/clubs", json={"name": "X", "address": "Y"})
    assert resp.status_code == 401


# ── clubs: get / update / deactivate ─────────────────────────────────────────

async def test_get_club_by_id(client, club):
    resp = await client.get(f"/clubs/{club['id']}")
    assert resp.status_code == 200
    assert resp.json()["id"] == club["id"]


async def test_get_nonexistent_club_returns_404(client):
    resp = await client.get("/clubs/9999")
    assert resp.status_code == 404


async def test_update_club(client, club):
    resp = await client.put(f"/clubs/{club['id']}", json={
        "name": "Оновлений клуб",
        "address": "вул. Оновлена, 5",
    }, headers=auth_headers())
    assert resp.status_code == 200
    assert resp.json()["name"] == "Оновлений клуб"


async def test_deactivate_club_hides_from_list(client, club):
    await client.delete(f"/clubs/{club['id']}", headers=auth_headers())
    resp = await client.get("/clubs")
    ids = [c["id"] for c in resp.json()]
    assert club["id"] not in ids


# ── courts: create ────────────────────────────────────────────────────────────

async def test_add_court_to_club(client, club):
    resp = await client.post(f"/clubs/{club['id']}/courts", json={
        "name": "Корт 1",
        "surface": "clay",
        "is_indoor": False,
        "price_per_hour": 250.0,
    }, headers=auth_headers())
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Корт 1"
    assert data["surface"] == "clay"
    assert data["club_id"] == club["id"]


async def test_add_court_returns_in_club_courts(client, club):
    await client.post(f"/clubs/{club['id']}/courts", json={
        "name": "Корт A",
        "surface": "hard",
        "price_per_hour": 300.0,
    }, headers=auth_headers())

    resp = await client.get(f"/clubs/{club['id']}/courts")
    assert resp.status_code == 200
    names = [c["name"] for c in resp.json()]
    assert "Корт A" in names


async def test_add_court_as_client_returns_403(client, club):
    resp = await client.post(f"/clubs/{club['id']}/courts", json={
        "name": "X", "surface": "clay", "price_per_hour": 100,
    }, headers=auth_headers("client"))
    assert resp.status_code == 403


# ── courts: update / deactivate ───────────────────────────────────────────────

async def test_update_court(client, club):
    court = (await client.post(f"/clubs/{club['id']}/courts", json={
        "name": "Old", "surface": "clay", "price_per_hour": 200,
    }, headers=auth_headers())).json()

    resp = await client.put(f"/clubs/{club['id']}/courts/{court['id']}", json={
        "name": "New", "surface": "grass", "price_per_hour": 350,
    }, headers=auth_headers())
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "New"
    assert data["price_per_hour"] == 350.0


async def test_deactivate_court_hides_from_list(client, club):
    court = (await client.post(f"/clubs/{club['id']}/courts", json={
        "name": "ToDelete", "surface": "hard", "price_per_hour": 200,
    }, headers=auth_headers())).json()

    await client.delete(f"/clubs/{club['id']}/courts/{court['id']}", headers=auth_headers())

    resp = await client.get(f"/clubs/{club['id']}/courts")
    names = [c["name"] for c in resp.json()]
    assert "ToDelete" not in names


# ── club detail includes courts ───────────────────────────────────────────────

async def test_club_detail_includes_courts(client, club):
    await client.post(f"/clubs/{club['id']}/courts", json={
        "name": "Корт X", "surface": "indoor", "is_indoor": True, "price_per_hour": 400,
    }, headers=auth_headers())

    resp = await client.get(f"/clubs/{club['id']}")
    courts = resp.json()["courts"]
    assert len(courts) == 1
    assert courts[0]["name"] == "Корт X"
