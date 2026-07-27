import type { FastifyInstance, FastifyServerOptions } from 'fastify';
import { createApp, type CreateAppSeams } from './app.ts';
import { assertEndpointSpine } from './architecture/endpointSpine.ts';
import { bearerCredential } from './platform/bearerCredential.ts';
import { systemClock } from './platform/clock.ts';
import { resolveSettings, type Settings } from './platform/settings.ts';
import { inMemorySessionVersions, type SessionVersions } from './platform/sessionVersions.ts';
import { registerHealth } from './routes/health.ts';
import { registerNotes } from './routes/notes.ts';

// The composition, in one place, used by the process entrypoint AND by every architecture test.
//
// This is the structural requirement none of the four route-seam claims names, and it is the one that decides
// whether their `centralized` locus is real. Each claim's mechanism is "a scan over the composed route table",
// and a scan is a statement about whatever app it was handed. A test that builds its own app scans its own app,
// which is a true statement about nothing anyone serves. The sibling edition gets this for free from a factory
// that boots the real host out of the real entrypoint; here it costs one exported function and a lint keeping
// the architecture tests away from `createApp`.
//
// The spine assertion runs HERE, after `ready()`, and not only in the test. A claim guard that lives only in CI
// lets a violating server start; running it at boot means the process refuses instead, and the test and the
// server are then failing on the same call rather than on two implementations of the same idea.
//
// `settings` is resolved before `createApp` is reached, which is DATA-5's "at startup, not first-use" made into
// an ordering rather than a promise. It is a default parameter rather than a statement in the body on purpose:
// a default is evaluated before the body runs, so there is no window in which the function has begun and the
// configuration has not been validated. `createApp` cannot be called without the result, so the resolution
// cannot be deleted the way `assertEndpointSpine` could.
//
// `surfaces` exists so that last sentence can be PROVEN rather than asserted. Round 3 claimed the boot refusal
// in its proof table on the evidence of a manual injection, and the round 3 audit deleted the
// `assertEndpointSpine` call, and its import, and watched the whole suite stay green with a clean typecheck and
// a clean lint. The wiring between the composition and the scan was the one part of the mechanism nothing ran.
// It cannot be tested from outside, because the composed app is by construction the one with no violations in
// it, so the violating surface has to be passable in. The default is the real set and the parameter is the seam
// a red proof needs; nothing else may call it, because `main.ts` is the only entrypoint and the architecture
// tests are held to `composeApp` by lint.

export type Surface = (app: FastifyInstance) => Promise<void>;

// `CreateAppSeams` plus the session-version store, which `createApp` has no business knowing about: it is the
// composition's choice of where revocation state lives, not a property of the instance.
export type ComposeSeams = CreateAppSeams & Readonly<{ sessionVersions?: SessionVersions }>;

const SURFACES: readonly Surface[] = Object.freeze([registerHealth, registerNotes]);

// The credential seam is wired HERE and not inside `createApp`, for the same reason the spine assertion is: this
// is the composition, and `createApp` is the thing being composed. It also keeps the fail-closed default where it
// belongs. `createApp` still falls back to `noCredential`, so an app assembled without a credential seam denies;
// what this function does is choose the real one, which means the choice is visible in the composition rather
// than buried as a default two files down.
//
// `sessionVersions` is a seam and not a private local because SEC-4's revocation half is only provable from
// outside: a test has to be able to bump a principal's version and then present the token minted before it. A
// store nothing can reach is a store whose revocation nobody has watched work, and that is the state the sibling
// left its own in until `Bumped_session_version_rejects_the_old_token` was written.
export async function composeApp(
  options: FastifyServerOptions = {},
  seams: ComposeSeams = {},
  surfaces: readonly Surface[] = SURFACES,
  settings: Settings = resolveSettings(),
): Promise<FastifyInstance> {
  const versions = seams.sessionVersions ?? inMemorySessionVersions();
  const authenticate =
    seams.authenticate ??
    bearerCredential(
      // Read from the resolved settings and from nowhere else. CFG-1's whole sentence: a second copy of the
      // issuer would be a value that can drift from the one the minter uses, which is E-75 exactly.
      { signingKey: settings.auth.signingKey, issuer: settings.auth.issuer, audience: settings.auth.audience },
      versions,
      systemClock,
    );

  const app = createApp(settings, options, { ...seams, authenticate });

  for (const register of surfaces) {
    await register(app);
  }
  await app.ready();

  assertEndpointSpine(app.routeTable);

  return app;
}
