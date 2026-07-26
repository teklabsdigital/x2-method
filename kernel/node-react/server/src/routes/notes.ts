import type { FastifyInstance } from 'fastify';
import { POLICIES } from '../platform/authorization.ts';
import { systemClock } from '../platform/clock.ts';

// The exemplar's one gated surface, and it exists to make the endpoint-spine scans non-vacuous rather than to
// realize anything about notes. A scan that has only an anonymous health route to look at proves that it can
// find no violation in one route it was never going to flag.
//
// What this is NOT: no DATA claim is realized here. The store is a module-level Map with no tenancy, no
// concurrency token and no bounded read, and it is deliberately the least thing that lets a route have a real
// body contract and a real permission policy. Every DATA and TEN claim except TEN-1's parameter and contract
// halves stays `owed` in the conformance record, and choosing a real store under DEP-1 is its own pass.
//
// Because the credential mint is owed (SEC-4, TEN-6), the composed server answers 401 on every route here. That
// is the fail-closed direction and it is what the conformance record says.

type Note = { id: string; title: string; body: string; createdAtUtc: string };

const notes = new Map<string, Note>();

const NO_QUERY = { type: 'object', properties: {}, additionalProperties: false } as const;

// TIME-1, on the one surface where this stack has the claim's full requirement natively. `format: 'date-time'`
// is RFC3339, and RFC3339 requires an offset, so a value declared this way is UTC-anchored AND offset-aware in
// the sense the claim asks for. The in-memory value is a JS `Date`, which is neither: it is an instant with the
// originating offset discarded. So the wire form is stronger than the domain form here, which is the inverse of
// the sibling, where `DateTimeOffset` carries the offset in the domain and JSON carries whatever the serializer
// chose. `toISOString()` renders the zero offset, which is honest for a server-assigned timestamp and would not
// be for an actor-supplied one: that case needs the offset carried beside the instant, which is what
// `clock.offsetMinutesAt` exists for and what no scheduling slice has needed yet.
const NOTE_RESPONSE = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    body: { type: 'string' },
    createdAtUtc: { type: 'string', format: 'date-time' },
  },
} as const;

export async function registerNotes(app: FastifyInstance): Promise<void> {
  app.get(
    '/notes',
    {
      config: { policy: POLICIES['notes.read'] },
      schema: {
        // Closed, so the declared query set IS the accepted set: Fastify validates with `removeAdditional`, so
        // `?email=a@b.com` never reaches the handler. That is what makes SEC-3's scan over this declaration a
        // statement about what arrives rather than about what was written down.
        querystring: {
          type: 'object',
          properties: { limit: { type: 'integer', minimum: 1, maximum: 100 } },
          additionalProperties: false,
        },
      },
    },
    async (request) => {
      const { limit = 20 } = request.query as { limit?: number };
      return { notes: [...notes.values()].slice(0, limit) };
    },
  );

  app.get(
    '/notes/:noteId',
    {
      config: { policy: POLICIES['notes.read'] },
      schema: {
        querystring: NO_QUERY,
        params: { type: 'object', properties: { noteId: { type: 'string' } }, additionalProperties: false },
        response: {
          200: NOTE_RESPONSE,
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request, reply) => {
      const { noteId } = request.params as { noteId: string };
      const note = notes.get(noteId);
      return note === undefined ? reply.code(404).send({ error: 'not found' }) : note;
    },
  );

  app.post(
    '/notes',
    {
      config: { policy: POLICIES['notes.write'] },
      schema: {
        querystring: NO_QUERY,
        // The contract carries what the caller owns and nothing else. `id`, `tenantId`, `createdBy` and
        // `status` are absent because the server assigns them, which is SEC-2's whole sentence; the scan proves
        // the absence and `additionalProperties: false` makes the proof binding, because a caller that posts one
        // anyway has it stripped before this handler runs.
        body: {
          type: 'object',
          required: ['title', 'body'],
          properties: { title: { type: 'string', maxLength: 200 }, body: { type: 'string', maxLength: 10000 } },
          additionalProperties: false,
        },
        response: { 201: NOTE_RESPONSE },
      },
    },
    async (request, reply) => {
      const { title, body } = request.body as { title: string; body: string };
      // The clock comes from the seam, which is TIME-1's monotonic sentence applied to the wall clock as well:
      // one module reads a clock, so there is one place to look when the question is where a timestamp came
      // from. A lint refuses `new Date()` here.
      const note: Note = {
        id: String(notes.size + 1),
        title,
        body,
        createdAtUtc: systemClock.now().toISOString(),
      };
      notes.set(note.id, note);
      return reply.code(201).send(note);
    },
  );
}
