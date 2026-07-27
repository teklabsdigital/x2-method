import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { NoteService } from '../app/notes/noteService.ts';
import { encodeCursor } from '../app/notes/noteService.ts';
import type { Note } from '../app/notes/noteStore.ts';
import { tenantOf, type TenantId } from '../app/tenancy.ts';
import { POLICIES } from '../platform/authorization.ts';

// The exemplar's one gated surface. It used to hold a module-level Map, which is what every DATA and TEN claim
// being `owed` in this edition was waiting on; the store is now a real one behind an interface, and this file
// touches neither it nor the database. DATA-1's sentence is that an endpoint calls one service method, and each
// handler below does exactly that.
//
// Every handler resolves its tenant with `tenantOf(request.credential)` and from nowhere else. That is TEN-1's
// resolution rule discharged at the point of USE rather than only at the point of resolution, which is the half
// the row carried as `patterned` while the credential had a tenant nothing read.

type NoteResponse = Omit<Note, 'tenantId'>;

// TEN-1 again, and it is a deliberate projection rather than a serializer accident. The tenant is on the record
// because the row is keyed by it; it does not cross the wire, because a client that can see a tenant id is a
// client that can try one. The response schema below does not name it either, so Fastify's serializer would drop
// it regardless; both halves are here because E-85 measured that a schema and a handler are two objects and
// either can change without the other.
const project = (note: Note): NoteResponse => ({
  id: note.id,
  title: note.title,
  body: note.body,
  createdAtUtc: note.createdAtUtc,
});

const NO_QUERY = { type: 'object', properties: {}, additionalProperties: false } as const;

// TIME-1, on the one surface where this stack has the claim's full requirement natively. `format: 'date-time'` is
// RFC3339, and RFC3339 requires an offset, so a value declared this way is UTC-anchored AND offset-aware in the
// sense the claim asks for.
const NOTE_RESPONSE = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    body: { type: 'string' },
    createdAtUtc: { type: 'string', format: 'date-time' },
  },
} as const;

const NOTE_LIST_RESPONSE = {
  type: 'object',
  properties: {
    items: { type: 'array', items: NOTE_RESPONSE },
    nextCursor: { type: ['string', 'null'] },
  },
} as const;

const tenantFor = (request: FastifyRequest): TenantId => {
  // The gate hook sets `request.credential` before any handler runs, and a route reaching this line has passed a
  // registered policy, so the credential is present. Asserted rather than assumed: a null here would mean the gate
  // ordering had changed, and the honest answer to that is a loud failure rather than a tenant of 'undefined'.
  if (request.credential === null) {
    throw new Error('a gated handler ran with no credential; the tenant is resolved solely from the credential (TEN-1).');
  }
  return tenantOf(request.credential);
};

export function notesSurface(service: NoteService) {
  return async function registerNotes(app: FastifyInstance): Promise<void> {
    app.get(
      '/notes',
      {
        config: { policy: POLICIES['notes.read'], contracts: { 200: 'noteListResponse' } },
        schema: {
          querystring: {
            type: 'object',
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
        const page = service.page(tenantFor(request), cursor, limit);
        return {
          items: page.items.map(project),
          nextCursor: page.nextCursor === null ? null : encodeCursor(page.nextCursor),
        };
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
        const note = service.read(tenantFor(request), noteId);
        return note === null ? reply.code(404).send({ error: 'not found' }) : project(note);
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
          // SEC-2: the contract carries what the caller owns and nothing else. `id`, `tenantId` and
          // `createdAtUtc` are absent because the server assigns them, and `additionalProperties: false` makes the
          // absence binding rather than documentary: a caller that posts one anyway has it stripped before this
          // handler runs.
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
        return reply.code(201).send(project(service.create(tenantFor(request), { title, body })));
      },
    );

    // The route the client and the harness have both been calling since before it existed. Its absence is why the
    // harness's `delete-note` scenario answered 403: SEC-1's deny-by-default fallback answers a URL with no route
    // behind it, so the client could not tell "no such note" from "no such endpoint".
    app.delete(
      '/notes/:noteId',
      {
        // `body: 'none'` rather than a closed empty body schema, and E-94 is why. Fastify ENFORCES a declared
        // body schema, so the closed empty object answered `400 body must be object` to every DELETE sent without
        // one, which is every DELETE this edition's client and harness send. Declaring none is the explicit
        // decision the surface obligation is actually asking for.
        config: { policy: POLICIES['notes.write'], body: 'none' },
        schema: {
          querystring: NO_QUERY,
          params: { type: 'object', properties: { noteId: { type: 'string' } }, additionalProperties: false },
          // 204 is declared as well as 404, because Fastify derives the reply's permitted status codes from this
          // object: with only 404 declared, `reply.code(204)` is a type error rather than an empty success.
          response: {
            204: { type: 'null' },
            404: { type: 'object', properties: { error: { type: 'string' } } },
          },
        },
      },
      async (request, reply) => {
        const { noteId } = request.params as { noteId: string };
        // A note belonging to another tenant is NOT FOUND, not forbidden. TEN-2's uniformity clause: 403 here
        // would be an existence oracle, telling a caller that a note it may not touch exists. The store's DELETE
        // carries the tenant in its own predicate, so a cross-tenant delete changes no rows and arrives here as an
        // absence rather than as an error to be translated. E-50 is the measurement behind that sentence: in the
        // sibling a cross-tenant read answered 404 while a cross-tenant delete with a forgotten filter answered
        // 500, and a caller could tell the difference.
        return service.discard(tenantFor(request), noteId)
          ? reply.code(204).send()
          : reply.code(404).send({ error: 'not found' });
      },
    );
  };
}
