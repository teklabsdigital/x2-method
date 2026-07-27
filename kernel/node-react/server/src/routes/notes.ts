import type { FastifyInstance } from 'fastify';
import { POLICIES } from '../platform/authorization.ts';
import { systemClock } from '../platform/clock.ts';

// The exemplar's one gated surface, and it exists to make the endpoint-spine scans non-vacuous rather than to
// realize anything about notes. A scan that has only an anonymous health route to look at proves that it can
// find no violation in one route it was never going to flag.
//
// What this is NOT: no DATA claim is realized here. The store is a module-level Map with no tenancy and no
// concurrency token, and it is deliberately the least thing that lets a route have a real
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

// CON-2's list contract, and it did not exist until the producer side of the parity check was built. The route
// declared no response schema at all and returned `{notes: [...]}`, while the client's `NoteList` and the shared
// fixture both say `{items, nextCursor}`. Two things were wrong and only one of them was the field names: a
// route that declares no response shape has nothing for a fixture to pin, so the drift was not merely undetected,
// it was unreadable. E-82's producer half is what asked the question, and the answer was a live violation.
const NOTE_LIST_RESPONSE = {
  type: 'object',
  properties: {
    items: { type: 'array', items: NOTE_RESPONSE },
    // Nullable, because "there is no next page" is a value the caller must be able to receive. The client's
    // `NoteList.nextCursor` is `string | null` and the harness asserts a non-null cursor on a truncated page.
    nextCursor: { type: ['string', 'null'] },
  },
} as const;

export async function registerNotes(app: FastifyInstance): Promise<void> {
  app.get(
    '/notes',
    {
      config: { policy: POLICIES['notes.read'], contracts: { 200: 'noteListResponse' } },
      schema: {
        // Closed, so the declared query set IS the accepted set: Fastify validates with `removeAdditional`, so
        // `?email=a@b.com` never reaches the handler. That is what makes SEC-3's scan over this declaration a
        // statement about what arrives rather than about what was written down.
        querystring: {
          type: 'object',
          // `cursor` is declared because the client sends it. It was absent, and absent here does not mean
          // rejected: `removeAdditional` STRIPPED it before the handler ran, so every paged read the client
          // issued silently returned page one. A closed surface makes an undeclared field disappear quietly,
          // which is the right answer for a field nobody should send and the wrong one for a field the contract
          // requires.
          properties: {
            cursor: { type: 'string' },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
          },
          additionalProperties: false,
        },
        response: { 200: NOTE_LIST_RESPONSE },
      },
    },
    async (request) => {
      const { cursor, limit = 20 } = request.query as { cursor?: string; limit?: number };
      // Keyset over insertion order, which is what a Map gives and is the whole of what is claimed. No DATA or
      // TEN row moves on this: the store still has no tenancy, no concurrency token, and no ordering guarantee a
      // real engine would have to provide. The paging exists because `nextCursor` is a field in the contract and
      // a field in a contract has to mean something; returning a constant null while `limit` silently dropped
      // rows would have been the same class of quiet answer as stripping the cursor.
      const all = [...notes.values()];
      const found = cursor === undefined ? 0 : all.findIndex((note) => note.id === cursor);
      // An unknown cursor points past everything rather than restarting at the top. `findIndex` returns -1 and
      // `-1 + 1` is 0, so the arithmetic alone would have answered page one to a caller holding a stale cursor.
      const from = cursor === undefined ? 0 : found < 0 ? all.length : found + 1;
      const items = all.slice(from, from + limit);
      const nextCursor = from + limit < all.length && items.length > 0 ? items[items.length - 1].id : null;
      return { items, nextCursor };
    },
  );

  app.get(
    '/notes/:noteId',
    {
      config: { policy: POLICIES['notes.read'], contracts: { 200: 'noteResponse' } },
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
      config: {
        policy: POLICIES['notes.write'],
        contracts: { body: 'createNoteRequest', 201: 'noteResponse' },
      },
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
