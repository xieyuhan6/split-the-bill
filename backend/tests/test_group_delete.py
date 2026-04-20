from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_delete_group_with_related_data() -> None:
    group_resp = client.post("/api/v1/groups", json={"name": "Delete Group Test"})
    assert group_resp.status_code == 201
    group_id = group_resp.json()["id"]

    member_resp = client.post(
        f"/api/v1/groups/{group_id}/members",
        json={"display_name": "Traveler"},
    )
    assert member_resp.status_code == 201
    member_id = member_resp.json()["id"]

    expense_resp = client.post(
        f"/api/v1/groups/{group_id}/expenses",
        json={
            "paid_by_member_id": member_id,
            "title": "Meal",
            "amount": 50,
            "currency": "USD",
            "occurred_at": datetime.now(timezone.utc).isoformat(),
            "participants": [
                {"member_id": member_id, "split_type": "equal", "split_value": 1},
            ],
            "adjustments": [],
        },
    )
    assert expense_resp.status_code == 201

    delete_resp = client.delete(f"/api/v1/groups/{group_id}")
    assert delete_resp.status_code == 204

    get_resp = client.get(f"/api/v1/groups/{group_id}")
    assert get_resp.status_code == 404
