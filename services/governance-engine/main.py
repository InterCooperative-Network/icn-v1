from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from enum import Enum
from datetime import datetime
from typing import Dict, List

app = FastAPI(title="ICN Governance v1")

class GovernanceModel(str, Enum):
    majority = "majority"
    supermajority = "supermajority"

class Proposal(BaseModel):
    proposal_id: str
    title: str
    description: str
    deadline: datetime
    model: GovernanceModel = GovernanceModel.majority
    quorum: float = 0.5
    approval: float = 0.5

class VoteType(str, Enum):
    yes = "yes"
    no = "no"

class Vote(BaseModel):
    proposal_id: str
    voter_id: str
    vote: VoteType

proposals: Dict[str, Proposal] = {}
votes: Dict[str, List[Vote]] = {}

def tally_votes(p: Proposal, votes_for_p: List[Vote]) -> Dict[str, float | bool]:
    total = max(len(votes_for_p), 1)
    yes = len([v for v in votes_for_p if v.vote == VoteType.yes])
    participation = len(votes_for_p) / total
    approved = False
    if participation >= p.quorum:
        ratio = yes / len(votes_for_p) if votes_for_p else 0.0
        need = p.approval if p.model == GovernanceModel.majority else max(0.66, p.approval)
        approved = ratio >= need
    return {"participation": participation, "approved": approved}

@app.post("/proposals")
async def create_proposal(p: Proposal):
    proposals[p.proposal_id] = p
    return {"ok": True, "proposal_id": p.proposal_id, "closes_in": (p.deadline - datetime.utcnow()).total_seconds()}

@app.post("/votes")
async def cast_vote(v: Vote):
    if v.proposal_id not in proposals:
        raise HTTPException(status_code=404, detail="proposal_not_found")
    votes.setdefault(v.proposal_id, []).append(v)
    return {"ok": True}

@app.get("/proposals/{proposal_id}/results")
async def get_results(proposal_id: str):
    if proposal_id not in proposals:
        raise HTTPException(status_code=404, detail="proposal_not_found")
    p = proposals[proposal_id]
    res = tally_votes(p, votes.get(proposal_id, []))
    return {"ok": True, **res}

