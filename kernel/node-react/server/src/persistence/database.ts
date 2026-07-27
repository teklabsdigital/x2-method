import { DatabaseSync } from 'node:sqlite';

// The engine seam: the one module that opens a database.
//
// The engine is `node:sqlite`, declared in `edition.json` under `engine` and nowhere else, which is DB2's shape.
// It adds no dependency, so it adds no supply-chain surface, and its version IS the runtime version. That is why
// the runtime is now pinned across six surfaces with a ledger row and an agreement check (E-92): the runtime
// reports this module as experimental, so a floating `>=24` was a floating database engine.
//
// **Migrations are never applied at startup**, and the split between this file and `migrator.ts` makes that
// structural rather than conventional. A host that migrates on boot makes every replica a schema author, and
// rolling replacement then runs two schema versions against each other in an order nobody chose.
//
// The split was forced by a lint and is better than what it replaced. `compose.ts` imports this module, so
// anything imported HERE lands in the server's import graph. The migration runner reads `.sql` files, and the
// filesystem ban exists so that SEC-5's "secrets are read in one place" is a statement about the server rather
// than about one code path. Keeping the reader here would have pulled `node:fs` into a process that never calls
// it. Now the serving process can open a database and CANNOT read a file, which is a stronger sentence than a
// convention saying it does not.

export type Database = DatabaseSync;

export function openDatabase(file: string): Database {
  const db = new DatabaseSync(file);
  // Referential integrity is off by default in SQLite, which is a compatibility decision from 2005 and not a
  // recommendation. A foreign key that is not enforced is a comment.
  db.exec('PRAGMA foreign_keys = ON');
  return db;
}
