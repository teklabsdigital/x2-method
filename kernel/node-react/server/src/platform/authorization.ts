import type { FastifyRequest } from 'fastify';

// SEC-1's vocabulary: what a permission policy IS here, and what anonymity costs.
//
// The framework supplies none of this. Fastify has no authorization concept at all: no attribute, no policy
// provider, no fallback policy, no notion of "authenticated". `RouteOptions.config` is an arbitrary per-route
// object echoed back on `request.routeOptions.config`, and that is the entire affordance. So a policy is not
// something a scan discovers here, it is something this file invents and the rest of the edition is obliged to
// use.
//
// That difference changes the shape of one of SEC-1's own sentences. The claim says bare authenticated-only
// registrations are REJECTED, which presumes a stack where the bare form is expressible and a scan has to catch
// it. Here it is expressible only if this file makes it so, and it does not: `definePolicies` refuses an empty
// permission set, so no value exists that gates on authentication and names no permission. Unrepresentable and
// rejected are different mechanism classes, and the difference is recorded in the findings register rather than
// smoothed over by pretending a scan is catching something.

export type Policy = Readonly<{ name: string; permissions: readonly string[] }>;

// A string, not a symbol, so a violation message can print it. `definePolicies` refuses it as a policy name, so
// there is no way to reach anonymity by naming a policy.
export const ANONYMOUS = 'anonymous';

export type PolicyDeclaration = typeof ANONYMOUS | Policy;

// Exported for one reason: the two refusals below are the entire mechanism by which SEC-1's forbidden
// registration is made unrepresentable, and an audit showed that deleting either left the suite green. The test
// that was supposed to cover them asserted over the CONTENTS of `POLICIES`, which is a statement about the two
// policies that happen to ship and not about the constructor, so the one-line regression it warned about was
// exactly what it could not see. A guard whose behaviour no test can invoke is a guard nobody has proven.
export function definePolicies<T extends Record<string, readonly string[]>>(
  declared: T,
): Readonly<{ [K in keyof T]: Policy }> {
  const built: Record<string, Policy> = {};
  for (const [name, permissions] of Object.entries(declared)) {
    if (name === ANONYMOUS) {
      throw new Error(`'${ANONYMOUS}' is not a policy name; it is the absence of a gate (SEC-1).`);
    }
    if (permissions.length === 0) {
      throw new Error(
        `policy '${name}' names no permission. A gate that only asks whether the caller authenticated is the bare authenticated-only registration SEC-1 forbids; name the permissions it requires.`,
      );
    }
    built[name] = Object.freeze({ name, permissions: Object.freeze([...permissions]) });
  }
  return Object.freeze(built) as Readonly<{ [K in keyof T]: Policy }>;
}

// The one place policies exist. A route declares one of these objects by reference, so the deny hook checks
// identity rather than a string: a forged `{name: 'notes.read', permissions: []}` is not in this set and is
// denied like any other unknown declaration.
export const POLICIES = definePolicies({
  'notes.read': ['notes:read'],
  'notes.write': ['notes:write'],
});

const REGISTERED: ReadonlySet<Policy> = new Set(Object.values(POLICIES));

export function isRegisteredPolicy(value: unknown): value is Policy {
  return REGISTERED.has(value as Policy);
}

// SEC-1's enumerated allowlist, and the justification the claim's weakening notes require per carve-out. A bare
// list of paths cannot carry a reason, and a carve-out whose reason is not written next to it is a carve-out
// nobody can review, which is what "reviewed as a security surface" was supposed to mean.
//
// Keyed by method AND url. A path-only key allowlists every method on that path, so allowlisting a health GET
// would silently pre-authorize a POST to the same URL that nobody has written yet.
export type AnonymousRoute = Readonly<{ method: string; url: string; why: string }>;

export const ANONYMOUS_ROUTES: readonly AnonymousRoute[] = Object.freeze([
  Object.freeze({
    method: 'GET',
    url: '/health',
    why: 'RES-4 liveness. Answers a fixed literal, reads no store and no credential, and reveals nothing an unauthenticated caller could not learn by connecting. Its synthesized HEAD is covered by this entry.',
  }),
]);

export type Credential = Readonly<{ subject: string; permissions: readonly string[] }>;

export type Authenticate = (request: FastifyRequest) => Credential | null;

// The credential seam, deliberately empty. Minting a credential is SEC-4 and TEN-6, both owed in both editions,
// so this edition has no way to produce one and says so in code rather than in a comment on an absent file. The
// consequence is honest and fail-closed: every gated route in the composed server answers 401 until the mint
// exists. The conformance record carries that, and no claim reads better than it is.
export const noCredential: Authenticate = () => null;

export function satisfies(policy: Policy, credential: Credential): boolean {
  return policy.permissions.every((permission) => credential.permissions.includes(permission));
}
