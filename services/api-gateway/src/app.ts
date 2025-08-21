import Fastify from 'fastify'
import { randomUUID } from 'crypto'

export function buildApp() {
  const fastify = Fastify({ logger: true })

  const GOVERNANCE_URL = process.env.GOVERNANCE_URL || process.env.GOVERNANCE_ENGINE_URL || 'http://governance-engine:8000'
  const EVENT_STORE_URL = process.env.EVENT_STORE_URL || 'http://event-store:8081'

  fastify.get('/api/health', async () => ({ status: 'ok' }))

  fastify.post('/api/v1/proposals', async (request, reply) => {
    const res = await fetch(`${GOVERNANCE_URL}/proposals`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request.body)
    })
    const data = await res.json()
    reply.code(201).send(data)
  })

  fastify.post<{ Params: { id: string } }>('/api/v1/proposals/:id/vote', async (request, reply) => {
    const { id } = request.params
    const res = await fetch(`${GOVERNANCE_URL}/proposals/${id}/vote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request.body)
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

  return fastify
}


