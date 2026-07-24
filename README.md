# X2

## The code doesn't matter anymore

Something strange happened to software in the last few years, and almost nobody outside the
industry noticed.

For half a century, the most valuable thing a software company owned was its code, the written
instructions its programs run on. Code was slow and expensive to produce. Companies guarded it
like gold, because rewriting it could take years and cost millions.

Then AI learned to write it.

Today, an AI assistant can write, and rewrite, working code in minutes. An entire section of a
program can be regenerated faster than a person could read it. Overnight, code went from the most
expensive thing a company owns to the cheapest. And anything that can be remade on demand is no
longer a treasure.

So what is the treasure now?

The decisions. The things no AI can invent for you:

- how a product should be split into parts
- what information it must keep, and what must always stay true about it
- what it should look like and how it should feel to use
- which rules must never, ever break

A banking app can be rebuilt in an afternoon. The decision that no customer's balance may ever
silently change cannot be rebuilt by anyone but the people responsible for it.

X2 is a method for building software that takes this reversal seriously. It was created for teams
who let AI do the building, and it answers one uncomfortable question: how do you stay in control
of a builder that works faster than you can watch?

![The X2 engineering loop: engineers decide, agents build, the log improves both](assets/x2-method-engineering-loop.png)

## The trouble with a brilliant, forgetful builder

Imagine hiring a builder who works a hundred times faster than anyone alive, but who forgets
everything between jobs and has no personal stake in whether the work is any good.

You could hand that builder your rules on paper. It would read them, then forget or ignore them
on the very next task. This is not a hypothetical; it is how AI coding assistants actually
behave. A rule that nobody actively checks is only a suggestion.

## What X2 does about it

X2 sorts everything into three piles and puts each one where it cannot go wrong.

**The unbreakable rules go into the machinery.** Instead of living on paper, they are built into
the automated checks that every piece of work must pass before it ships. Break a rule and the
work simply fails, no matter what the AI claims. A machine enforces them, so they cannot be
forgotten.

**The decisions stay with people.** They live in a handful of short documents that humans own and
humans change. This is the treasure, and it is kept deliberately small.

**The code becomes disposable.** It is regenerated from the decisions whenever needed, like
printing a fresh copy from a master document. Nobody mourns it.

The result: nothing important depends on the AI remembering anything.

In the method's own vocabulary the three piles are the invariants, the decisions and the
consequences. [`X2.md`](X2.md) walks through all three, and the reasoning behind them.

## People keep the wheel

The AI does the building, but a person decides at three checkpoints:

1. **Approve the plan.** What is going to be built.
2. **Approve the design.** What it will look like, confirmed as the target to build toward.
3. **Accept the finished work.** Only after an independent check confirms it truly runs.

Between checkpoints, the AI must stop and ask whenever it hits a question no document answers.

And "finished" is never taken on the builder's word. Work counts as done only when a report,
verified by someone who did not build it, shows it was genuinely tested and genuinely works.
Nobody grades their own homework. The failure this guards against even has a name inside the
method: **green-but-wrong**, a build where every light is green while the product is quietly not
what was decided.

## Why this matters beyond software

For decades, software teams have run on trust in people: their memory, their habits, their
honesty. That worked because people were doing the building.

The builders are no longer people. X2's wager is that the trust which must never slip should move
into machinery that cannot forget and cannot fudge, while everything requiring real judgment
stays with humans.

If AI ends up building most of the world's software, and it is heading that way, then the
interesting question is no longer who writes the code. It is who makes the decisions, and how
those decisions are protected from a workforce that never remembers yesterday. X2 is one answer.

## What it has built

[learn.reqwiseconsulting.com](https://learn.reqwiseconsulting.com) is a free seven-lesson prompt
course with an AI trainer that marks your work. X2 built it in 2 days, six slices, idea to
production. Every moment a person had to step in was logged as it happened and published in
[`record/metrics.md`](record/metrics.md), which is the part most methods cannot show you.

## The method keeps score of itself

Every time a person steps in, the moment is logged and classified: a decision only a person could
take, or a defect in the method or its tooling. The count of those turns per shipped slice is the
method's price tag, and the goal is to bring it down.

At project close, **x2:extract** mines that log with two lenses. The defect lens catches what
bit. The churn lens catches what quietly resisted: decisions that never failed a test yet kept
costing attention, the failure no retrospective surfaces because nothing ever went red. Findings
change the method only through a human ruling; the sanitized results are published in
[`record/`](record/), and the next project starts by reading them. Each project is meant to make
the next one cheaper, and the record shows whether it did.

## How X2 compares

In the industry's terms, X2 is an agentic software engineering method: AI agents do the building,
the build enforces the rules that must always hold, a person decides only at the gates, and the
method measures its own cost in human turns.

**To Agile.** X2 keeps Agile's engine: thin working slices, requirements that stay open, change
kept cheap. But every Agile guarantee is carried by human discipline: memory, habit, self-report.
An AI has none of those and no stake in the outcome. So X2 takes each rule Agile trusts a person
to hold and hands it to something that cannot forget or fudge: the build.

| | Agile carries it with people | X2 carries it with a mechanism |
|---|---|---|
| **Standards** | Heads, wikis, review habits: rules that decay | Compiled into the kernel; a breach fails the build, not a review |
| **"Done"** | A checklist the team grades itself on | A report audited by someone who didn't build it |
| **Quality** | Review and pairing, after the code exists | Checks that gate every change, before merge |
| **Acceptance** | Criteria hand-written per story | Tests derived from the locked prototype |
| **The asset** | The working code | The decisions; code is regenerated from them |
| **Progress** | Story points: output, estimated | Human turns per slice: cost, measured |
| **Improvement** | Retrospectives: opinions, remembered | Extraction: measured churn and defect share, ruled into the method |
| **Coordination** | Ceremonies keep the team in step | The agent builds; a person decides at the gates |

Agile moved trust from documents to people. X2 moves the part of that trust that must never vary
from people to the build, and leaves the rest with people, where it belongs. For how X2 answers
the Agile Manifesto's 4 values, see [`X2.md`](X2.md).

**To the other AI methods.** Two families dominate agentic development today, and X2 belongs to
neither. Agent-team methods, [BMAD](https://docs.bmad-method.org/) foremost, simulate a human
team: role agents (analyst, product manager, architect, developer, tester) plan a PRD and an
architecture document, then shard them into story files an implementing agent executes.
Spec-driven tools ([Spec Kit](https://github.com/github/spec-kit), [Kiro](https://kiro.dev/),
[OpenSpec](https://github.com/Fission-AI/OpenSpec)) put a specification ahead of every feature:
requirements, design and tasks written first, code generated against them.

Both families answer the forgetful builder with documents: write everything down and have the AI
read it back on every task. X2's answer is mechanism, because prose that nothing checks is a
suggestion, however good the template that produced it. That difference shows in three places: a
rule breach fails the build instead of slipping past a reader, "done" is judged from outside
instead of self-declared, and the method measures its own cost and learns from its own record.

| | Agent-team methods (BMAD) | Spec-driven tools (Spec Kit, Kiro, OpenSpec) | X2 |
|---|---|---|---|
| **Rules live in** | Personas, templates, checklists: prose, re-read each task | A constitution or steering files: prose, re-read each task | The kernel; a breach fails the build |
| **The specification** | PRD and architecture doc, sharded into stories | Requirements, design and tasks per feature | Epic stories plus the locked design prototype |
| **Acceptance** | Criteria hand-written into each story | Criteria hand-written per requirement | Tests derived from the locked prototype |
| **"Done"** | The agent team checks its own work | Tasks complete against the spec | An exit report audited outside the builder's context |
| **The asset** | The documents | The specs | The decisions; code and tests are regenerated |
| **The team** | Simulated: agents role-play the job titles | One agent walking the spec | Contexts split by incentive: the builder never grades its own record |
| **Cost** | Unmeasured | Unmeasured | Human turns per shipped slice, logged and classified |
| **Improvement** | New templates and modules, by hand | New specs, by hand | Extraction: measured churn and defect share, ruled into the method |

The last two rows are the deepest difference. No other method measures what a project cost in
human attention, so none can show it is getting cheaper, and none has a mechanism that learns
from its own record.

The honest converse: BMAD and the spec-driven tools are broader today. They run on many stacks
and many agents, and their communities are large. X2 ships one edition, has run end to end on 2
projects, and says so.

One test cuts through the whole comparison: swap the AI for a better one and see what survives.
Everything X2 adds, the enforced rules, the derived tests, the outside audit, the logged cost,
survives that swap unchanged. A method should outlive its generator; a code generator is what
just got replaced.

## Where the evidence stands

The invariants come from 2 production systems. The method itself has now run end to end on 2
projects, every human turn logged, classified and audited. The second is public and running at
[learn.reqwiseconsulting.com](https://learn.reqwiseconsulting.com).

Its first headline figure (25 human turns for the pilot's first slice) is retired, by the
method's own extraction ruling: it mixed counting rules and scopes. The metric history lives in
[`record/metrics.md`](record/metrics.md) under one counting rule. What travels across projects:

- **Defect share of counted turns fell from about a third to about a tenth** between the first
  project and the second.
- **After the first slice, a slice costs 1 to 7 counted turns mid-build**; one slice shipped
  with zero.
- The first project's watch classes (bootstrap loss, green-but-not-running, completeness
  interrogations) went to near zero in the second.

Treat those numbers the way the method itself demands:

- A sample of two, with no baseline. Nobody has yet built the same product without the method
  and counted.
- The 2 days is wall clock on one project, self run, and it is not the method's metric. It says
  nothing about a team that did not write the method. The per-slice turn counts are what the
  record actually supports.
- Whole-project totals do not compare across projects; per-slice cost and defect share do,
  which is why they are the published numbers.
- The central regeneration claim has not yet run: no module has been regenerated from its
  decisions.

The kernel, the skills, the acceptance test, an invariants review and the first extraction pass
have all landed; the open experiments are listed in [`X2.md`](X2.md) under "What remains open".

## Get started

You need:

- [Claude Code](https://claude.com/claude-code): the skills are written for it
- the .NET 9 SDK, Node 24 and Docker, to use the shipped edition.

Install the plugin once, from inside Claude Code:

```
/plugin marketplace add teklabsdigital/x2-method
/plugin install x2@x2
```

The first command registers this repo as a plugin marketplace; the second installs the 12 skills,
namespaced under `x2:`, so they are available in every project, including the new repo the method
creates for you. Type `/x2:` in Claude Code to see them listed.

Invoke a skill:

- **By name.** Type the slash command, such as `/x2:stories`.
- **By intent.** Say what you want ("I have a product idea", "the app misbehaves at runtime").
  Each skill declares when it applies, and Claude selects the right one.

Ask for `/x2:help` at any time to see what to run next. Migrating an existing project? Use
`/x2:adopt` instead of the flow below.

To work on the method itself, clone the repo and symlink `skills/*` into Claude Code's personal
skills folder instead; installed that way the skills appear unscoped (`/stories`, `/seed`, and so
on) rather than under `x2:`.

### From a user story to a running app

X2 works in slices: thin pieces of the product that each work end to end. Start Claude Code and
describe your product idea. Then follow the flow. You approve at 3 gates and answer the odd
question; the agent does the rest.

1. **x2:stories** turns your idea into epic-level stories, one line each. *You approve them
   (gate 1).*
2. **x2:seed** creates your project repo from the edition and arms the CI gate.
3. **x2:decompose** records how the system divides up, the schema and the first slice.
4. **x2:design** produces the whole-product design prototype. *You approve it (gate 2a).*
5. **x2:lock** copies the prototype into your repo as the contract to build to. *You approve the
   lock (gate 2b).*
6. **x2:derive-tests** derives the acceptance tests from the locked design.
7. **x2:implement** builds the slice until every check passes. It asks you only when it hits a
   decision no record answers.
8. **x2:slice-exit** produces the audited report that declares the slice done. *You accept it
   (gate 3).*

Then run it: the edition's [`README`](kernel/dotnet-react/README.md) has a "Running it" section
that starts the app locally. Deployment is per project: the CI loop gates every merge, and you
attach your own release step to it.

Repeat steps 5 to 8 for each next slice. At project close, **x2:extract** runs the extraction
loop described above, so what the ledger recorded feeds the method.

### Bring your own stack

The shipped [.NET 9 and React edition](kernel/dotnet-react/) is the reference: a working
demonstration, not a limit.

The claims are written to be technology-neutral. One edition exists so far, so neutrality is a
design goal until a second edition tests it.

To build on another stack, create a new edition that realises the same claims. Each claim file
names the harm, the mechanism and its limits; your edition supplies that mechanism for your stack.
Start from [`kernel/claims/`](kernel/claims/) and the shipped edition's conformance table.

If you build one, please contribute it back as a pull request.

## What is in this repository

- [`X2.md`](X2.md): the full method, and the reasoning behind each part of it.
- [`GLOSSARY.md`](GLOSSARY.md): the record codes (X-8, MET-07, INV-10) the skills and claims cite,
  each defined in one line.
- [`kernel/claims/`](kernel/claims/): the 69 technology-neutral invariants. One file per claim:
  the harm it prevents, the mechanism that enforces it, and that mechanism's honest limits.
- [`kernel/dotnet-react/`](kernel/dotnet-react/): a working .NET 9 and React edition that
  enforces the claims, with the steps to start a new project on it.
- [`skills/`](skills/): the 12 agent skills that run the method, from working out the problem
  through to a slice that is done and the extraction that follows the project.
- [`record/`](record/): the published extraction record: the metric history, candidate rules,
  confirmations, and the negative-space register with its cross-project churn table.

## Help improve it

X2 is a sample of two and says so. The feedback worth the most:

- **Run it and publish your ledger.** Open an issue with your turn counts and buckets. That is
  the method's native evidence.
- **Challenge a claim.** Name the claim and the failure case. The weakening notes exist to be
  extended.
- **Take an open experiment.** The baseline run, the first regeneration and the specification gap
  are listed in [`X2.md`](X2.md).
- **Build an edition.** A second stack is what turns "technology-neutral" from intent into fact.

Issues and pull requests are welcome.

## Licence

X2 is free to use, commercially or otherwise. Credit is the one condition.

- The method and its documentation: [CC BY 4.0](LICENSE-DOCS). Share and adapt freely; credit
  "X2 method, Teklabs Digital Pty Ltd, Trevor Attema" with a link to this repository.
- The source code under [`kernel/dotnet-react/`](kernel/dotnet-react/): [MIT](LICENSE-CODE).
