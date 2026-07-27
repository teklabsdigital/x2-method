// SEC-4's revocation half: every principal carries a server-side session version, and a token minted before the
// current version is refused, so a role change, a password change, a disable or a sign-out-everywhere takes
// effect at the next request rather than at token expiry.
//
// **The version is server-side, and that is the whole mechanism.** The token carries the version it was minted
// at; the server carries the version that is current. Revocation is a write on the server side, and no token can
// argue with it, which is the property that makes it immediate. A version the client asserts and the server
// believes is not revocation, it is a suggestion.

export type SessionVersions = Readonly<{
  current: (subject: string) => number;
  bump: (subject: string) => number;
}>;

// An unknown principal reads as this, and that is a real property of a store with no user table behind it rather
// than an implementation detail. Stated here, and asserted by a test, because the alternative is that someone
// discovers it later and cannot tell whether it was chosen.
//
// What it costs: this store cannot distinguish "a principal at version 1" from "a principal it has never heard
// of", so any validly signed token bearing sv=1 for a subject nobody has bumped is accepted. That is not a hole
// in the revocation mechanism, which only has to be able to INVALIDATE what it has seen, and revoking requires
// having seen it. It is a hole in a different claim, the one that would say a token's subject must correspond to
// a principal that exists, and this edition has no principal store to answer that with. The sibling's equivalent
// store has the identical property through `GetOrAdd(userId, 1)`.
export const INITIAL_SESSION_VERSION = 1;

// Process-local, and named as such rather than described as a cache. SEC-4's weakening note licenses a short-TTL
// cache in front of a real lookup provided the TTL is a named, tested bound, "because the cache window is exactly
// the revocation delay". There is no cache here and no lookup behind it: this map IS the store, so the window is
// zero and the note's obligation has no surface in this edition. A store shared across processes is a named
// upgrade that arrives with persistence, not a second obligation on this one.
export function inMemorySessionVersions(): SessionVersions {
  const versions = new Map<string, number>();

  return Object.freeze({
    current: (subject: string) => versions.get(subject) ?? INITIAL_SESSION_VERSION,
    bump: (subject: string) => {
      const next = (versions.get(subject) ?? INITIAL_SESSION_VERSION) + 1;
      versions.set(subject, next);
      return next;
    },
  });
}
