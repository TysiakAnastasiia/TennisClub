from tests.conftest import auth_headers


# ── profile: get / create on first access ────────────────────────────────────

async def test_get_my_profile_creates_if_missing(client):
    resp = await client.get("/users/me", headers=auth_headers(1))
    assert resp.status_code == 200
    data = resp.json()
    assert data["user_id"] == 1
    assert data["first_name"] is None


async def test_get_my_profile_twice_returns_same(client):
    r1 = (await client.get("/users/me", headers=auth_headers(1))).json()
    r2 = (await client.get("/users/me", headers=auth_headers(1))).json()
    assert r1["id"] == r2["id"]


async def test_get_profile_requires_auth(client):
    resp = await client.get("/users/me")
    assert resp.status_code == 401


# ── profile: update ───────────────────────────────────────────────────────────

async def test_update_profile_fields(client):
    await client.get("/users/me", headers=auth_headers(1))
    resp = await client.put("/users/me", json={
        "first_name": "Дарія",
        "last_name": "Тарадайка",
        "phone": "+380991234567",
    }, headers=auth_headers(1))
    assert resp.status_code == 200
    data = resp.json()
    assert data["first_name"] == "Дарія"
    assert data["last_name"] == "Тарадайка"
    assert data["phone"] == "+380991234567"


async def test_update_profile_partial(client):
    await client.get("/users/me", headers=auth_headers(1))
    await client.put("/users/me", json={"first_name": "Ім'я"}, headers=auth_headers(1))
    resp = await client.put("/users/me", json={"last_name": "Прізвище"}, headers=auth_headers(1))
    data = resp.json()
    assert data["first_name"] == "Ім'я"
    assert data["last_name"] == "Прізвище"


async def test_different_users_have_separate_profiles(client):
    await client.put("/users/me", json={"first_name": "User1"}, headers=auth_headers(1, email="a@t.com"))
    await client.put("/users/me", json={"first_name": "User2"}, headers=auth_headers(2, email="b@t.com"))

    p1 = (await client.get("/users/me", headers=auth_headers(1, email="a@t.com"))).json()
    p2 = (await client.get("/users/me", headers=auth_headers(2, email="b@t.com"))).json()

    assert p1["first_name"] == "User1"
    assert p2["first_name"] == "User2"
    assert p1["id"] != p2["id"]


# ── membership: join ──────────────────────────────────────────────────────────

async def test_join_club(client):
    resp = await client.post("/users/membership/1", json={"club_name": "Смарагдовий Корт"}, headers=auth_headers(1))
    assert resp.status_code == 201
    data = resp.json()
    assert data["club_id"] == 1
    assert data["club_name"] == "Смарагдовий Корт"
    assert data["user_id"] == 1


async def test_join_club_twice_returns_400(client):
    body = {"club_name": "Клуб"}
    await client.post("/users/membership/1", json=body, headers=auth_headers(1))
    resp = await client.post("/users/membership/1", json=body, headers=auth_headers(1))
    assert resp.status_code == 400


async def test_join_different_clubs(client):
    await client.post("/users/membership/1", json={"club_name": "Клуб 1"}, headers=auth_headers(1))
    await client.post("/users/membership/2", json={"club_name": "Клуб 2"}, headers=auth_headers(1))

    resp = await client.get("/users/membership", headers=auth_headers(1))
    assert resp.status_code == 200
    assert len(resp.json()) == 2


# ── membership: leave ─────────────────────────────────────────────────────────

async def test_leave_club(client):
    await client.post("/users/membership/1", json={"club_name": "Клуб"}, headers=auth_headers(1))
    resp = await client.delete("/users/membership/1", headers=auth_headers(1))
    assert resp.status_code == 204

    memberships = (await client.get("/users/membership", headers=auth_headers(1))).json()
    assert memberships == []


async def test_leave_club_not_member_returns_404(client):
    resp = await client.delete("/users/membership/99", headers=auth_headers(1))
    assert resp.status_code == 404


# ── membership: list ─────────────────────────────────────────────────────────

async def test_get_memberships_empty_initially(client):
    resp = await client.get("/users/membership", headers=auth_headers(1))
    assert resp.status_code == 200
    assert resp.json() == []


async def test_memberships_are_user_specific(client):
    await client.post("/users/membership/1", json={"club_name": "Клуб"}, headers=auth_headers(1, email="a@t.com"))

    resp = await client.get("/users/membership", headers=auth_headers(2, email="b@t.com"))
    assert resp.json() == []


# ── admin endpoints ───────────────────────────────────────────────────────────

async def test_list_profiles_requires_admin(client):
    resp = await client.get("/users", headers=auth_headers(1, "client"))
    assert resp.status_code == 403


async def test_list_profiles_as_admin(client):
    await client.get("/users/me", headers=auth_headers(1, email="a@t.com"))
    await client.get("/users/me", headers=auth_headers(2, email="b@t.com"))

    resp = await client.get("/users", headers=auth_headers(99, "admin"))
    assert resp.status_code == 200
    assert len(resp.json()) == 2
