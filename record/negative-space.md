---
kind: record
status: authoritative
---

# Negative space

The quiet half of the map: decisions that were green-but-wrong or gaps never noticed because
nothing failed. Surfaced by churn (turns clustering on one decision), ruled by a human. Churn
nominates; it never judges. Every ruling lands in one of two classes:

- **iteration-inherent**: the churn is the work; not knowable up front. The method's job is to
  name the loop so it is budgeted, not to prevent it.
- **pre-decidable**: the churn was avoidable; the method pre-flights it for the next project.

An entry earns its place by having bitten once or by cross-project frequency, and it must
graduate to a mechanized rule (a skill step, a claim, a checklist a gate runs) as soon as it can.

## The register

- **NS-1 The story-prototype loop.** Class: iteration-inherent, named structure (ruled, P2).
  Story sets are dynamic and heavily iterated by the owner; there is an entire loop from stories
  to UI prototype and back that refines the stories until acceptance. Gate 1 is provisional until
  that loop settles; re-approval of a revised set is a normal gate turn, not a breach. Evidence:
  P2's story set was its highest-churn decision (14 post-approval revisits before settling
  through the prototype). Mechanized in: x2:stories.
- **NS-2 The launch phase.** Class: pre-decidable, named structure (ruled, P2). Applies when the
  product ships to a public audience. Chrome, discoverability, social presence, legal pages,
  analytics, and edge hardening arrive as ad-hoc owner directives at the end unless ruled in or
  out early. Includes the estate question: a greenfield app can land inside an existing brand
  estate (styles, domains, policies) that is not greenfield. Evidence: P2 spent its largest
  zero-defect churn cluster here. Mechanized in: x2:decompose (the launch and exposure
  pre-flight).
- **NS-3 Exposure values and the lock-time exposure review.** Class: pre-decidable, named
  structure (ruled, P2). Applies when any surface is externally visible. Externally-visible
  values (serving domains, sender addresses, public identifiers, entry points) are ruled before
  first use, never assumed; and the frozen design artifact gets an exposure review at the lock,
  because a prototype can carry security-shaped choices (an admin door on a public page, a
  sequential identifier on a public surface) that transcription would ship. Evidence: P2, four
  separate instances. Mechanized in: x2:decompose, x2:lock.
- **NS-4 Model selection.** Class: iteration-inherent (ruled, P2). Applies when a feature is
  model-backed. Models are iterated on cost, suitability, and usability discovered during build;
  the churn is legitimate. Residual rule: record the emerging criteria (latency budget, cost
  ceiling, quality bar) in the decision record as the flips happen, so each flip has a baseline.
  Marked as a falsifier target: such decisions record a confidence and a wrong-if line.
- **NS-5 Pending-rulings tray.** Class: gate ergonomic, not a method rule (ruled, P2). Small
  single-value questions cost a full turn each when they ride alone; batch them at the next gate.
- **NS-6 Content voice tuning.** Class: iteration-inherent, ruled legitimate evolution (P2). The
  owner's voice is the product; per-value tuning turns are the work, not a defect. On record so
  future churn tables do not re-nominate it.
- **NS-7 Stays-ahead churn baseline.** Class: expected churn (ruled, P2). The decomposition
  record is revised by design as scope evolves; future churn tables baseline against it rather
  than flagging it.

## Cross-project churn table

Post-ruling revisits per decision type. Read by decompose as a pre-flight: pre-decide the
pre-decidable, budget the inherent. Counts are per project; the rank column is within-project
relative rank (the cross-project normalizer).

| Decision type | P2 revisits | Rank | Ruling |
|---|---|---|---|
| Story set | 14 | top | NS-1, inherent, named loop |
| Locked-surface deltas and re-locks | ~14 | top | sanctioned traffic; the re-lock pipeline priced it low |
| Decomposition record | ~12 | top | NS-7, expected churn |
| Content configuration boundary (what is code vs content) | ~9 | top | settled slowly; watch in P3 |
| Launch chrome and discoverability | 8 | high | NS-2, pre-decidable |
| Model-facing prompt architecture | 8 | high | loud half (fired as defect); see candidates |
| Acceptance-review register | 8 | high | sanctioned owner review churn |
| Content voice tuning | 6 | mid | NS-6, inherent |
| External delivery provider (sender, deliverability) | 6 | mid | part loud; exposure values under NS-3 |
| Abuse and edge hardening | 5 | mid | NS-2 adjacent; pre-decidable |
| Model selection | 4 | mid | NS-4, inherent, falsifier target |
| Micro-rulings (single values riding alone) | 3 | low | NS-5, gate ergonomic |
| Public entry-point placement | 2 | low | NS-3, pre-decidable |
| Serving-domain identity | 1, wide blast | low | NS-3, pre-decidable |
