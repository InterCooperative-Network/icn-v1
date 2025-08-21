import Fastify from 'fastify';
import { registerAuth } from './middleware/auth';
import { registerJwt } from './middleware/jwt';

const server = Fastify({ logger: true });
// JWT first (if enabled), else dev auth stub
registerJwt(server);
registerAuth(server);

// Downstream service URLs (can be overridden by environment)
const GOVERNANCE_URL = process.env.GOVERNANCE_ENGINE_URL || 'http://localhost:8000';
const DISCOVERY_URL = process.env.RESOURCE_DISCOVERY_URL || 'http://localhost:3002';
const IDENTITY_URL = process.env.IDENTITY_SERVICE_URL || 'http://localhost:3001';

async function getJson(url: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, { signal: controller.signal as any });
    clearTimeout(timeout);
    if (!res.ok) {
      return { ok: false, status: res.status };
    }
    const data = await res.json().catch(() => ({}));
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

server.get('/health', async () => ({ status: 'ok' }));
server.get('/ready', async () => ({ status: 'ready' }));

// Basic health fan-out for downstream services
server.get('/api/health', async () => {
  const [governance, discovery, identity] = await Promise.all([
    getJson(`${GOVERNANCE_URL}/health`),
    getJson(`${DISCOVERY_URL}/health`),
    getJson(`${IDENTITY_URL}/health`),
  ]);

  return {
    status: 'ok',
    services: {
      governance,
      discovery,
      identity,
    },
  };
});

// Pass-through health checks for convenience
server.get('/api/governance/health', async () => getJson(`${GOVERNANCE_URL}/health`));
server.get('/api/discovery/health', async () => getJson(`${DISCOVERY_URL}/health`));
server.get('/api/identity/health', async () => getJson(`${IDENTITY_URL}/health`));

// Basic pass-through routes for PoC
server.post('/api/proposals', async (request, reply) => {
  const res = await fetch(`${GOVERNANCE_URL}/proposals`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request.body ?? {}),
  });
  reply.code(res.status).send(await res.json().catch(() => ({})));
});

server.post('/api/proposals/:id/vote', async (request, reply) => {
  const { id } = request.params as any;
  const res = await fetch(`${GOVERNANCE_URL}/proposals/${id}/vote`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request.body ?? {}),
  });
  reply.code(res.status).send(await res.json().catch(() => ({})));
});

server.get('/api/proposals/:id/results', async (request, reply) => {
  const { id } = request.params as any;
  const res = await fetch(`${GOVERNANCE_URL}/proposals/${id}/results`);
  reply.code(res.status).send(await res.json().catch(() => ({})));
});

server.post('/api/resources', async (request, reply) => {
  const res = await fetch(`${DISCOVERY_URL}/resources`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request.body ?? {}),
  });
  reply.code(res.status).send(await res.json().catch(() => ({})));
});

server.get('/api/resources', async (_request, reply) => {
  const res = await fetch(`${DISCOVERY_URL}/resources`);
  reply.code(res.status).send(await res.json().catch(() => ({})));
});

const port = Number(process.env.PORT || 3000);

server
  .listen({ port, host: '0.0.0.0' })
  .then(() => {
    server.log.info(`API Gateway listening on ${port}`);
    server.log.info(`Downstreams: governance=${GOVERNANCE_URL}, discovery=${DISCOVERY_URL}, identity=${IDENTITY_URL}`);
  })
  .catch((err) => {
    server.log.error(err);
    process.exit(1);
  });

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