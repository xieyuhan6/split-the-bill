from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_group_settlement_equal_split() -> None:
    group_resp = client.post(
        "/api/v1/groups",
        json={"name": "Settlement Test Group", "base_currency": "USD"},
    )
    assert group_resp.status_code == 201
    group_id = group_resp.json()["id"]

    alice_resp = client.post(
        f"/api/v1/groups/{group_id}/members",
        json={"display_name": "Alice"},
    )
    bob_resp = client.post(
        f"/api/v1/groups/{group_id}/members",
        json={"display_name": "Bob"},
    )
    assert alice_resp.status_code == 201
    assert bob_resp.status_code == 201

    alice_id = alice_resp.json()["id"]
    bob_id = bob_resp.json()["id"]

    expense_resp = client.post(
        f"/api/v1/groups/{group_id}/expenses",
        json={
            "paid_by_member_id": alice_id,
            "title": "Lunch",
            "amount": 100,
            "currency": "USD",
            "occurred_at": datetime.now(timezone.utc).isoformat(),
            "participants": [
                {"member_id": alice_id, "split_type": "equal", "split_value": 1},
                {"member_id": bob_id, "split_type": "equal", "split_value": 1},
            ],
            "adjustments": [],
        },
    )
    assert expense_resp.status_code == 201

    settlement_resp = client.get(f"/api/v1/groups/{group_id}/settlement")
    assert settlement_resp.status_code == 200

    data = settlement_resp.json()
    assert data["base_currency"] == "USD"
    assert len(data["members"]) == 2
    assert len(data["transfers"]) == 1

    transfer = data["transfers"][0]
    assert transfer["from_member_id"] == bob_id
    assert transfer["to_member_id"] == alice_id
    assert transfer["amount"] == "50.00"
    assert transfer["currency"] == "USD"
