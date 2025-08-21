import Fastify from 'fastify'
import { request } from 'undici'

const fastify = Fastify({ logger: true })

fastify.post('/economic/commands/append', async (req, reply) => {
  const body: any = await req.body
  const res = await request('http://event-store:8081/events/append', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' }
  })
  const json = await res.body.json()
  return reply.send(json)
})

fastify.listen({ host: '0.0.0.0', port: 8080 })