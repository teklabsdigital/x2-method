---
kind: record
status: working
---

# Delta protocol log

The step-2 artifact of the delta protocol, one section per claim. Each section is the Node mechanism written
from the claim text alone, **before** the .NET realization was opened, followed by the delta recorded at step 3.

This file exists because step 2 is unfalsifiable otherwise. A finding of the form "the claim did not say X" is
worth nothing if the design that discovered X was written after reading a realization that supplied it. Writing
the prediction down first, dated, and leaving it unedited when it turns out wrong is what makes the register's
findings evidence rather than commentary. Predictions that were refuted are kept verbatim and marked, not
rewritten.

The quarantine at the time of writing each step 2: the `mechanism` column of `kernel/dotnet-react/conformance.json`,
the generated conformance table in `kernel/dotnet-react/README.md`, `kernel/dotnet-react/server/tests/Kernel.Tests.Architecture/**`,
and the proof tables in `kernel/dotnet-react/VERIFICATION.md`.

## The research phase is closed (owner's direction, 2026-07-27)

Step 2, the blind design written before the sibling is opened, is closed. No further claim gets one. The eight
already written stand as recorded, unedited, and the protocol's definition stays in this file and in
`kernel/node-react/BUILD-BRIEF.md` because it defines a method rather than describing a mechanism, which is what
E-21 ruled is kept.

**The owner's reason.** Step 2 existed to make portability findings falsifiable: a finding of the form "the claim
did not say X" is worth nothing if the design that found X was written after reading a realization that supplied
it. That purchase is real, and it is a purchase on FINDINGS. The remaining work is not hunting findings. It is
planting violations against guards to establish whether each row is honest, and a blind design buys nothing
there, because a plant is falsifiable on its own terms: the guard goes red naming the claim, or it does not.
Paying the quarantine's cost for a benefit the work no longer needs is the trade being declined.

**What closing it changes.** The 61 claims that never got a step 2 do not owe one. Any record that gates a status
or a piece of work on "this claim's delta pass" is stating a fact about a closed procedure, not about a
mechanism, and is corrected where it appears: `kernel/node-react/README.md`'s conformance section and the
`Sixty-one claims still owe a step 2` section of `record/adjudication-digest.md`. For 36 of those 61 no delta was
ever possible in any case, because the claim is `owed` in the .NET edition too and a delta needs two realizations
to sit between.

## What the quarantine does not cover, and what is done about it (ruled 2026-07-27)

This register is not in the quarantine and cannot be. It is what a pass reads to know what has already been
found, and findings quote realizations in order to be checkable at all: E-22 exists because the register could
name a registry that had never been applied to a body member. So a finding about one claim informs another
whenever it names that other claim's artifact, and S-12 asked whether the protocol survives that.

It survives, and the size is measured rather than argued. `tools/docs-lint.mjs` now emits a **register leak
report**: for each finding it takes the artifacts the finding names and the claim the finding is about, and
reports every claim that OWNS a named artifact and is not the subject. It reports and never fails, because a
blocking form would have refused both E-6 and E-22, the two findings that did the most work here.

Three things make the report the whole answer, with no per-claim `[informed]` label behind it.

- **The strong worry is refuted by this file's own history.** Every step 2 in it, round 1's included, was written
  under the `Edition:` bullet the claim file carried, so all eight were informed before ruling 1 removed the
  bullets. They produced A-1 through A-5, E-10 and E-22, and DATA-5's informed prediction was informed by a
  sentence describing a facility the edition does not have: being informed handed that pass a false belief to
  falsify, which an uninformed pass would not have had. Contamination has never been measured to cost a finding.
  The one time it was reported to, in S-12, the premise was measured false.
- **The report dated into a round's ledger IS the marking.** The register only grows, so a run today over-reports
  what a step 2 written six rounds ago could have seen. A dated snapshot is the only honest answer to "was this
  informed WHEN IT WAS WRITTEN", and a hand-maintained label per claim would drift where the snapshot cannot.
- **The leak shrinks by design pressure, not by discipline.** Most of it comes from claims that share a
  realization, so a claim given a realization of its own stops being leakable. That is a property of the edition,
  which can be changed, rather than of the protocol, which cannot.

**Standing instruction:** a build round begins by pasting the current report under its heading. A finding in that
round that asserts a claim's independence ("the claim did not say X") is checked against the snapshot first.

**Snapshot, 2026-07-27.** The .NET report names 12 of 69 claims. Seven are already burned by their own step 2,
so the live cost is **five of the 61 claims that still owe one**: AI-1 (`ToolExecutor`), CON-1
(`WireConventionTests`), MOD-2 and TEST-1 (`NamingPlacementTests`), SEC-4 (`HostSecurityTests`,
`SessionVersionMiddleware`). The Node report names five, all of them already burned, so no owing claim is
informed about the Node edition.

## Round 1 (2026-07-26): the four route-seam claims

SEC-1, SEC-3, SEC-2 and TEN-1 all scan the route table, which the Phase 2 scaffold already bought. All four
step-2 designs below were written in one sitting, from the four claim files and nothing else, so that opening
the first .NET realization could not contaminate the three step-2 designs not yet written.

---

### SEC-1 step 2: every endpoint permission-gated, deny by default

**Surface.** `app.routeTable`. **Predicate.** every recorded route carries an explicit permission policy.

The first thing the claim text runs into: **Fastify has no authorization concept at all.** There is no
`[Authorize]`, no policy provider, no fallback policy, and no notion of "authenticated". `RouteOptions.config`
is an arbitrary per-route object echoed back on `request.routeOptions.config`, and that is the entire
affordance. So the policy is not something the scan discovers, it is something the edition has to invent and
then require. Predicted consequence: the claim's verb "rejecting bare authenticated-only registrations"
presumes a framework in which the bare form is expressible. Here it is expressible only if I build it, so the
honest realization makes it **unrepresentable** rather than **rejected**, and those are different mechanism
classes.

What I would build:

1. **A policy registry**, one named list in `src/platform/authorization.ts`. `definePolicy(name, permissions)`
   refuses an empty permission set, which is how "authenticated is enough" is made unrepresentable: no value
   exists that gates on authentication and names no permission. `ANONYMOUS` is a separate sentinel, not a
   policy, so it cannot be reached by passing a policy name.
2. **Every route declares `config.policy`**, obligated at `onReady` alongside the schema surfaces. Missing, or
   naming an unregistered policy, refuses the boot. This means `RecordedRoute` has to grow a `config` field,
   because the recorded shape currently carries only method, url, constraints and schema.
3. **An enumerated anonymous allowlist**, frozen, in the same module, each entry carrying a `why` string (the
   claim asks for carve-outs justified in the scan itself, mirroring TEN-5). A route declaring `ANONYMOUS` that
   is not on the list refuses the boot. **And the reverse**: an allowlist entry matching no route refuses the
   boot too. The claim does not ask for the reverse check. I would build it anyway, because a list that can
   only grow is not a surface anybody reviews, and a stale entry is a pre-authorized hole waiting for a URL to
   be re-registered under it.
4. **A deny-by-default fallback** as an `onRequest` hook installed by `createApp` in the same expression that
   creates the instance, on the identical argument that puts the recorder there: no window may exist in which
   an instance has routes and lacks the fallback. It reads `request.routeOptions.config?.policy` and the
   **default branch denies**. Not a policy and not `ANONYMOUS` produces 403 without calling through.

**Predicted at step 2, worth measuring:** the claim calls the fallback "the belt to the scan's braces", which
presumes the two are independent. In .NET they plainly are, because the scan is a test in one process and the
fallback is host configuration in another. Here both are things `createApp` does, at the same moment, in the
same expression. I expect to find that the independence has to be re-bought and that the honest form of it is
different: the scan consults the **table** and the fallback consults the **request**, so the fallback covers
precisely the hole the table cannot (a URL served with no route behind it). If the deny hook runs for an
unmatched URL, SEC-1 closes the residual hole S-5 names, which would be a strict gain over the sibling edition
rather than a loss.

**Predicted second problem:** proving the fallback denies rather than merely being registered, which the claim
demands in so many words. Obligation 2 makes a policy-less route unregisterable, so I cannot compose one to
test the fallback against. The .NET edition does not have this problem, because its scan is a test and does not
stop a test from mapping an ungated endpoint. Expected resolution: drive the exported hook directly with a
synthetic request carrying an empty `config`, plus an injected end-to-end pair (no credential gives 401, wrong
permission gives 403).

**Predicted A-1 interaction.** The allowlist is keyed by method and URL, and `/health` is anonymous, so the
allowlist must contain `HEAD /health`, a route nobody wrote and nobody can point at in source. Either the
allowlist is authored per-GET and expanded to its synthesized HEAD by the mechanism, or a human is asked to
review an entry for a line that does not exist.

**Predicted cross-claim gap.** "an enumerated allowlist reviewed as a security surface" is a review obligation,
and the edition's review mechanism is HUM-1, whose repaired form enumerates exactly three fixed
irreversible-surface categories (`schema-migrations`, `wire-contracts`, `contract-docs`) that an edition may
not extend. SEC-1 names a fourth kind of reviewed surface and HUM-1 has nowhere to put it.

---

### SEC-3 step 2: no PII in routes or query strings

**Surface.** `app.routeTable`, two halves: path parameters and query parameters. **Predicate.** no parameter
name matches the PII name list.

This is the claim whose predicate ports without friction, so the interesting half is entirely the surface, and
I expect it to confirm S-5 a third time rather than produce something new.

What I would build:

1. `PII_PARAMETER_NAMES`, one frozen list in one module, seeded with the claim's own five (email, phone, name,
   ssn, dob) and documented as the D-000 extension point the weakening note describes.
2. **Path parameters read from both sources and reconciled.** The URL text carries `:id` and
   `schema.params.properties` carries `id`, and those are two independent views of the same set. Comparing them
   is free here and follows the reconciliation lesson: a params schema naming a property the URL does not
   carry, or a URL parameter the schema omits, is a disagreement and should refuse rather than be resolved in
   favour of whichever the scan happens to read.
3. **Query parameters from `schema.querystring.properties`**, which the route-table obligation already forces
   to exist and to be closed with `additionalProperties: false`. So the declared query set IS the accepted
   query set, which is what makes a name scan over the declaration a true statement.
4. **Matching on split tokens, not equality and not substring.** `emailAddress`, `user_email` and `Email` all
   carry an email and equality misses all three; substring matching makes `filename` match `name`. So:
   normalize by splitting on camel case, underscores and hyphens, lowercase, then match any token against the
   list. Predicted cost, stated before measuring: `fileName` splits to `file` and `name` and will be a false
   positive, because `name` is a genuinely bad list entry. Carve-outs are named in the scan with justification,
   in the SEC-1 discipline the claim itself points at.

**Predicted structural requirement the claim does not name.** The scan has to run over *the* composed app, not
a test-local one, or B-1's "one scan over one enumeration covers the whole surface" is false. That needs a
single `composeApp()` that `main.ts` and the architecture tests both call, and a lint keeping route
registration out of everything else. In .NET this is free from `WebApplicationFactory<Program>`, which composes
the real host. Expect a delta here.

**A ruling I would make at step 2 and expect to have to defend.** Predicates that assert a claim go in
architecture tests over the composed table, NOT into `createApp`'s boot refusals. `createApp` owns the
completeness of the enumeration; if it also owns every claim's predicate it becomes the whole kernel, each
claim's guard becomes indistinguishable from the others, and a claim that wants to *report* on carve-outs
cannot, because the boot already refused.

---

### SEC-2 step 2: request contracts never carry server-controlled fields

**Surface.** every route's `schema.body`, reached from `routeTable`. **Predicate.** no property name matches
the forbidden-field registry.

B-2 already predicted this comes out inverted (Node stronger, because the contract is a value attached to the
route rather than a type to be inferred), and that prediction was made from a design, not from a mechanism.
What step 2 adds:

1. `SERVER_OWNED_FIELDS`, one frozen registry: entity id, tenant id, created/updated timestamps,
   created/updated by, status and state, concurrency token (rowVersion, etag, version), role and permission
   grants.
2. **A recursive schema walk**, because the fields hide below the top level: `properties`, `items`, and the
   `allOf` / `anyOf` / `oneOf` combinators. `$ref` needs no resolver because the surface obligation already
   refuses one at registration.
3. **A reported path** (`body.author.createdBy`), because a violation reported against a route is not
   actionable when the field is three levels down.
4. Same token normalizer as SEC-3.

**Predicted finding, and this is the one I most want to test.** SEC-2's mechanism class says "a reflection scan
over every body-bound request type". The **query string is a request surface that binds**, and
`PATCH /notes/:id?status=Approved` is mass assignment through a surface the claim's mechanism does not cover.
The same is true of path parameters. In .NET a `[FromQuery]`-bound parameter is not a "body-bound request type"
either, so this is not a Node artifact; it is a hole in the claim, visible from here only because Node makes
the query surface a first-class declared object that the scan is already holding. If it holds, the claim's
`Statement` ("no request contract exposes a field the server owns") is strictly broader than its
`Mechanism class`, which is the S-5 shape pointed at a different part of the sentence.

**Predicted non-finding, recorded so it is not later claimed as one.** The three claims in this round need
three registries (PII names, server-owned names, tenant-shaped names) and one shared normalizer. That is not a
defect. It is worth one sentence only because a bug in the shared normalizer silently weakens three claims at
once, and each claim's `proven` row would keep reading `proven`.

---

### TEN-1 step 2: tenant comes only from the credential

**Surface.** the route table, across **four** declared surfaces, because this claim's statement names four:
route, query, header and body. **Predicate.** no parameter or field is tenant-shaped.

The route half and the body half are SEC-3 and SEC-2 with a different registry, and I expect a delta of near
zero on both. The header half is where I expect this claim to break, and I am writing the reason down before
looking:

**Headers cannot be closed.** The query-string mechanism works because
`additionalProperties: false` on a declared object makes the declared set the accepted set, and Fastify's
`removeAdditional` enforces it by stripping. Headers cannot work that way: every request carries `host`,
`user-agent`, `accept` and a dozen more, so no route can declare a closed header schema, and
`request.headers` is readable in full whether or not anything was declared. So the route table can enumerate
**declared** headers and can say nothing about read ones, and a scan over the table cannot support the
sentence "tenant identity never travels as a header".

Predicted consequence: TEN-1's mechanism class ("an architecture test scans the application's real route
table") does not reach the header half at all, and the reachable centralized mechanism is a **different class**:
an `onRequest` hook in `createApp` that strips tenant-shaped headers before any handler sees them. That is
runtime, total, and in one place, so the `centralized` locus survives, but it is not a scan and no part of the
claim names it. Expect a class A finding on the mechanism class with the locus refuted, which would rhyme with
B-1.

**The carve-out.** TEN-6's identity mint surface is the one sanctioned exception, named and justified in the
scan itself. TEN-6 is owed in both editions, so the carve-out list is empty here, and the scan should say that
in words rather than have an empty array that reads as an oversight.

---

## Round 1, step 3 (2026-07-26): the deltas

Read at step 3: `EndpointSpineTests.cs`, `ContractShapeTests.cs`, `ServerControlledFields.cs`, `HostSecurityTests.cs`,
`Program.cs`, `PermissionPolicyProvider.cs`, and the four sibling conformance rows.

### SEC-1

| Prediction | Outcome |
|---|---|
| No policy registry; the bare form has to be made unrepresentable rather than rejected | **Confirmed.** The sibling asserts a policy string starts with `perm:` and is longer than the prefix, and its provider mints a policy for any suffix. That is a syntax check over a name, so a look-alike satisfies it; here a declaration must BE a member of `POLICIES`, compared by identity. |
| The allowlist needs a per-entry justification | **Confirmed, and worse than predicted.** The sibling's allowlist is `string[] = ["/health"]`. Its failure message tells the author to "add it to the allowlist with a justification" and the data structure has nowhere to put one, so SEC-1's own weakening note, which requires carve-outs justified in the scan, is unmet by SEC-1's own realization. |
| The allowlist needs a staleness check | **Confirmed absent.** Nothing notices an entry matching no endpoint. |
| The allowlist is keyed by method and URL | **Not predicted as a delta; found at step 3.** The sibling matches on path only, so one anonymous GET pre-authorizes every future method on that URL. |
| The scan and the fallback are not obviously independent here, and independence must be re-bought | **Confirmed, and the resolution is the one predicted.** Split by what each consults: the scan reads the table and never issues a request, the hook reads the request and never reads the table. Keeping the scan out of `createApp` is what made the fallback testable at all. |
| The fallback closes the S-5 ghost hole | **Confirmed by measurement.** `/ghost?email=a@b.com` returned 403 with an empty route table and no leaked query string; an unmatched URL returns 403 rather than 404. The hook is installed in the expression that creates the instance, so a ghost hook is by construction a later hook. |
| The allowlist must answer for a synthesized HEAD nobody wrote | **Confirmed, and the discriminator measured.** Fastify hands a synthesized HEAD the same options object as its GET, so `Object.is` on `config` is a proof of synthesis that no comparison of values gives. An independently registered HEAD is refused even when its config is identical in content. |
| HUM-1 has nowhere to carry a fourth reviewed surface | **Confirmed by reading `edition.json`,** and left as a finding rather than repaired, because inventing a fourth category unilaterally is the thing the S-7 repair deliberately refused editions. |

**The delta nobody predicted, and it is the largest one.** The sibling's fallback is
`SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build())`. An endpoint with no
authorization metadata is therefore reachable by **every authenticated caller in the system**, with no
permission and across tenants. SEC-1's statement asks for a fallback such that a forgetful endpoint is
"unreachable, not public", and bare authentication is the very gate SEC-1 forbids one sentence earlier. The
Node fallback denies outright and does not care whether the caller holds a credential, which costs nothing
because the scan guarantees every real route names a policy.

**And the delta on the test that proves it.** The claim asks for "a host test asserting the fallback policy
actually denies anonymous callers, not merely that it is registered". The sibling test reads
`IOptions<AuthorizationOptions>` and asserts a `DenyAnonymousAuthorizationRequirement` is present in the
requirement list. That is reading the registration one level deeper. It never evaluates the policy, never
composes an endpoint with no authorization metadata, and never observes a status code, so it cannot distinguish
a host that applies the fallback from one that never calls `UseAuthorization()`.

### SEC-3

**Predicate delta: near zero, as predicted. Surface delta: everything, as predicted (S-5 again, third instance).**

Two things were not predicted:

1. **The matcher.** The sibling compares `name.ToLowerInvariant()` against a hash set, which is equality. So
   `email` is on the list and `emailAddress` walks past it. The list compensates by hand-enumerating
   `firstname`, `lastname`, `dateofbirth` and `organisationid`, which is enumeration standing in for a
   comparison, and it still misses `emailAddress` and `userEmail`. Both claims frame the heuristic's weakness as
   NOVELTY ("a novel parameter name carrying PII escapes it"); the weakness that bites is MORPHOLOGY, and no
   weakening note in either claim mentions it.
2. **The parameter enumeration is a second reimplementation of the binder.** E-2 records that `IsBodyDto`
   reimplements ASP.NET's body-binding rules by exclusion. `BindsFromUrl`, in the same file, reimplements the
   URL-binding rules by enumeration of types, and SEC-3's whole surface rests on it. E-2 named one method; there
   are two, and the second is load-bearing for a different claim.

**The residual limitation the sibling names is closed here.** Its doc comment states that "a handler that takes
HttpContext and reads Request.Query[...] at runtime is invisible to any static route-table scan" and files it as
a slice-level review item. In Fastify it is not invisible, it is impossible: the query schema is mandatory and
closed, and `removeAdditional` strips every undeclared parameter before the handler runs, so `request.query.email`
is `undefined` no matter what the caller sent. This is the SEC-3 analogue of B-4. It closes the handler-reads-it
path and does NOT close the harm SEC-3 actually names, since a URL carrying PII still reaches logs and proxies
regardless of which edition is serving it, and neither mechanism addresses that.

### SEC-2

**B-2's conclusion survives and one row of B-2's own table is wrong.** The register's comparison credits the
sibling with "reflection recurses types" for nested objects, array items and combinators. Measured,
`BindableMemberNames` yields a type's own public properties and its constructor parameters and does not recurse
into a property's type or a collection's element type; `ContractShapeTests` enumerates only types whose name ends
in `Request`, so a nested `AuthorDto` is never enumerated at all. **A server-controlled field one level down in a
request body is invisible to both sibling guards.** No live instance exists, because the shipped contracts are
flat records, so this is a hole in the guard rather than an open vulnerability. It is recorded as E-6.

**The predicted finding about the query surface is refuted, by thinking it through rather than by measuring, and
the refutation is kept because it is the more useful result.** Step 2 predicted that SEC-2's mechanism class
("body-bound request type") is narrower than its statement, because a query string also binds and
`PATCH /notes/:id?status=Approved` is mass assignment through an uncovered surface. Building it showed why the
claim is right to scope where it does: filtering a list by `?status=open` is legitimate and extremely common, so
widening the registry to the query surface would fire on the routes it matters least for and would be turned off.
"Body-bound" is a proxy for "bound onto a persisted entity", the proxy is imperfect in both editions equally, and
changing the surface does not improve the proxy. The residual is real and small and is recorded as such, not as a
headline.

**One delta in the sibling's favour, recorded because this register is not a scoreboard.** `ServerControlledFields`
is a single registry shared by both sibling guards specifically so the two nets cannot drift apart. That is the
right instinct and the Node build adopted it, and then had to go further: `TENANT_SHAPED` is read by the scan AND
by a runtime hook, so it lives in `platform/` rather than beside the tests. A registry that is also a behaviour
cannot live in the test tier.

### TEN-1

**The header prediction is confirmed and the finding is bigger than predicted, because it is not a portability
finding at all.** Step 2 predicted that Node cannot reach headers through the route table and needs a different
mechanism class. Both halves hold. What step 2 did not predict is that **the sibling does not reach headers
either**: `ParameterNames` walks route-pattern parameters and method parameters, and nothing in `EndpointSpineTests`
looks at a header. A `[FromHeader] string tenantId` is caught only by accident, because the scan yields the name
of every scalar-typed handler parameter without caring where it binds from, and a header read ad hoc off
`HttpContext` is not caught at all.

So TEN-1 names four surfaces and both editions' mechanisms cover three. This is not "the Node stack is weaker
here"; it is a gap in the claim that one edition could not reveal, which is the exact thing this build exists to
find. Recorded as A-2.

The Node realization covers the fourth surface with a mechanism the claim does not name: a runtime strip in the
composition root, measured to remove `x-tenant-id`, `x-org-id` and `x-workspace-slug` while leaving `x-request-id`
and `host` intact. `centralized` survives, by a mechanism class that is not a scan.

---

## Round 2 (2026-07-26): configuration and time

**Claims: CFG-1, SEC-5, DATA-5, TIME-1.** All four step-2 designs below were written in one sitting, from the
four claim files and nothing else.

**Why these four, re-derived rather than inherited.** The round 1 handover proposed SEC-4 with TEN-6, or the DATA
family, and flagged its own sequencing as contaminated. Re-deriving from the claim files and the two conformance
records gives a different answer, on three grounds.

1. **A round is only a portability test where the sibling has a realization to differ from.** TEN-6 is `owed` in
   both editions, so its step 3 is empty by construction and the work reduces to first-realization. All four
   claims here read `proven` in the sibling, so all four have a real delta.
2. **These four name each other in the catalog's own text.** CFG-1's statement delegates its two right homes to
   SEC-5 and DATA-5 by id; DATA-5's runtime half is the timezone refusal that TIME-1's statement also cites by
   id. A-3 found that where ONE claim names two mechanisms and asserts a relationship, the relationship is part
   of the claim and does not port for free. This is the same shape one level up, across four claims, and it can
   only be tested by taking them together. Taking them one at a time is what would hide it.
3. **Nothing here is blocked and nothing here is a scan over the route table.** No store, no credential, no
   client tree. Four rounds have now attacked one mechanism class, and the catalog's conclusions about
   portability rest almost entirely on it.

### Quarantine, extended for this round, and why

The standing quarantine is the `mechanism` column of `kernel/dotnet-react/conformance.json`, the generated table
in `kernel/dotnet-react/README.md`, `kernel/dotnet-react/server/tests/Kernel.Tests.Architecture/**`, and the
proof tables in `kernel/dotnet-react/VERIFICATION.md`. **Extended for this round to
`kernel/dotnet-react/server/src/**` and to `kernel/dotnet-react/server/**/*.json`,** neither of which the
original list names.

The original list assumes a mechanism is a test. For round 1 that happened to hold. It does not hold here: three
of these four claims are realized substantially in production code and in committed configuration rather than in
the test tier, so the standing quarantine would have left the answers in plain sight. `appsettings*.json` is the
artifact CFG-1 and SEC-5 are ABOUT. Recorded before the round rather than after it.

**A hole in the quarantine that cannot be closed, and it is a finding rather than an inconvenience.** S-1 records
that the catalog's Enforcement section holds exactly one edition by construction, and has argued it as a schema
defect. It is also a protocol defect, and this round is where that becomes concrete. Every claim file carries an
`- Edition:` bullet naming the .NET realization, and step 1 says to read the claim file. So step 2 for these four
was written already knowing that the sibling uses `ValidateOnStart` on option types, asserts `UserSecretsId` in
every csproj, scans `server/src` and `scripts/` from `OperationalSettingsTests`, and bans `DateTime` in favour of
`DateTimeOffset` across four assemblies including persistence. That is most of a mechanism, handed over before
the prediction is written, and no quarantine can remove it without removing the claim.

The delta protocol is therefore weaker than it reads, uniformly and in the sibling's favour, and every step 2 in
this file including round 1's was written under it. Predictions below are marked `[informed]` where the claim
file supplied the answer, so the honest and the contaminated predictions can be told apart at step 3. This is
recorded as a finding in its own right rather than treated as an accepted cost.

### Pre-registered cross-claim prediction P-1

Stated before any of the four mechanisms is built, so that it can be refuted rather than confirmed by narration.

**P-1.** Every claim in this round will require the same purchase: **one confined seam plus a lint banning the
affordance everywhere else**, and the sibling will require none of them, because each distinction these claims
draw is modelled in .NET as a TYPE and in Node as nothing. B-1 established this for route enumeration and read as
a fact about routing. If it holds across configuration, secrets, startup validation and time, it is not about
routing: it is the general statement of what this port costs, and `centralized` in the catalog silently means
"free in a reflective, nominally typed runtime".

**Falsifier, named in advance.** CFG-1's literal-shape scan is a text scan over source in both editions and
should port with no confinement at all. If CFG-1 ports whole, P-1 is refuted as stated and survives only in the
weaker form "claims whose surface is a runtime value". I expect the split to fall inside CFG-1 rather than
between claims, which is a worse outcome for P-1 than a clean confirmation and is what I actually expect.

**P-2.** S-8 recurs. The conformance vocabulary has no value for a claim that is half realized, which round 1
found on TEN-1 and recorded as one claim's problem. I predict it fires on at least two of these four, and I can
name the halves from the claim text before building: SEC-5's vault port is `owed` inside its own Edition bullet,
TIME-1's wall-clock-delta lint is `owed` inside its own Edition bullet, and DATA-5's runtime-refusal half has no
seam in this edition to refuse at. If S-8 fires on three of four, it stops being a finding about TEN-1 and
becomes a measured property of the vocabulary at a rate worth quoting to the adjudication pass.

---

### CFG-1 step 2: operational settings are configuration, not code

**Surface.** host source and shipped scripts, as text. **Predicate.** no operational-setting literal shape.

**The first thing the claim runs into: Fastify has no configuration concept at all,** which is the same sentence
SEC-1 produced about authorization and is now the second instance. There is no layered provider, no
`appsettings.json`, no environment overlay, no binding to a typed options object. So "resolve from configuration
and live in committed appsettings" is not a thing the edition can point at, it is a thing the edition must
invent before the claim's ban means anything: a ban on the third, wrong home is empty until the two right homes
exist. What I would build:

1. **A committed settings document**, `server/config/settings.json`, plus a per-environment overlay
   `settings.<env>.json`, both committed, layered in that order.
2. **One settings seam**, `platform/settings.ts`, the only module in the server that reads the config files or
   the process environment. It resolves, validates (DATA-5), freezes, and returns. Everything else receives the
   resolved object as a parameter, exactly as `composeApp` receives its surfaces.
3. **A lint confining the affordance**, banning `process.env` outside that seam, in the shape the socket ban and
   the framework-import ban already use in this edition, with one named exemption.

**Predicted class A finding, and it is the reason I put CFG-1 in this round.** CFG-1 names two right homes
(committed configuration, the secret store) and one wrong home (a literal in code). **Node has a fourth home the
claim does not name: the ambient process environment.** `process.env.PORT ?? 5080` is not a literal in code, so
the literal-shape registry cannot see it; it is not committed configuration, so it escapes the config-review
surface and the per-environment surface; and the `??` default is a silent fallback of exactly the kind DATA-5
forbids. Every harm CFG-1's own harm paragraph names applies to it, and its mechanism class is blind to it by
construction.

This is not hypothetical and I am not predicting it about a future project: `kernel/node-react/server/src/main.ts`
ships that line today, in the edition that reports on this claim. Found by reading CFG-1, before opening
anything.

I expect this to be genuinely absent in .NET rather than merely handled differently, because .NET's default
configuration builder includes an environment-variable provider, so reading an env var there goes THROUGH the
config system and arrives with a declared key and a per-environment surface. Node has no config system, so the
env read happens raw at the point of use and is scattered by default. The claim generalized from a platform
where the ambient environment is already inside the right home.

4. **The literal registry**: model-id shapes, provider endpoint URLs, timeouts, feature-flag booleans, ports.
5. **The script surface.** "A script never duplicates a committed configuration value, it reads it." The Node
   script surface is `package.json` scripts, `.github/workflows/*.yml`, `tools/*.mjs` and
   `client-web/tools/harness/*`. **Predicted structural problem:** in the sibling, `server/src` and `scripts/`
   are disjoint directories, and here the script surface is partly INSIDE a manifest that DEP-1 also owns and
   that legitimately carries literal version numbers. A text scan over "shipped scripts" therefore cannot be
   file-granular; it needs a per-file notion of which literals are values. Expect a delta here and expect the
   sibling not to have the problem.

**Predicted cross-claim gap, and this is the round's version of A-3.** CFG-1's mechanism class ends "plus the
SEC-5 and DATA-5 mechanisms already covering the two right homes". So CFG-1's enforcement is complete only if
two OTHER claims are realized, and CFG-1's conformance row has no way to say so. Build CFG-1 alone and it reads
`proven` while a secret sits in the committed settings file it just created, because the right-home half is not
CFG-1's to enforce. A-3 found the relationship problem inside one claim; I predict the same problem ACROSS
claims, where it is worse, because the conformance record is one row per claim and there is nowhere to write a
dependency.

---

### SEC-5 step 2: no secret in committed configuration

**Surface.** committed configuration files, plus the whole repository for the scan half. **Predicate.** no
secret-shaped key holds a non-placeholder value; no secret-shaped value anywhere.

Two mechanisms again, and the claim asserts no relationship between them this time, which is itself worth
noticing after A-3.

1. **The config-shape test.** A key whose name token-matches a secret registry (secret, password, key, token,
   credential, connection string, api key, private key, client secret) must hold a placeholder. **The claim never
   defines "placeholder", and that is the interesting half.** Deciding it by heuristic (entropy, length, looks
   like a real key) is a second heuristic underneath the first, which is E-2's shape exactly. So I would make it
   a closed rule instead of an inferred one: the ONLY permitted value for a secret-shaped key in a committed file
   is the empty string, so there is no judgement to make and no scanner to tune. That is the same move SEC-1's
   policy registry made, unrepresentable rather than rejected, and I expect the sibling to have made the
   heuristic choice because a config-shape test over `appsettings.json` has no way to forbid a value shape
   without judging it.

2. **The dev secret store, and this is my strongest class C candidate of the entire build.** The claim requires
   development secrets to live "in the developer-local secret store, outside the repository tree". `[informed]`
   The claim's own Edition bullet names .NET User Secrets and says the mechanism is an arch test asserting
   `UserSecretsId` is present in every service csproj. **Node has no such facility.** The idiomatic Node answer
   is a `.env` file, which is INSIDE the repository tree and kept out of history only by `.gitignore`, and a
   gitignore entry is a strictly weaker guarantee than a path outside the tree: it is a deny-list, `git add -f`
   overrides it, and it protects nothing once the tree is copied or archived.

   Reachable, but nothing is free: the settings seam resolves dev secrets from a declared path outside the repo
   root, and a test asserts that the declared path is outside the root. **And the completeness obligation bites
   in the S-5 shape**: that test proves the DECLARED source is outside the tree and proves nothing about a second
   reader, unless file reads and `process.env` are confined to the one seam by lint. Which is the CFG-1
   confinement, needed again, for a different claim, for a different reason.

   Predicted finding: SEC-5's mechanism class assumes the platform supplies an out-of-tree per-project secret
   store AND supplies a manifest field asserting it is wired. Both are .NET facts. The portable content is "dev
   secrets resolve from outside the tree through one seam, and the seam is the only reader", and no part of the
   claim says the second half.

3. **The CI secret-scan gate, and it collides with DEP-1 in this repo.** "A CI secret-scan gate over the
   repository" is a class of mechanism, but every realization is a third-party action, and E-1 records that this
   repo's workflows pin actions by mutable major tag with no ledger row. Adding a scanner under DEP-1's rules
   means pinning by digest and ledgering it; adding it the normal way means executing unpinned third-party code
   inside the loop that gates every claim in the catalog. Predicted resolution: write the scan in the shared
   tool rather than import one, and record that SEC-5's mechanism class assumes a scanner exists and says
   nothing about its provenance, which is a live tension with DEP-1 inside one repository.

4. **The unenforceable half, named now so it is not quietly dropped.** "A secret never transits a chat
   transcript, a work log, or any committed file." A chat transcript is not a surface any mechanism in this
   repo can reach. A work log under `docs/work/` is a committed file and IS reachable. So the sentence is one
   third enforceable and is written as though it were whole, and SEC-5 reads `proven` in the sibling.

---

### DATA-5 step 2: mandatory configuration fails fast

**Surface.** the resolved settings document at startup, and the seams that need runtime context.
**Predicate.** every mandatory key is present and valid before anything runs; a missing runtime context is
refused by name.

1. **Validate the settings document with the machinery the edition already owns.** The server already carries a
   JSON Schema validator, because Fastify validates requests with Ajv, and it already carries the discipline of
   closed object schemas from the route surface obligation. So the settings document gets a schema, closed with
   `additionalProperties: false`, validated at startup. **Predicted advantage over the sibling, and the reason
   I think this is the B-2 inversion again:** `ValidateOnStart` is per options type, so an options type nobody
   registered is silently unvalidated and an appsettings key nobody bound to a type is silently ignored. One
   closed schema over the whole document has neither hole: an undeclared key is REFUSED rather than ignored,
   which is the difference between a description and a filter.

2. **Applying E-10 to my own mechanism before an audit applies it for me.** E-10 is the round 1 audit's finding
   that a closure obligation has a depth, and that this edition stated the obligation, proved it, and bought it
   at level zero. A settings document is a nested object. So the closure obligation is recursive here from the
   start, and the honest test of whether this edition learned anything is whether the existing machinery is
   REUSABLE for a surface it was not written for. Predicted: it is welded to `RouteOptions` and will have to be
   lifted. Worth measuring, because "the guard generalizes" is most of what makes a kernel a kernel and nobody
   has tested it.

3. **All missing keys, not the first.** The claim says "an error naming the missing key", singular. A validator
   that stops at the first turns a three-key misconfiguration into three failed deploys. I would report all of
   them, and record the singular phrasing as a defect that a single-key test can never surface.

4. **The ordering obligation the claim does not name.** "Executed at startup (not first-use)" is a `when`, and
   the claim states it as a property of the validation rather than as an obligation on composition. The real
   requirement is that validation completes before any seam that could read a setting exists, which in this
   edition means before `createApp`. That is the third time this build has found a timing dimension missing from
   a stated obligation, after the Phase 2 audit added a `when` to S-5 and round 1's audit added a depth. Predict
   the sibling gets the ordering free from the host builder and therefore never had to state it.

5. **The runtime-refusal half has no seam here, and I am not going to claim it.** "An operation requiring context
   the system does not have refuses with a named error rather than guessing" needs an operation that needs
   context. This edition has no principal, no credential and no timezone. The startup half will be real and
   proven; the runtime half will have nothing to run against. Pre-registered as an instance of P-2.

---

### TIME-1 step 2: UTC-anchored, offset-aware, and nothing else

**Surface.** `[informed]` domain, contracts, application and persistence, which the claim's Edition bullet
enumerates as assemblies. **Predicate.** no naive datetime; durations from a monotonic source.

This is the claim carrying three untested seeded hypotheses, and I think the headline one is wrong.

**"JavaScript ships one `Date` and it is the unsafe one" is, I predict, false, and false in the interesting
direction.** A JS `Date` holds milliseconds since the Unix epoch. It is an INSTANT: it has no offset field and
no zone, and it is also not ambiguous, which is not the same thing. A .NET naive `DateTime` is ambiguous, which
is the harm TIME-1's harm paragraph is entirely about, and a JS `Date` is not ambiguous. So `Date` is neither
the forbidden type nor the permitted one. It is a third thing, and the claim's ban is a two-way partition with
no bucket for it.

The lattices do not correspond. .NET offers naive, offset-aware, date-only and time-only as four distinct types,
and reflection can tell them apart for free. JavaScript offers `Date`. TypeScript adds nothing, because it adds
no runtime values. Consequences I predict:

- **The contract half moves surface and stays reachable.** A contract here is JSON Schema, and JSON has no time
  type at all: a time value is a `string` with `format: 'date-time'` (RFC3339, and RFC3339 requires an offset),
  or `format: 'date'`, or `format: 'time'`. So the ban is on a FORMAT, and the naive shape is a time-named
  string carrying no format, or a local-flavoured one. That is a scan over the route table this edition already
  owns, so I predict a near-zero predicate delta and a total surface delta: S-5's fourth independent instance,
  in a family that has nothing to do with the three that produced it.
- **The domain half must become a lint, and the lint must ban a function rather than a type.** Nothing carries a
  type at runtime, so there is no reflection to do. Worse for a type-shaped ban: `const t = new Date()` has no
  annotation to reject, so a ban on declared positions misses values that arrive by inference. The reachable ban
  is on the constructor and the globals, `new Date()`, `Date.now()`, `Date.parse()`, outside one clock seam.
  Which is the confinement P-1 predicts, for the fourth claim in a row.
- **The persistence half has nothing to scan.** No store. P-2 again.

**Where I predict Node is genuinely stronger, and the claim's own weakening note is the evidence.** TIME-1
records that `DateTimeOffset` is insufficient for a future local event, because it stores an offset and not a
zone, and that the right shape is "wall time plus the IANA zone id", filed as the rule the first scheduling
slice adopts rather than something the scan enforces. If Node 24 ships TC39 `Temporal`, then
`Temporal.ZonedDateTime` IS wall time plus an IANA zone id as a first-class value, `Temporal.Instant` is the
offset-aware instant, `Temporal.PlainDate` and `Temporal.PlainTime` are the zoneless calendar concepts the
weakening note carves out, and `Temporal.PlainDateTime` is precisely the forbidden naive type, nameable and
bannable. The lattice would then correspond exactly, be RICHER than .NET's on the one axis the claim admits it
is short on, and be bannable by name.

**I am not asserting that Node 24 ships it.** Three passes of this register have been corrected for asserting a
sibling property from what it ought to be rather than from measurement, and asserting a property of my own
runtime from memory of a standards timeline is the same error with the target moved. It is measured at build
time, and whichever way it comes out is recorded.

**The monotonic half, predicted delta.** `[informed]` The claim asks for a lint banning wall-clock-delta idioms
outside the clock seam, and says the lint is owed in the sibling. Node has `performance.now()` and
`process.hrtime.bigint()`, both monotonic, so the source exists. The predicted difference is shape rather than
availability: the .NET idiom is `Stopwatch`, a TYPE, so a type ban finds it; the Node monotonic source is a
function on a global, so the seam has to be bought by confinement. P-1, fifth instance, inside the one claim
half where the sibling has not built the mechanism either.

---

## Round 2, step 3 (2026-07-26): the deltas

Read at step 3, after the whole of step 2 was written and built: `OperationalSettingsTests.cs`,
`SecretConfigShapeTests.cs`, `StartupConfigTests.cs`, `TimeTypeTests.cs`, `Program.cs`, `appsettings.json`,
`appsettings.Development.json`, `Kernel.Api.csproj`, `scripts/e2e.sh`, `scripts/dev-setup.sh`,
`.github/workflows/ci.yml`, and the four sibling conformance rows.

**Everything asserted below about the sibling was measured, not read.** The sibling's architecture suite was run
(baseline 49 of 49), and every claim about what it does or does not catch is a mutation with a control. Three
passes of this register have been corrected for inferring a sibling property from what a mechanism ought to do,
and E-6 was corrected for asserting a property of the sibling's contracts without enumerating them. The tree was
restored after every mutation and `git status` confirms it.

### CFG-1

| Prediction | Outcome |
|---|---|
| Fastify has no configuration concept, so both right homes must be built before the ban means anything | **Confirmed**, and this is the second instance of the sentence SEC-1 produced about authorization. The sibling gets a layered provider, a committed appsettings surface, a per-environment overlay and an environment-variable provider from the platform, and none of it is edition work. |
| The ambient process environment is a fourth home the claim does not name | **Confirmed on both sides of the comparison, which is more than predicted.** In Node it bites: `main.ts` shipped `process.env.PORT ?? 5080`. In .NET it does not, and the reason is the one predicted before looking: `Program.cs` reads configuration only through `builder.Configuration[key]`, and the default builder already includes an environment-variable provider, so an env read there arrives through the config system with a declared key. The claim generalized from a platform where the fourth home is already inside the first. |
| The script surface is partly inside a manifest that DEP-1 also owns, which the sibling will not have | **Confirmed.** The sibling scans `scripts/*.sh`, top directory only, a directory disjoint from `server/src`. |
| CFG-1's enforcement is complete only if SEC-5 and DATA-5 are realized, and its conformance row cannot say so | **Confirmed and unremarked in the sibling.** All three read `proven` there, so the composition holds by accident of scheduling rather than by anything that would notice if it stopped holding. |

**The delta nobody predicted, and it is the largest one for this claim.** CFG-1's statement ends with a sentence
of its own: "Scripts are part of the code surface: a script never duplicates a committed configuration value, it
reads it." **Nothing in the sibling enforces it.** `OperationalSettingsTests` scans two regular expressions, an
AI model id and four named provider endpoints, and that is the whole test. A script that pasted the committed
issuer would pass. The sibling's conformance row reads "`scripts/e2e.sh` reads Jwt values from committed
appsettings, never duplicating them", which is a true statement about the current state of one file and is not a
mechanism. Read against the claim, it is the harm paragraph's own second incident ("then a script duplicating
committed issuer and audience values so the two copies could drift") recorded as fixed and left unguarded.

`e2e.sh` does read them, and does it well, with a comment explaining why. That is the discipline working once, by
hand, in the file that met the problem.

**One honest limit on the Node repair, stated rather than discovered.** The duplication check compares committed
values against parsed string literals and ignores values shorter than eight characters, because a check that
fires on `info` or on a port number is a check somebody deletes. The sibling's committed issuer and audience are
both the string `kernel`, so the Node mechanism would not catch a script duplicating THOSE either. The check is
exact where it applies and its floor is a heuristic; both editions are therefore uncovered for short
configuration values, and the claim says nothing about value length because it never had to.

### SEC-5

**The class C prediction is refuted and then inverted, and the inversion is the finding.**

Step 2 predicted that the dev secret store would be SEC-5's portability casualty: the claim requires development
secrets "outside the repository tree", .NET supplies User Secrets as a platform facility with a manifest field an
arch test can assert, and Node's idiomatic substitute is a gitignored `.env` INSIDE the tree, which is a property
of a tool's configuration rather than a property of a path.

Both halves of that are true. `Kernel.Api.csproj` carries `<UserSecretsId>` and `scripts/dev-setup.sh` populates
`Jwt:Key` through `dotnet user-secrets set`. And then:

**The sibling keeps a development secret inside the repository tree, protected only by a gitignore entry, while
SEC-5 reads `proven`.** `scripts/dev-setup.sh` generates `MSSQL_SA_PASSWORD` and writes it to `.env` at the
edition root; `.gitignore` lists `.env` and `.env.local`, with the comment "Local dev secrets (SEC-5): the SA
password lives here, never committed". The edition names the claim in the comment that documents the exception
to it. So the mechanism this pass predicted Node would be forced down to is the mechanism the sibling already
uses for one of its two development secrets, and nothing notices, because `SecretConfigShapeTests` scans JSON
files under `src/` and `.env` is neither JSON nor under `src/`.

**And the delta that matters most, measured rather than reasoned.** The edition's principal development secret is
`Jwt:Key`. Committed in plaintext to `appsettings.json`, it leaves **all 49 architecture tests green and the CI
secret-scan silent**. Both of SEC-5's mechanisms miss it, for two independent reasons:

- `SecretConfigShapeTests` matches `leafKey.Contains(entry)` against
  `["password","pwd","secret","apikey","api_key","accesskey","privatekey","token","signingkey"]`. The leaf key is
  `Key`, which is SHORTER than every entry that would describe it, so the containment runs the wrong way and
  matches nothing. This is E-9's finding in a fourth registry and in a third direction: E-9 found equality missing
  the compound (`emailAddress` past `email`); here containment misses the ATOM (`Key` past `signingkey`).
- The CI grep requires the literal lowercase words `password|pwd|secret|apikey|api_key` before the separator, and
  it carries no `-i`. Measured: `secret: "Sup3rSecretValue123"` matches and `Password: "Sup3rSecretValue123"` does
  not. **.NET's configuration convention is PascalCase**, so the scan is written in the one casing its own
  platform does not use for config keys. The workflow's own literal `MSSQL_SA_PASSWORD: 'Ci_Harness_Pass123!'`
  sits in a scanned file and is invisible for exactly this reason.

The Node matcher catches every one of those spellings, measured: `Key`, `key`, `Password`, `PASSWORD`, `ApiKey`
and `signingKey` all match, and `keyboardLayout` does not. That is not a scoreboard entry, because the reason is
the token matcher this edition already had to build for E-9, in a claim family E-9 does not mention. The cost is
the same one E-9 records: `tokenCount` matches `token`, and a false positive is the price of a run.

| Prediction | Outcome |
|---|---|
| The claim never defines "placeholder", so the sibling will decide it by heuristic | **Confirmed.** `IsPlaceholder` is five clauses: empty or whitespace, or the value contains `{`, or `<`, or `$(`, or the substring "user-secret", or "placeholder". A judgement about a value's shape, which is the second heuristic underneath the first that E-2 names. The Node rule is that the only permitted committed value is the empty string, so there is nothing to judge. |
| A CI secret-scan gate collides with DEP-1, because every realization is an unpinned third-party action | **Refuted, and the sibling resolved it the same way this pass did.** It writes its own `grep` in the workflow rather than importing a scanner. The pressure was real and both editions independently declined to add the dependency, which is worth recording as agreement rather than as a finding. |
| "Never transits a chat transcript, a work log, or any committed file" is one third enforceable | **Confirmed by absence.** Nothing in either edition reaches a transcript or a work log. |

### DATA-5

**The prediction that mattered was informed, and the information was wrong.** Step 2 was marked `[informed]`
where the claim file supplied the sibling's mechanism, and DATA-5's Edition bullet reads "`ValidateOnStart` on
all option types in the skeleton". Measured: `grep` over the whole of `server/src` finds **no `ValidateOnStart`,
no `AddOptions`, and no options binding of any kind**. The single `IOptions<>` in the tree is
`PermissionPolicyProvider` consuming `AuthorizationOptions`, which belongs to SEC-1. The realization is a
hand-rolled four-line `Required(string key)` closure over `builder.Configuration[key]` in `Program.cs`.

So the catalog's own Edition line describes a mechanism the shipped edition does not have. That is worth
separating into two consequences, because they are different in kind. The claim's `Mechanism class` bullet names
"options validation executed at startup", and a `Required()` read at startup satisfies the CLASS; what is wrong
is the `Edition:` bullet, which names a specific .NET facility that is not used. And the protocol consequence is
sharper: this pass wrote a step-2 prediction shaped by a sentence in the catalog that turned out not to describe
anything, which is the first measured instance of the quarantine hole recorded at the top of this round.

| Prediction | Outcome |
|---|---|
| One closed document refuses an undeclared key; `ValidateOnStart` is per type, so an unbound key is silently ignored | **Confirmed, and by a simpler route than predicted.** There is no options binding at all: `IConfiguration` is a dictionary and an appsettings key nobody reads is ignored by construction, with nothing that would report it. `Harness:Enabled` is read directly and never declared anywhere. |
| The claim's singular "the missing key" is a defect a single-key test cannot surface | **Confirmed.** `Required()` throws on the first missing key, and `StartupConfigTests` blanks exactly one key per case, so the test shape and the mechanism shape agree with each other and neither can see the case where three are missing. Three missing keys is three failed deploys. |
| "At startup, not first-use" is an obligation on composition that the claim states as a property of the validation | **Confirmed, and free in the sibling.** The four `Required()` calls sit above `builder.Build()`, so ordering is a consequence of the host builder's shape rather than something anyone had to buy. Here it is bought by making resolved settings a required parameter of `createApp`. |
| The runtime-refusal half has no seam in this edition | **Confirmed, and the asymmetry is real rather than a Node limitation.** The sibling has a live one, `ToolExecutor`'s timezone refusal, because it has a tool executor. This edition has no principal and no timezone, so the idiom ships with a test and no caller. |

### TIME-1

**Both seeded hypotheses are refuted, and the first one splits the claim.**

The hypothesis was "the ban is on a type, and JavaScript ships one `Date` and it is the unsafe one". Measured: a
JS `Date` is milliseconds since the epoch. `new Date('2026-07-26T10:00:00+10:00')` and
`new Date('2026-07-26T00:00:00Z')` are the same value, and `toISOString()` renders UTC. So it is **not** the
unsafe one: it does not have the ambiguity that is the entire subject of TIME-1's harm paragraph. It is also not
the permitted one, because the originating offset is discarded at parse and there is no accessor for it.

`Date` satisfies neither side of a two-way partition, and the reason is that **"UTC-anchored offset-aware" fuses
two independent properties that `DateTimeOffset` happens to supply together**: unambiguity, which the harm
paragraph is about and `Date` has, and offset retention, which the harm paragraph never mentions and `Date`
lacks. One edition could not separate them, because on that platform they arrive in the same type. Recorded as
A-5.

The second hypothesis, that Node might be the stronger realization because wall time plus an IANA zone id is
native, is **refuted at this runtime**: `typeof globalThis.Temporal` is `undefined` on Node 24.13.1 with V8 13.6.
`Temporal.ZonedDateTime` would be exactly the shape TIME-1's weakening note says `DateTimeOffset` is short of,
and it is not here. Asserted as a test so that the day it arrives, the test goes red and the finding is revisited
rather than left quietly wrong.

| Prediction | Outcome |
|---|---|
| The mechanism class names assemblies, which is a .NET artifact in the portable layer | **Confirmed, and it is more blatant than B-1's leak.** B-1's claims said "a runtime scan over the composed route table", which READS portable. TIME-1 says "reflecting over domain, contracts, application, and persistence assemblies", which names the artifact type outright. |
| The contract half moves from a type scan to a format scan and stays reachable | **Confirmed.** `format: 'date-time'` is RFC3339 and RFC3339 requires an offset, so the wire surface is the one place in this stack where the claim's full requirement is native. Near-zero predicate delta, total surface delta: S-5's fourth independent instance, in a family unrelated to the three that produced it. |
| The domain half must ban a constructor rather than a type, because a value arriving by inference has no annotation to reject | **Confirmed.** The ban is on `new Date`, `Date.now`, `Date.parse`, `Date.UTC` and `performance.now` outside one seam. |
| The persistence half has nothing to scan | **Confirmed.** No store. |

**The delta nobody predicted, measured with a control.** `TimeTypeTests` scans three assemblies: Contracts, App
and Persistence. It does **not** scan `Kernel.Api`. A public class carrying a naive `DateTime` property, added to
`Kernel.Api/Platform/`, leaves 49 of 49 green; the identical class added to `Kernel.Contracts` turns the suite
red with the TIME-1 message. That is the guard binding correctly on the surface it covers and being absent one
assembly over.

It composes with a finding already in this register, and the composition is worse than either half. E-6 records
that `IsBodyDto` has a fifth, unrecorded exclusion, `type.Namespace is null`, so a public DTO declared in
`Program.cs` is skipped by SEC-2's body scan entirely, and that `NamingPlacementTests` exempts `Program.cs` from
the one-public-type rule. `Program.cs` is in `Kernel.Api`. So a request DTO declared there is invisible to SEC-2's
body scan and to TIME-1's type scan at the same time, by two independent gaps that happen to meet on one
sanctioned file.

**And the surfaces are disjoint, which neither claim notices.** The sibling checks C# types in three assemblies
and trusts the serializer for the wire form. This edition checks the wire form and has no types to check. Each
edition's mechanism covers what the other's cannot, both read `proven`-shaped confidence for the same claim, and
TIME-1's statement ("domain types, contracts, and persistence") is satisfied by neither alone.

### The two pre-registered predictions

**P-1 holds in the modified form it named in advance, and the falsifier fired where it was told to.** Three of
the four claims required the predicted purchase, one confined seam plus a lint banning the affordance elsewhere:
the settings seam for CFG-1's fourth home, the filesystem confinement for SEC-5's store, the clock seam for
TIME-1. The sibling required none of the three, because each distinction is a type or a platform facility there.
CFG-1 split exactly where step 2 said it would: its literal-shape scan ported with no confinement at all, being a
text scan in both editions. DATA-5 needed no confinement either, and that was not predicted: its ordering
obligation is bought with a required constructor parameter, which is a type-level constraint rather than a lint,
so the purchase exists and is not the one P-1 names. Two of four unconfined is a weaker result than a clean
confirmation and it is the result.

**P-2 is confirmed at three of four.** SEC-5's vault port is `owed` by its own Edition bullet and its committed
`.env` is now a second half nobody enforces; DATA-5's runtime-refusal half has no seam in this edition; TIME-1's
persistence half has no store and its monotonic lint is `owed` in the sibling by the claim's own text. Round 1
found S-8 on TEN-1 and recorded it as one claim's problem. Four claims later it is four claims out of five with
separable obligations and one status word, which is a rate rather than an anecdote.
