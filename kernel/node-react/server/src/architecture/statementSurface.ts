import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { EDITION_ROOT } from '../platform/settings.ts';
import type { Violation } from './endpointSpine.ts';

// TEN-2 and DATA-2 over every query this server is capable of running.
//
// **This scan exists because of a structural property the sibling does not have, and E-77 is the record of why.**
// There, read tenancy is a hand-written `.Where(n => n.TenantId == tenantId)` repeated in each read method, so a
// cross-tenant read is the ABSENCE of a predicate. Absence has no syntax. A scan for it would be green forever,
// which is why that edition's ledger obligation is owed with the chokepoint named as a precondition rather than
// with a scan restated in words. Here every statement is a string literal in one exported object, so the set of
// queries the store CAN run is a value a scan can read, and "every query is tenant-scoped" becomes a statement
// about the store rather than about the three methods somebody remembered to check.
//
// E-50 is what the missing version cost: removing the tenant filter from the sibling's delete left 113
// architecture tests and 19 unit tests green, and the path then answered 500 where the read answered 404, which
// is an existence oracle a caller can use.
//
// The scan is static. It reads the source rather than importing it, so it sees the statements a module DECLARES
// rather than the ones a particular composition happened to build, and a query assembled at runtime is reported
// rather than missed (see `notLiteral` below). That is the same choice `configurationSurface.ts` makes and for
// the same reason: what a test can import is what one code path produced.

const TENANT_COLUMN = 'tenant_id';

// The name IS the registry, and that is deliberate rather than incidental. The chokepoint only holds if every
// query lives in an object a scan can find, so the object has a fixed name and the prepare-site check below
// refuses SQL that reaches the engine any other way. A second store declares its own `STATEMENTS` and is scanned
// the day it is written, without this file changing.
const STATEMENT_SET_NAME = 'STATEMENTS';

// The two files permitted to hand the engine something that is not a `STATEMENTS` member, each with the reason,
// in the carve-out discipline SEC-1's anonymous allowlist and the endpoint spine's registries already use. A
// stale entry is reported, because an exemption nobody needs is a pre-authorized hole.
type Exemption = Readonly<{ file: string; why: string }>;

const EXEMPTIONS: readonly Exemption[] = Object.freeze([
  Object.freeze({
    file: 'server/src/persistence/migrator.ts',
    why: 'DDL read from the committed migration files. Migration SQL creates the tenant column rather than filtering on it, so a tenant predicate is not merely absent, it is meaningless; the statements are also not literals in this module at all, they are file contents. HUM-1 covers the migration directory as an irreversible surface.',
  }),
  Object.freeze({
    file: 'server/src/persistence/database.ts',
    why: 'one PRAGMA, executed once at open, turning on foreign key enforcement. It reads no table, so it has no tenancy, and it is a literal here rather than in a statement set because a connection setting is not a query.',
  }),
]);

// SQL that ends a WHERE region. Everything between `WHERE` and the first of these is the predicate.
const CLAUSE_ENDS: readonly string[] = Object.freeze(['ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'RETURNING']);

const VERBS: readonly string[] = Object.freeze(['SELECT', 'INSERT', 'UPDATE', 'DELETE']);

// The reach, stated rather than left to be discovered. These are text predicates over single statements, not a
// SQL parser. A subquery carrying its own WHERE, a CTE, or a statement built from fragments would each need a
// parser to judge, and none of the three can occur in a set whose members are required to be plain literals and
// which this scan reads in full. If one ever does, the honest move is a parser rather than a longer regex, and
// the failure mode meanwhile is the safe one: an unrecognized shape is a violation, never a pass.
export function scanStatements(label: string, statements: Readonly<Record<string, string>>): readonly Violation[] {
  const violations: Violation[] = [];

  for (const [name, sql] of Object.entries(statements)) {
    const at = `${label} ${STATEMENT_SET_NAME}.${name}`;
    const flat = sql.replace(/\s+/g, ' ').trim();
    const upper = flat.toUpperCase();
    const verb = VERBS.find((candidate) => upper.startsWith(`${candidate} `));

    if (verb === undefined) {
      violations.push({
        claim: 'TEN-2',
        at,
        message: `does not begin with ${VERBS.join(', ')}, so this scan cannot say what it touches or whether it is tenant-scoped. An unrecognized statement is refused rather than assumed harmless: a scan whose default is to pass is the scan E-50 measured the cost of.`,
      });
      continue;
    }

    if (verb === 'INSERT') {
      // The column list, which is the INSERT form of a predicate: a row written without naming the tenant column
      // is a row nothing can scope afterwards.
      const columns = /^INSERT\s+INTO\s+\S+\s*\(([^)]*)\)/i.exec(flat);
      if (columns === null) {
        violations.push({
          claim: 'TEN-2',
          at,
          message: `is an INSERT with no explicit column list. The columns have to be named for the tenant column to be checkable, and an INSERT that relies on table order breaks silently the day a column is added.`,
        });
      } else if (!columnNames(columns[1] ?? '').includes(TENANT_COLUMN)) {
        violations.push({
          claim: 'TEN-2',
          at,
          message: `writes a row without naming '${TENANT_COLUMN}'. A row written with no tenant is a row that belongs to everyone or to no one, and no later filter can repair it.`,
        });
      }
    } else {
      const where = predicateOf(flat, upper);
      if (where === undefined) {
        violations.push({
          claim: 'TEN-2',
          at,
          message: `has no WHERE clause, so it reads or writes every tenant's rows. Tenant scope is established at the entry and fails closed; a statement with no predicate is the fail-open default the claim forbids.`,
        });
      } else if (!/\btenant_id\s*=\s*\?/i.test(where)) {
        violations.push({
          claim: 'TEN-2',
          at,
          message: `has a WHERE clause that does not constrain '${TENANT_COLUMN}' to a parameter (${JSON.stringify(where.trim())}). Projecting the column is not filtering on it: a SELECT can name '${TENANT_COLUMN}' in its column list and still read every tenant, which is the shape a substring check would pass.`,
        });
      }
    }

    if (verb === 'SELECT' && !/\bLIMIT\b/i.test(upper)) {
      violations.push({
        claim: 'DATA-2',
        at,
        message: `is a SELECT with no LIMIT. The query that returned 50 rows in development returns five million in production year two, and a bound applied by one caller is a bound on that caller rather than on the read.`,
      });
    }

    if (/\bOFFSET\b/i.test(upper)) {
      violations.push({
        claim: 'DATA-2',
        at,
        message: `pages by OFFSET. Offset paging degrades linearly and silently skips rows under concurrent writes; the keyset form is a row comparison against the ordering columns.`,
      });
    }
  }

  return Object.freeze(violations);
}

// The whole surface: every statement set this server declares, plus every site that hands the engine SQL.
//
// **It reports finding nothing as a violation**, which is the one thing a scan like this usually cannot say about
// itself. E-11 established the shape and E-92 named it exactly: a walk that reaches no files returns the same
// empty array as a walk that reached everything and approved of it. A renamed directory, a moved store or a
// changed constant name would each turn this scan silently vacuous, so silence is refused here rather than in a
// test that somebody has to remember to write.
export function scanStatementSurface(
  root: string = path.join(EDITION_ROOT, 'server', 'src'),
  exemptions: readonly Exemption[] = EXEMPTIONS,
  engineRoot: string = path.join(EDITION_ROOT, 'server', 'src', 'persistence'),
): readonly Violation[] {
  const violations: Violation[] = [];
  const used = new Set<Exemption>();
  let setsFound = 0;

  for (const file of walk(root)) {
    const relative = path.relative(EDITION_ROOT, file).split(path.sep).join('/');
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);

    for (const set of statementSets(source)) {
      setsFound += 1;
      violations.push(...set.notLiteral.map((name) => notLiteralViolation(relative, name)));
      violations.push(...scanStatements(relative, set.statements));
    }
  }

  // The two questions have different scopes on purpose, and the difference was measured rather than designed.
  //
  // A statement SET is scanned wherever it is declared, because a query is a query. The loose-execution check runs
  // over the persistence tree alone, and the first version did not: it walked everything and reported
  // `BEARER.exec(header)` in the credential verifier and `/^INSERT.../.exec(flat)` in this very file, because
  // `exec` is `RegExp.prototype.exec` as well as `DatabaseSync.prototype.exec` and a predicate matching on method
  // NAME cannot tell two unrelated APIs apart. That is E-9's finding in a new place: a name-shaped predicate
  // resolves on spelling, and spelling is shared.
  //
  // Narrowing to `persistence/` is not a dodge, and it is worth being explicit about what it leans on. Nothing
  // outside this directory can execute SQL, because nothing outside it is given a `Database`: `compose.ts` opens
  // one and hands it to the store, and DATA-1's downward-dependency rule is what keeps it there. So this check is
  // sound exactly as far as that rule holds, and it is the import-graph scan, not this file, that holds it. Two
  // mechanisms, each stating what it rests on, is the honest form; one mechanism quietly assuming the other is
  // how a scan ends up proving something about a tree nobody constrained.
  for (const file of walk(engineRoot)) {
    const relative = path.relative(EDITION_ROOT, file).split(path.sep).join('/');
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);

    const exempt = exemptions.find((candidate) => candidate.file === relative);
    const loose = looseExecutions(source);
    if (exempt !== undefined) {
      used.add(exempt);
    } else {
      violations.push(...loose.map((where) => looseViolation(relative, where)));
    }
  }

  if (setsFound === 0) {
    violations.push({
      claim: 'TEN-2',
      at: root,
      message: `found no ${STATEMENT_SET_NAME} in the tree, so every assertion above passed by reaching nothing. A scan that approves of an empty enumeration is the failure mode E-11 recorded and E-92 named; if the statements have moved, this scan has to be told where.`,
    });
  }

  for (const exemption of exemptions) {
    if (!used.has(exemption)) {
      violations.push({
        claim: 'TEN-2',
        at: exemption.file,
        message: `is exempted from the statement chokepoint and no longer exists, or no longer executes SQL. An exemption nobody needs is a pre-authorized hole waiting for a query; delete it.`,
      });
    }
  }

  return Object.freeze(violations);
}

// The reach, exposed for the same reason `scannedFiles()` is in `configurationSurface.ts`: a scan returning no
// violations is the same output whether it read five statements or none, and the vacuity guard inside the scan
// catches only the total case. A test naming the statements it expects to find is what catches the partial one, a
// walk that reaches the store but stops reading halfway down the object.
export function declaredStatements(
  root: string = path.join(EDITION_ROOT, 'server', 'src'),
): readonly Readonly<{ file: string; name: string }>[] {
  const found: Array<{ file: string; name: string }> = [];
  for (const file of walk(root)) {
    const relative = path.relative(EDITION_ROOT, file).split(path.sep).join('/');
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
    for (const set of statementSets(source)) {
      for (const name of Object.keys(set.statements)) {
        found.push(Object.freeze({ file: relative, name }));
      }
    }
  }
  return Object.freeze(found);
}


function notLiteralViolation(relative: string, name: string): Violation {
  return {
    claim: 'TEN-2',
    at: `${relative} ${STATEMENT_SET_NAME}.${name}`,
    message: `is not a plain string literal, so no scan can read what it queries. A statement assembled at runtime defeats the chokepoint this whole mechanism rests on, whatever the assembled text turns out to say.`,
  };
}

function looseViolation(relative: string, where: string): Violation {
  return {
    claim: 'TEN-2',
    at: `${relative} ${where}`,
    message: `hands the engine SQL that is not a ${STATEMENT_SET_NAME} member. Every query has to live in the scanned set, or the set describes only the queries whose author chose to put them there, and the scan becomes a statement about good intentions.`,
  };
}

// A declared statement set, read statically. A property whose value is not a plain literal is reported by name
// rather than skipped, because skipping it is exactly how a chokepoint stops being one.
type StatementSet = Readonly<{ statements: Record<string, string>; notLiteral: readonly string[] }>;

function statementSets(source: ts.SourceFile): readonly StatementSet[] {
  const sets: StatementSet[] = [];

  const visit = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === STATEMENT_SET_NAME &&
      node.initializer !== undefined
    ) {
      const literal = objectLiteralOf(node.initializer);
      if (literal !== undefined) {
        sets.push(readSet(literal));
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  return sets;
}

// `Object.freeze({...})` and a bare `{...}` are the same declaration for this purpose. The freeze is what stops
// the set being edited at runtime; it is not what makes it readable.
function objectLiteralOf(node: ts.Expression): ts.ObjectLiteralExpression | undefined {
  if (ts.isObjectLiteralExpression(node)) {
    return node;
  }
  if (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === 'freeze' &&
    node.arguments.length === 1
  ) {
    return objectLiteralOf(node.arguments[0] as ts.Expression);
  }
  return undefined;
}

function readSet(literal: ts.ObjectLiteralExpression): StatementSet {
  const statements: Record<string, string> = {};
  const notLiteral: string[] = [];

  for (const property of literal.properties) {
    if (!ts.isPropertyAssignment(property)) {
      notLiteral.push(property.name !== undefined && ts.isIdentifier(property.name) ? property.name.text : '(unnamed)');
      continue;
    }
    const name = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name) ? property.name.text : '(computed)';
    const value = property.initializer;
    if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) {
      statements[name] = value.text;
    } else {
      notLiteral.push(name);
    }
  }

  return Object.freeze({ statements, notLiteral: Object.freeze(notLiteral) });
}

// Every site that hands the engine a statement. `prepare` and `exec` are the two `node:sqlite` entry points that
// take SQL, and both are checked, because banning one leaves the other as the way round it.
function looseExecutions(source: ts.SourceFile): readonly string[] {
  const loose: string[] = [];

  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      (node.expression.name.text === 'prepare' || node.expression.name.text === 'exec') &&
      node.arguments.length > 0 &&
      !isStatementMember(node.arguments[0] as ts.Expression)
    ) {
      const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
      loose.push(`line ${line + 1}, ${node.expression.name.text}()`);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  return loose;
}

function isStatementMember(argument: ts.Expression): boolean {
  return (
    ts.isPropertyAccessExpression(argument) &&
    ts.isIdentifier(argument.expression) &&
    argument.expression.text === STATEMENT_SET_NAME
  );
}

function columnNames(list: string): readonly string[] {
  return list.split(',').map((column) => column.trim().toLowerCase());
}

function predicateOf(flat: string, upper: string): string | undefined {
  const start = upper.indexOf(' WHERE ');
  if (start < 0) {
    return undefined;
  }
  const from = start + ' WHERE '.length;
  let end = flat.length;
  for (const clause of CLAUSE_ENDS) {
    const at = upper.indexOf(` ${clause} `, from);
    if (at >= 0 && at < end) {
      end = at;
    }
  }
  return flat.slice(from, end);
}

function walk(root: string): readonly string[] {
  let entries: string[];
  try {
    entries = readdirSync(root);
  } catch {
    return [];
  }
  const found: string[] = [];
  for (const entry of entries) {
    const full = path.join(root, entry);
    if (entry === 'node_modules' || entry === 'dist' || entry === '__tests__') {
      continue;
    }
    if (statSync(full).isDirectory()) {
      found.push(...walk(full));
    } else if (path.extname(entry) === '.ts') {
      found.push(full);
    }
  }
  return found;
}
