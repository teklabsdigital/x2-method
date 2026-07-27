import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import type { Database } from './database.ts';

// The migration runner, deliberately NOT in `database.ts`.
//
// `compose.ts` imports `database.ts`, so every import there lands in the server's import graph. This module reads
// `.sql` files off disk, and the filesystem ban exists so SEC-5's "secrets are read in one place" is a statement
// about the server rather than about one code path. Keeping the reader here means the serving process can open a
// database and cannot read a file. Nothing in the request path imports this module: the migrate script does, and
// test fixtures do.

export const MIGRATIONS_DIRECTORY = path.resolve(import.meta.dirname, 'migrations');

// The applied-migrations table is created here rather than by a migration, because a migration that creates the
// table recording which migrations ran cannot record itself.
const APPLIED = `CREATE TABLE IF NOT EXISTS applied_migrations (
  name        TEXT PRIMARY KEY,
  applied_utc TEXT NOT NULL
) STRICT`;

export function migrationFiles(directory: string = MIGRATIONS_DIRECTORY): string[] {
  // Sorted by name, which is what makes the numeric prefix load-bearing rather than decorative. Readdir order is
  // filesystem order and differs between machines, and a migration set applied in two different orders is two
  // different schemas.
  return readdirSync(directory)
    .filter((entry) => entry.endsWith('.sql'))
    .sort();
}

// Returns the migrations it applied, so a caller can assert that a fresh database applied the whole set and that a
// second call applies none. A migrate function that reports nothing is one whose idempotence nobody has checked.
export function migrate(db: Database, now: Date, directory: string = MIGRATIONS_DIRECTORY): string[] {
  db.exec(APPLIED);
  const already = new Set(
    (db.prepare('SELECT name FROM applied_migrations').all() as { name: string }[]).map((row) => row.name),
  );

  const applied: string[] = [];
  for (const name of migrationFiles(directory)) {
    if (already.has(name)) {
      continue;
    }
    const sql = readFileSync(path.join(directory, name), 'utf8');
    // One transaction per migration, so a migration that fails halfway leaves the database on the version it was
    // on rather than on a version no file describes.
    db.exec('BEGIN');
    try {
      db.exec(sql);
      db.prepare('INSERT INTO applied_migrations (name, applied_utc) VALUES (?, ?)').run(name, now.toISOString());
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw new Error(
        `migration ${name} failed and was rolled back: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    applied.push(name);
  }
  return applied;
}
