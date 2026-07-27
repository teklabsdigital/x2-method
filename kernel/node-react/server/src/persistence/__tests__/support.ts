import { openDatabase, type Database } from '../database.ts';
import { migrate } from '../migrator.ts';
import { systemClock } from '../../platform/clock.ts';

// A fresh, migrated, in-process database per caller.
//
// `:memory:` is a REAL engine, not a fake provider, and the difference is the whole of TEST-1's second obligation.
// The claim bans a fake in-memory PROVIDER (the kind that reimplements a query API over a dictionary and answers
// questions the real engine would refuse); it asks for unavoidable data shapes to run on a real embedded engine,
// which is exactly what this is. The same SQLite that serves a file serves this, with the same parser, the same
// type rules and the same constraint enforcement. What it does not give is a second engine's opinion, which is
// what the sibling's container tier exists for and what this edition does not have.
//
// **The REAL migrations are applied**, never a hand-written CREATE TABLE beside them. A fixture that builds its
// own schema tests a schema nobody deploys, and the divergence shows up as a passing suite over a table that does
// not exist in production.
export function freshDatabase(): Database {
  const db = openDatabase(':memory:');
  const applied = migrate(db, systemClock.now());
  if (applied.length === 0) {
    // A fresh database that applied no migration means the migration directory was not found or was empty, and
    // every test built on it would then run against a schema-less database and fail confusingly, or worse, pass.
    throw new Error('a fresh database applied no migrations; the migration set is empty or unreachable.');
  }
  return db;
}
