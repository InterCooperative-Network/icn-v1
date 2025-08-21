import Fastify from 'fastify';
const app = Fastify();
app.get('/health', async () => ({ ok: true }));
app.get('/resources/search', async (req, res) => res.send({ items: [], total: 0 }));
app.post('/resources', async (req, res) => res.code(201).send({ id: 'stub' }));
const port = process.env.PORT || 8090;
app.listen({ port, host: '0.0.0.0' });
