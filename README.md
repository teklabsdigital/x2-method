# X2

Your code is not the asset anymore. It is the cheapest thing you own now that an agent can
regenerate a module faster than a human can review it. What no agent can regenerate are the
decisions: how the system divides up, what the schema promises, what the product looks like,
what must never break. X2 is a method for building production software with AI coding agents
that takes that inversion seriously. The rules that must always hold are compiled into a
kernel the build enforces on every change. The decisions live in a few short files that
people own. The code is regenerated from them, and nobody mourns it.

Most teams hand the agent its rules as prose: architecture guides, review checklists, coding
standards. The agent reads them again on every task. They cost tokens, drift out of date and get
quietly ignored. A rule the build does not check is only a suggestion.

A person steps in only where a machine cannot decide. X2 measures that cost directly, as **human
turns per shipped slice**, and works to bring it down.

## How X2 compares to Agile

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
| **Coordination** | Ceremonies keep the team in step | The agent builds; a person decides at the gates |

Agile moved trust from documents to people. X2 moves the part of that trust that must never vary
from people to the build, and leaves the rest with people, where it belongs.

For how X2 answers the Agile Manifesto's 4 values, see [`X2.md`](X2.md).

## How X2 works

X2 sorts everything a method carries into 3 tiers. Each goes where it cannot decay.

- **Invariants**: the properties that must always hold. Compiled into the kernel and enforced by
  the build on every change. A breach fails the build, not a review.
- **Decisions**: the choices a build cannot make for you. How the system divides up, the lasting
  schema, the locked design prototype, a short record per slice. The only prose meant to last.
- **Consequences**: the code and its unit tests. Disposable outputs, regenerated from decisions.
  Never the source of truth.

Nothing important depends on the agent remembering anything.

## The workflow

- **Work in slices.** A slice is a thin, working piece of the product. Only 3 things stay ahead
  of the work: the decomposition, the lasting schema and the whole-product design. Everything
  else waits for its slice.
- **The person is asked at 3 gates, on purpose.** Approve the stories. Approve the prototype,
  twice. Accept the slice on its audited exit report. The gates are the floor, not the total: between
  them the agent still asks whenever it hits a decision no record answers, and the pilot's first
  slice spent 25 human turns in all.
- **"Done" is an audited report.** Every test tier with counts, a real end-to-end run of the
  actual entry point, gaps named, the turn count. Independently audited. Nobody signs off their
  own work.

## Get started

You need:

- [Claude Code](https://claude.com/claude-code): the skills are written for it
- the .NET 9 SDK, Node 24 and Docker, to use the shipped edition.

Install the skills once:

```
git clone https://github.com/teklabsdigital/x2-method.git
mkdir -p ~/.claude/skills
ln -s "$(pwd)/x2-method/skills/"* ~/.claude/skills/
```

This links the 11 skills into Claude Code's personal skills folder, so they are available in every
project, including the new repo the method creates for you. To install for a single project
instead, copy the folders into that project's `.claude/skills/`. New sessions pick them up; type
`/` in Claude Code to see them listed.

Invoke a skill either way:

- **By name.** Type the slash command, such as `/x2-stories`.
- **By intent.** Say what you want ("I have a product idea", "the app misbehaves at runtime").
  Each skill declares when it applies, and Claude selects the right one.

Ask for `x2-help` at any time to see what to run next. Migrating an existing project? Use
`x2-adopt` instead of the flow below.

### From a user story to a running app

Start Claude Code and describe your product idea. Then follow the flow. You approve at 3 gates and
answer the odd question; the agent does the rest.

1. **x2-stories** turns your idea into epic-level stories, one line each. *You approve them
   (gate 1).*
2. **x2-seed** creates your project repo from the edition and arms the CI gate.
3. **x2-decompose** records how the system divides up, the schema and the first slice.
4. **x2-design** produces the whole-product design prototype. *You approve it (gate 2a).*
5. **x2-lock** copies the prototype into your repo as the contract to build to. *You approve the
   lock (gate 2b).*
6. **x2-derive-tests** derives the acceptance tests from the locked design.
7. **x2-implement** builds the slice until every check passes. It asks you only when it hits a
   decision no record answers.
8. **x2-slice-exit** produces the audited report that declares the slice done. *You accept it
   (gate 3).*

Then run it: the edition's [`README`](kernel/dotnet-react/README.md) has a "Running it" section
that starts the app locally. Deployment is per project: the CI loop gates every merge, and you
attach your own release step to it.

Repeat steps 5 to 8 for each next slice.

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
- [`kernel/claims/`](kernel/claims/): the 37 technology-neutral invariants. One file per claim:
  the harm it prevents, the mechanism that enforces it, and that mechanism's honest limits.
- [`kernel/dotnet-react/`](kernel/dotnet-react/): a working .NET 9 and React edition that
  enforces the claims, with the steps to start a new project on it.
- [`skills/`](skills/): the 11 agent skills that run the method, from working out the problem
  through to a slice that is done.

## Status and evidence

The invariants come from 2 production systems.

A kernel acceptance test ran the method once: one pilot taken from idea to a finished first slice,
with every human turn logged, sorted and audited. The figure was **25 human turns**.

Treat that figure the way the method itself demands:

- It is a sample of one, with no baseline. Nobody has yet built the same product without the
  method and counted.
- The pilot's record is not yet published.
- The central regeneration claim has not yet run: no module has been regenerated from its
  decisions.

So 25 is X2's own starting line, not evidence it beats anything. The kernel, the skills, the
acceptance test and an invariants review have all landed; the open experiments are listed in
[`X2.md`](X2.md) under "What remains open".

## Help improve it

X2 is a sample of one and says so. The feedback worth the most:

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
