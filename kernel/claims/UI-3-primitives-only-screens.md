---
id: UI-3
family: client-ui
locus: centralized
provenance: X-7, B1-6
---

# UI-3: Screens compose primitives; only the primitive layer touches tokens

**Statement.** Screen and route code composes shared primitives only: no style-sheet creation, no raw platform text elements, no direct token consumption in screens. The primitive component layer is the sole consumer of theme tokens. Client business logic lives in separately testable services, hooks, and reducers; the UI layer is a thin veneer over them.

**Harm.** Style logic smeared across screens makes every design change a hunt, and logic embedded in components is untestable without rendering. Both source systems converged on the thin-veneer half (B1-6); the primitives half was proven enforceable.

**Enforcement.**
- Mechanism class: lint bans on style-primitive usage in the screens tree and on raw text-element imports outside the primitive layer; business logic testable off-framework (services and reducers unit-tested without rendering).
- Edition: the proven shape: zero `StyleSheet.create` under `app/`, only the Text primitive imports the platform Text, repos/reducers/transports tested off-React; the skeleton ships the primitive layer plus the lint rules preconfigured.

**Weakening notes.** The logic-placement half is structural rather than lint-provable: the skeleton's shape (data access in repos, state in pure reducers, hooks as the seam) is the mechanism, and the fidelity suites (UI-4) plus off-framework unit tests are the evidence it stays true.
