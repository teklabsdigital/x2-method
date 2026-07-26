import { createHmac, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';

// HS256 JWT minter with no dependencies (node:crypto only). CI uses this to mint HARN_TOKEN / HARN_TOKEN_B for
// the e2e-wire job. Repeated perm claims are emitted as a JSON array, which the server maps to multiple claims.
//
// IDENTITY PREMISES (INV-10): this tool carries two assumptions that an identity module INVALIDATES, so an
// instantiating project that owns identity must revisit them deliberately:
// 1. "Tokens are minted, not earned." Legitimate here because the kernel ships no identity module. Once the
//    product owns sign-in, mint-around remains setup for OTHER scenarios only; the harness must exercise the real
//    sign-in path at least once (TEST-2), via the gated harness profile.
// 2. "sub is an opaque string." The kernel passes it through untouched. A product whose user id is a real key
//    (the pilot's users-table GUID) will 500 on a label; the CLI below therefore defaults sub to a random UUID
//    (HARN_SUB pins it when a test needs a fixed one), which is valid in both worlds.
const base64url = (value) => Buffer.from(value).toString('base64url');

export function mintToken({ key, issuer, audience, tenantId, sub = 'harness-user', sv = 1, permissions = [] }) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(
    JSON.stringify({
      sub,
      tenant_id: tenantId,
      sv,
      perm: permissions,
      iss: issuer,
      aud: audience,
      iat: now,
      nbf: now,
      exp: now + 1800,
    }),
  );
  const signature = createHmac('sha256', key).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

// Allow use as a CLI: node mintToken.mjs <tenantId> <perm,perm>
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [, , tenantId, permissions = ''] = process.argv;
  const token = mintToken({
    key: process.env.HARN_JWT_KEY ?? '',
    issuer: process.env.HARN_JWT_ISSUER ?? 'kernel',
    audience: process.env.HARN_JWT_AUDIENCE ?? 'kernel',
    tenantId: tenantId ?? randomUUID(),
    // See the identity premises above: a random UUID is valid whether sub is opaque (kernel) or a real user key.
    sub: process.env.HARN_SUB ?? randomUUID(),
    permissions: permissions.length > 0 ? permissions.split(',') : [],
  });
  process.stdout.write(token);
}
