import type { FastifyInstance } from 'fastify';
import { ANONYMOUS } from '../platform/authorization.ts';

// The liveness route, and the edition's one anonymous surface. Anonymity is declared here and justified in
// `ANONYMOUS_ROUTES`, not asserted here: a reason written next to the route is a reason nobody reviewing the
// security surface will ever find, because they are reading the list.
export async function registerHealth(app: FastifyInstance): Promise<void> {
  app.get(
    '/health',
    {
      config: { policy: ANONYMOUS },
      schema: {
        // Declared empty rather than omitted. Every route answers the query-string question explicitly,
        // because a query string has no syntactic tell in the URL and an omitted declaration is
        // indistinguishable from a route that reads `request.query` and hopes nobody scans it.
        querystring: { type: 'object', properties: {}, additionalProperties: false },
        response: {
          200: {
            type: 'object',
            required: ['status'],
            properties: { status: { type: 'string' } },
          },
        },
      },
    },
    async () => ({ status: 'ok' }),
  );
}
