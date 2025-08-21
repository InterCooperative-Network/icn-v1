from fastapi.testclient import TestClient
from src.main import app


client = TestClient(app)


def test_create_proposal_and_vote():
    # Create proposal
    resp = client.post(
        "/proposals",
        json={
            "title": "Test Proposal",
            "description": "PoC",
            "initiator_id": "member-1",
            "stakeholder_cooperatives": ["coop-a", "coop-b"],
        },
    )
    assert resp.status_code == 200
    proposal = resp.json()
    pid = proposal["id"]

    # Cast vote
    v = client.post(f"/proposals/{pid}/vote", json={"voter_id": "member-1", "vote_type": "approve"})
    assert v.status_code == 200

    # Results
    r = client.get(f"/proposals/{pid}/results")
    assert r.status_code == 200
    data = r.json()
    assert data["proposal_id"] == pid

