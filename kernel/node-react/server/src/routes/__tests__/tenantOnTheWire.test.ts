import { describe, expect, it } from 'vitest';
import { composeApp } from '../../compose.ts';
import { freshDatabase } from '../../persistence/__tests__/support.ts';
import { POLICIES, type Credential } from '../../platform/authorization.ts';

// TEN-2's last question, asked at the only level that can answer it: does the tenant that reaches the STORE come
// from the caller's credential, on every route?
//
// The type system already answers a different and easier question. `TenantId` is branded and `tenantOf` is its
// only producer, so no handler can reach the store with no tenant, and a lint now refuses the testing hatch in
// production so no handler can reach it with a tenant that came from nowhere. Neither of those says a handler
// used the tenant belonging to THIS request. That is a per-request fact, and a per-request fact needs a request.
//
// So each test below drives the real composed app, through `composeApp`, with a credential seam standing in for
// the verifier and the real store underneath. The assertion is against the DATABASE rather than against the
// response: a response can only show what the handler chose to send back, and the question is what it wrote.

// Derived from the fixture rather than named, so the test does not carry a second copy of a boundary it is
// reaching across. E-91 is the same shape one level out.
type Database = ReturnType<typeof freshDatabase>;

const permissions = Object.values(POLICIES).flatMap((policy) => policy.permissions);

const callerFor = (tenantId: string): Credential =>
  Object.freeze({ subject: `subject-of-${tenantId}`, tenantId, sessionVersion: 1, permissions });

const appFor = async (tenantId: string, database: Database) =>
  composeApp({}, { database, authenticate: () => callerFor(tenantId) });

const rowsIn = (database: Database): { tenant_id: string; id: string }[] =>
  database.prepare('SELECT tenant_id, id FROM notes ORDER BY id').all() as { tenant_id: string; id: string }[];

describe('TEN-2: the tenant that reaches the store is the one on the caller credential', () => {
  it('stamps a created row with the caller tenant and with no other', async () => {
    const database = freshDatabase();
    const app = await appFor('tenant-a', database);

    const created = await app.inject({
      method: 'POST',
      url: '/notes',
      payload: { title: 'from a', body: 'x' },
    });
    expect(created.statusCode).toBe(201);

    // Read past the handler, at the row. The response never carries a tenant (TEN-1 projects it out), so a
    // handler that wrote the wrong one would return an identical 201.
    expect(rowsIn(database).map((row) => row.tenant_id)).toEqual(['tenant-a']);

    await app.close();
  });

  it('shows a second caller nothing of the first, on every route, in one shape', async () => {
    const database = freshDatabase();
    const alice = await appFor('tenant-a', database);
    const created = await alice.inject({ method: 'POST', url: '/notes', payload: { title: 'hers', body: 'x' } });
    const id = (created.json() as { id: string }).id;
    await alice.close();

    // Same database, different caller. This is the composition a cross-tenant request actually is.
    const bob = await appFor('tenant-b', database);

    expect((await bob.inject({ method: 'GET', url: '/notes' })).json()).toMatchObject({ items: [] });
    expect((await bob.inject({ method: 'GET', url: `/notes/${id}` })).statusCode).toBe(404);
    // E-50: the delete has to answer the same way the read does. A 500 here, or a 204, would each be an oracle
    // telling an outsider that the id exists.
    expect((await bob.inject({ method: 'DELETE', url: `/notes/${id}` })).statusCode).toBe(404);
    // And it is still there, which the status code alone does not say.
    expect(rowsIn(database)).toHaveLength(1);

    await bob.close();
  });

  it('serves the same caller its own note, so the refusals above are the tenancy and not a broken route', async () => {
    const database = freshDatabase();
    const app = await appFor('tenant-a', database);
    const created = await app.inject({ method: 'POST', url: '/notes', payload: { title: 'hers', body: 'x' } });
    const id = (created.json() as { id: string }).id;

    expect((await app.inject({ method: 'GET', url: `/notes/${id}` })).statusCode).toBe(200);
    expect((await app.inject({ method: 'DELETE', url: `/notes/${id}` })).statusCode).toBe(204);
    expect(rowsIn(database)).toHaveLength(0);

    await app.close();
  });
});
