import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// TEST-3 and HUM-1's arming step, read back rather than assumed. Plain node, no dependencies.
//
// Usage:
//   node tools/gate-check.mjs              read the live gate and exit non-zero unless it is armed
//   node tools/gate-check.mjs --self-test  run the predicate against its own controls and exit
//
// Why this exists, and why it READS rather than writes. TEST-3 is the claim that makes every other claim's
// enforced tag true, and it gates nothing until branch protection requires the pipeline. Arming is an
// instantiation step, not the workflow file, and TEST-3's weakening note predicted the failure verbatim before
// anything was built: "'Set at instantiation' is exactly the step that gets skipped, so the kernel acceptance
// test must verify that instantiation actually arms the gate, not merely that the workflow file exists."
//
// The acceptance test then ran for the first time and found that instantiation ships one imperative sentence, no
// script, no ruleset, no readback and nothing that reads the armed state back, so an armed instantiation and an
// unarmed one are indistinguishable by every means the kernel ships (E-24). This closes that: arming stays a
// human step, exactly as TEST-3 and HUM-1 both word it, and skipping it becomes loud.
//
// The required check names are DERIVED from the workflow file, never listed here. A hand-written list of jobs is
// a second copy of the workflow that agrees with itself while the workflow changes underneath it, which is the
// defect this edition has now measured five separate times.
const editionRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const selfTest = process.argv.includes('--self-test');
const invokedDirectly = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

// The kernel repo is not a seeded project and has no product gate to arm. Detected the way docs-lint already
// detects it, by the two files the instantiation manifest keeps behind, so the two tools cannot disagree about
// which tree they are in.
const kernelContext = existsSync(join(editionRoot, 'BUILD-BRIEF.md')) && existsSync(join(editionRoot, 'VERIFICATION.md'));

/**
 * Every job the CI workflow declares, which is the set branch protection has to require. Read from the workflow
 * rather than declared here: a job added to CI and not to the gate is precisely the drift this checks for, and a
 * list in this file could not see it.
 *
 * GitHub names a required check by the job's `name:` when it has one and by the job id otherwise, so both are
 * returned per job and either spelling satisfies the check.
 */
export function workflowJobs(yaml) {
  const lines = yaml.split('\n');
  const jobsAt = lines.findIndex((line) => /^jobs:\s*$/.test(line));
  if (jobsAt < 0) {
    return [];
  }

  const jobs = [];
  for (let i = jobsAt + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^\S/.test(line) && line.trim().length > 0) {
      break; // a new top-level key ends the jobs block
    }

    const id = /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(line);
    if (id) {
      jobs.push({ id: id[1], name: null });
      continue;
    }

    const name = /^ {4}name:\s*(.+?)\s*$/.exec(line);
    if (name && jobs.length > 0) {
      jobs[jobs.length - 1].name = name[1].replace(/^['"]|['"]$/g, '');
    }
  }

  return jobs;
}

/**
 * Everything wrong with a gate, given what the forge says about it. Empty means armed.
 *
 * Isolated from the network on purpose, so `--self-test` drives exactly the predicate the live path drives. A
 * checker that can only be exercised against a real forge is a checker nobody exercises, and the failure mode
 * this whole file exists to prevent is a mechanism whose reach nobody measured.
 *
 * `state` is the normalized shape: what checks are required, whether a pull request is required at all, whether
 * code-owner review is required, and whether the rules are enforced rather than merely configured.
 */
export function gateFindings(jobs, state) {
  const findings = [];

  if (jobs.length === 0) {
    findings.push('The workflow declares no jobs, so this check has nothing to require and would pass against any gate at all. Read tools/gate-check.mjs before trusting a green run (TEST-3).');
    return findings;
  }

  if (!state.enforced) {
    findings.push(`The branch rules exist but are not enforced (${state.enforcementMode ?? 'unknown mode'}). A ruleset in evaluate mode reports every rule and blocks nothing, which is TEST-3's defect one level down (TEST-3).`);
  }

  if (!state.requiresPullRequest) {
    findings.push('No pull request is required to merge into the default branch, so every required check below can be bypassed by pushing straight to it (TEST-3).');
  }

  const required = new Set(state.requiredChecks);
  for (const job of jobs) {
    if (!required.has(job.id) && !(job.name !== null && required.has(job.name))) {
      findings.push(`CI job '${job.name ?? job.id}' is not a required status check, so a pull request failing it can still merge (TEST-3).`);
    }
  }

  if (!state.requiresCodeOwnerReview) {
    findings.push('Code-owner review is not required, so a change to an irreversible surface can merge without the human named for it in CODEOWNERS (HUM-1).');
  }

  return findings;
}

const CONTROLS = [
  ['an armed gate passes', () =>
    gateFindings([{ id: 'server', name: null }, { id: 'client', name: null }], {
      requiredChecks: ['server', 'client'], requiresPullRequest: true, requiresCodeOwnerReview: true, enforced: true,
    })],
  ['a job named in the workflow with a display name is matched by that name', () =>
    gateFindings([{ id: 'server', name: 'Server tests' }], {
      requiredChecks: ['Server tests'], requiresPullRequest: true, requiresCodeOwnerReview: true, enforced: true,
    })],
];

const VIOLATIONS = [
  ['nothing armed at all', () =>
    gateFindings([{ id: 'server', name: null }], {
      requiredChecks: [], requiresPullRequest: false, requiresCodeOwnerReview: false, enforced: false,
    })],
  ['a job added to CI and never added to the gate', () =>
    gateFindings([{ id: 'server', name: null }, { id: 'secret-scan', name: null }], {
      requiredChecks: ['server'], requiresPullRequest: true, requiresCodeOwnerReview: true, enforced: true,
    })],
  ['code-owner review not required (HUM-1 alone)', () =>
    gateFindings([{ id: 'server', name: null }], {
      requiredChecks: ['server'], requiresPullRequest: true, requiresCodeOwnerReview: false, enforced: true,
    })],
  ['every check required, but no pull request required to merge', () =>
    gateFindings([{ id: 'server', name: null }], {
      requiredChecks: ['server'], requiresPullRequest: false, requiresCodeOwnerReview: true, enforced: true,
    })],
  ['a ruleset in evaluate mode, which reports every rule and blocks nothing', () =>
    gateFindings([{ id: 'server', name: null }], {
      requiredChecks: ['server'], requiresPullRequest: true, requiresCodeOwnerReview: true, enforced: false, enforcementMode: 'evaluate',
    })],
  ['a workflow this parser found no jobs in, which would otherwise pass against anything', () =>
    gateFindings([], { requiredChecks: [], requiresPullRequest: true, requiresCodeOwnerReview: true, enforced: true })],
];

const PARSE_CONTROLS = [
  ['a job id is found', () => workflowJobs('jobs:\n  server:\n    runs-on: x\n').some((j) => j.id === 'server')],
  ['a display name is found', () => workflowJobs('jobs:\n  server:\n    name: Server tests\n').some((j) => j.name === 'Server tests')],
  ['a hyphenated job id is found', () => workflowJobs('jobs:\n  secret-scan:\n    runs-on: x\n').some((j) => j.id === 'secret-scan')],
  ['a key after the jobs block is not a job', () => !workflowJobs('jobs:\n  server:\n    runs-on: x\nconcurrency:\n  group: g\n').some((j) => j.id === 'group')],
  ['a step name is not a job', () => workflowJobs('jobs:\n  server:\n    steps:\n      - name: Build\n').every((j) => j.name !== 'Build')],
];

if (invokedDirectly && selfTest) {
  const failures = [];
  for (const [why, probe] of CONTROLS) {
    const found = probe();
    if (found.length > 0) {
      failures.push(`FALSE POSITIVE  ${why} -> ${JSON.stringify(found)}`);
    }
  }
  for (const [why, probe] of VIOLATIONS) {
    if (probe().length === 0) {
      failures.push(`MISSED  ${why}`);
    }
  }
  for (const [why, probe] of PARSE_CONTROLS) {
    if (!probe()) {
      failures.push(`PARSE   ${why}`);
    }
  }
  if (failures.length > 0) {
    console.error('gate-check --self-test FAILED:');
    for (const f of failures) {
      console.error(`  ${f}`);
    }
    process.exit(1);
  }
  console.log(`gate-check --self-test ok: ${VIOLATIONS.length} caught, ${CONTROLS.length + PARSE_CONTROLS.length} ignored.`);
  process.exit(0);
}

if (!invokedDirectly) {
  // Imported for its predicates (the acceptance test and any future caller); the live read below is not run.
} else if (kernelContext) {
  // The kernel ships the workflow and the manifest step; it is not the repository whose gate is being armed.
  // Parsing the workflow still runs, because a workflow this parser cannot read would make every downstream run
  // vacuously green, and that is exactly the failure this file exists to refuse.
  const jobs = readWorkflowJobs();
  if (jobs.length === 0) {
    console.error(`gate-check: no jobs found in ${workflowPath() ?? '(no workflow file)'}. Downstream this check would pass against any gate at all (TEST-3).`);
    process.exit(1);
  }
  console.log(`gate-check: note: kernel context, no product gate to read. The workflow declares ${jobs.length} jobs, and instantiation must require all of them: ${jobs.map((j) => j.name ?? j.id).join(', ')}.`);
  process.exit(0);
} else {
  await main();
}

function workflowPath() {
  // At instantiation the workflow moves to the repo root; in the edition it sits under the edition directory.
  for (const base of [join(editionRoot, '.github', 'workflows'), join(editionRoot, '..', '.github', 'workflows')]) {
    if (!existsSync(base)) continue;
    const file = readdirSync(base).find((name) => name.endsWith('.yml') || name.endsWith('.yaml'));
    if (file) return join(base, file);
  }
  return null;
}

function readWorkflowJobs() {
  const path = workflowPath();
  return path === null ? [] : workflowJobs(readFileSync(path, 'utf8'));
}

async function main() {
  const jobs = readWorkflowJobs();

  // Before the network, because a workflow this parser cannot read makes every answer below vacuous, and a
  // vacuous check that reports ok is the failure this file was written to refuse.
  if (jobs.length === 0) {
    console.error(`gate-check: no jobs found in ${workflowPath() ?? '(no workflow file)'}, so this check has nothing to require and would report ok against an unarmed gate (TEST-3).`);
    process.exit(1);
  }

  const repo = originRepo();

  if (repo === null) {
    // Never silently pass. A check that cannot reach the thing it checks has to say so and fail, because the
    // whole finding behind this file is that an unobservable gate reads exactly like an armed one (E-24).
    console.error('gate-check: no GitHub remote found on `origin`, so the merge gate cannot be read back. If this project deliberately has no forge, TEST-3 and HUM-1 are unenforceable here and their rows belong at `owed` naming that, which is a decision to record rather than a check to skip.');
    process.exit(1);
  }

  let state;
  try {
    state = await readGate(repo);
  } catch (error) {
    console.error(`gate-check: could not read the gate for ${repo.owner}/${repo.name}: ${error.message}`);
    console.error('gate-check: set GH_TOKEN (or GITHUB_TOKEN) to a token with repository administration read access, or install the gh CLI and authenticate it. An unread gate is not an armed gate.');
    process.exit(1);
  }

  const findings = gateFindings(jobs, state);
  if (findings.length > 0) {
    console.error(`gate-check: the merge gate on ${repo.owner}/${repo.name}@${state.branch} is not armed:`);
    for (const finding of findings) {
      console.error(`  ${finding}`);
    }
    console.error('gate-check: this is the instantiation manifest step that gets skipped (TEST-3, HUM-1). Until it is done the pipeline runs and blocks nothing.');
    process.exit(1);
  }

  console.log(`gate-check: ok, ${repo.owner}/${repo.name}@${state.branch} requires all ${jobs.length} CI jobs, a pull request, and code-owner review.`);
}

function originRepo() {
  let url;
  try {
    url = execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }

  const match = /github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/.exec(url);
  return match === null ? null : { owner: match[1], name: match[2] };
}

async function api(path) {
  const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
  if (token) {
    const response = await fetch(`https://api.github.com${path}`, {
      headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'user-agent': 'gate-check' },
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`GET ${path} returned ${response.status}`);
    return response.json();
  }

  try {
    return JSON.parse(execFileSync('gh', ['api', path], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
  } catch (error) {
    if (/HTTP 404/.test(String(error.stderr ?? ''))) return null;
    throw new Error('no GH_TOKEN and the gh CLI could not answer');
  }
}

/**
 * The armed state, normalized across the two ways GitHub expresses it. Both are read, because a repository may
 * be gated by a ruleset or by classic branch protection and reading only one would report an armed repository as
 * unarmed, or worse, miss the half that is missing.
 */
async function readGate(repo) {
  const meta = await api(`/repos/${repo.owner}/${repo.name}`);
  if (meta === null) throw new Error('repository not found, or the token cannot see it');
  const branch = meta.default_branch;

  const state = {
    branch,
    requiredChecks: [],
    requiresPullRequest: false,
    requiresCodeOwnerReview: false,
    enforced: false,
    enforcementMode: null,
  };

  // Rulesets, via the endpoint that answers "what applies to this branch". Only active rules are returned here,
  // so anything this reports is genuinely in force.
  const rules = (await api(`/repos/${repo.owner}/${repo.name}/rules/branches/${encodeURIComponent(branch)}`)) ?? [];
  for (const rule of rules) {
    if (rule.type === 'required_status_checks') {
      state.enforced = true;
      state.enforcementMode = 'active ruleset';
      for (const check of rule.parameters?.required_status_checks ?? []) {
        state.requiredChecks.push(check.context);
      }
    }
    if (rule.type === 'pull_request') {
      state.enforced = true;
      state.enforcementMode ??= 'active ruleset';
      state.requiresPullRequest = true;
      state.requiresCodeOwnerReview ||= rule.parameters?.require_code_owner_review === true;
    }
  }

  // Classic branch protection, for repositories gated the older way.
  const protection = await api(`/repos/${repo.owner}/${repo.name}/branches/${encodeURIComponent(branch)}/protection`);
  if (protection !== null) {
    state.enforced = true;
    state.enforcementMode ??= 'classic branch protection';
    for (const context of protection.required_status_checks?.contexts ?? []) {
      state.requiredChecks.push(context);
    }
    if (protection.required_pull_request_reviews) {
      state.requiresPullRequest = true;
      state.requiresCodeOwnerReview ||= protection.required_pull_request_reviews.require_code_owner_reviews === true;
    }
  }

  if (!state.enforced) {
    state.enforcementMode = 'no ruleset and no branch protection on the default branch';
  }

  return state;
}
