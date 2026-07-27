import { describe, expect, it } from 'vitest';
import { composeApp } from '../../compose.ts';
import type { Credential } from '../../platform/authorization.ts';
import type { RecordedRoute } from '../../platform/routeTable.ts';
import {
  contractNames,
  contractParityFindings,
  readContractFixture,
  type ContractFixture,
} from '../contractParity.ts';

// CON-2's producer side. The green half scans THE composed app, through `composeApp` and never `createApp`, for
// the reason the endpoint spine tests give. The red half is in this same file rather than a sibling, and that is
// the difference E-79 recorded: `scanEndpointSpine` reads a table the composed app produces, so planting a
// violation means building a violating app, but `contractParityFindings` takes both the fixture and the table as
// arguments, so a violation is a literal in a test and the two halves cost one file.

const FIXTURE: ContractFixture = readContractFixture();

// A route table entry is five frozen fields. Building one by hand is legitimate HERE, and is not the thing the
// createApp ban forbids: these tables are never scanned as evidence about what this server serves, they are
// inputs proving the predicate reports what it claims to report.
function route(over: Partial<RecordedRoute> = {}): RecordedRoute {
  return Object.freeze({
    method: 'POST',
    url: '/notes',
    constraints: Object.freeze({}),
    schema: Object.freeze({}),
    config: Object.freeze({}),
    ...over,
  }) as RecordedRoute;
}

const shape = (...names: string[]) => ({
  type: 'object',
  properties: Object.fromEntries(names.map((name) => [name, { type: 'string' }])),
  additionalProperties: false,
});

// A table that satisfies the fixture completely, built from the fixture itself so it stays correct when the
// contract changes. Every refusal below starts from this and breaks exactly one thing, which is what makes each
// one a statement about the predicate rather than about the accumulated state of a hand-written table.
function conformingTable(fixture: ContractFixture = FIXTURE): RecordedRoute[] {
  return contractNames(fixture).map((name, index) =>
    route({
      url: `/bound/${index}`,
      schema: Object.freeze({ response: { 200: shape(...(fixture[name] as string[])) } }),
      config: Object.freeze({ contracts: { 200: name } }),
    }),
  );
}

describe('the shared fixture is a corpus and not an empty file (CON-2)', () => {
  it('carries the three hand-mirrored contracts, each a non-empty field set', () => {
    // Without this, every assertion in this file passes over a fixture someone emptied: a predicate that
    // enumerates from a register reports a clean pass when the register is blank, which is E-11's shape applied
    // to a data file rather than to a scan.
    expect(contractNames(FIXTURE)).toEqual(['createNoteRequest', 'noteListResponse', 'noteResponse']);
    for (const name of contractNames(FIXTURE)) {
      expect(Array.isArray(FIXTURE[name])).toBe(true);
      expect((FIXTURE[name] as string[]).length).toBeGreaterThan(0);
    }
  });
});

describe('the composed app realizes every contract the shared fixture pins (CON-2)', () => {
  it('has no parity finding against the fixture the client asserts against', async () => {
    const app = await composeApp();
    expect(contractParityFindings(FIXTURE, app.routeTable)).toEqual([]);
    await app.close();
  });

  it('binds every contract in the fixture to a real route surface, so a clean pass is not an unasked question', async () => {
    // The extent assertion, and it is the one that would have caught E-82's residue. Two of the three contracts
    // matched on the first run and the third was bound by nothing, so a per-route check alone reported a clean
    // pass over the only contract that had drifted. Naming the count here means deleting a binding fails this
    // test as well as the scan.
    const app = await composeApp();
    const bound = app.routeTable
      .flatMap((entry) => Object.values((entry.config.contracts ?? {}) as Record<string, string>))
      .sort();

    expect([...new Set(bound)]).toEqual(contractNames(FIXTURE));
    expect(app.routeTable.some((entry) => entry.schema.body !== undefined && entry.config.contracts !== undefined)).toBe(true);

    await app.close();
  });
});

// A declaration and an emission are two different things in this stack, and the scan above pins only the first.
// The sibling edition gets the identity for free: its handler returns the typed record the contract IS, so there
// is one object and no gap to close. Here the schema is a value beside a handler that returns whatever it likes,
// and the response serializer silently drops any field the schema does not name, so a handler and its own
// declaration can disagree with nothing reporting it and a field simply missing from the wire.
//
// These are also the first tests in this edition to pass a credential. `CreateAppSeams.authenticate` has existed
// since the composition root was written and every test so far has taken the default, which means the entire
// authenticated path (`satisfies`, the 403 for an insufficient credential, `request.credential`) was code no test
// had ever run.
type Page = Readonly<{ items: { id: string }[]; nextCursor: string | null }>;

const grant = (...permissions: string[]): Credential => Object.freeze({ subject: 'contract-parity', permissions });

const authenticatedApp = (credential: Credential) => composeApp({}, { authenticate: () => credential });

describe('what the server emits is what the contract declares (CON-2)', () => {
  it('emits the fixture field set on create, not merely a schema that names it', async () => {
    const app = await authenticatedApp(grant('notes:read', 'notes:write'));

    const created = await app.inject({
      method: 'POST',
      url: '/notes',
      payload: { title: 'a', body: 'b' },
    });

    expect(created.statusCode).toBe(201);
    expect(Object.keys(created.json() as object).sort()).toEqual(
      [...(FIXTURE.noteResponse as string[])].sort(),
    );

    await app.close();
  });

  it('emits items and nextCursor on the list, which is the field set the client asserts against', async () => {
    const app = await authenticatedApp(grant('notes:read', 'notes:write'));
    await app.inject({ method: 'POST', url: '/notes', payload: { title: 'a', body: 'b' } });

    const listed = await app.inject({ method: 'GET', url: '/notes' });

    expect(listed.statusCode).toBe(200);
    expect(Object.keys(listed.json() as object).sort()).toEqual(
      [...(FIXTURE.noteListResponse as string[])].sort(),
    );

    await app.close();
  });

  it('walks the whole list through the cursor without dropping or repeating a note', async () => {
    // `nextCursor` is a field in the contract, so it has to mean something. Before this route declared a response
    // shape it returned `{notes}` with no cursor at all, and `cursor` was not in the query schema, so
    // `removeAdditional` stripped it and every paged read the client issued silently answered page one.
    //
    // Asserted as totality rather than as a page count, and that is not a stylistic choice. The store is a
    // module-level Map with no reset seam, so notes created by any test in this process are still there for the
    // next one; the first version of this test asserted "three notes make two pages" and failed on the fourth
    // note, which a reader would have read as a paging bug. Comparing the walk against the unpaged read is both
    // independent of what else ran and a stronger statement: no note dropped, none served twice.
    const app = await authenticatedApp(grant('notes:read', 'notes:write'));
    for (const title of ['one', 'two', 'three']) {
      await app.inject({ method: 'POST', url: '/notes', payload: { title, body: title } });
    }

    const whole = (await app.inject({ method: 'GET', url: '/notes?limit=100' })).json() as Page;
    expect(whole.items.length).toBeGreaterThanOrEqual(3);
    // If this is not null the unpaged read was itself truncated, and every comparison below would be against a
    // partial list. Fail here rather than compare two truncations and call them equal.
    expect(whole.nextCursor).toBeNull();

    const walked: string[] = [];
    let cursor: string | null = null;
    let pages = 0;
    do {
      const url = cursor === null ? '/notes?limit=2' : `/notes?limit=2&cursor=${cursor}`;
      const page = (await app.inject({ method: 'GET', url })).json() as Page;
      walked.push(...page.items.map((note) => note.id));
      cursor = page.nextCursor;
      pages += 1;
      // A cursor that never advances is an infinite loop, and a test that hangs reports nothing at all.
      expect(pages).toBeLessThanOrEqual(whole.items.length + 1);
    } while (cursor !== null);

    expect(walked).toEqual(whole.items.map((note) => note.id));
    expect(pages).toBeGreaterThan(1);

    await app.close();
  });

  it('answers a stale cursor with an empty page rather than restarting at the top', async () => {
    // The arithmetic alone would have done the wrong thing: `findIndex` returns -1 for an unknown cursor and
    // -1 + 1 is 0, so a caller holding a cursor for a deleted note would have been handed page one and would
    // have had no way to tell.
    const app = await authenticatedApp(grant('notes:read', 'notes:write'));
    await app.inject({ method: 'POST', url: '/notes', payload: { title: 'a', body: 'b' } });

    const stale = (await app.inject({ method: 'GET', url: '/notes?cursor=no-such-note' })).json() as Page;

    expect(stale.items).toEqual([]);
    expect(stale.nextCursor).toBeNull();

    await app.close();
  });

  it('refuses a credential that authenticated but lacks the permission', async () => {
    // The seam's other direction, and the reason it is worth exercising at all: a test that only ever passes a
    // sufficient credential proves the gate opens and says nothing about whether it closes.
    const app = await authenticatedApp(grant('notes:read'));

    const written = await app.inject({ method: 'POST', url: '/notes', payload: { title: 'a', body: 'b' } });

    expect(written.statusCode).toBe(403);
    expect((written.json() as { reason: string }).reason).toContain('notes:write');

    await app.close();
  });
});

describe('the predicate reports a producer that has drifted (CON-2)', () => {
  it('reports a renamed field on the server side', () => {
    const table = conformingTable();
    const target = table.findIndex((entry) => (entry.config.contracts as Record<string, string>)[200] === 'noteResponse');
    table[target] = route({
      url: table[target].url,
      schema: Object.freeze({ response: { 200: shape('id', 'title', 'body', 'createdAt') } }),
      config: Object.freeze({ contracts: { 200: 'noteResponse' } }),
    });

    const findings = contractParityFindings(FIXTURE, table);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('has drifted');
    expect(findings[0]).toContain('Missing: createdAtUtc');
    expect(findings[0]).toContain('Unpinned: createdAt');
  });

  it('reports a field the server added and the fixture never pinned', () => {
    const table = conformingTable();
    const target = table.findIndex((entry) => (entry.config.contracts as Record<string, string>)[200] === 'createNoteRequest');
    table[target] = route({
      url: table[target].url,
      schema: Object.freeze({ response: { 200: shape('title', 'body', 'tenantId') } }),
      config: Object.freeze({ contracts: { 200: 'createNoteRequest' } }),
    });

    const findings = contractParityFindings(FIXTURE, table);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('Unpinned: tenantId');
  });

  it('reports a contract the fixture declares and no route binds', () => {
    // The E-82 state exactly: the client asserts three contracts, the server answers for two, and every route
    // that IS bound matches. This is the finding a per-route check cannot produce.
    const table = conformingTable().filter(
      (entry) => (entry.config.contracts as Record<string, string>)[200] !== 'noteListResponse',
    );

    const findings = contractParityFindings(FIXTURE, table);
    expect(findings).toEqual([
      "the fixture declares 'noteListResponse' and no route binds it, so the client asserts a contract this server has never been asked about (CON-2).",
    ]);
  });

  it('reports every unbound contract, not the first', () => {
    expect(contractParityFindings(FIXTURE, [])).toHaveLength(contractNames(FIXTURE).length);
  });

  it('reports a binding whose surface declares no schema', () => {
    const findings = contractParityFindings(FIXTURE, [
      ...conformingTable(),
      route({ url: '/unbacked', config: Object.freeze({ contracts: { 201: 'noteResponse' } }) }),
    ]);

    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('declares no schema at that surface');
  });

  it('reports a binding that names a contract the fixture does not carry', () => {
    const findings = contractParityFindings(FIXTURE, [
      ...conformingTable(),
      route({
        url: '/invented',
        schema: Object.freeze({ response: { 200: shape('id') } }),
        config: Object.freeze({ contracts: { 200: 'inventedContract' } }),
      }),
    ]);

    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain("names 'inventedContract', which the shared fixture does not carry");
  });

  it('reports a schema with no readable field set rather than passing it', () => {
    // `{}` and `true` both satisfy "is not undefined", and both pin nothing. The request surfaces are protected
    // from this by `requireScannable` at boot; response schemas are not, so the predicate has to answer for it.
    const findings = contractParityFindings(FIXTURE, [
      ...conformingTable(),
      route({
        url: '/opaque',
        schema: Object.freeze({ response: { 200: { type: 'object' } } }),
        config: Object.freeze({ contracts: { 200: 'noteResponse' } }),
      }),
    ]);

    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('declares no properties object');
  });

  it('reports a malformed binding rather than skipping the route it is on', () => {
    const findings = contractParityFindings(FIXTURE, [
      ...conformingTable(),
      route({ url: '/bad-shape', config: Object.freeze({ contracts: ['noteResponse'] }) }),
      route({ url: '/bad-value', config: Object.freeze({ contracts: { 200: 7 } }) }),
    ]);

    expect(findings).toHaveLength(2);
    expect(findings.some((finding) => finding.includes('not an object mapping surfaces to contract names'))).toBe(true);
    expect(findings.some((finding) => finding.includes('not a contract name'))).toBe(true);
  });

  it('reports a fixture entry that is not a field set', () => {
    const broken: ContractFixture = { ...FIXTURE, noteResponse: 'id,title' };
    const findings = contractParityFindings(broken, conformingTable(FIXTURE));

    expect(findings.some((finding) => finding.includes('is not an array of field names'))).toBe(true);
  });

  it('is silent on a route that binds nothing, so unmirrored surfaces are not swept in', () => {
    // CON-2 is scoped to hand-mirrored contracts. `/health`'s body and the 404 error shape are neither, and a
    // predicate that demanded a fixture entry for every response schema would be enforcing a claim nobody made.
    const findings = contractParityFindings(FIXTURE, [
      ...conformingTable(),
      route({ method: 'GET', url: '/health', schema: Object.freeze({ response: { 200: shape('status') } }) }),
    ]);

    expect(findings).toEqual([]);
  });
});
