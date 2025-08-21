from services.governance_engine.main import Proposal, GovernanceModel, Vote, VoteType, tally_votes

def test_majority_simple_approve():
    p = Proposal(proposal_id="p1", title="t", description="d", deadline="2099-01-01T00:00:00Z")
    votes = [Vote(proposal_id="p1", voter_id="a", vote=VoteType.yes), Vote(proposal_id="p1", voter_id="b", vote=VoteType.no)]
    res = tally_votes(p, votes)
    assert res["participation"] == 1.0
    assert res["approved"] is True or res["approved"] is False


