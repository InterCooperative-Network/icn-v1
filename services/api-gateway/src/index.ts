import Fastify from 'fastify'
import { sdk } from './otel'
import { request } from 'undici'
import { z } from 'zod'

await sdk.start()
const fastify = Fastify({ logger: true })

const EconomicEventSchema = z.object({
  event_id: z.string().uuid(),
  event_type: z.string().min(1),
  aggregate_id: z.string().uuid(),
  timestamp: z.string().datetime(),
  participants: z.array(z.string()).min(1),
  amount_cents: z.number().int().nonnegative(),
  currency: z.string().min(3).max(3).transform((v) => v.toUpperCase()).refine((v) => /^[A-Z]{3}$/.test(v), 'currency must be 3 uppercase letters')
})

function generateId(): string {
  // Prefer crypto.randomUUID if available; otherwise simple fallback
  const c: any = (globalThis as any).crypto
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

fastify.get('/health', async () => ({ ok: true }))

fastify.post('/economic/commands/append', async (req, reply) => {
  const parse = EconomicEventSchema.safeParse(await req.body)
  if (!parse.success) {
    return reply.code(400).send({ ok: false, error: 'validation_failed', issues: parse.error.issues })
  }
  const body = parse.data
  const isIntercoop = new Set(body.participants).size > 1
  const governanceApproved = String((req.headers['x-governance-approved'] ?? '')).toLowerCase() === 'true'

  if (isIntercoop && !governanceApproved) {
    // Create a governance proposal (stub) and inform client to approve
    const proposal_id = generateId()
    try {
      const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      await request('http://governance-engine:8000/proposals', {
        method: 'POST',
        body: JSON.stringify({
          proposal_id,
          title: `Approve inter-coop event ${body.event_type}`,
          description: `Aggreg: ${body.aggregate_id}; participants: ${body.participants.join(',')}`,
          deadline,
          model: 'majority',
          quorum: 0.5,
          approval: 0.5
        }),
        headers: { 'content-type': 'application/json' }
      })
    } catch (e) {
      req.log.warn({ err: e }, 'failed to create governance proposal')
    }
    return reply.code(202).send({ ok: false, governance_required: true, proposal_id })
  }
  const res = await request('http://event-store:8081/events/append', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' }
  })
  const json = await res.body.json()
  return reply.send(json)
})

fastify.listen({ host: '0.0.0.0', port: 8080 })