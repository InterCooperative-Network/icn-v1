from fastapi import FastAPI
from pydantic import BaseModel
from enum import Enum
from datetime import datetime

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

@app.post("/proposals")
async def create_proposal(p: Proposal):
    return {"ok": True, "proposal_id": p.proposal_id, "closes_in": (p.deadline - datetime.utcnow()).total_seconds()}

