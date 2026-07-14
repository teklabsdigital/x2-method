import { KernelClient } from '../../src/api/client.ts';
import { NotesRepo } from '../../src/data/notesRepo.ts';
import { redact } from './redact.ts';

// TEST-2 out-of-process e2e harness. Drives the REAL client services (KernelClient + NotesRepo) against a running
// server, emits one NDJSON line per scenario (redacted, SEC-6), and exits non-zero if any scenario fails. Tokens
// come from the environment; CI mints them with mintToken.mjs.
const baseUrl = process.env.HARN_BASE_URL ?? 'http://localhost:5080';
const repoA = new NotesRepo(new KernelClient(baseUrl, process.env.HARN_TOKEN ?? ''));
const repoB = new NotesRepo(new KernelClient(baseUrl, process.env.HARN_TOKEN_B ?? ''));

// TEST-2 completeness self-audit (INV-10): every public method of every client data service must be driven
// through the real transport by at least one scenario. The method set is enumerated from the prototype and every
// call is recorded through a wrapper, so completeness is declared by the harness itself, never interrogated
// after the fact. A new repo method with no scenario fails the run.
const repoProto = NotesRepo.prototype as unknown as Record<string, unknown>;
const serviceMethods = Object.getOwnPropertyNames(NotesRepo.prototype).filter(
  (name) => name !== 'constructor' && typeof repoProto[name] === 'function',
);
const driven = new Set<string>();
for (const name of serviceMethods) {
  const original = repoProto[name] as (this: NotesRepo, ...args: unknown[]) => unknown;
  repoProto[name] = function (this: NotesRepo, ...args: unknown[]) {
    driven.add(name);
    return original.apply(this, args);
  };
}

const outcomes: boolean[] = [];

function emit(scenario: string, ok: boolean, detail: string): void {
  outcomes.push(ok);
  process.stdout.write(`${redact(JSON.stringify({ scenario, ok, detail }))}\n`);
}

async function run(scenario: string, body: () => Promise<string>): Promise<void> {
  try {
    emit(scenario, true, await body());
  } catch (error) {
    emit(scenario, false, error instanceof Error ? error.message : String(error));
  }
}

await run('health', async () => {
  const response = await fetch(`${baseUrl}/health`);
  if (response.status !== 200) {
    throw new Error(`expected 200, got ${response.status}`);
  }
  return 'health returned 200';
});

await run('create-note', async () => {
  const note = await repoA.create({ title: 'Harness note', body: 'created by the harness' });
  if (note.id.length === 0) {
    throw new Error('no id returned');
  }
  return `created note ${note.id}`;
});

await run('list-notes-paged', async () => {
  await repoA.create({ title: 'Page one', body: 'a' });
  await repoA.create({ title: 'Page two', body: 'b' });
  const first = await repoA.list(undefined, 1);
  if (first.items.length !== 1) {
    throw new Error(`expected 1 item, got ${first.items.length}`);
  }
  if (first.nextCursor === null) {
    throw new Error('expected a nextCursor');
  }
  const second = await repoA.list(first.nextCursor, 1);
  if (second.items.length === 0) {
    throw new Error('expected a second page');
  }
  return 'keyset paging returned a bounded page and a cursor';
});

await run('cross-tenant-404', async () => {
  const note = await repoA.create({ title: 'A only', body: 'secret' });
  const seen = await repoB.get(note.id);
  if (seen !== null) {
    throw new Error('tenant B could read tenant A note');
  }
  return 'cross-tenant read returned not-found';
});

await run('get-note', async () => {
  const created = await repoA.create({ title: 'Get me', body: 'happy path' });
  const fetched = await repoA.get(created.id);
  if (fetched === null || fetched.id !== created.id) {
    throw new Error('created note was not retrievable');
  }
  return `fetched note ${fetched.id}`;
});

await run('delete-note', async () => {
  const created = await repoA.create({ title: 'Delete me', body: 'to be removed' });
  if (!(await repoA.remove(created.id))) {
    throw new Error('remove returned false for an existing note');
  }
  if ((await repoA.get(created.id)) !== null) {
    throw new Error('note still readable after remove');
  }
  return `removed note ${created.id}`;
});

// The completeness diff is its own scenario line, so an uncovered method fails the run loudly (INV-10).
const uncovered = serviceMethods.filter((name) => !driven.has(name));
emit(
  'service-method-coverage',
  uncovered.length === 0,
  uncovered.length === 0
    ? `all ${serviceMethods.length} NotesRepo methods driven through the real transport`
    : `uncovered service methods: ${uncovered.join(', ')}`,
);

const failures = outcomes.filter((ok) => !ok).length;
if (failures > 0) {
  process.stderr.write(`${failures} harness scenario(s) failed\n`);
  // Set the code and let the module finish so buffered stdout (the NDJSON scenario lines) flushes; process.exit()
  // can tear the process down before an async pipe write completes, dropping the failing line from the log.
  process.exitCode = 1;
}
