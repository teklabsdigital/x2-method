import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { composeApp } from '../../compose.ts';
import { freshDatabase } from '../../persistence/__tests__/support.ts';
import { decideCredential } from '../bearerCredential.ts';
import { systemClock } from '../clock.ts';
import { DEVELOPMENT_RELAXATION, resolveSettings, type Settings } from '../settings.ts';
import { INITIAL_SESSION_VERSION, inMemorySessionVersions } from '../sessionVersions.ts';
import { ADMITTED_ALGORITHMS, verifyToken, type VerificationKeys } from '../tokenVerification.ts';

// SEC-4's token-validation half, proved by input rather than by configuration. The sibling proves its equivalent
// by reading a `TokenValidationParameters` object back off the host; here the validation is a function, so the
// only way to prove it is to build the violating tokens and send them, which is also the half the sibling does
// NOT have: E-88 measured that five of its seven validation properties can be set permissive with all 261 tests
// green, because no violating input exists in its test harness to send.
//
// Every rejection is asserted BY REASON. "Returned a rejection" is not the fact worth having: an unsigned token
// that happens to be refused because its empty signature failed to match is refused for the wrong reason, and the
// day someone reorders the branches it starts passing. E-22 is that shape.

// SEC-5: this is a literal bound to a secret-shaped name, and it is exempted in both scans with a written reason
// rather than renamed to slip past them. The tests both mint and verify with it, which is exactly the sibling's
// reasoning for allowlisting its own `JwtKey`.
const signingKey = 'node-architecture-tests-symmetric-signing-phrase-0123456789';

// CFG-1, and the first draft of this file failed it. The issuer and audience were written here as literals, which
// is precisely E-75's defect: the dotnet CI carried the committed JWT identity in four places, the harness minted
// with one pair and the server validated with another, and changing the committed value would have left the
// duplicate green while every other caller broke. So these are READ. The scan caught it, which is the scan
// working on the pass that added the file rather than four rounds later.
const settings = resolveSettings();

const KEYS: VerificationKeys = Object.freeze({
  signingKey,
  issuer: settings.auth.issuer,
  audience: settings.auth.audience,
});

// Derived rather than written, for the same reason: a second signing phrase as a literal would be a second
// secret-shaped value in source, and there is nothing about "a key that is not the configured one" that needs a
// particular value.
const wrongPhrase = signingKey.replace('node', 'other');

// Captured once through the clock seam, so every expiry assertion below is relative to one instant and is a
// statement about the token rather than about when the suite ran. Read through the seam rather than as
// `new Date(...)`, which the clock lint forbids outside `clock.ts` and two named test files. Not needing an
// exemption is better than being granted one: the config's whole design is that each exemption is argued by name,
// and this file has no reason to read a clock beyond needing an instant to compare against.
const NOW = systemClock.now();
const seconds = Math.floor(NOW.getTime() / 1000);

const base64url = (value: string) => Buffer.from(value).toString('base64url');

type Claims = Record<string, unknown>;

const VALID_CLAIMS: Claims = Object.freeze({
  sub: 'harness-user',
  tenant_id: '11111111-2222-3333-4444-555555555555',
  sv: 1,
  perm: ['notes:read', 'notes:write'],
  iss: KEYS.issuer,
  aud: KEYS.audience,
  iat: seconds - 60,
  nbf: seconds - 60,
  exp: seconds + 1800,
});

// `declaredAlg` and `hash` are separate parameters on purpose. A token whose header SAYS HS256 while its signature
// was computed with SHA-384 is the RS-to-HS confusion family in the shape this stack can express, and it is only
// reachable if the two can disagree.
function mint({
  claims = {},
  declaredAlg = 'HS256',
  hash = 'sha256',
  key = signingKey,
  signature,
}: {
  claims?: Claims;
  declaredAlg?: string;
  hash?: string;
  key?: string;
  signature?: string;
} = {}): string {
  const header = base64url(JSON.stringify({ alg: declaredAlg, typ: 'JWT' }));
  const payload = base64url(JSON.stringify({ ...VALID_CLAIMS, ...claims }));
  const signed = signature ?? createHmac(hash, key).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signed}`;
}

function reasonFor(token: string, keys: VerificationKeys = KEYS, now: Date = NOW): string {
  const result = verifyToken(token, keys, now);
  if (result.ok) {
    throw new Error(`expected a rejection, got a verified token for ${JSON.stringify(result.token)}`);
  }
  return result.reason;
}

describe('the admitted algorithm set is a value, asserted whole (SEC-4, E-54)', () => {
  it('admits exactly HS256 and nothing else', () => {
    // The assertion E-54 says the sibling could not make. Minting one excluded algorithm and asserting 401 proves
    // that algorithm is excluded; it says nothing about what the set contains, which is why adding RS256 to the
    // sibling's pin left its whole suite green.
    expect([...ADMITTED_ALGORITHMS]).toEqual(['HS256']);
    expect(Object.isFrozen(ADMITTED_ALGORITHMS)).toBe(true);
  });

  it.each(['HS384', 'HS512', 'RS256', 'ES256', 'none'])('refuses a token declaring alg %s', (declaredAlg) => {
    expect(reasonFor(mint({ declaredAlg }))).toContain(`declares alg '${declaredAlg}'`);
  });

  it('never negotiates: a header alg it does not admit is refused even when the signature would verify', () => {
    // Signed correctly with HS256 and the right key, and declaring HS384. If the header selected the algorithm
    // this would be a signature mismatch; because the header is compared rather than obeyed, it is refused for
    // declaring an algorithm the verifier does not admit.
    expect(reasonFor(mint({ declaredAlg: 'HS384', hash: 'sha256' }))).toContain('never negotiates from the header');
  });

  it.each([
    ['null', null],
    ['a number', 7],
    ['an object', { alg: 'HS256' }],
  ])('refuses a header whose alg is %s', (_label, declaredAlg) => {
    // Written with values that are not `undefined` on purpose. The first version of this test passed
    // `undefined as unknown as string`, which is exactly what a default parameter is for, so `mint` substituted
    // 'HS256' and minted a perfectly valid token; the test asserted a rejection and got a credential. It was
    // caught only because `reasonFor` throws on an unexpected success instead of returning a falsy reason, which
    // is the same argument as asserting rejections by reason rather than by status.
    expect(reasonFor(mint({ declaredAlg: declaredAlg as unknown as string }))).toContain('declares alg');
  });
});

describe('requiring a signature is independent of pinning the algorithm (SEC-4, E-55)', () => {
  it('refuses an unsigned token FOR BEING UNSIGNED, before the header is read at all', () => {
    // The ordering proof, and the whole reason this is its own test. E-55's control refuted a reasoned prediction:
    // with the algorithm still pinned to HS256, an unsigned token AUTHENTICATED in the sibling, because an
    // unsigned token never reaches signature validation so the pin never runs. This token is unsigned AND declares
    // an inadmissible algorithm, and the reason names the signature, which is the branch that must not be
    // reachable only through the other one.
    expect(reasonFor(mint({ declaredAlg: 'none', signature: '' }))).toContain('carries no signature');
  });

  it('refuses an unsigned token that declares the admitted algorithm', () => {
    expect(reasonFor(mint({ declaredAlg: 'HS256', signature: '' }))).toContain('carries no signature');
  });

  it('refuses a token whose signature was computed with a different hash than its header declares', () => {
    // Header says HS256, signature is SHA-384. This is the confusion family arriving past the pin, and it is
    // caught by verification rather than by the pin, which is what makes the two independent.
    expect(reasonFor(mint({ declaredAlg: 'HS256', hash: 'sha384' }))).toContain('does not verify');
  });
});

describe('the signature is verified against the configured key (SEC-4)', () => {
  it('refuses a token signed with a different key', () => {
    expect(reasonFor(mint({ key: wrongPhrase }))).toContain('does not verify');
  });

  it('refuses a tampered signature', () => {
    // A byte of the DECODED signature is flipped and re-encoded. Flipping a base64url CHARACTER can be a no-op:
    // the last character of a 32-byte HMAC carries padding bits a lenient decoder discards, which made the
    // sibling's first version of this test fail about one run in sixteen.
    const parts = mint().split('.');
    const raw = Buffer.from(parts[2], 'base64url');
    raw[0] ^= 0xff;
    parts[2] = raw.toString('base64url');

    expect(reasonFor(parts.join('.'))).toContain('does not verify');
  });

  it('refuses a signature of the right shape but the wrong length', () => {
    expect(reasonFor(mint({ signature: base64url('short') }))).toContain('does not verify');
  });
});

describe('the development relaxation is refused as a verification key (SEC-5, E-89)', () => {
  it('refuses an otherwise perfect token when the key is the committed relaxation value', () => {
    // The measured hazard: `settings.ts` relaxes an absent secret to this literal when the environment name is
    // development or test, and the environment name defaults to development when NODE_ENV is unset. Before this
    // file existed nothing verified, so the relaxation was harmless. It is the act of verifying with it that is
    // not legitimate, so the refusal lives here and not in the resolver.
    const relaxed: VerificationKeys = { ...KEYS, signingKey: DEVELOPMENT_RELAXATION };

    expect(reasonFor(mint({ key: DEVELOPMENT_RELAXATION }), relaxed)).toContain('committed to the repository');
  });

  it('refuses an empty signing key rather than verifying nothing against nothing', () => {
    expect(reasonFor(mint(), { ...KEYS, signingKey: '' })).toContain('signing key is empty');
  });
});

describe('issuer, audience and expiry, which SEC-4 does not name and rests on (E-88)', () => {
  it('refuses a token from another issuer', () => {
    expect(reasonFor(mint({ claims: { iss: 'urn:x2:not-the-configured-issuer' } }))).toContain('is not the configured issuer');
  });

  it('refuses a token for another audience', () => {
    expect(reasonFor(mint({ claims: { aud: 'not-the-configured-audience' } }))).toContain('is not the configured audience');
  });

  it('refuses a token that declares no exp, so it would never expire', () => {
    expect(reasonFor(mint({ claims: { exp: undefined } }))).toContain('never expires');
  });

  it('refuses a token whose exp is not an integer', () => {
    expect(reasonFor(mint({ claims: { exp: 'soon' } }))).toContain('never expires');
  });

  it('refuses an expired token', () => {
    expect(reasonFor(mint({ claims: { exp: seconds - 1 } }))).toContain('has expired');
  });

  it('refuses a token that is not valid yet', () => {
    expect(reasonFor(mint({ claims: { nbf: seconds + 60 } }))).toContain('not valid yet');
  });

  it('accepts a token whose exp is one second away, so the boundary is not off by one', () => {
    expect(verifyToken(mint({ claims: { exp: seconds + 1 } }), KEYS, NOW).ok).toBe(true);
  });
});

describe('the claims a credential is built from (SEC-4, TEN-1, TEN-6)', () => {
  it.each([
    ['sub', { sub: undefined }, 'carries no subject'],
    ['an empty sub', { sub: '' }, 'carries no subject'],
    ['tenant_id', { tenant_id: undefined }, 'no single tenant_id'],
    ['an array tenant_id', { tenant_id: ['a', 'b'] }, 'no single tenant_id'],
    ['sv', { sv: undefined }, 'no integer sv'],
    ['a string sv', { sv: '1' }, 'no integer sv'],
    ['perm', { perm: undefined }, 'no perm array'],
    ['a string perm', { perm: 'notes:read' }, 'no perm array'],
    ['a perm entry that is not a string', { perm: ['notes:read', 7] }, 'no perm array'],
  ])('refuses a token with %s', (_label, claims, expected) => {
    expect(reasonFor(mint({ claims }))).toContain(expected);
  });

  it('builds the credential from the token and freezes it', () => {
    const result = verifyToken(mint(), KEYS, NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.token).toEqual({
      subject: 'harness-user',
      tenantId: '11111111-2222-3333-4444-555555555555',
      sessionVersion: 1,
      permissions: ['notes:read', 'notes:write'],
    });
    expect(Object.isFrozen(result.token)).toBe(true);
    expect(Object.isFrozen(result.token.permissions)).toBe(true);
  });

  it('accepts an empty permission set, which is a caller with no permissions and not a malformed token', () => {
    const result = verifyToken(mint({ claims: { perm: [] } }), KEYS, NOW);
    expect(result.ok).toBe(true);
  });
});

describe('malformed input is refused and never thrown (the seam has no try/catch)', () => {
  it.each([
    ['an empty string', ''],
    ['one segment', 'not-a-token'],
    ['two segments', 'aaa.bbb'],
    ['four segments', 'aaa.bbb.ccc.ddd'],
    ['a header that is not base64url', 'not base64!.bbb.ccc'],
    ['a payload that is not base64url', `${base64url('{}')}.not base64!.ccc`],
    ['a header that is not JSON', `${base64url('nonsense')}.${base64url('{}')}.cccc`],
    ['a header that is a JSON array', `${base64url('[]')}.${base64url('{}')}.cccc`],
  ])('refuses %s without throwing', (_label, token) => {
    expect(() => verifyToken(token, KEYS, NOW)).not.toThrow();
    expect(verifyToken(token, KEYS, NOW).ok).toBe(false);
  });

  it('refuses a payload that is not JSON, after the signature has verified', () => {
    // Reached only by signing a garbage payload correctly, which is the one path where a parse failure happens
    // AFTER the cryptography rather than before it.
    const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = base64url('not json');
    const signature = createHmac('sha256', signingKey).update(`${header}.${payload}`).digest('base64url');

    expect(reasonFor(`${header}.${payload}.${signature}`)).toContain('payload segment is not JSON');
  });
});

// The store and the adapter, then the composed app. Everything above is a statement about a function; these are
// statements about the server, and SEC-4's revocation half is only reachable here because a version has to be
// bumped on a store the app is actually using.

describe('the session version store (SEC-4)', () => {
  it('reads an unknown principal as the initial version, which is a property and not an accident', () => {
    // Named and asserted rather than left to be discovered. A store with no user table behind it cannot tell "a
    // principal at version 1" from "a principal it has never heard of", and the sibling's store has the identical
    // property through GetOrAdd(userId, 1). It is not a hole in revocation, which only has to invalidate what it
    // has seen; it is the absence of a principal store, which is a different claim and a different pass.
    const versions = inMemorySessionVersions();
    expect(versions.current('never-seen')).toBe(INITIAL_SESSION_VERSION);
  });

  it('bumps a principal without touching any other', () => {
    const versions = inMemorySessionVersions();
    expect(versions.bump('a')).toBe(INITIAL_SESSION_VERSION + 1);
    expect(versions.current('a')).toBe(INITIAL_SESSION_VERSION + 1);
    expect(versions.current('b')).toBe(INITIAL_SESSION_VERSION);
  });

  it('gives each store its own state, so one test cannot revoke a principal another test relies on', () => {
    const versions = inMemorySessionVersions();
    versions.bump('a');
    expect(inMemorySessionVersions().current('a')).toBe(INITIAL_SESSION_VERSION);
  });
});

describe('the Authorization header becomes a credential, or does not (SEC-4, TEN-1)', () => {
  const versions = inMemorySessionVersions();
  const decide = (header: unknown) => decideCredential(header, KEYS, versions, NOW);

  it.each([
    ['no header', undefined],
    ['an empty header', ''],
    ['a non-string header', 7],
    ['a Basic header', 'Basic dXNlcjpwYXNz'],
    ['a bare token with no scheme', mint()],
    ['a Bearer scheme with no token', 'Bearer '],
    ['a scheme smuggled after another', `Basic x Bearer ${mint()}`],
  ])('refuses %s', (_label, header) => {
    expect(decide(header).ok).toBe(false);
  });

  it('carries the tenant from the token and from nowhere else (TEN-1)', () => {
    // TEN-1's resolution rule, which had no mechanism at all while the mint was owed (S-8). The tenant on the
    // credential is read off a signed token; `app.ts` has already stripped every tenant-shaped header before this
    // runs, and nothing here reads a route parameter, a query value or a body.
    const decision = decide(`Bearer ${mint()}`);
    expect(decision.ok).toBe(true);
    if (!decision.ok) {
      return;
    }
    expect(decision.credential.tenantId).toBe('11111111-2222-3333-4444-555555555555');
    expect(decision.credential.sessionVersion).toBe(1);
    expect(decision.credential.permissions).toEqual(['notes:read', 'notes:write']);
  });

  it('refuses a token minted before the current session version, naming both (SEC-4)', () => {
    const revoking = inMemorySessionVersions();
    const token = `Bearer ${mint({ claims: { sub: 'revoked-user' } })}`;
    expect(decideCredential(token, KEYS, revoking, NOW).ok).toBe(true);

    revoking.bump('revoked-user');

    const after = decideCredential(token, KEYS, revoking, NOW);
    expect(after.ok).toBe(false);
    if (after.ok) {
      return;
    }
    expect(after.reason).toContain('minted at session version 1');
    expect(after.reason).toContain('current version is 2');
  });

  it('refuses a token minted AHEAD of the current version rather than tolerating it', () => {
    // Equality, not `>=`. A token from a version the server has never issued is not a token from the future to be
    // waved through; it is one the server cannot account for.
    expect(decide(`Bearer ${mint({ claims: { sv: 99 } })}`).ok).toBe(false);
  });
});

describe('the composed app answers with the wired verifier (SEC-4, E-89)', () => {
  // Settings are injected because the resolver, under a test or a fresh clone, hands back the development
  // relaxation for the signing key, and the verifier refuses to verify with it. That refusal is the point of
  // E-89, so it is exercised below rather than configured around.
  const base = resolveSettings();
  const withKey = (key: string): Settings => Object.freeze({ ...base, auth: Object.freeze({ ...base.auth, signingKey: key }) });

  it('admits a correctly minted token through the gate', async () => {
    const app = await composeApp({}, { database: freshDatabase() }, undefined, withKey(signingKey));

    const created = await app.inject({
      method: 'POST',
      url: '/notes',
      headers: { authorization: `Bearer ${mint()}` },
      payload: { title: 'minted', body: 'through the real gate' },
    });

    expect(created.statusCode).toBe(201);
    await app.close();
  });

  it('answers 403 when the token authenticates and lacks the permission, so the credential came from the token', async () => {
    const app = await composeApp({}, { database: freshDatabase() }, undefined, withKey(signingKey));

    const written = await app.inject({
      method: 'POST',
      url: '/notes',
      headers: { authorization: `Bearer ${mint({ claims: { perm: ['notes:read'] } })}` },
      payload: { title: 'a', body: 'b' },
    });

    expect(written.statusCode).toBe(403);
    expect((written.json() as { reason: string }).reason).toContain('notes:write');
    await app.close();
  });

  it('stops admitting a token the moment that principal has its session version bumped', async () => {
    // The end-to-end shape of SEC-4's revocation sentence: the same token, the same server, one write in between.
    const versions = inMemorySessionVersions();
    const app = await composeApp({}, { sessionVersions: versions, database: freshDatabase() }, undefined, withKey(signingKey));
    const token = `Bearer ${mint({ claims: { sub: 'signed-out-everywhere' } })}`;

    expect((await app.inject({ method: 'GET', url: '/notes', headers: { authorization: token } })).statusCode).toBe(200);

    versions.bump('signed-out-everywhere');

    expect((await app.inject({ method: 'GET', url: '/notes', headers: { authorization: token } })).statusCode).toBe(401);
    await app.close();
  });

  it('refuses a token signed with another key', async () => {
    const app = await composeApp({}, { database: freshDatabase() }, undefined, withKey(signingKey));
    const reply = await app.inject({
      method: 'GET',
      url: '/notes',
      headers: { authorization: `Bearer ${mint({ key: wrongPhrase })}` },
    });

    expect(reply.statusCode).toBe(401);
    await app.close();
  });

  it('refuses every token when the process is running on the development relaxation key (E-89)', async () => {
    // The measured hazard, end to end. A deploy that forgets NODE_ENV resolves the signing key to a literal
    // committed in this repository; without this refusal the server would authenticate anyone who read it.
    const app = await composeApp({}, { database: freshDatabase() }, undefined, withKey(DEVELOPMENT_RELAXATION));
    const reply = await app.inject({
      method: 'GET',
      url: '/notes',
      headers: { authorization: `Bearer ${mint({ key: DEVELOPMENT_RELAXATION })}` },
    });

    expect(reply.statusCode).toBe(401);
    await app.close();
  });

  it('still answers 401 with no Authorization header at all', async () => {
    const app = await composeApp({}, { database: freshDatabase() }, undefined, withKey(signingKey));
    expect((await app.inject({ method: 'GET', url: '/notes' })).statusCode).toBe(401);
    await app.close();
  });
});
