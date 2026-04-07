"""
Smoke tests — run against a live API on localhost:8000.
Requires: API running, DB migrated, postgres reachable.

  cd api && PYTHONPATH=. pytest tests/smoke_test.py -v
"""
import uuid
import pytest
import httpx

BASE = "http://localhost:8000"
EMAIL = f"smoke-{uuid.uuid4().hex[:8]}@example.com"


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE, timeout=10) as c:
        yield c


# ── Healthcheck ───────────────────────────────────────────────────────────────

def test_healthz(client):
    r = client.get("/healthz")
    assert r.status_code == 200
    assert r.json()["ok"] is True


# ── Auth flow ─────────────────────────────────────────────────────────────────

def test_magic_link_returns_token(client):
    r = client.post("/v1/auth/magic-link", json={"email": EMAIL})
    assert r.status_code in (200, 201), r.text
    data = r.json()
    assert "token" in data, f"missing 'token' in {data}"
    assert isinstance(data["is_new_user"], bool)


def test_verify_returns_jwt(client):
    # Create a fresh token
    r = client.post("/v1/auth/magic-link", json={"email": EMAIL})
    token = r.json()["token"]

    r2 = client.post("/v1/auth/verify", json={"token": token})
    assert r2.status_code == 200, r2.text
    data = r2.json()
    assert "jwt" in data, f"missing 'jwt' in {data}"
    assert "workspace_id" in data
    assert "is_new_user" in data

    # Store for later fixtures via module-level dict (pytest doesn't allow fixture return)
    _state["jwt"] = data["jwt"]
    _state["workspace_id"] = data["workspace_id"]


def test_token_is_single_use(client):
    r = client.post("/v1/auth/magic-link", json={"email": EMAIL})
    token = r.json()["token"]
    # Use it once
    client.post("/v1/auth/verify", json={"token": token})
    # Second use must fail
    r2 = client.post("/v1/auth/verify", json={"token": token})
    assert r2.status_code in (400, 401, 422), f"expected error, got {r2.status_code}: {r2.text}"


# ── API key flow ──────────────────────────────────────────────────────────────

def test_create_api_key(client):
    jwt = _state.get("jwt")
    if not jwt:
        pytest.skip("jwt not available (auth test failed)")

    r = client.post(
        "/v1/api-keys",
        json={"name": "smoke-test-key"},
        headers={"Authorization": f"Bearer {jwt}"},
    )
    assert r.status_code in (200, 201), r.text
    data = r.json()
    assert "raw_key" in data, f"missing 'raw_key' in {data}"
    assert data["raw_key"].startswith("juno_")
    _state["api_key"] = data["raw_key"]


# ── Ingest ────────────────────────────────────────────────────────────────────

def test_ingest_conversation(client):
    api_key = _state.get("api_key")
    if not api_key:
        pytest.skip("api_key not available")

    ext_id = f"smoke-conv-{uuid.uuid4().hex[:8]}"
    r = client.post(
        "/v1/ingest",
        json={"conversations": [{
            "external_id": ext_id,
            "turns": [
                {"role": "user", "content": "How do I reset my password?"},
                {"role": "assistant", "content": "Click 'Forgot password' on the login page."},
            ],
        }]},
        headers={"Authorization": f"Bearer {api_key}"},
    )
    assert r.status_code in (200, 201), r.text
    data = r.json()
    assert "accepted" in data
    assert data["accepted"] >= 0
    _state["ext_id"] = ext_id


def test_ingest_rejects_invalid_key(client):
    r = client.post(
        "/v1/ingest",
        json={"conversations": []},
        headers={"Authorization": "Bearer juno_bad_key"},
    )
    assert r.status_code == 401, f"expected 401, got {r.status_code}"


# ── Dashboard ─────────────────────────────────────────────────────────────────

def test_dashboard_overview_shape(client):
    jwt = _state.get("jwt")
    if not jwt:
        pytest.skip("jwt not available")

    r = client.get("/v1/dashboard/overview", headers={"Authorization": f"Bearer {jwt}"})
    assert r.status_code in (200, 201), r.text
    data = r.json()
    required = {"total_conversations", "monthly_count", "gap_rate", "cluster_count", "plan"}
    missing = required - data.keys()
    assert not missing, f"overview missing fields: {missing}"
    assert isinstance(data["total_conversations"], int)
    assert isinstance(data["gap_rate"], (int, float))


def test_dashboard_conversations_shape(client):
    jwt = _state.get("jwt")
    if not jwt:
        pytest.skip("jwt not available")

    r = client.get("/v1/dashboard/conversations", headers={"Authorization": f"Bearer {jwt}"})
    assert r.status_code in (200, 201), r.text
    data = r.json()
    assert "conversations" in data, f"missing 'conversations' key in {data}"
    assert "total" in data, f"missing 'total' key in {data}"
    assert isinstance(data["conversations"], list)

    if data["conversations"]:
        conv = data["conversations"][0]
        for field in ("id", "external_id", "gap_flagged", "turn_count", "created_at"):
            assert field in conv, f"conversation missing field '{field}': {conv}"


def test_dashboard_clusters_shape(client):
    jwt = _state.get("jwt")
    if not jwt:
        pytest.skip("jwt not available")

    r = client.get("/v1/dashboard/clusters", headers={"Authorization": f"Bearer {jwt}"})
    assert r.status_code in (200, 201), r.text
    data = r.json()
    assert "clusters" in data, f"missing 'clusters' key in {data}"
    assert isinstance(data["clusters"], list)


def test_dashboard_requires_auth(client):
    r = client.get("/v1/dashboard/overview")
    assert r.status_code in (401, 403), f"expected auth error, got {r.status_code}"


# ── Shared state (module-scoped, populated by tests in order) ─────────────────
_state: dict = {}
