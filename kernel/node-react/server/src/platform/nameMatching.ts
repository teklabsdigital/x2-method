// The shared matcher behind three claims' registries (SEC-3's PII names, SEC-2's server-owned fields, TEN-1's
// tenant-shaped names). Three lists, one comparison, and the comparison is the part every one of those claims
// leaves to the edition.
//
// Every claim in this family calls its list a heuristic and names novelty as the weakness: SEC-3's weakening
// note says "a novel parameter name carrying PII escapes it", SEC-2's says a field named `newState` slips past a
// registry listing `status`. Both are true and neither is the weakness that actually bites. Measured against the
// sibling edition, whose matcher is case-insensitive equality, the escape needs no novelty at all: `email` is on
// the list and `emailAddress` walks past it, `status` is on the list and `noteStatus` walks past it. The failure
// is morphological, not lexical, and the sibling compensates by hand-enumerating `firstname`, `lastname`,
// `dateofbirth` and `organisationid` as separate entries, which is enumeration standing in for a comparison.
//
// So the matcher here splits a name into tokens and matches a registry entry as a contiguous run of them.
// `emailAddress`, `user_email` and `EMAIL` all reduce to a run containing `email`; `createdAtUtc` contains the
// run `created at`. The cost is stated rather than discovered: `name` is a genuinely bad entry, and `fileName`
// tokenizes to `file name` and matches it. That is a false positive by construction, and the carve-out list is
// how a route says so in writing, in the discipline SEC-1 asks for.

// Digits are a boundary too, which the round 4 audit found by running the inputs rather than reasoning about
// them. `email1` was one token and matched nothing: a numbered field is the ordinary way a form carries a second
// address, and the tokenizer treated it as a word it had never seen. Splitting letters from digits also makes
// `phone2` match, and does not make `id1` an entity id, because `id` is a whole-name entry and `['id','1']` is
// two tokens.
export function tokenize(name: string): readonly string[] {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([A-Za-z])([0-9])/g, '$1 $2')
    .replace(/([0-9])([A-Za-z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.toLowerCase());
}

// `run` matches the entry anywhere inside the name; `whole` matches only the entire name.
//
// The distinction exists for exactly one entry and is worth the machinery. SEC-2 forbids "entity ids on create",
// and `id` as a run matches `parentId`, `noteId` and every other foreign key a legitimate body carries. As a
// whole-name entry it matches the field the claim is actually about and nothing else. Leaving this to a comment
// would have meant either a registry that cries wolf on every reference or one that quietly drops the entry.
export type MatchMode = 'run' | 'whole';

export type FieldRule = Readonly<{ entry: string; mode: MatchMode }>;

export function rule(entry: string, mode: MatchMode = 'run'): FieldRule {
  return Object.freeze({ entry, mode });
}

function containsRun(haystack: readonly string[], needle: readonly string[]): boolean {
  if (needle.length === 0 || needle.length > haystack.length) {
    return false;
  }
  for (let start = 0; start <= haystack.length - needle.length; start += 1) {
    if (needle.every((token, offset) => haystack[start + offset] === token)) {
      return true;
    }
  }
  return false;
}

export function matchingRule(rules: readonly FieldRule[], name: string): FieldRule | undefined {
  const tokens = tokenize(name);
  return rules.find((candidate) => {
    const wanted = tokenize(candidate.entry);
    return candidate.mode === 'whole'
      ? wanted.length === tokens.length && wanted.every((token, index) => token === tokens[index])
      : containsRun(tokens, wanted);
  });
}
