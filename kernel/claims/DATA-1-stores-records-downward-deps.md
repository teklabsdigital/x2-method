---
id: DATA-1
family: data
locus: centralized (per-module rules, centrally tested)
provenance: X-3 ruling, B2-2
---

# DATA-1: Stores, pure records, downward-only dependencies

**Statement.** Data access lives behind store interfaces; records are pure data holders with zero behavior; logic lives in services, stores, and projections. An endpoint never touches a store or the database context: it calls one service method. Dependencies flow downward only; no lower layer calls upward. Cross-boundary collaborators are interfaces registered at the composition root.

**Harm.** A system declared layering "non-negotiable" and enforced it with nothing; verification found three live seams, including a controller injecting the security database context directly behind an anonymous surface (B2-2, risk item 1). An unenforced layering rule decays into whatever the deadline needed.

**Enforcement.**
- Mechanism class: dependency-direction architecture tests: no endpoint/host type references a store implementation or DbContext; no persistence type references application services; store implementations are reachable only via their interfaces.
- Edition: NetArchTest-style rules in the arch-test project (the kernel's `DependencyDirectionTests` realizes the technique), in the CI loop.

**Weakening notes.** The rule set is dependency direction, not folder taxonomy. Whether a module needs an orchestration tier above its business services is a per-module design decision made at D-000, guided but not mandated (X-3): a single-service module is legal when YAGNI says so. Mandating the full orchestration/business/technical taxonomy on every module fails the impose-on-an-unmet-project bar.
