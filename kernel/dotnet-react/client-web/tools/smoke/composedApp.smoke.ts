import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { expect, test } from 'vitest';

// UI-5 composed-entrypoint smoke: loads the BUILT app against a running server and asserts at least one real
// request leaves the client per primary flow. The pilot declared "all green" while the composed product never
// called the API; this tier is what makes that impossible. It runs in the e2e context, where the edition's own
// orchestrator builds the client and exports VITE_API_BASE_URL and VITE_API_TOKEN before `npm run smoke`. This
// file is shared by both editions and each names its orchestrator differently, so it names neither (E-105 is the
// same rule one layer up, for the conformance record). TEST-2 driving the services directly stays necessary and
// is explicitly not sufficient.
//
// **The BUILT form, and E-107 is why.** This file used to import `../../src/main.tsx`, the SOURCE module. The
// shell reads `import.meta.env.VITE_API_BASE_URL`, which the BUILD replaces with a literal, and the test runner
// substitutes separately from its own environment, so the two are different events and a green line here was
// compatible with a bundle pointing somewhere else entirely. Measured before the change: building with the
// variable unset put `http://localhost:5080` into the bundle while this smoke was green against a random port in
// the same minute. The claim rules on exactly this case, that where the shell undergoes build-time substitution
// the smoke asserts the built form and never the source form, and the precondition holds here.
//
// So the entry module comes from the built `index.html`, and so does the DOM the app mounts into. A build that
// stops shipping `#root`, that emits a differently named chunk, or that bakes in the wrong base URL is a failure
// HERE rather than a discovery in production.

const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'dist');

// No default, deliberately, and E-96 is the reason: a control over a value that has a default cannot distinguish
// configuration arriving from a default that happens to equal it. The orchestrator hands this tier an
// OS-assigned port, so an absent value is a broken run rather than a local convenience.
const baseUrl = process.env.VITE_API_BASE_URL;
if (baseUrl === undefined || baseUrl === '') {
  throw new Error(
    'VITE_API_BASE_URL is not set. This tier asserts the BUILT client against the server the same value was built for, so there is nothing to assert without it; run the edition e2e orchestrator rather than this script alone.',
  );
}

function built(): { body: string; entry: string } {
  const indexPath = path.join(DIST, 'index.html');
  let html: string;
  try {
    html = readFileSync(indexPath, 'utf8');
  } catch {
    throw new Error(
      `No built client at ${indexPath}. This tier asserts the built form (E-107), so the orchestrator builds before it runs: npm run build with the same VITE_ values, then this.`,
    );
  }
  const script = /<script[^>]*\ssrc="([^"]+)"/.exec(html);
  const body = /<body[^>]*>([\s\S]*?)<\/body>/.exec(html);
  if (script === null || body === null) {
    throw new Error(`The built index.html has no module script or no body: ${indexPath}`);
  }
  // The href is site-absolute in the built HTML; on disk it is relative to dist/.
  return { body: body[1] ?? '', entry: path.join(DIST, (script[1] ?? '').replace(/^\//, '')) };
}

interface Sent {
  method: string;
  url: string;
}

const sent: Sent[] = [];
const realFetch = globalThis.fetch;
globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  sent.push({ method: init?.method ?? 'GET', url: String(input) });
  return realFetch(input, init);
}) as typeof fetch;

async function until(predicate: () => boolean, what: string, timeoutMs = 15000): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timed out waiting for ${what}.`);
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

test('the composed entrypoint makes a real request per primary flow', async () => {
  const { body, entry } = built();

  // The BUILT body, not a hand-written one: `#root` is the build's to ship, and a template that stops shipping it
  // is a broken product a hand-written fixture would hide.
  document.body.innerHTML = body;
  await import(pathToFileURL(entry).href);

  // Primary flow 1: the notes list loads from the server through the composed repo, and the screen renders it.
  // The URL asserted is the one the BUILD was given, so a bundle that baked in a different base fails here.
  await until(() => sent.some((s) => s.method === 'GET' && s.url === `${baseUrl}/notes`), 'the list request');
  await until(
    () => document.querySelector('[data-atom="note-list"], [data-atom="empty-state"]') !== null,
    'the screen to render the server data',
  );

  // Primary flow 2: creating a note is a real POST through the composed repo, followed by a real re-list.
  const listCallsBeforeCreate = sent.filter((s) => s.method === 'GET' && s.url === `${baseUrl}/notes`).length;
  const button = document.querySelector<HTMLButtonElement>('[data-atom="header"] button');
  if (!button) {
    throw new Error('The New note button did not render.');
  }
  button.click();
  await until(() => sent.some((s) => s.method === 'POST' && s.url === `${baseUrl}/notes`), 'the create request');
  await until(
    () => sent.filter((s) => s.method === 'GET' && s.url === `${baseUrl}/notes`).length > listCallsBeforeCreate,
    'the refresh after create',
  );

  expect(document.querySelector('[data-atom="note-list"]')).not.toBeNull();
  // The explicit timeout exceeds the until() waits (15s), so a failure surfaces the NAMED wait that timed out
  // rather than vitest's generic 5s test timeout.
}, 20_000);
