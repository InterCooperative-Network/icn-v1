import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

type Decoded = { sub?: string; email?: string; realm_access?: { roles?: string[] } };

export function registerJwt(server: FastifyInstance) {
  const enabled = process.env.JWT_ENABLED === 'true';
  const secret = process.env.JWT_SECRET;
  if (!enabled || !secret) {
    server.log.warn('JWT auth disabled or missing secret; using dev auth stub');
    return;
  }

  server.addHook('preHandler', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const auth = req.headers['authorization'];
      if (!auth || !auth.startsWith('Bearer ')) {
        return reply.code(401).send({ error: 'Missing bearer token' });
      }
      const token = auth.slice('Bearer '.length);
      const decoded = jwt.verify(token, secret) as Decoded;
      (req as any).user = { id: decoded.sub, email: decoded.email, roles: decoded.realm_access?.roles || [] };
    } catch (e) {
      return reply.code(401).send({ error: 'Invalid token' });
    }
  });
}


