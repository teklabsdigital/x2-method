---
id: UI-5
family: client-ui
locus: centralized (import ban) + per-seam (one smoke line per primary flow)
provenance: INV-07 (acceptance-test record, turns 18b and 20), CONF-02
---

# UI-5: The UI is a thin layer over tested services, and the composed entrypoint is exercised

**Statement.** The client UI holds no business or transport logic of its own. Modules outside the composition
root import neither the transport nor the data services; the composition root constructs the real client and
delegates; screens receive data and callbacks, they do not fetch. Type-only imports stay legal (a screen may type
its props against a service's exported types; types carry no behavior). And the composed entrypoint is exercised:
a smoke tier boots the ACTUAL app entrypoint against a running server and asserts at least one real request
leaves the client per primary flow. TEST-2 driving the services directly is necessary and explicitly not
sufficient; this claim is what makes "green" imply "the product runs".

**Harm.** Every gate green while the headline flow is inert. The acceptance-test pilot declared slice one green
on every tier while the composed UI never called the server (the sign-in button switched screens locally); the
thin-layer property was assumed, unenforced, and silently violated with every gate green. One import statement is
all it takes to smear transport logic into a screen where no service-level e2e can see it, and one unwired
callback is all it takes to ship an inert product that reads as done.

**Enforcement.**
- Mechanism class: a client lint import ban (modules outside the composition root cannot import the transport or
  data-service modules), plus a composed-entrypoint smoke wired into the CI e2e job.
- Edition: eslint `no-restricted-imports` bans `api/**` and `data/**` outside the composition root
  (`src/main.tsx`), the service and transport layers themselves, tests, and the harness/smoke tools, with
  `allowTypeImports` on; `npm run smoke` boots `src/main.tsx` in jsdom against the live harness server and
  asserts a real GET (the list loads and renders) and a real POST (create, then a real re-list) reach the server.

**Weakening notes.** The import ban is centralized: a violating import cannot merge. The smoke is per-seam: each
new primary flow owes its smoke line, and the flow list is reviewed at each slice (the slice-exit report's
coverage table is where a missing flow shows). The payoff of the thin-layer rule is that the smoke stays tiny:
the services underneath are already the tested seam (TEST-2), so the smoke only proves delegation, not behavior.
