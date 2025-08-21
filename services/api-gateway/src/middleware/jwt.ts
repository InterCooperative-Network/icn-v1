import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

export function registerJwt(server: FastifyInstance) {
  const enabled = process.env.JWT_ENABLED === 'true';
  const jwksUri = process.env.JWT_JWKS_URI; // e.g., https://keycloak/realms/icn/protocol/openid-connect/certs
  const audience = process.env.JWT_AUDIENCE;
  const issuer = process.env.JWT_ISSUER;

  if (!enabled || !jwksUri) {
    server.log.warn('JWT auth disabled or missing JWKS; using dev auth stub');
    return;
  }

  const JWKS = createRemoteJWKSet(new URL(jwksUri));

  server.addHook('preHandler', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const auth = req.headers['authorization'];
      if (!auth || !auth.startsWith('Bearer ')) {
        return reply.code(401).send({ error: 'Missing bearer token' });
      }
      const token = auth.slice('Bearer '.length);
      const { payload } = await jwtVerify(token, JWKS, {
        audience: audience || undefined,
        issuer: issuer || undefined,
      });
      const p = payload as JWTPayload & { realm_access?: { roles?: string[] } };
      (req as any).user = {
        id: p.sub,
        email: (p as any).email,
        roles: p.realm_access?.roles || [],
      };
    } catch (e) {
      return reply.code(401).send({ error: 'Invalid token' });
    }
  });
}


