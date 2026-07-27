import type { Credential } from '../platform/authorization.ts';

// TEN-1's resolution rule, made into a type rather than a discipline.
//
// The sibling realizes TEN-2 with an ambient scope whose accessor throws when nothing has been stamped, and that
// is the right shape there: an EF `SaveChanges` override has no parameter list to put a tenant in, so the tenant
// has to arrive out of band and the only available guarantee is that reading it unset fails loudly.
//
// This edition has a parameter list, so it uses one. `TenantId` is a branded string that cannot be constructed
// from an arbitrary value: `tenantOf` is the only producer and it takes a `Credential`, which is only ever built
// by `bearerCredential` from a verified signature. So "the tenant is resolved solely from the validated
// credential" is not a rule a scan checks after the fact, it is the only way to obtain a value of the type the
// store demands. **Unrepresentable and rejected are different mechanism classes**, and this edition already made
// that distinction for SEC-1's bare authenticated-only registration; the same argument applies here and is
// recorded rather than smoothed into "same as the sibling".
//
// What this does NOT give, said plainly because the sibling's mechanism does give it: there is no ambient scope,
// so nothing stamps a tenant onto a write that forgot to name one. That protection is replaced by the store
// requiring the value, and the difference shows up on any path that is not a request. A background job here must
// obtain a `TenantId` from somewhere, and the only somewhere is a credential.

declare const brand: unique symbol;

export type TenantId = string & { readonly [brand]: 'TenantId' };

export function tenantOf(credential: Credential): TenantId {
  return credential.tenantId as TenantId;
}

// The one escape hatch, named and narrow, for tests that need a tenant without minting a JWT. It is exported so
// that a test does not reach for `as TenantId` at every call site, which would be the same hole with no name and
// nothing to grep for. Production code has no reason to call it, and a lint could pin that; what makes it safe
// enough today is that every production path holds a `Credential` already.
export function tenantForTesting(value: string): TenantId {
  if (value.length === 0) {
    throw new Error('a tenant id is never the empty string; an empty tenant is the fail-open value TEN-2 forbids.');
  }
  return value as TenantId;
}
