import { randomUUID } from 'node:crypto';
import type { Database } from '../database.ts';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  type NewNote,
  type Note,
  type NoteCursor,
  type NotePage,
  type NoteStore,
} from '../../app/notes/noteStore.ts';
import type { TenantId } from '../../app/tenancy.ts';

// The SQLite implementation of `NoteStore`.
//
// **Every statement this store can execute is in the object below, and every one of them names `tenant_id`.**
// That is the chokepoint E-77 says the sibling does not have, and it is worth stating exactly why it matters
// there. In the sibling, read tenancy is a hand-written `.Where(n => n.TenantId == tenantId)` repeated in each
// read method, so a cross-tenant read is the ABSENCE of a predicate, and absence has no syntax: a scan for it
// would be green forever, which is why TEN-5's ledger obligation is owed there with the chokepoint named as a
// precondition rather than a scan restated.
//
// Here the statements are string literals in one exported constant, so a scan can read every query this store is
// capable of running and assert that each one is tenant-scoped. That is a statement about the store rather than
// about the three methods someone remembered to check, and it is what E-50 measured the cost of missing: removing
// the tenant filter from the sibling's delete left 113 architecture tests and 19 unit tests green, and the path
// then answered 500 rather than 404, which is an existence oracle.
export const STATEMENTS = Object.freeze({
  insert: 'INSERT INTO notes (tenant_id, id, title, body, created_at_utc) VALUES (?, ?, ?, ?, ?)',
  // The keyset predicate, in the form that reads the composite index. `(created_at_utc, id) > (?, ?)` expressed
  // as a row comparison keeps the ordering total across equal timestamps without a second scan.
  listFirst:
    'SELECT tenant_id, id, title, body, created_at_utc FROM notes WHERE tenant_id = ? ORDER BY created_at_utc, id LIMIT ?',
  listAfter:
    'SELECT tenant_id, id, title, body, created_at_utc FROM notes WHERE tenant_id = ? AND (created_at_utc, id) > (?, ?) ORDER BY created_at_utc, id LIMIT ?',
  // `LIMIT 1` on a full primary-key lookup returns nothing the key did not already guarantee, and that is the
  // point. `PRIMARY KEY (tenant_id, id)` bounds this read to one row by construction, so the read was never
  // unbounded; what was missing is that the bound lived in the SCHEMA and the scan reads STATEMENTS. The
  // alternative was teaching the scan which columns form the primary key, which is a second copy of the migration
  // living in an architecture test. One word here buys an invariant with no exceptions in it: every SELECT this
  // server can run carries a LIMIT, and a rule with no carve-outs is a rule nobody has to interpret.
  get: 'SELECT tenant_id, id, title, body, created_at_utc FROM notes WHERE tenant_id = ? AND id = ? LIMIT 1',
  remove: 'DELETE FROM notes WHERE tenant_id = ? AND id = ?',
});

type Row = Readonly<{ tenant_id: string; id: string; title: string; body: string; created_at_utc: string }>;

const toNote = (row: Row): Note =>
  Object.freeze({
    tenantId: row.tenant_id as TenantId,
    id: row.id,
    title: row.title,
    body: row.body,
    createdAtUtc: row.created_at_utc,
  });

// DATA-2: the bound is applied HERE and not only at the route. A limit enforced at one caller is not a bound on
// the read, it is a bound on that caller, and the next caller of this store gets none. Clamped rather than
// refused, because a caller asking for more than the maximum has asked a question the system answers by giving
// less, and refusing would make the bound a contract the client has to know.
const boundedLimit = (limit: number): number => {
  if (!Number.isInteger(limit) || limit < 1) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(limit, MAX_PAGE_SIZE);
};

export function sqliteNoteStore(db: Database): NoteStore {
  return Object.freeze({
    add(tenant: TenantId, note: NewNote, now: Date): Note {
      // CON-1's opacity clause, and E-83's live violation repaired at the place the register said it belonged:
      // the store boundary. The previous id was `String(notes.size + 1)`, which fails opacity outright and, as
      // E-86 recorded, COLLIDES after any delete, because deleting one of three rows makes the next mint reuse an
      // id that still exists. A UUID is opaque, is not an enumeration of the tenant's rows, and does not depend on
      // the store's current size for uniqueness.
      const row: Note = Object.freeze({
        tenantId: tenant,
        id: randomUUID(),
        title: note.title,
        body: note.body,
        createdAtUtc: now.toISOString(),
      });
      db.prepare(STATEMENTS.insert).run(row.tenantId, row.id, row.title, row.body, row.createdAtUtc);
      return row;
    },

    list(tenant: TenantId, cursor: NoteCursor | null, limit: number): NotePage {
      const size = boundedLimit(limit);
      // One row more than asked for, which is how the cursor learns whether a next page exists without a second
      // count query. The extra row is dropped before returning; it is the evidence, not the answer.
      const rows = (
        cursor === null
          ? db.prepare(STATEMENTS.listFirst).all(tenant, size + 1)
          : db.prepare(STATEMENTS.listAfter).all(tenant, cursor.createdAtUtc, cursor.id, size + 1)
      ) as Row[];

      const page = rows.slice(0, size).map(toNote);
      const last = page.at(-1);
      const nextCursor =
        rows.length > size && last !== undefined
          ? Object.freeze({ createdAtUtc: last.createdAtUtc, id: last.id })
          : null;

      return Object.freeze({ items: Object.freeze(page), nextCursor });
    },

    get(tenant: TenantId, id: string): Note | null {
      const row = db.prepare(STATEMENTS.get).get(tenant, id) as Row | undefined;
      return row === undefined ? null : toNote(row);
    },

    remove(tenant: TenantId, id: string): boolean {
      // The tenant is in the DELETE's own predicate, so a cross-tenant delete removes nothing and reports it as an
      // absence. E-50 is the reason that sentence is worth writing: in the sibling the same operation with a
      // forgotten filter reached the save-pipeline guard and threw, so a cross-tenant READ answered 404 while a
      // cross-tenant DELETE answered 500, and a caller could tell the difference. Uniform not-found is what TEN-2
      // asks for, and it is only uniform if every path gets it the same way.
      return db.prepare(STATEMENTS.remove).run(tenant, id).changes > 0;
    },
  });
}
