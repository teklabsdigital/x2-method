import { createHmac, timingSafeEqual } from 'node:crypto';
import { DEVELOPMENT_RELAXATION } from './settings.ts';

// SEC-4's token-validation half, as a pure function over a token string, a key set and an instant.
//
// The sibling gets this from host configuration: a `TokenValidationParameters` object handed to a library, with
// tests that read the object back off every registered scheme. This stack has no such object, so the validation
// IS this file, and that difference decides the shape of everything below.
//
// **The admitted algorithm set is a value, not a comparison buried in a branch.** E-54 measured why: the sibling's
// pin was proven by minting one HS384 token and asserting 401, which proves HS384 is excluded and says nothing
// about what the set ADMITS. Adding RS256 to it left the whole suite green. A guard that can only be probed one
// excluded algorithm at a time cannot state its own reach, so the reach is exported and asserted whole.
export const ADMITTED_ALGORITHMS: readonly string[] = Object.freeze(['HS256']);

// **Requiring a signature is a separate obligation from pinning the algorithm, and neither shadows the other.**
// E-55 is the reason this is written as its own step with its own rejection reason, before the algorithm is read
// at all. The sibling had `RequireSignedTokens = false` with the pin still `[HS256]`, and a reasoned prediction
// said the pin would save it. The control refuted the prediction: an unsigned token never reaches signature
// validation, so the algorithm pin never runs and cannot shadow the missing flag. An alg:none token
// AUTHENTICATED. Here the two are separate branches with separate reasons, and both are tested by reason and not
// only by status, because "rejected" and "rejected for the right reason" are different facts.

export type VerifiedToken = Readonly<{
  subject: string;
  tenantId: string;
  sessionVersion: number;
  permissions: readonly string[];
}>;

// A discriminated result rather than `VerifiedToken | null`, and the reason is E-22: a guard whose message names
// nothing lets one rejection stand in for another. A test that asserts only "this returned null" cannot tell an
// unsigned token refused for being unsigned from one refused because its signature happened not to match.
export type VerificationResult =
  | Readonly<{ ok: true; token: VerifiedToken }>
  | Readonly<{ ok: false; reason: string }>;

export type VerificationKeys = Readonly<{
  signingKey: string;
  issuer: string;
  audience: string;
}>;

const SEGMENT = /^[A-Za-z0-9_-]+$/;

const reject = (reason: string): VerificationResult => Object.freeze({ ok: false as const, reason });

// Never throws. The credential seam is called bare inside an `onRequest` hook with no try/catch, so a thrown
// verifier turns a malformed token into a 500 and leaks the message to the error path, where the honest answer is
// a 401. Every branch below returns; every parse is guarded.
export function verifyToken(token: string, keys: VerificationKeys, now: Date): VerificationResult {
  // E-89, and it is deliberately the FIRST thing checked. `settings.ts` relaxes an absent secret to a committed
  // literal when the environment name is development or test, and the environment name defaults to `development`
  // when NODE_ENV is unset. That relaxation is legitimate for a process that verifies nothing, which is what this
  // edition was until this file existed. It is not legitimate to VERIFY with it: a deploy that forgets NODE_ENV
  // would otherwise accept any token signed with a string committed to this repository, silently, on a process
  // that started cleanly. So the refusal lives at the act of verifying rather than at the resolver, which is the
  // only place that can tell the two situations apart.
  if (keys.signingKey === DEVELOPMENT_RELAXATION) {
    return reject(
      'the signing key is the development relaxation value, which is committed to the repository. Set the key in the developer-local secret store or in KERNEL_AUTH_SIGNING_KEY before this process verifies anything (SEC-5, E-89).',
    );
  }
  if (keys.signingKey.length === 0) {
    return reject('the signing key is empty, so no signature can be verified');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return reject(`a JWT has three dot-separated segments; this has ${parts.length}`);
  }
  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  // Step 1, on its own, before anything reads the header. SEC-4's "requires signed tokens".
  if (encodedSignature.length === 0) {
    return reject('the token carries no signature. Unsigned tokens are refused whatever their header claims (SEC-4)');
  }
  for (const [name, segment] of [
    ['header', encodedHeader],
    ['payload', encodedPayload],
    ['signature', encodedSignature],
  ] as const) {
    if (!SEGMENT.test(segment)) {
      // Checked rather than left to the decoder, because `Buffer.from(value, 'base64url')` is lenient: it drops
      // characters outside the alphabet instead of failing, so a token with a corrupted segment would decode to
      // something plausible and be judged on that.
      return reject(`the ${name} segment is not base64url`);
    }
  }

  const header = parseSegment(encodedHeader);
  if (header === undefined) {
    return reject('the header segment is not JSON');
  }

  // Step 2. The header's `alg` is COMPARED against the pinned set; it never selects the algorithm. That is the
  // whole of "algorithm negotiation from token headers is rejected": the token is asked what it claims and then
  // told, rather than asked what to do.
  const algorithm = header.alg;
  if (typeof algorithm !== 'string' || !ADMITTED_ALGORITHMS.includes(algorithm)) {
    return reject(
      `the token declares alg '${String(algorithm)}'; this verifier admits exactly ${ADMITTED_ALGORITHMS.join(', ')} and never negotiates from the header (SEC-4)`,
    );
  }

  const expected = createHmac('sha256', keys.signingKey).update(`${encodedHeader}.${encodedPayload}`).digest();
  const presented = Buffer.from(encodedSignature, 'base64url');
  // Length is compared first because `timingSafeEqual` THROWS on a length mismatch, and this function may not
  // throw. The length of an HMAC output is not a secret, so branching on it leaks nothing.
  if (presented.length !== expected.length || !timingSafeEqual(presented, expected)) {
    return reject('the signature does not verify against the configured signing key');
  }

  const payload = parseSegment(encodedPayload);
  if (payload === undefined) {
    return reject('the payload segment is not JSON');
  }

  // Issuer, audience and expiry are validated here although SEC-4's sentences name none of the three, and E-88 is
  // why. The sibling sets all three as host configuration, no test asserts any of them, and no violating token
  // exists to send: planted permissive, all 261 tests stayed green. SEC-4's revocation half says revocation takes
  // effect "immediately rather than at token expiry", which presupposes that tokens expire; a claim can rest on a
  // premise it states as background rather than as a requirement, and a guard set built from its words alone does
  // not cover the premise. These three are recorded as obligations beyond the claim's letter rather than folded
  // into it, so the row says what it is doing.
  if (payload.iss !== keys.issuer) {
    return reject(`the token's issuer '${String(payload.iss)}' is not the configured issuer`);
  }
  if (payload.aud !== keys.audience) {
    return reject(`the token's audience '${String(payload.aud)}' is not the configured audience`);
  }

  const seconds = Math.floor(now.getTime() / 1000);
  if (!Number.isInteger(payload.exp)) {
    return reject('the token declares no integer exp, so it never expires (E-88)');
  }
  if ((payload.exp as number) <= seconds) {
    return reject('the token has expired');
  }
  if (payload.nbf !== undefined) {
    if (!Number.isInteger(payload.nbf)) {
      return reject('the token declares a non-integer nbf');
    }
    if ((payload.nbf as number) > seconds) {
      return reject('the token is not valid yet');
    }
  }

  const subject = payload.sub;
  if (typeof subject !== 'string' || subject.length === 0) {
    return reject('the token carries no subject');
  }

  // TEN-6's premise, verified rather than assumed: the credential carries EXACTLY ONE tenant and it arrives on
  // the validated token. TEN-1 reads the tenant from the credential and from nowhere else, and this is the
  // function that decides what the credential says. A token with no tenant, or with a tenant that is not a single
  // non-empty string, has no place to be resolved from and is refused rather than defaulted.
  const tenantId = payload.tenant_id;
  if (typeof tenantId !== 'string' || tenantId.length === 0) {
    return reject('the token carries no single tenant_id, and a tenant is never resolved from anywhere else (TEN-1, TEN-6)');
  }

  // Strict, and a number rather than a numeric string. The shared minter emits a JSON number; accepting a string
  // too would mean two representations of the same fact and a comparison that has to normalize, which is where a
  // version check stops being a comparison and starts being a parser.
  const sessionVersion = payload.sv;
  if (!Number.isInteger(sessionVersion)) {
    return reject('the token carries no integer sv, so it cannot be checked against the current session version (SEC-4)');
  }

  const permissions = payload.perm;
  if (!Array.isArray(permissions) || permissions.some((entry) => typeof entry !== 'string')) {
    return reject('the token carries no perm array of strings');
  }

  return Object.freeze({
    ok: true as const,
    token: Object.freeze({
      subject,
      tenantId,
      sessionVersion: sessionVersion as number,
      permissions: Object.freeze([...(permissions as string[])]),
    }),
  });
}

function parseSegment(segment: string): Record<string, unknown> | undefined {
  try {
    const value: unknown = JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
    return value === null || typeof value !== 'object' || Array.isArray(value)
      ? undefined
      : (value as Record<string, unknown>);
  } catch {
    return undefined;
  }
}
