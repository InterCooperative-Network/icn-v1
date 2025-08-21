import Fastify from 'fastify';
import { randomUUID } from 'crypto';

const app = Fastify({ logger: true });

app.get('/health', async () => ({ status: 'ok' }));
app.get('/ready', async () => ({ status: 'ready' }));

// In-memory resource registry (PoC)
type Resource = {
  id: string;
  name: string;
  resourceType: string;
  ownerCooperativeId: string;
  description?: string;
};
const resources: Record<string, Resource> = {};

app.post('/resources', async (req, reply) => {
  const body: any = (req as any).body || {};
  const id = randomUUID();
  const resource: Resource = {
    id,
    name: body.name,
    resourceType: body.resourceType,
    ownerCooperativeId: body.ownerCooperativeId,
    description: body.description,
  };
  resources[id] = resource;
  reply.code(201).send(resource);
});

app.get('/resources', async (req, reply) => {
  const list = Object.values(resources);
  reply.send({ resources: list, total_count: list.length });
});

const port = Number(process.env.PORT || 3002);
app.listen({ port, host: '0.0.0.0' })
  .then(() => app.log.info(`Resource Discovery listening on ${port}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });


