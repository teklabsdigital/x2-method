import { expect, test } from 'vitest';

// UI-5 composed-entrypoint smoke: boots the ACTUAL app entrypoint (src/main.tsx, the composition root) against a
// running server and asserts at least one real request leaves the client per primary flow. The pilot declared
// "all green" while the composed product never called the API; this tier is what makes that impossible. It runs
// in the e2e context (scripts/e2e.sh exports VITE_API_BASE_URL and VITE_API_TOKEN before `npm run smoke`); TEST-2
// driving the services directly stays necessary and is explicitly not sufficient.

const baseUrl = process.env.VITE_API_BASE_URL ?? 'http://localhost:5080';

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
  document.body.innerHTML = '<div id="root"></div>';
  await import('../../src/main.tsx');

  // Primary flow 1: the notes list loads from the server through the composed repo, and the screen renders it.
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
