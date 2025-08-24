import Fastify from 'fastify'
import { randomUUID } from 'crypto'

export function buildApp() {
  const fastify = Fastify({ logger: true })

  const GOVERNANCE_URL = process.env.GOVERNANCE_URL || process.env.GOVERNANCE_ENGINE_URL || 'http://governance-engine:8000'
  const EVENT_STORE_URL = process.env.EVENT_STORE_URL || 'http://event-store:8081'
  const RESOURCE_DISCOVERY_URL = process.env.RESOURCE_DISCOVERY_URL || 'http://resource-discovery:3002'
  const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL || 'http://identity-federation:3001'

  fastify.get('/api/health', async () => {
    const targets = [
      { name: 'governance', url: `${GOVERNANCE_URL}/health` },
      { name: 'identity', url: `${IDENTITY_SERVICE_URL}/health` },
      { name: 'discovery', url: `${RESOURCE_DISCOVERY_URL}/health` }
    ]
    const results: Record<string, string> = {}
    await Promise.all(
      targets.map(async (t) => {
        try {
          const res = await fetch(t.url)
          results[t.name] = res.ok ? 'ok' : 'degraded'
        } catch {
          results[t.name] = 'down'
        }
      })
    )
    return { status: 'ok', services: results }
  })

  fastify.get('/api/governance/health', async () => {
    try {
      const res = await fetch(`${GOVERNANCE_URL}/health`)
      return { status: res.ok ? 'ok' : 'degraded' }
    } catch {
      return { status: 'down' }
    }
  })

  fastify.get('/api/identity/health', async () => {
    try {
      const res = await fetch(`${IDENTITY_SERVICE_URL}/health`)
      return { status: res.ok ? 'ok' : 'degraded' }
    } catch {
      return { status: 'down' }
    }
  })

  fastify.get('/api/discovery/health', async () => {
    try {
      const res = await fetch(`${RESOURCE_DISCOVERY_URL}/health`)
      return { status: res.ok ? 'ok' : 'degraded' }
    } catch {
      return { status: 'down' }
    }
  })

  fastify.post('/api/v1/proposals', async (request, reply) => {
    const body: any = request.body || {}
    const proposalId = body.proposal_id || randomUUID()
    const defaultDeadlineMs = 7 * 24 * 60 * 60 * 1000
    const deadline = body.deadline || new Date(Date.now() + defaultDeadlineMs).toISOString()
    const payload = {
      proposal_id: proposalId,
      title: body.title,
      description: body.description,
      deadline,
      model: 'majority',
      quorum: 0.5,
      approval: 0.5,
      initiator_id: body.initiator_id || 'system',
      stakeholder_cooperatives: body.stakeholder_cooperatives || []
    }
    const res = await fetch(`${GOVERNANCE_URL}/proposals`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    reply.code(201).send(data)
  })

  fastify.post<{ Params: { id: string } }>('/api/v1/proposals/:id/vote', async (request, reply) => {
    const { id } = request.params
    const body: any = request.body || {}
    const payload = {
      proposal_id: id,
      voter_id: body.voter_id,
      vote: body.vote ?? body.vote_type,
      vote_weight: body.vote_weight,
      reasoning: body.reasoning,
      delegate_to: body.delegate_to
    }
    const res = await fetch(`${GOVERNANCE_URL}/votes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    reply.send(data)
  })

  fastify.get<{ Params: { id: string } }>('/api/v1/proposals/:id/results', async (request, reply) => {
    const { id } = request.params
    const res = await fetch(`${GOVERNANCE_URL}/proposals/${id}/results`)
    const data = await res.json()
    reply.send(data)
  })

  fastify.post('/api/v1/events', async (request, reply) => {
    const body: any = request.body || {}
    const payload = {
      event_id: body.event_id || randomUUID(),
      event_type: body.event_type,
      aggregate_id: body.aggregate_id || randomUUID(),
      timestamp: new Date().toISOString(),
      participants: body.participants || [],
      amount_cents: body.amount_cents ?? body?.event_data?.amount_cents ?? 0,
      currency: body.currency ?? body?.event_data?.currency ?? 'USD'
    }
    const res = await fetch(`${EVENT_STORE_URL}/events/append`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'Idempotency-Key': (request.headers['idempotency-key'] as string) || '' },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    reply.code(201).send({ id: data.event_id, ...data })
  })

  fastify.post('/api/v1/cooperatives', async (request, reply) => {
    reply.code(201).send({ id: 'coop-' + Date.now(), ...(request.body as any) })
  })

  fastify.get<{ Params: { id: string } }>('/api/v1/cooperatives/:id', async (request) => {
    return { id: request.params.id, legal_name: 'Example Coop', domain: 'example.coop', created_at: new Date().toISOString() }
  })

  fastify.post('/api/v1/members', async (request, reply) => {
    reply.code(201).send({ id: 'mem-' + Date.now(), created_at: new Date().toISOString(), ...(request.body as any) })
  })

  fastify.post('/api/v1/resources', async (request, reply) => {
    reply.code(201).send({ id: 'res-' + Date.now(), ...(request.body as any) })
  })

  fastify.get('/api/v1/resources/search', async () => {
    return { resources: [], total_count: 0 }
  })

  fastify.post<{ Params: { id: string } }>('/api/v1/resources/:id/request', async (request, reply) => {
    reply.code(202).send({ ok: true, resource_id: request.params.id })
  })

  // v1 and non-versioned resource discovery proxies
  fastify.get('/api/resources', async (_request, reply) => {
    const res = await fetch(`${RESOURCE_DISCOVERY_URL}/resources`)
    const data = await res.json()
    reply.send(data)
  })

  fastify.post('/api/resources', async (request, reply) => {
    const res = await fetch(`${RESOURCE_DISCOVERY_URL}/resources`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request.body)
    })
    const data = await res.json()
    reply.code(201).send(data)
  })

  return fastify
}


