import React from 'react'
import { createRoot } from 'react-dom/client'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function App() {
  const [health, setHealth] = React.useState<any>(null)
  const [resources, setResources] = React.useState<any[]>([])
  const [proposalId, setProposalId] = React.useState<string>('')
  const [result, setResult] = React.useState<any>(null)

  async function loadHealth() {
    const res = await fetch(`${API}/api/health`)
    setHealth(await res.json())
  }

  async function listResources() {
    const res = await fetch(`${API}/api/resources`)
    const data = await res.json()
    setResources(data.resources || [])
  }

  async function addResource() {
    const res = await fetch(`${API}/api/resources`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Shared Projector', resourceType: 'equipment', ownerCooperativeId: 'alpha' })
    })
    await res.json()
    listResources()
  }

  async function createProposal() {
    const res = await fetch(`${API}/api/proposals`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Approve Exchange', description: 'Test', initiator_id: 'member-1', stakeholder_cooperatives: ['alpha','beta'] })
    })
    const data = await res.json()
    setProposalId(data.id)
  }

  async function voteApprove() {
    if (!proposalId) return
    await fetch(`${API}/api/proposals/${proposalId}/vote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ voter_id: 'member-1', vote_type: 'approve' })
    })
    const r = await fetch(`${API}/api/proposals/${proposalId}/results`)
    setResult(await r.json())
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 16 }}>
      <h1>ICN Frontend</h1>
      <button onClick={loadHealth}>Check Health</button>
      <pre>{health && JSON.stringify(health, null, 2)}</pre>

      <h2>Resources</h2>
      <button onClick={listResources}>List</button>
      <button onClick={addResource}>Add</button>
      <pre>{resources && JSON.stringify(resources, null, 2)}</pre>

      <h2>Governance</h2>
      <button onClick={createProposal}>Create Proposal</button>
      <div>Proposal ID: {proposalId}</div>
      <button onClick={voteApprove} disabled={!proposalId}>Vote Approve</button>
      <pre>{result && JSON.stringify(result, null, 2)}</pre>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<App />)


