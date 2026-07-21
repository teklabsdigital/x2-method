# X2

Your code is not the asset anymore. It is the cheapest thing you own now that an agent can
regenerate a module faster than a human can review it. What no agent can regenerate are the
decisions: how the system divides up, what the schema promises, what the product looks like,
what must never break. X2 is a method for building production software with AI coding agents
that takes that inversion seriously. The rules that must always hold are compiled into a
kernel the build enforces on every change. The decisions live in a few short files that
people own. The code is regenerated from them, and nobody mourns it.

X2 is an agentic software engineering method. AI agents do the building, the build
enforces the rules that must always hold, a person decides only at the gates, and the method
measures its own cost in human turns and feeds every project's evidence back into itself.

![The X2 engineering loop: engineers decide, agents build, the log improves both](assets/x2-method-engineering-loop.png)

**See what it built:** [learn.reqwiseconsulting.com](https://learn.reqwiseconsulting.com) is a free
seven-lesson prompt course with an AI trainer that marks your work. X2 built it in 2 days, six
slices, idea to production. What it cost in human attention was logged turn by turn and published
in [`record/metrics.md`](record/metrics.md), which is the part most methods cannot show you.

Most teams hand the agent its rules as prose: architecture guides, review checklists, coding
standards. The agent reads them again on every task. They cost tokens, drift out of date and get
quietly ignored. A rule the build does not check is only a suggestion.

A person steps in only where a machine cannot decide. X2 measures that cost directly, as **human
turns per shipped slice**, and works to bring it down.

## Is X2 just a code generator?

No. The code generator is the part X2 assumes. Any capable agent can already produce plausible
code on demand, which is exactly why the code stopped being the asset. What no generator gives
you is a reason to trust its output without re-reading it, and re-reading output faster than a
machine writes it is a race a person loses.

X2 is everything that has to surround generation before you can ship what it produces: the rules
that must always hold, compiled into a build that fails on a breach; the decisions recorded so
code is regenerated instead of maintained; the gates where a person rules; a definition of done
that is audited rather than self-declared; and a ledger that prices the whole thing in human
turns. Swap the generator for a better one and none of that changes. That is the test: a method
survives its generator being replaced. A code generator is what got replaced.

X2 keeps Agile's engine: thin working slices, requirements that stay open, change kept cheap.

But every Agile guarantee is carried by human discipline: memory, habit, self-report. An AI agent
has none of those and no stake in the outcome. So X2 takes each rule Agile trusts a person to
hold and hands it to something that cannot forget or fudge: the build.

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
from people to the build, and leaves the rest with people, where it belongs.

For how X2 answers the Agile Manifesto's 4 values, see [`X2.md`](X2.md).

## How X2 compares to BMAD and the spec-driven tools

Two families dominate agentic development today, and X2 belongs to neither. Agent-team methods,
[BMAD](https://docs.bmad-method.org/) foremost, simulate a human team: role agents (analyst,
product manager, architect, developer, tester) plan a PRD and an architecture document, then
shard them into story files an implementing agent executes. Spec-driven tools
([Spec Kit](https://github.com/github/spec-kit), [Kiro](https://kiro.dev/),
[OpenSpec](https://github.com/Fission-AI/OpenSpec)) put a specification ahead of every feature:
requirements, design and tasks written first, code generated against them.

Both families start from the same fact X2 starts from: an agent has no durable memory and no
stake in the outcome. Both answer it with documents: write the rules, the requirements and the
process down, and have the agent read them back on every task. X2's answer is mechanism, because
prose that nothing checks is a suggestion, however good the template that produced it.

That difference makes X2 stronger in 3 places:

- **Enforced, not read.** A rule breach fails the build. A prose rule can be skipped without a
  trace.
- **Checked from outside.** Acceptance tests derive from the locked design, and "done" is audited
  outside the builder's context. The other methods let the system grade its own work.
- **It learns.** Cost is measured in human turns, and every project's evidence is ruled back into
  the method. The others improve only when someone rewrites a template.

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
from its own record. X2's extraction loop lives exactly there, and it learns from both halves of
the record: the defects that announced themselves, and the quiet decisions that never failed a
test but kept costing turns.

The honest converse: BMAD and the spec-driven tools are broader today. They run on many stacks
and many agents, and their communities are large. X2 ships one edition, has run end to end on 2
projects, and says so.

## How X2 works

X2 sorts everything a method carries into 3 tiers. Each goes where it cannot decay.

- **Invariants**: the properties that must always hold. Compiled into the kernel and enforced by
  the build on every change. A breach fails the build, not a review.
- **Decisions**: the choices a build cannot make for you. How the system divides up, the lasting
  schema, the locked design prototype, a short record per slice. The only prose meant to last.
- **Consequences**: the code and its unit tests. Disposable outputs, regenerated from decisions.
  Never the source of truth.

Nothing important depends on the agent remembering anything.

The failure class X2 is built against even has a name: **green-but-wrong**, a build that passes
while the product quietly is not what was decided. That is why acceptance tests are derived
rather than written, and why "done" is audited rather than self-declared.

## The workflow

- **Work in slices.** A slice is a thin, working piece of the product. Only 3 things stay ahead
  of the work: the decomposition, the lasting schema and the whole-product design. Everything
  else waits for its slice.
- **The person is asked at 3 gates, on purpose.** Approve the stories. Approve the prototype,
  twice. Accept the slice on its audited exit report. The gates are the floor, not the total: between
  them the agent still asks whenever it hits a decision no record answers. Measured, that
  mid-build cost runs 1 to 7 human turns per slice (see the evidence below).
- **"Done" is an audited report.** Every test tier with counts, a real end-to-end run of the
  actual entry point, gaps named, the turn count. Independently audited. Nobody signs off their
  own work.

## The method improves itself

Every human turn is logged the moment it happens and classified: a decision only a person could
take, or a defect in the method or its tooling. At project close, **x2:extract** mines that
ledger with two lenses. The defect lens catches what bit. The churn lens catches what quietly
resisted: decisions that never failed a test yet kept costing turns, the failure no retrospective
surfaces because nothing ever went red. Findings cross into the method only through a human
ruling; the sanitized results are published in [`record/`](record/), and the next project's
decomposition pre-reads the churn table so the decisions history says will churn are decided up
front. Each project is meant to make the next one cheaper, and the record shows whether it did.

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

Start Claude Code and describe your product idea. Then follow the flow. You approve at 3 gates and
answer the odd question; the agent does the rest.

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
- [`kernel/claims/`](kernel/claims/): the 46 technology-neutral invariants. One file per claim:
  the harm it prevents, the mechanism that enforces it, and that mechanism's honest limits.
- [`kernel/dotnet-react/`](kernel/dotnet-react/): a working .NET 9 and React edition that
  enforces the claims, with the steps to start a new project on it.
- [`skills/`](skills/): the 12 agent skills that run the method, from working out the problem
  through to a slice that is done and the extraction that follows the project.
- [`record/`](record/): the published extraction record: the metric history, candidate rules,
  confirmations, and the negative-space register with its cross-project churn table.

## Status and evidence

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
