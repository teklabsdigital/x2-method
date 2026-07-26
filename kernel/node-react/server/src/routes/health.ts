import type { FastifyInstance } from 'fastify';

// The one route the scaffold ships, so that the recorder has something real to record and the completeness
// tests have a composed app to run against. It carries no tenancy and no authorization yet; both arrive with
// their claims in the build pass, and until they do the conformance record says so.
export async function registerHealth(app: FastifyInstance): Promise<void> {
  app.get(
    '/health',
    {
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
