---
name: problem-solve
description: Use when the product misbehaves at runtime and the cause is unknown, especially when reproducing needs the human's device, eyes, or account. Do not use for a red test with an evident cause (stay in the implement loop) or for green-but-wrong against the locked prototype (that is an adjudication turn; the fix goes in the decision file).
---

# X2 Problem Solve

Diagnosis, priced in human turns. Every "try this and tell me what you see" is a round trip the human
pays for, and the metric counts it. The kernel prevents classes of defects; it does not diagnose
novel ones, so when one appears, spend the fewest observation turns that honestly find the cause.

## The pipeline

1. **Observe.** Get the observation and visual evidence first (screenshot, recording, exact
   repro). Find the last working state in git; the diff between working and broken is the search
   space.
2. **Hypothesize.** Form two to four falsifiable hypotheses, each with the data signature it
   predicts. Write the expected values down before instrumenting; a hypothesis without a predicted
   signature is a guess.
3. **Validate with one pass.** Design ONE instrumentation deployment that discriminates between
   all hypotheses simultaneously: five to ten log points, state transitions only, a filterable
   prefix, no per-render logging. Deploy instrumentation only, no other changes. One round trip.
   If the data says "working correctly" and the human says otherwise, the hypotheses are wrong,
   not the human's eyes; return to step 2.
4. **Confirm.** State the root cause in one sentence tied to measured data. If it does not fit in
   one sentence, it is not understood yet.
5. **Fix.** A failing regression test first where the defect is testable; then the fix through the
   normal implement loop; then remove every log point added in step 3. If the root cause is a
   specification defect, that is green-but-wrong: the fix goes in the decision file, never patched
   into source.

## Anti-patterns

- No code changes before a confirmed cause. No layered speculative fixes; if you stack three
  changes, you learn nothing. No trying the opposite of a failed fix without new data.

## Human-turn contract

- No gate. The observation round trips are the turns; log each one to the ledger like any other,
  and design the instrumentation so there is usually exactly one.

## What this skill must NOT produce

- No fixes without a measured root cause, no instrumentation left behind, no commits without
  direction.
