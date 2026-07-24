---
id: CON-4
family: contracts
locus: centralized
provenance: patterns pass 2026-07-24 (architecture stream: oasdiff-class OpenAPI diffing; buf breaking; Confluent schema compatibility modes)
---

# CON-4: A breaking change to a published contract is detected by machine, approved by human

**Statement.** Every published external contract (an OpenAPI surface, a proto package, an event schema) is diffed in CI against its released baseline, and a change in a breaking category (a removed field or endpoint, a narrowed type, a new required input, a removed enum member) fails the gate. The failure proceeds only through HUM-1's named human turn, recorded as an approval of the classified break, never as a suppression of the diff. The async twin is the same claim applied at the broker: an event schema registry runs in a compatibility mode that refuses a breaking revision.

**Harm.** HUM-1 requires a human turn on published-contract changes, but detection of "this is breaking" was itself manual: a reviewer eyeballing a diff. Already-deployed clients (a mobile release in the field, a partner integration) break on a change nobody classified as breaking, and the failure surfaces in someone else's error budget, weeks later, unattributable. CON-1 rules the dialect and CON-2 pins hand-mirrored copies; neither compares a contract against its own released past.

**Enforcement.**
- Mechanism class: a breaking-change diff job in the CI loop (oasdiff class for OpenAPI, buf breaking for proto, registry compatibility mode for event schemas) comparing against the released baseline artifact, failing on breaking categories; the override path is a reviewed, named approval on the HUM-1 surface.
- Edition: owed; trigger: the first published external contract (a versioned API consumed outside the repo, a partner surface, or the first schema registry; the composed client in the same repo is CON-2's territory, not a published contract).

**Weakening notes.** The diff tools' breaking taxonomies are the mechanism's authority, and they are conservative in both directions: some flagged changes are harmless to every real client (the human turn absorbs these as approvals), and semantic breaks that preserve the shape (a field's meaning changing under a stable name) are invisible to any diff; that case is exactly what the catalog's own claim-identity rule handles for claims, and for contracts it stays a review obligation. The baseline must be the released artifact, not the working copy, or the gate diffs a change against itself.
