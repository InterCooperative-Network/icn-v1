import Fastify from 'fastify'
import { request } from 'undici'
import { z } from 'zod'

const fastify = Fastify({ logger: true })

const EconomicEventSchema = z.object({
  event_id: z.string().uuid(),
  event_type: z.string().min(1),
  aggregate_id: z.string().uuid(),
  timestamp: z.string().datetime(),
  participants: z.array(z.string()).min(1),
  amount_cents: z.number().int().nonnegative(),
  currency: z.string().min(3).max(3)
})

fastify.get('/health', async () => ({ ok: true }))

fastify.post('/economic/commands/append', async (req, reply) => {
  const parse = EconomicEventSchema.safeParse(await req.body)
  if (!parse.success) {
    return reply.code(400).send({ ok: false, error: 'validation_failed', issues: parse.error.issues })
  }
  const body = parse.data
  const res = await request('http://event-store:8081/events/append', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' }
  })
  const json = await res.body.json()
  return reply.send(json)
})

fastify.listen({ host: '0.0.0.0', port: 8080 })