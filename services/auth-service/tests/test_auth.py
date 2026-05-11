from unittest.mock import AsyncMock, patch
from app.services.auth_service import auth_facade


# ── helpers ──────────────────────────────────────────────────────────────────

async def _register(client, email="user@test.com", password="pass123"):
    """Register a user with notification silenced; return response."""
    with patch.object(auth_facade, "_send_confirmation", new_callable=AsyncMock):
        return await client.post("/auth/register", json={"email": email, "password": password})


async def _activate(client, user_id: int):
    return await client.post(f"/auth/activate/{user_id}")


async def _register_and_activate(client, email="user@test.com", password="pass123"):
    resp = await _register(client, email, password)
    await _activate(client, resp.json()["id"])
    return resp.json()


# ── registration ─────────────────────────────────────────────────────────────

async def test_register_creates_inactive_client(client):
    resp = await _register(client)
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "user@test.com"
    assert data["role"] == "client"
    assert data["is_active"] is False


async def test_register_duplicate_email_returns_400(client):
    await _register(client, "dup@test.com")
    resp = await _register(client, "dup@test.com")
    assert resp.status_code == 400


async def test_register_sends_confirmation_email(client):
    with patch.object(auth_facade, "_send_confirmation", new_callable=AsyncMock) as mock_send:
        await client.post("/auth/register", json={"email": "send@test.com", "password": "pass"})
    mock_send.assert_called_once()


# ── login ─────────────────────────────────────────────────────────────────────

async def test_login_inactive_returns_401(client):
    await _register(client, "inactive@test.com")
    resp = await client.post("/auth/login", json={"email": "inactive@test.com", "password": "pass123"})
    assert resp.status_code == 401


async def test_login_wrong_password_returns_401(client):
    user = await _register_and_activate(client, "usr@test.com", "correct")
    resp = await client.post("/auth/login", json={"email": "usr@test.com", "password": "wrong"})
    assert resp.status_code == 401


async def test_login_success_returns_jwt(client):
    await _register_and_activate(client, "act@test.com", "pass123")
    resp = await client.post("/auth/login", json={"email": "act@test.com", "password": "pass123"})
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"
    assert body["role"] == "client"


async def test_login_nonexistent_user_returns_401(client):
    resp = await client.post("/auth/login", json={"email": "nobody@test.com", "password": "x"})
    assert resp.status_code == 401


# ── activation / deactivation ─────────────────────────────────────────────────

async def test_activate_user(client):
    resp = await _register(client, "toact@test.com")
    user_id = resp.json()["id"]
    await _activate(client, user_id)
    login = await client.post("/auth/login", json={"email": "toact@test.com", "password": "pass123"})
    assert login.status_code == 200


async def test_deactivate_blocks_login(client):
    user = await _register_and_activate(client, "deact@test.com")
    await client.post(f"/auth/deactivate/{user['id']}")
    resp = await client.post("/auth/login", json={"email": "deact@test.com", "password": "pass123"})
    assert resp.status_code == 401


# ── cancel registration ───────────────────────────────────────────────────────

async def test_cancel_registration_removes_user(client):
    captured = {}

    async def capture(user):
        captured["token"] = user.cancel_token

    with patch.object(auth_facade, "_send_confirmation", side_effect=capture):
        await client.post("/auth/register", json={"email": "cancel@test.com", "password": "p"})

    resp = await client.get(f"/auth/cancel/{captured['token']}")
    assert resp.status_code == 200

    users = (await client.get("/auth/users")).json()
    assert not any(u["email"] == "cancel@test.com" for u in users)


async def test_cancel_invalid_token_returns_404(client):
    resp = await client.get("/auth/cancel/definitely-invalid-token")
    assert resp.status_code == 404


# ── role management ───────────────────────────────────────────────────────────

async def test_update_role_to_staff(client):
    user = (await _register(client, "role@test.com")).json()
    await client.patch(f"/auth/users/{user['id']}/role", json={"role": "staff"})
    users = (await client.get("/auth/users")).json()
    updated = next(u for u in users if u["id"] == user["id"])
    assert updated["role"] == "staff"


async def test_list_users_returns_all_registered(client):
    await _register(client, "a@test.com")
    await _register(client, "b@test.com")
    resp = await client.get("/auth/users")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


async def test_list_users_empty_initially(client):
    resp = await client.get("/auth/users")
    assert resp.status_code == 200
    assert resp.json() == []
