---
id: UI-2
family: client-ui
locus: centralized
provenance: X-7
---

# UI-2: Literal visual values are lint errors outside the token source

**Statement.** Literal colors (hex, rgb/rgba/hsl), inline font properties, raw radii, raw hairline widths, and raw spacing and dimension values (padding, margin, gap, width, height, offsets, insets, in numeric, px, and rem forms) are error-tier lint violations everywhere except the token source and the primitive layer. Errors gate the build; there is no warn-and-ship tier for these rules. The dimension allowlist is structural: unitless ratios, flex, order, integer z-index, percentages, viewport units, ch/fr/auto, and zero are not literals of the design system and pass.

**Harm.** Every literal is a fork of the design system that no refactor will find. Two comparable systems show the split cleanly: with this mechanism, zero error-tier violations; without it, hundreds (B2-3). The difference is the gate, not the discipline.

**Enforcement.**
- Mechanism class: error-tier lint rules banning literal visual values, wired into the client verification chain (typecheck + tests + lint) which runs in the CI loop.
- Edition: an ESLint restricted-syntax block (hex, rgba/hsl, raw font props, raw radius, hairline width, plus the Text-import and StyleSheet bans that belong to UI-3); token source file exempted by path.

**Weakening notes.** Two gaps found in a prior implementation (an AST-literal-only color rule that template literals and named colors escaped, a template-literal color being the live example; and a font-weight bound instead of set membership) are closed in the kernel edition: the color ban covers strings, template literals, and modern color functions, and font weights are a closed set. The named-color list is broad but not the full CSS keyword set. The former "spacing/size rules may start warn-tier while a project calibrates" hedge is withdrawn: the acceptance-test pilot proved it is exactly where drift lives (77+ raw dimensions, zero token references, all gates green), so dimensions are error tier with a structural allowlist instead of a calibration period (INV-09). Dynamic dimension values built in template literals remain a review item; the numeric and string forms are gated.
