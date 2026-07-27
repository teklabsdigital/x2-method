import { describe, expect, it } from 'vitest';
import { MAX_PAGE_SIZE } from '../../../app/notes/noteStore.ts';
import { tenantForTesting } from '../../../app/tenancy.ts';
import { instantForTesting, systemClock } from '../../../platform/clock.ts';
import { freshDatabase } from '../../__tests__/support.ts';
import { sqliteNoteStore } from '../sqliteNoteStore.ts';

// TEN-2 and DATA-2 behaviourally, against the real engine and the real migrations.
//
// **This file exists because a plant found the gap in what was covering the store.** Removing the tenant filter
// from `STATEMENTS.remove`, which is E-50's exact defect, turned two tests red and both of them were the static
// scan. Nothing in the suite executed a cross-tenant delete. The harness has `cross-tenant-404`, and it is a
// READ; E-50 is specifically about a read and a delete answering differently, so the one scenario that would have
// caught it was the one nobody had written, in both editions, for the same reason.
//
// A static scan and a behavioural test are not two ways of saying the same thing here. The scan says no statement
// this store can run is unscoped, which is a claim about the whole surface and is what makes the row more than a
// per-method check. This file says the scoping WORKS: that the predicate the scan approved of actually separates
// two tenants at the engine, on every method, in the same not-found shape. A scan over correct-looking SQL that
// silently matched nothing would satisfy the first and fail here.

const alice = tenantForTesting('tenant-alice');
const bob = tenantForTesting('tenant-bob');
// One clock read through the seam, and every other instant derived from it by arithmetic. The tests below need
// instants a known distance apart and two that are identical, which is a relationship rather than a date, so
// nothing here depends on what the wall clock said.
const BASE = systemClock.now().getTime();
const at = (seconds: number): Date => instantForTesting(BASE + seconds * 1000);

const seeded = () => {
  const store = sqliteNoteStore(freshDatabase());
  const hers = store.add(alice, { title: 'Alice note', body: 'private' }, at(1));
  const his = store.add(bob, { title: 'Bob note', body: 'also private' }, at(2));
  return { store, hers, his };
};

describe('TEN-2: two tenants cannot see or touch each other, and every path says so the same way', () => {
  it('does not return another tenant note by id', () => {
    const { store, hers } = seeded();

    expect(store.get(alice, hers.id)).not.toBeNull();
    expect(store.get(bob, hers.id)).toBeNull();
  });

  it('does not list another tenant rows', () => {
    const { store, hers, his } = seeded();

    expect(store.list(alice, null, 10).items.map((note) => note.id)).toEqual([hers.id]);
    expect(store.list(bob, null, 10).items.map((note) => note.id)).toEqual([his.id]);
  });

  // E-50, behaviourally. In the sibling this operation with a forgotten filter reached the save-pipeline guard and
  // threw, so a cross-tenant read answered 404 while a cross-tenant delete answered 500, and a caller could tell
  // the difference. Uniform not-found is only uniform if every path is asked.
  it('reports a cross-tenant delete as an absence, and leaves the row where it was', () => {
    const { store, hers } = seeded();

    expect(store.remove(bob, hers.id)).toBe(false);
    // The half that matters more than the return value: the row is still there. A delete that reported false and
    // removed the row anyway would pass the assertion above and be a silent cross-tenant write.
    expect(store.get(alice, hers.id)).not.toBeNull();
  });

  it('deletes for the owning tenant, so the refusal above is the tenancy and not a broken delete', () => {
    const { store, hers } = seeded();

    expect(store.remove(alice, hers.id)).toBe(true);
    expect(store.get(alice, hers.id)).toBeNull();
  });
});

describe('DATA-2: the bound lives at the store, so every caller gets it', () => {
  it('clamps a page size above the maximum rather than honouring it', () => {
    const store = sqliteNoteStore(freshDatabase());
    for (let index = 0; index < MAX_PAGE_SIZE + 5; index += 1) {
      store.add(alice, { title: `note ${index}`, body: 'x' }, at(index));
    }

    expect(store.list(alice, null, MAX_PAGE_SIZE + 5).items).toHaveLength(MAX_PAGE_SIZE);
  });

  it('clamps a nonsense page size to the default rather than returning nothing', () => {
    const { store } = seeded();

    expect(store.list(alice, null, 0).items).toHaveLength(1);
    expect(store.list(alice, null, -1).items).toHaveLength(1);
    expect(store.list(alice, null, 1.5).items).toHaveLength(1);
  });

  // Totality through the cursor rather than a page count, because the interesting failure is a row served twice
  // or dropped at a page boundary, and a count assertion cannot see either.
  it('walks every row through the cursor exactly once, with equal timestamps in the set', () => {
    const store = sqliteNoteStore(freshDatabase());
    const written = new Set<string>();
    for (let index = 0; index < 7; index += 1) {
      // Two pairs share an instant, which is the case the id tiebreak exists for and the case the sibling's
      // unique index on a timestamp threw on.
      written.add(store.add(alice, { title: `n${index}`, body: 'x' }, at(Math.floor(index / 2))).id);
    }

    const walked: string[] = [];
    let cursor = null as Parameters<typeof store.list>[1];
    for (let page = 0; page < 10; page += 1) {
      const next = store.list(alice, cursor, 2);
      walked.push(...next.items.map((note) => note.id));
      cursor = next.nextCursor;
      if (cursor === null) {
        break;
      }
    }

    expect(walked).toHaveLength(written.size);
    expect(new Set(walked)).toEqual(written);
  });
});

describe('CON-1: an id is opaque and does not come back after a delete', () => {
  // E-83 and E-86 together. The id used to be `String(notes.size + 1)`, which is an enumeration of the tenant's
  // rows and, worse, COLLIDES after a delete: removing one of three rows makes the next mint reuse an id that is
  // still in use.
  it('does not reuse an id after a delete', () => {
    const store = sqliteNoteStore(freshDatabase());
    const first = store.add(alice, { title: 'a', body: 'x' }, at(1));
    const second = store.add(alice, { title: 'b', body: 'x' }, at(2));
    store.remove(alice, second.id);
    const third = store.add(alice, { title: 'c', body: 'x' }, at(3));

    expect(third.id).not.toBe(first.id);
    expect(third.id).not.toBe(second.id);
    expect(Number.isInteger(Number(third.id))).toBe(false);
  });

  it('gives two tenants ids that do not collide, so an id is not an index within a tenant', () => {
    const store = sqliteNoteStore(freshDatabase());

    expect(store.add(alice, { title: 'a', body: 'x' }, at(1)).id).not.toBe(
      store.add(bob, { title: 'a', body: 'x' }, at(1)).id,
    );
  });
});
