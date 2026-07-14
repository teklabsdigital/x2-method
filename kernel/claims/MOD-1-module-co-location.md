---
id: MOD-1
family: modules
locus: centralized
provenance: X-3, Bucket 3
---

# MOD-1: A module's code lives together; modules meet only at the composition root

**Statement.** All code for a module lives under that module's folder on each side of the wire: endpoints, services, stores, contracts, and tests co-located by module, not scattered by technical kind across the tree. Modules depend on each other only through interfaces registered at the composition root; no module reaches into another's internals.

**Harm.** Kind-first layouts (all controllers here, all services there) make every feature change a tree-wide scatter, defeat working-set locality for both humans and generation loops, and hide coupling because nothing structural marks a cross-module reach.

**Enforcement.**
- Mechanism class: the kernel skeleton instantiates the layout, so the generation loop lands new code in the module by construction; dependency rules in the arch-test project reject direct cross-module type references outside composition-root wiring; client-side, deep-path import bans force modules through their public surface.
- Edition: the kernel's layout (`Endpoints/`, module folders, `Program.cs` registry) as the skeleton; NetArchTest cross-module rules; an ESLint deep-path import ban.

**Weakening notes.** Shared kernel-level primitives (auth, tenancy, wire conventions) are not a module and live in the platform layer; the arch rules must whitelist that layer explicitly or every module fails the cross-reference check for using the platform.
