from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_delete_expense() -> None:
    group_resp = client.post("/api/v1/groups", json={"name": "Delete Expense Test"})
    assert group_resp.status_code == 201
    group_id = group_resp.json()["id"]

    member_resp = client.post(
        f"/api/v1/groups/{group_id}/members",
        json={"display_name": "Alex"},
    )
    assert member_resp.status_code == 201
    member_id = member_resp.json()["id"]

    expense_resp = client.post(
        f"/api/v1/groups/{group_id}/expenses",
        json={
            "paid_by_member_id": member_id,
            "title": "Coffee",
            "amount": 20,
            "currency": "USD",
            "occurred_at": datetime.now(timezone.utc).isoformat(),
            "participants": [
                {"member_id": member_id, "split_type": "equal", "split_value": 1},
            ],
            "adjustments": [],
        },
    )
    assert expense_resp.status_code == 201
    expense_id = expense_resp.json()["id"]

    delete_resp = client.delete(f"/api/v1/groups/{group_id}/expenses/{expense_id}")
    assert delete_resp.status_code == 204

    list_resp = client.get(f"/api/v1/groups/{group_id}/expenses")
    assert list_resp.status_code == 200
    assert list_resp.json() == []
