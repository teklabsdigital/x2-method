import { spawn, spawnSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { mintToken } from '../client-web/tools/harness/mintToken.mjs';
import { POLICIES } from '../server/src/platform/authorization.ts';
import { INITIAL_SESSION_VERSION } from '../server/src/platform/sessionVersions.ts';
import { environmentNameFor, resolveSettings } from '../server/src/platform/settings.ts';

// The e2e runner (TEST-2, plus the UI-5 smoke). Migrates a throwaway database, boots the real entrypoint, drives
// the REAL client services against it with real bearer tokens, boots the ACTUAL composed entrypoint against the
// same server, and tears it all down. `.github/workflows/ci.yml` and the repository's own `kernel.yml` both run
// it, which is the half E-80 found missing: this edition shipped the harness and the smoke as npm scripts and
// nothing started either of them, so the tier was built and had never executed against a running server.
//
// Usage: node scripts/e2e.ts (from anywhere)
//
// **Why this is JavaScript and not a shell script.** The sibling's `scripts/e2e.sh` reads the issuer and the
// audience out of `appsettings.json` with two `node -e` one-liners, because a shell cannot import the host's own
// modules and the values have to come from somewhere. Here they can be imported, and that difference is the whole
// repair for E-91: a value that crosses this boundary is not copied, compared or re-derived, it is the same
// binding the server itself reads.
//
// **What is NOT checked about this file, stated rather than left to be discovered.** It sits outside both
// packages, so `tsc --noEmit` does not typecheck it and neither eslint config lints it. That is the same standing
// this edition's shipped scripts already had, and the sibling's bash orchestrator has permanently. Two things
// cover it instead: CFG-1's configuration-surface scan now walks `scripts/`, which is why that surface was added
// in the same change; and the CI job below RUNS it, so a file that does not parse or does not work fails a gate
// rather than sitting green. The second is the real one. A script whose only proof is that someone ran it once is
// the state E-80 was about.

const EDITION_ROOT = path.resolve(import.meta.dirname, '..');
const SERVER = path.join(EDITION_ROOT, 'server');
const CLIENT = path.join(EDITION_ROOT, 'client-web');

// A port the operating system says is free, asked for by binding zero and reading back what it assigned.
//
// The probe names no interface, and that is the repair for the first thing CFG-1's scan said about this file. It
// was written `probe.listen(0, '127.0.0.1')`, which duplicates the committed `http.host`, and adding `scripts/`
// to the scanned surfaces reported it by name on the first run. Binding every interface is also the stronger
// question: a port free there is free on any one of them, since a socket already held on a single interface
// refuses the wildcard bind.
function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.on('error', reject);
    probe.listen(0, () => {
      const address = probe.address();
      if (address === null || typeof address === 'string') {
        reject(new Error('the probe socket reported no port.'));
        return;
      }
      probe.close(() => resolve(address.port));
    });
  });
}

// A throwaway database and a fresh signing key, both installed through the DECLARED override channel before
// anything resolves settings.
//
// The channel is the point. `environmentNameFor` derives the variable name from the settings key, so neither name
// is written down here; a key the spec does not declare has no name to override it by, and a name that changes in
// the spec changes here without anyone editing this file. That is CFG-1's fourth-home repair used as a caller
// rather than described.
//
// The key is generated, never read and never printed. The sibling has to go and FETCH its signing key out of
// user-secrets, because the server reads it from there and the minter needs the same one; this direction is
// strictly better, because the orchestrator is the only thing that ever holds it and both consumers get it from
// one variable. There is nothing for a second copy to drift from.
//
// It also has to be a real key rather than the development relaxation. `verifyToken` refuses `DEVELOPMENT_
// RELAXATION` before it looks at anything else (E-89), so a run that let the relaxation fire would 401 on every
// gated route, and the failure would look like a product defect rather than a missing key.
//
// The port is overridden too, and that one is not a convenience. It was added after a plant measured the control
// below reporting green with the harness's environment stripped: both shipped tools default their base URL to a
// hardcoded `http://localhost:5080` (E-78), which is the COMMITTED port, so a run whose configuration never
// arrived fell back onto the same address and reached the same server. A fallback that equals the configured
// value is indistinguishable from configuration arriving. Serving on a port nobody wrote down is what makes the
// difference observable: with the fallback pointing at an address where nothing listens, a harness that did not
// receive its environment fails instead of passing.
//
// The port is asked for rather than chosen, so no number is written down here either. The gap between closing the
// probe socket and the server binding is a real race and is stated rather than hidden; it costs a rerun, and the
// early-exit check below reports it as a bind failure in about a second rather than as a timeout.
const workspace = mkdtempSync(path.join(tmpdir(), 'kernel-node-e2e-'));
process.env[environmentNameFor('database.file')] = path.join(workspace, 'kernel.db');
process.env[environmentNameFor('auth.signingKey')] = randomBytes(48).toString('base64url');
process.env[environmentNameFor('http.port')] = String(await freePort());

// The same function the server calls, over the same environment the children inherit. The issuer, the audience,
// the host and the port are therefore not values this script knows, they are values it resolved the way the
// process it is about to boot will resolve them.
const settings = resolveSettings();
const baseUrl = `http://${settings.http.host}:${settings.http.port}`;

// **E-91, repaired.** The two editions disagreed about the permission strings on the wire: the sibling's
// orchestrator mints `notes.read`, this edition's policies require `notes:read`, and a token minted the shared way
// authenticated cleanly and then failed authorization on every gated route (403 against 200, measured). The shared
// minter was blameless. It passes permission strings through untouched and cannot know either edition's
// vocabulary; the duplication was between an edition's policy table and an edition's orchestrator, and nothing
// compared them.
//
// So nothing is compared here either. The strings are READ from `POLICIES`, which is the one place this edition
// declares them and the same object every gated route declares by reference. A permission renamed there is
// renamed here, and a policy added there is minted here, without this file changing.
//
// The union rather than a chosen subset, because the harness drives every public method of the client service
// layer and therefore has to satisfy every policy the served routes declare. The negative case, a caller holding
// the wrong permission, is not this tier's job: it is asserted directly in `tokenVerification.test.ts`, where a
// 403 can be told apart from a route that does not exist.
const permissions = [...new Set(Object.values(POLICIES).flatMap((policy) => policy.permissions))].sort();
if (permissions.length === 0) {
  throw new Error(
    'no permissions were derived from POLICIES, so every gated route would answer 403 and the run would look like a product defect rather than an empty registry.',
  );
}

function tokenFor(tenantId: string): string {
  return mintToken({
    key: settings.auth.signingKey,
    issuer: settings.auth.issuer,
    audience: settings.auth.audience,
    tenantId,
    sub: randomUUID(),
    // Read from the edition for the same reason the permissions are. Both are 1 today, so a copy would be
    // invisible until the day the initial version changes, which is precisely how E-91 stayed invisible.
    sv: INITIAL_SESSION_VERSION,
    permissions,
  });
}

// Two tenants, because the harness's `cross-tenant-404` scenario is a statement about two of them and a run with
// one tenant would report that scenario green for the wrong reason.
const tokenA = tokenFor(randomUUID());
const tokenB = tokenFor(randomUUID());

const serverLog: string[] = [];
let serverExit: number | null = null;

function run(what: string, command: string, args: readonly string[], cwd: string, env: NodeJS.ProcessEnv): number {
  process.stdout.write(`\n== ${what}\n`);
  const finished = spawnSync(command, [...args], { cwd, env, stdio: 'inherit' });
  if (finished.error !== undefined) {
    process.stderr.write(`${what} could not start: ${String(finished.error)}\n`);
    return 1;
  }
  return finished.status ?? 1;
}

async function waitForReady(): Promise<void> {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    // The server dying is checked BEFORE the timeout, so a process that refuses to start (a port already bound, a
    // configuration error, a migration that did not run) reports its own output in a second rather than after two
    // minutes of dots. The sibling waits out its full loop and then tails a log, which is the same information
    // arriving too late to be read as the cause.
    if (serverExit !== null) {
      throw new Error(`the server exited with code ${serverExit} before becoming ready:\n${serverLog.join('')}`);
    }
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.status === 200) {
        return;
      }
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`the server did not answer /health at ${baseUrl} within 30s:\n${serverLog.join('')}`);
}

// Non-vacuity: the harness reported seven green scenarios, and this is what says they happened HERE.
//
// It is asserted as a SUCCESS rather than as a refusal, which is E-90's rule: the harness created notes as tenant
// A, so tenant A's token must be able to see them through the server this script booted. An empty list means the
// harness talked to something else, or to nothing.
//
// **What it cost to make this bind.** Written first with the port left at its committed value, the check reported
// green with `HARN_BASE_URL` deleted from the harness's environment, because both shipped tools default to a
// hardcoded `http://localhost:5080` (E-78) and that is the committed port. The harness fell back, reached the very
// server booted here, and every scenario passed while proving nothing about the wiring. Serving on an unwritten
// port is what closed it: the fallback now points where nothing listens, so the same deletion fails.
// It reports rather than throws, for the reason the harness itself sets `process.exitCode` instead of calling
// `process.exit`: a run should say everything it is able to say. Throwing here would skip the smoke and replace
// the summary with a stack trace, so a single failure would cost the answer to a question nobody had asked yet.
async function harnessDroveThisServer(): Promise<number> {
  process.stdout.write('\n== the harness drove THIS server\n');
  const response = await fetch(`${baseUrl}/notes`, { headers: { authorization: `Bearer ${tokenA}` } });
  if (response.status !== 200) {
    process.stderr.write(`reading back the harness's notes returned ${response.status}, so the run cannot be trusted.\n`);
    return 1;
  }
  const body = (await response.json()) as { items?: unknown[] };
  if (!Array.isArray(body.items) || body.items.length === 0) {
    process.stderr.write(
      'this server holds none of the harness\'s notes, so the harness and the server this script booted were not talking to each other. Check that the harness received HARN_BASE_URL rather than falling back to its default.\n',
    );
    return 1;
  }
  process.stdout.write(`the harness's notes are readable on the server this script booted (${body.items.length}).\n`);
  return 0;
}

let server: ReturnType<typeof spawn> | undefined;
let failures = 0;

try {
  // 1. Schema first, as its own step and its own process. The server does not migrate on boot by construction, so
  //    this is not an optimization: a run without it is a run against a schema-less database. `npm run migrate`
  //    rather than the module it calls, so the deployment step itself is what gets exercised.
  failures += run('migrate the throwaway database', 'npm', ['run', 'migrate'], SERVER, process.env);
  if (failures > 0) {
    throw new Error('the migration failed, so there is no schema to run against.');
  }

  // 2. Boot the real entrypoint through its published script, detached so the whole process group is killable.
  //    `npm start` forks node, and killing npm alone would leave the server holding the port; a detached child
  //    gets its own group and `kill(-pid)` reaches both. That is the same hazard the sibling avoids by building
  //    first and running the DLL, and this is the cheaper answer to it: nothing here duplicates what `npm start`
  //    means, which would be a committed value carried in a script (CFG-1).
  process.stdout.write(`\n== boot the server at ${baseUrl}\n`);
  server = spawn('npm', ['start'], { cwd: SERVER, detached: true, env: process.env });
  server.stdout?.on('data', (chunk: Buffer) => serverLog.push(String(chunk)));
  server.stderr?.on('data', (chunk: Buffer) => serverLog.push(String(chunk)));
  server.on('exit', (code) => {
    serverExit = code ?? -1;
  });
  await waitForReady();
  process.stdout.write('ready.\n');

  // 3. The harness (real client services, real transport, completeness self-audit), then the control that proves
  //    it drove THIS server, then the composed-entrypoint smoke (UI-5).
  failures += run('harness', 'npm', ['run', 'harness'], CLIENT, {
    ...process.env,
    HARN_BASE_URL: baseUrl,
    HARN_TOKEN: tokenA,
    HARN_TOKEN_B: tokenB,
  });
  failures += await harnessDroveThisServer();

  // E-107: the smoke asserts the BUILT client, so the build runs here and with the SAME values. Two separate
  // substitutions of one variable is the defect the finding names; passing the same environment to both is what
  // makes the smoke's green say something about the artifact that ships. The build is inside the timed run
  // rather than a prerequisite because a stale `dist/` would otherwise be indistinguishable from a fresh one.
  const clientEnvironment = { ...process.env, VITE_API_BASE_URL: baseUrl, VITE_API_TOKEN: tokenA };
  failures += run('client build', 'npm', ['run', 'build'], CLIENT, clientEnvironment);
  failures += run('composed-entrypoint smoke', 'npm', ['run', 'smoke'], CLIENT, clientEnvironment);
} finally {
  if (server?.pid !== undefined && serverExit === null) {
    try {
      process.kill(-server.pid, 'SIGTERM');
    } catch {
      // Already gone.
    }
  }
  rmSync(workspace, { recursive: true, force: true });
}

if (failures > 0) {
  process.stderr.write(`\ne2e failed. Server log:\n${serverLog.join('')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('\ne2e green: harness + composed-entrypoint smoke.\n');
}
