import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { RecordedRoute } from '../platform/routeTable.ts';

// CON-2's producer half. The consumer half has existed since the client was written: `noteContract.test.ts`
// reads the fixture off disk and checks the client's three types against it. Nothing on this side read it, and
// E-82 is what that costs: a fixture only the consumer reads is a second copy of the consumer's own beliefs, and
// the two agree with each other forever because only one of them is ever asked. A rename in `routes/notes.ts`
// passed every gate in this edition while the client went on asserting the old name.
//
// The fixture is a SHARED-tier file, composed into both editions from `kernel/shared/`, which is the shape CON-2's
// own weakening note describes: two consumers that must each stand alone after being copied, so "physically the
// same file" is unrealizable and the sanctioned alternative applies. One authoritative source, a materializer
// that copies it, and a check mode that fails the build when a copy differs. `compose.mjs --check` is that check
// and it runs in the loop. What this file adds is the other thing the alternative still owes: the producer has to
// be ASKED.
//
// Pure over passed-in data, deliberately, and the reason is E-79. The sibling edition's equivalent scans reflect
// over the host they are hosted by, so the only surface they can be handed is the shipped one, which has no
// violation in it; the identical vacuity probe left five of its assertions green and failed twenty-three here.
// A predicate that takes its route table as an argument can be handed a VIOLATING table, so every refusal below
// is a test asserting that a defect is reported, not a test asserting the shipped tree is clean.

// A binding lives on the route, in `config`, next to the policy. Not in a table inside this file: a map here
// would be a third copy of the same beliefs, maintained by whoever remembers this file exists, and the route
// author is the person who knows which contract a schema realizes. `config` is already recorded by reference on
// every route table entry, so the binding travels with the route through the same enumeration every other claim
// guard stands on.
//
// Keys are `body` or a response status code as it appears in `schema.response`. Values are contract names in the
// fixture.
export type ContractBindings = Readonly<Record<string, string>>;

export type ContractFixture = Readonly<Record<string, unknown>>;

// Keys beginning with an underscore are prose, not contracts. The fixture carries its own `_comment` explaining
// what it is for, which is worth more to a reader than a filename, and a convention is cheaper than a second file.
const isContractName = (key: string): boolean => !key.startsWith('_');

export const FIXTURE_PATH = path.resolve(
  import.meta.dirname,
  '..',
  '..',
  '..',
  'client-web',
  'src',
  'data',
  '__fixtures__',
  'note-contract.fixture.json',
);

export function readContractFixture(at: string = FIXTURE_PATH): ContractFixture {
  return JSON.parse(readFileSync(at, 'utf8')) as ContractFixture;
}

export function contractNames(fixture: ContractFixture): string[] {
  return Object.keys(fixture).filter(isContractName).sort();
}

// One string per violation, and every one names the claim, the route, the surface and both field sets. A finding
// a reader cannot act on without opening three files is a finding that gets suppressed.
export function contractParityFindings(fixture: ContractFixture, routes: readonly RecordedRoute[]): string[] {
  const findings: string[] = [];
  const declared = new Set(contractNames(fixture));
  const bound = new Set<string>();

  for (const route of routes) {
    const bindings = route.config.contracts;
    if (bindings === undefined) {
      continue;
    }
    const at = `${route.method} ${route.url}`;

    if (bindings === null || typeof bindings !== 'object' || Array.isArray(bindings)) {
      findings.push(`${at}: config.contracts is ${Array.isArray(bindings) ? 'an array' : String(bindings)}, not an object mapping surfaces to contract names (CON-2).`);
      continue;
    }

    for (const [surface, contract] of Object.entries(bindings as Record<string, unknown>)) {
      if (typeof contract !== 'string') {
        findings.push(`${at}: config.contracts.${surface} is ${typeof contract}, not a contract name (CON-2).`);
        continue;
      }
      if (!declared.has(contract)) {
        findings.push(
          `${at}: config.contracts.${surface} names '${contract}', which the shared fixture does not carry. Declared contracts: ${[...declared].join(', ')} (CON-2).`,
        );
        continue;
      }
      bound.add(contract);

      const schema = surfaceSchema(route, surface);
      if (schema === undefined) {
        findings.push(
          `${at}: config.contracts.${surface} claims to realize '${contract}' but the route declares no schema at that surface, so there is nothing for the fixture to pin (CON-2).`,
        );
        continue;
      }

      const served = propertyNames(schema);
      if (served === undefined) {
        findings.push(
          `${at}: schema at ${surface} declares no properties object, so its field set is unreadable and '${contract}' is pinned to nothing (CON-2).`,
        );
        continue;
      }

      const expected = fixture[contract];
      if (!Array.isArray(expected) || expected.some((name) => typeof name !== 'string')) {
        findings.push(`the fixture's '${contract}' is not an array of field names, so nothing can be pinned to it (CON-2).`);
        continue;
      }

      const want = [...(expected as string[])].sort();
      const got = [...served].sort();
      if (want.join(',') !== got.join(',')) {
        const missing = want.filter((name) => !got.includes(name));
        const extra = got.filter((name) => !want.includes(name));
        findings.push(
          `${at}: ${surface} realizes '${contract}' but its field set has drifted. Fixture: ${want.join(', ')}. Served: ${got.join(', ')}.` +
            `${missing.length > 0 ? ` Missing: ${missing.join(', ')}.` : ''}${extra.length > 0 ? ` Unpinned: ${extra.join(', ')}.` : ''} (CON-2)`,
        );
      }
    }
  }

  // The enumeration half, and the half that makes this more than a per-route spot check. The fixture is CON-2's
  // corpus of hand-mirrored contracts, so a contract sitting in it that no route claims is a contract the client
  // asserts against and the server has never been asked about. That is exactly the state E-82 found, and without
  // this loop a producer-side test would have reported a clean pass for it: the two contracts that WERE bound
  // both matched, and the one that was not bound was the one that had drifted.
  for (const contract of declared) {
    if (!bound.has(contract)) {
      findings.push(
        `the fixture declares '${contract}' and no route binds it, so the client asserts a contract this server has never been asked about (CON-2).`,
      );
    }
  }

  return findings.sort();
}

// What is NOT covered, said here rather than discovered later: a hand-mirrored contract that never entered the
// fixture is invisible to this and to the client test alike, because the fixture is the register and a register
// cannot report what was never written into it. CON-2 names the fixture as the corpus, so enumerating from it is
// the claim's own registry rather than a heuristic, but the gap is real and the conformance row carries it.

function surfaceSchema(route: RecordedRoute, surface: string): unknown {
  if (surface === 'body') {
    return route.schema.body;
  }
  const response = route.schema.response;
  if (response === null || typeof response !== 'object') {
    return undefined;
  }
  return (response as Record<string, unknown>)[surface];
}

function propertyNames(schema: unknown): string[] | undefined {
  if (schema === null || typeof schema !== 'object') {
    return undefined;
  }
  const properties = (schema as Record<string, unknown>).properties;
  if (properties === null || typeof properties !== 'object') {
    return undefined;
  }
  return Object.keys(properties as Record<string, unknown>);
}
