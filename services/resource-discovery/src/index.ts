import Fastify from 'fastify';

const app = Fastify({ logger: true });

app.get('/health', async () => ({ status: 'ok' }));
app.get('/ready', async () => ({ status: 'ready' }));

const port = Number(process.env.PORT || 3002);
app.listen({ port, host: '0.0.0.0' })
  .then(() => app.log.info(`Resource Discovery listening on ${port}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });


