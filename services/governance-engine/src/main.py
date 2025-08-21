from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from uuid import uuid4
from datetime import datetime, timedelta

app = FastAPI(title="ICN Governance Engine")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/ready")
def ready():
    return {"status": "ready"}


# In-memory PoC stores (reset on process restart)
PROPOSALS: Dict[str, Dict] = {}
VOTES: Dict[str, List[Dict]] = {}


class VotingRules(BaseModel):
    governance_model: str = Field(default="majority")
    quorum_threshold: float = Field(default=0.5, ge=0, le=1)
    approval_threshold: float = Field(default=0.5, ge=0, le=1)
    voting_period_hours: int = Field(default=72, ge=1)
    delegate_voting_allowed: bool = Field(default=True)


class ProposalRequest(BaseModel):
    title: str
    description: str
    proposal_type: str = Field(default="economic")
    initiator_id: str
    stakeholder_cooperatives: List[str]
    related_event_id: Optional[str] = None
    voting_rules: Optional[VotingRules] = None


class Proposal(BaseModel):
    id: str
    title: str
    description: str
    proposal_type: str
    initiator_id: str
    stakeholder_cooperatives: List[str]
    related_event_id: Optional[str]
    voting_rules: VotingRules
    status: str
    created_at: datetime
    voting_deadline: Optional[datetime]


class VoteRequest(BaseModel):
    voter_id: str
    vote_type: str  # approve, reject, abstain, delegate, object
    reasoning: Optional[str] = None
    delegate_to: Optional[str] = None
    vote_weight: float = 1.0


@app.post("/proposals", response_model=Proposal)
def create_proposal(req: ProposalRequest):
    proposal_id = str(uuid4())
    rules = req.voting_rules or VotingRules()
    voting_deadline = datetime.utcnow() + timedelta(hours=rules.voting_period_hours)
    proposal = Proposal(
        id=proposal_id,
        title=req.title,
        description=req.description,
        proposal_type=req.proposal_type,
        initiator_id=req.initiator_id,
        stakeholder_cooperatives=req.stakeholder_cooperatives,
        related_event_id=req.related_event_id,
        voting_rules=rules,
        status="voting",
        created_at=datetime.utcnow(),
        voting_deadline=voting_deadline,
    )
    PROPOSALS[proposal_id] = proposal.model_dump()
    VOTES[proposal_id] = []
    return proposal


@app.post("/proposals/{proposal_id}/vote")
def cast_vote(proposal_id: str, vote: VoteRequest):
    if proposal_id not in PROPOSALS:
        raise HTTPException(status_code=404, detail="Proposal not found")
    VOTES[proposal_id].append({
        "voter_id": vote.voter_id,
        "vote_type": vote.vote_type,
        "vote_weight": vote.vote_weight,
        "reasoning": vote.reasoning,
        "delegate_to": vote.delegate_to,
        "cast_at": datetime.utcnow().isoformat(),
    })
    return {"ok": True}


@app.get("/proposals/{proposal_id}/results")
def proposal_results(proposal_id: str):
    if proposal_id not in PROPOSALS:
        raise HTTPException(status_code=404, detail="Proposal not found")
    votes = VOTES.get(proposal_id, [])
    approve = sum(v.get("vote_weight", 1.0) for v in votes if v.get("vote_type") == "approve")
    reject = sum(v.get("vote_weight", 1.0) for v in votes if v.get("vote_type") == "reject")
    abstain = sum(v.get("vote_weight", 1.0) for v in votes if v.get("vote_type") == "abstain")
    total_cast = approve + reject + abstain
    rules = VotingRules(**PROPOSALS[proposal_id]["voting_rules"])  # type: ignore[arg-type]
    quorum_met = total_cast >= rules.quorum_threshold  # simplistic for PoC
    threshold_met = (approve / total_cast) >= rules.approval_threshold if total_cast > 0 else False
    result = "approved" if quorum_met and threshold_met else "pending"
    return {
        "proposal_id": proposal_id,
        "approve": approve,
        "reject": reject,
        "abstain": abstain,
        "total_votes_cast": total_cast,
        "quorum_met": quorum_met,
        "threshold_met": threshold_met,
        "result": result,
    }

# Duplicate app definition removed; health is already defined above.
