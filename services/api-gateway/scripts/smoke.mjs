// Simple E2E smoke for the API Gateway
// Requires gateway at http://localhost:3000 and local services

const GATEWAY = process.env.GATEWAY_URL || 'http://localhost:3000'

async function waitFor(url, timeoutMs = 60000, intervalMs = 1000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) return true
    } catch {}
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error(`Timeout waiting for ${url}`)
}

async function main() {
  await waitFor(`${GATEWAY}/api/health`)

  // Create proposal
  const createRes = await fetch(`${GATEWAY}/api/v1/proposals`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'Smoke Test', description: 'Gateway smoke' })
  })
  if (!createRes.ok) throw new Error(`Create proposal failed: ${createRes.status}`)
  const created = await createRes.json()
  const proposalId = created.proposal_id || created.id
  if (!proposalId) throw new Error('No proposal id returned')
  console.log(JSON.stringify({ step: 'create', proposalId, created }, null, 2))

  // Vote yes (gateway normalizes yes->approve)
  const voteRes = await fetch(`${GATEWAY}/api/v1/proposals/${proposalId}/vote`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ voter_id: 'smoke', vote_type: 'yes' })
  })
  if (!voteRes.ok) throw new Error(`Vote failed: ${voteRes.status}`)
  const vote = await voteRes.json()
  console.log(JSON.stringify({ step: 'vote', vote }, null, 2))

  // Fetch results
  const resultsRes = await fetch(`${GATEWAY}/api/v1/proposals/${proposalId}/results`)
  if (!resultsRes.ok) throw new Error(`Results failed: ${resultsRes.status}`)
  const results = await resultsRes.json()
  console.log(JSON.stringify({ step: 'results', results }, null, 2))
}

main().catch((err) => {
  console.error('SMOKE FAILED:', err.message)
  process.exit(1)
})


