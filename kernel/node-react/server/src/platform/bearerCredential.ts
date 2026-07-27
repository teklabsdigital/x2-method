import type { FastifyRequest } from 'fastify';
import type { Authenticate, Credential } from './authorization.ts';
import type { Clock } from './clock.ts';
import type { SessionVersions } from './sessionVersions.ts';
import { verifyToken, type VerificationKeys } from './tokenVerification.ts';

// The adapter between a request and a credential: the one place a bearer token becomes a principal.
//
// `Authenticate` is synchronous and has no error channel, and both facts are load-bearing here. The gate hook in
// `app.ts` calls the seam bare, with no `await` and no try/catch, so a verifier that returns a Promise makes
// `credential === null` false and the request 500s on a Promise with no `.permissions`, and a verifier that
// throws turns a malformed token into a 500 instead of the 401 the gate exists to produce. Everything below
// returns, and `verifyToken` is written to the same rule.
//
// The decision is exposed separately from the seam, with its reason, and the seam is a thin wrapper over it. A
// test that can only assert "this returned null" cannot tell a token refused for a stale session version from one
// refused because the signature did not verify, and those are different facts about different claims: the first
// is SEC-4's revocation half working, the second is its algorithm half.

export type CredentialDecision =
  | Readonly<{ ok: true; credential: Credential }>
  | Readonly<{ ok: false; reason: string }>;

const BEARER = /^Bearer +(\S+)$/;

const refuse = (reason: string): CredentialDecision => Object.freeze({ ok: false as const, reason });

export function decideCredential(
  header: unknown,
  keys: VerificationKeys,
  versions: SessionVersions,
  now: Date,
): CredentialDecision {
  if (typeof header !== 'string' || header.length === 0) {
    return refuse('the request carries no Authorization header');
  }

  // Anchored, and the scheme is required. An unanchored match would accept `Basic x Bearer y`, and a scheme-less
  // match would accept a bare token, which is a second accepted wire format nobody wrote down.
  const presented = BEARER.exec(header);
  if (presented === null) {
    return refuse('the Authorization header is not a Bearer token');
  }

  const verified = verifyToken(presented[1], keys, now);
  if (!verified.ok) {
    return refuse(verified.reason);
  }

  // SEC-4's revocation half, and it runs on every request that presents a token, which is what "immediately"
  // means. The comparison is equality and not `>=`: a token minted at a version AHEAD of the server's is not a
  // token from the future to be tolerated, it is a token the server cannot account for.
  const current = versions.current(verified.token.subject);
  if (verified.token.sessionVersion !== current) {
    return refuse(
      `the token was minted at session version ${verified.token.sessionVersion} and the current version is ${current}, so it has been revoked (SEC-4)`,
    );
  }

  return Object.freeze({
    ok: true as const,
    credential: Object.freeze({
      subject: verified.token.subject,
      tenantId: verified.token.tenantId,
      sessionVersion: verified.token.sessionVersion,
      permissions: verified.token.permissions,
    }),
  });
}

// TEN-1's resolution rule, and the reason this function reads exactly one header. The claim says the tenant a
// request operates in is resolved solely from the validated authentication credential; `app.ts` strips every
// tenant-shaped header before this runs, and nothing here reads a route parameter, a query value or a body. So
// the tenant on the credential came from a signed token and from nowhere else, which is the half of TEN-1 that
// had no mechanism at all while the mint was owed (S-8).
export function bearerCredential(keys: VerificationKeys, versions: SessionVersions, clock: Clock): Authenticate {
  return (request: FastifyRequest): Credential | null => {
    const decision = decideCredential(request.headers.authorization, keys, versions, clock.now());
    return decision.ok ? decision.credential : null;
  };
}
