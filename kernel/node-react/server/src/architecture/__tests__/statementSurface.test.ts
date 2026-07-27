import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { EDITION_ROOT } from '../../platform/settings.ts';
import { STATEMENTS } from '../../persistence/notes/sqliteNoteStore.ts';
import { declaredStatements, scanStatementSurface, scanStatements } from '../statementSurface.ts';

// TEN-2 and DATA-2 over the statement chokepoint, with a red proof for every branch.
//
// The green assertion alone would be worth very little here and the file says so rather than implying it: this
// tree has one store with five statements, all of them correct, so a scan that reached none of them and a scan
// that read all five return the same empty array. Every branch below is therefore driven from a fixture, and the
// two vacuity cases (nothing found, and a set found but half read) are assertions in their own right.

const scratch = (files: Readonly<Record<string, string>>): string => {
  const root = mkdtempSync(path.join(tmpdir(), 'statements-'));
  for (const [relative, contents] of Object.entries(files)) {
    const full = path.join(root, relative);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, contents, 'utf8');
  }
  return root;
};

const messages = (violations: readonly { claim: string; message: string }[]): string =>
  violations.map((violation) => `${violation.claim}: ${violation.message}`).join('\n');

describe('TEN-2 and DATA-2 hold over every statement the server can run', () => {
  it('finds no violation in the tree as it stands', () => {
    expect(scanStatementSurface()).toEqual([]);
  });

  // The reach assertion. A walk that stopped at the first property, or that found the store and could not read
  // its object, would leave the scan above green while covering a fraction of what it claims to cover.
  it('reads every statement the store declares, which a green scan cannot say it did', () => {
    const declared = declaredStatements();

    expect(declared.map((entry) => entry.name).sort()).toEqual([
      'get',
      'insert',
      'listAfter',
      'listFirst',
      'remove',
    ]);
    expect(new Set(declared.map((entry) => entry.file))).toEqual(
      new Set(['server/src/persistence/notes/sqliteNoteStore.ts']),
    );
    // The set the scan read IS the set the store executes, rather than a second copy that agrees with it today.
    expect(declared.map((entry) => entry.name).sort()).toEqual(Object.keys(STATEMENTS).sort());
  });
});

describe('TEN-2: every statement is tenant-scoped, or it is a violation', () => {
  it('refuses a read with no WHERE clause at all', () => {
    expect(messages(scanStatements('fixture', { all: 'SELECT id FROM notes LIMIT 10' }))).toMatch(
      /TEN-2.*no WHERE clause/s,
    );
  });

  // The trap a substring check walks straight into, and the reason this scan reads the PREDICATE rather than the
  // statement. `tenant_id` appears in the text of this query twice and constrains nothing.
  it('refuses a read that projects the tenant column without filtering on it', () => {
    const violations = scanStatements('fixture', {
      leak: 'SELECT tenant_id, id FROM notes WHERE id = ? ORDER BY tenant_id LIMIT 10',
    });

    expect(messages(violations)).toMatch(/TEN-2.*does not constrain 'tenant_id'/s);
  });

  it('refuses a delete with no tenant predicate', () => {
    expect(messages(scanStatements('fixture', { wipe: 'DELETE FROM notes WHERE id = ?' }))).toMatch(
      /TEN-2.*does not constrain 'tenant_id'/s,
    );
  });

  it('refuses a write that does not name the tenant column', () => {
    expect(messages(scanStatements('fixture', { add: 'INSERT INTO notes (id, title) VALUES (?, ?)' }))).toMatch(
      /TEN-2.*without naming 'tenant_id'/s,
    );
  });

  it('refuses a write with no column list, because table order is not a contract', () => {
    expect(messages(scanStatements('fixture', { add: 'INSERT INTO notes VALUES (?, ?, ?)' }))).toMatch(
      /TEN-2.*no explicit column list/s,
    );
  });

  // Fail-closed on the shape it does not recognize. A scan whose default is to pass would approve of every
  // statement it was never taught to read, which is the whole failure mode.
  it('refuses a statement whose verb it cannot read', () => {
    expect(messages(scanStatements('fixture', { odd: 'PRAGMA journal_mode = WAL' }))).toMatch(
      /TEN-2.*does not begin with/s,
    );
  });

  it('accepts the shapes the store actually uses, so the refusals above are the violation and not the scan', () => {
    expect(scanStatements('fixture', { ...STATEMENTS })).toEqual([]);
  });
});

describe('DATA-2: reads are bounded, and bounded by keyset', () => {
  it('refuses a SELECT with no LIMIT', () => {
    expect(messages(scanStatements('fixture', { unbounded: 'SELECT id FROM notes WHERE tenant_id = ?' }))).toMatch(
      /DATA-2.*no LIMIT/s,
    );
  });

  it('refuses offset paging', () => {
    const violations = scanStatements('fixture', {
      paged: 'SELECT id FROM notes WHERE tenant_id = ? LIMIT ? OFFSET ?',
    });

    expect(messages(violations)).toMatch(/DATA-2.*OFFSET/s);
  });
});

describe('the chokepoint holds, so the set is the whole surface and not a habit', () => {
  it('refuses SQL handed to the engine outside the statement set', () => {
    const root = scratch({
      'persistence/sneaky.ts': "export const run = (db: Database) => db.prepare('SELECT * FROM notes').all();\n",
    });

    const violations = scanStatementSurface(root, [], root);

    expect(messages(violations)).toMatch(/TEN-2.*not a STATEMENTS member/s);
  });

  it('refuses a statement it cannot read statically', () => {
    const root = scratch({
      'persistence/built.ts': 'export const STATEMENTS = Object.freeze({ listFirst: buildQuery() });\n',
    });

    expect(messages(scanStatementSurface(root, [], root))).toMatch(/TEN-2.*not a plain string literal/s);
  });

  // The two vacuity guards. The first is inside the scan rather than in this file on purpose: a check that only a
  // test can make is a check that disappears the day somebody writes a second caller.
  it('refuses a tree in which it found no statements at all', () => {
    const root = scratch({ 'persistence/empty.ts': 'export const nothing = 1;\n' });

    expect(messages(scanStatementSurface(root, [], root))).toMatch(/TEN-2.*found no STATEMENTS/s);
  });

  it('refuses an exemption that no longer matches anything', () => {
    const root = scratch({
      'persistence/store.ts':
        "export const STATEMENTS = Object.freeze({ get: 'SELECT id FROM notes WHERE tenant_id = ? LIMIT 1' });\n",
    });

    const violations = scanStatementSurface(
      root,
      [{ file: 'nowhere/gone.ts', why: 'a file that was deleted three passes ago' }],
      root,
    );

    expect(messages(violations)).toMatch(/TEN-2.*no longer exists/s);
  });

  it('lets an exemption that is used cover its file, and reports nothing else about it', () => {
    const root = scratch({
      'persistence/migrator.ts': 'export const apply = (db: Database, sql: string) => db.exec(sql);\n',
      'persistence/store.ts':
        "export const STATEMENTS = Object.freeze({ get: 'SELECT id FROM notes WHERE tenant_id = ? LIMIT 1' });\n",
    });
    // Computed with the same expression the scan labels files by. An exemption is matched against an
    // edition-relative path, so a fixture tree has to name itself the way the scan will name it; getting this
    // wrong is what the stale-exemption branch above reports, which is how the mistake surfaced.
    const relative = path
      .relative(EDITION_ROOT, path.join(root, 'persistence/migrator.ts'))
      .split(path.sep)
      .join('/');

    expect(scanStatementSurface(root, [{ file: relative, why: 'DDL' }], root)).toEqual([]);
  });
});
