import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export function registerAuth(server: FastifyInstance) {
  server.addHook('preHandler', async (req: FastifyRequest, _reply: FastifyReply) => {
    // Dev-friendly stub: read X-User-Id and X-Cooperative-Id
    const userId = req.headers['x-user-id'];
    const coopId = req.headers['x-cooperative-id'];
    (req as any).user = userId ? { id: userId, cooperativeId: coopId } : undefined;
  });
}


