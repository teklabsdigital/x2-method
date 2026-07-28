import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The catalog's own gate, and the one nothing else covers.
//
// `conformance.mjs` enumerates the catalog by reading the claim FILES, which is right: the files are the schema's
// authority. The consequence nobody had drawn is that every check which exists reaches the files and NONE reaches
// the catalog's index, its governance prose, or the skills. Three findings came out of that gap in one day:
//
//   S-13  the index stated a status tally of 37 for a catalog holding 69 claims, and stated statuses at all
//         twenty lines after the same document ruled that claim files carry none.
//   S-14  the index restated every claim in condensed form, 276 sections, not one identical to its file. A
//         second normative text nobody ruled, which no generator can produce because condensing is judgment.
//   the skills  a standing constraint says no skill names a product or a project. Nothing checked it, and the
//         index that exists to list the skills had been missing one for as long as that skill had existed.
//
// **Every check here reports what it COMPARED, and that is not decoration.** S-14's first measurement matched
// section headings the claim files do not use, compared nothing, and reported zero drift. A false alarm gets
// investigated; a false pass gets filed as evidence. So a check that reaches nothing is an error here, and the
// summary prints the counts so a reader can see the scan had a subject.
//
// Usage:
//   node kernel/tools/catalog-check.mjs              check; non-zero on any finding
//   node kernel/tools/catalog-check.mjs --write      regenerate the index tables from the claim files
//   node kernel/tools/catalog-check.mjs --self-test  run every predicate against its own controls

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const claimsDir = join(repoRoot, 'kernel', 'claims');
const skillsDir = join(repoRoot, 'skills');

const CLAIM_ID = /^([A-Z]+-\d+)/;
const HEADING = /^## Claims \((\d+)\)/m;

// A marker is a LINE whose whole content is the marker, never a substring. `conformance.mjs` learned this the
// expensive way: it matched with indexOf, a sentence documenting the markers mentioned them, and `--write`
// spliced a generated table into the middle of that sentence while the real table went unguarded.
const begin = (family) => `<!-- catalog:${family}:begin -->`;
const end = (family) => `<!-- catalog:${family}:end -->`;

// ---------------------------------------------------------------------------------------------------------
// Reading

export function parseClaim(name, text) {
  const front = /^---\n([\s\S]*?)\n---/.exec(text);
  const field = (key) => {
    const m = front === null ? null : new RegExp(`^${key}:\\s*(.*)$`, 'm').exec(front[1]);
    return m === null ? null : m[1].trim();
  };
  const h1 = /^#\s+(?:[A-Z]+-\d+:\s*)?(.*)$/m.exec(text);
  return {
    id: CLAIM_ID.exec(name)?.[1] ?? null,
    file: name,
    family: field('family'),
    locus: field('locus'),
    provenance: field('provenance') ?? '',
    title: h1 === null ? null : h1[1].trim(),
  };
}

export function readClaims(dir = claimsDir) {
  return readdirSync(dir)
    .filter((n) => n.endsWith('.md') && n !== 'README.md' && CLAIM_ID.test(n))
    .map((n) => parseClaim(n, readFileSync(join(dir, n), 'utf8')))
    .sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
}

// The family slug used in the marker names. Derived from the frontmatter rather than from the heading text, so
// a heading someone rewords does not silently orphan a table.
export const slug = (family) => (family ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ---------------------------------------------------------------------------------------------------------
// Generation

export function tableFor(claims) {
  return [
    '',
    `Generated from the claim files by \`kernel/tools/catalog-check.mjs\`; edit the claim, not the table.`,
    '',
    '| Claim | Title | Locus |',
    '|-------|-------|-------|',
    ...claims.map((c) => `| [${c.id}](${c.file}) | ${c.title} | ${c.locus} |`),
    '',
  ].join('\n');
}

// Splices between one named marker pair. Refuses anything but exactly one pair, for the reason above.
export function spliceFamily(text, family, block) {
  const lines = text.split('\n');
  const b = lines.reduce((a, l, i) => (l.trim() === begin(family) ? [...a, i] : a), []);
  const e = lines.reduce((a, l, i) => (l.trim() === end(family) ? [...a, i] : a), []);
  if (b.length !== 1 || e.length !== 1) {
    return { error: `family '${family}': found ${b.length} begin and ${e.length} end markers on their own lines; exactly one pair is required.` };
  }
  if (e[0] < b[0]) {
    return { error: `family '${family}': the end marker precedes the begin marker.` };
  }
  return { text: [...lines.slice(0, b[0] + 1), ...block.split('\n'), ...lines.slice(e[0])].join('\n') };
}

// A marker declares the families its table covers, which is why there is no family-to-heading map in this file.
// The index groups families under editorial headings that do not match the frontmatter one for one: three
// families share one heading, and one family is spelled two ways across its own claims. A map here would be a
// registry beside the thing it describes, which is the shape that goes stale (E-92). Declaring the grouping in
// the document makes it a visible diff and lets this tool check it both ways: a family in no marker is a claim
// nothing lists, and a marker naming no family is a table about nothing.
export function markerGroups(indexText) {
  return [...indexText.matchAll(/^<!-- catalog:([a-z0-9,-]+):begin -->$/gm)].map((m) => ({
    key: m[1],
    families: m[1].split(','),
  }));
}

export function renderIndex(indexText, claims) {
  const groups = markerGroups(indexText);
  const errors = [];
  let out = indexText.replace(HEADING, `## Claims (${claims.length})`);

  const covered = new Set(groups.flatMap((g) => g.families));
  for (const family of new Set(claims.map((c) => c.family))) {
    if (!covered.has(family)) {
      errors.push(`family '${family}' is carried by ${claims.filter((c) => c.family === family).length} claim(s) and appears in no catalog marker, so those claims are listed nowhere.`);
    }
  }
  for (const group of groups) {
    for (const family of group.families) {
      if (!claims.some((c) => c.family === family)) {
        errors.push(`the catalog marker '${group.key}' names family '${family}', which no claim declares.`);
      }
    }
  }
  if (errors.length > 0) {
    return { text: out, errors };
  }

  for (const group of groups) {
    // Ordered by the marker's own family order, then by id. Where a heading covers several families the marker
    // states the reading order the editor intended, and a plain id sort would silently rearrange it.
    const rows = claims
      .filter((c) => group.families.includes(c.family))
      .sort((a, b) =>
        group.families.indexOf(a.family) - group.families.indexOf(b.family) ||
        a.id.localeCompare(b.id, 'en', { numeric: true }));
    const result = spliceFamily(out, group.key, tableFor(rows));
    if (result.error !== undefined) {
      errors.push(result.error);
      continue;
    }
    out = result.text;
  }
  return { text: out, errors };
}

// ---------------------------------------------------------------------------------------------------------
// The checks. Each returns { errors, compared }, and `compared` is load-bearing.

export function checkIndexMatchesClaims(indexText, claims) {
  const errors = [];
  const rendered = renderIndex(indexText, claims);
  errors.push(...rendered.errors);
  if (rendered.errors.length === 0 && rendered.text !== indexText) {
    errors.push("the catalog index disagrees with the claim files; run 'node kernel/tools/catalog-check.mjs --write'.");
  }
  const heading = HEADING.exec(indexText);
  if (heading === null) {
    errors.push('the catalog index carries no "## Claims (N)" heading, so its count cannot be checked at all.');
  } else if (Number(heading[1]) !== claims.length) {
    errors.push(`the catalog index heading says ${heading[1]} claims; ${claims.length} claim files exist.`);
  }
  return { errors, compared: claims.length };
}

// A family's intro paragraph is hand-written synthesis and is kept deliberately, so what it names is checked
// rather than generated. An intro that lists nine of ten claims reads as a complete sentence.
export function checkFamilyIntros(indexText, claims) {
  const errors = [];
  let compared = 0;
  const body = indexText.slice(indexText.search(HEADING));
  for (const section of body.split(/^### /m).slice(1)) {
    const intro = section.split(/<!-- catalog:/)[0];
    const named = new Set(intro.match(/\b[A-Z]+-\d+\b/g) ?? []);
    if (named.size === 0) {
      continue; // a family with no intro sentence, which single-claim families legitimately have
    }
    const family = claims.filter((c) => section.startsWith(`${c.family}\n`) || slug(section.split('\n')[0]) === slug(c.family));
    for (const claim of family) {
      compared += 1;
      if (!named.has(claim.id)) {
        errors.push(`the '${section.split('\n')[0].trim()}' family intro does not name ${claim.id}; a list that omits one reads as a complete sentence.`);
      }
    }
  }
  return { errors, compared };
}

export function checkLocusSplit(indexText, claims) {
  const stated = /The split is (\d+) centralized, (\d+) per-seam/.exec(indexText);
  if (stated === null) {
    return { errors: [], compared: 0, skipped: 'the index states no locus split' };
  }
  const actual = {
    centralized: claims.filter((c) => c.locus === 'centralized').length,
    'per-seam': claims.filter((c) => c.locus === 'per-seam').length,
  };
  const errors = [];
  if (Number(stated[1]) !== actual.centralized || Number(stated[2]) !== actual['per-seam']) {
    errors.push(`the index states a locus split of ${stated[1]} centralized and ${stated[2]} per-seam; the claim files give ${actual.centralized} and ${actual['per-seam']}.`);
  }
  return { errors, compared: claims.length };
}

export function checkCitations(claims, texts) {
  const known = new Set(claims.map((c) => c.id));
  // Prefixes that share the claim shape and are record codes rather than claims. Listed, because a scan that
  // treated every ID-shaped token as a claim would report the whole provenance layer as dangling.
  const records = /^(E|A|B|C|S|X|R|INV|MET|PC|CONF|DB|GHSA|RFC|SOC|CU|DEC|D|P|B1|B2)-/;
  const errors = [];
  let compared = 0;
  for (const [where, text] of texts) {
    for (const token of new Set(text.match(/\b[A-Z]{2,5}-\d+\b/g) ?? [])) {
      if (records.test(token) || !/^[A-Z]+-\d+$/.test(token)) {
        continue;
      }
      const family = token.split('-')[0];
      if (!claims.some((c) => c.id.split('-')[0] === family)) {
        continue; // not a claim family at all
      }
      compared += 1;
      if (!known.has(token)) {
        errors.push(`${where} cites ${token}, which is not a claim in this catalog. Claim identity is append-only: a retired id is deprecated in place with a pointer, never removed.`);
      }
    }
  }
  return { errors, compared };
}

// The check the catalog itself names as its own missing upgrade, at the end of its versioning section.
export function checkProvenanceDates(claims, indexText) {
  const known = new Set(indexText.match(/\d{4}-\d{2}-\d{2}/g) ?? []);
  const errors = [];
  let compared = 0;
  for (const claim of claims) {
    for (const date of claim.provenance.match(/\d{4}-\d{2}-\d{2}/g) ?? []) {
      compared += 1;
      if (!known.has(date)) {
        errors.push(`${claim.id} cites pass date ${date} in its provenance, and no pass paragraph in the catalog index names that date.`);
      }
    }
  }
  return { errors, compared };
}

// ---------------------------------------------------------------------------------------------------------
// Skills. A standing constraint with no check is a rule addressed to whoever remembers.

// Whether a document LISTS a skill, which is not the same question as whether the document contains its name,
// and the difference is a defect this tool shipped with for one commit. Several skills are named after ordinary
// words that these documents use as prose: `kernel`, `design`, `lock`, `extract`, `implement`, `seed`. Planted
// by deleting the kernel skill from the help index, the word-boundary version stayed GREEN, because the same
// document says "the kernel enforces the invariants" three lines earlier. That is E-99 exactly: a name-shaped
// predicate only knows how something is spelled.
//
// So membership is asked of the LISTING CONSTRUCTS these documents actually use, and nothing else counts: the
// namespaced command form, bold emphasis, or a leading table cell. Prose mentioning the word is not a listing
// and must not satisfy this.
export function isListed(text, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(x2:${escaped}\\b)|(\\*\\*(x2:)?${escaped}\\*\\*)|(^\\|\\s*${escaped}\\s*\\|)`, 'm').test(text);
}

export function checkSkills(skills, indexes) {
  const errors = [];
  let compared = 0;
  for (const skill of skills) {
    compared += 1;
    if (!skill.hasFile) {
      errors.push(`skills/${skill.dir}/ has no SKILL.md, so nothing there can be invoked.`);
      continue;
    }
    if (skill.name === null) {
      errors.push(`skills/${skill.dir}/SKILL.md has no parseable 'name' in its front matter.`);
    } else if (skill.name !== skill.dir) {
      errors.push(`skills/${skill.dir}/SKILL.md declares name '${skill.name}'; the directory is what the command is named after, so the two must agree.`);
    }
    if (skill.description === null) {
      errors.push(`skills/${skill.dir}/SKILL.md has no 'description', which is what decides when it gets loaded.`);
    }
    for (const [what, pattern] of skill.violations) {
      errors.push(`skills/${skill.dir}/SKILL.md contains ${what} (${pattern}). A skill must work unchanged for any project.`);
    }
    for (const [where, listed] of indexes) {
      if (!listed.has(skill.dir)) {
        errors.push(`${where} does not name the '${skill.dir}' skill. A list is a count that has learned to hide: an omission reads as a skill that does not exist.`);
      }
    }
  }
  return { errors, compared };
}

// ---------------------------------------------------------------------------------------------------------
// Counts stated in live documents.

export function checkStatedCounts(documents, derived) {
  const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13 };
  const errors = [];
  let compared = 0;
  for (const [where, text] of documents) {
    for (const m of text.matchAll(/\b(\d{1,3}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen)\s+(?:X2\s+)?(claims|skills|editions)\b/gi)) {
      const stated = WORDS[m[1].toLowerCase()] ?? Number(m[1]);
      const actual = derived[m[2].toLowerCase()];
      if (actual === undefined) {
        continue;
      }
      compared += 1;
      if (stated !== actual) {
        errors.push(`${where} states "${m[0]}" and the tree has ${actual}. A number in prose is a claim about the tree with no guard; state it in one home and cite it, or delete it.`);
      }
    }
  }
  return { errors, compared };
}

// ---------------------------------------------------------------------------------------------------------
// Controls. E-11's ordering, and S-14's correction is why every control below asserts a COUNT as well as a
// finding: a predicate that reaches nothing reports clean and reads exactly like a predicate that passed.

const CLAIMS = [
  { id: 'AA-1', file: 'AA-1-a.md', family: 'alpha', locus: 'centralized', provenance: 'X-1, 2026-01-01', title: 'A' },
  { id: 'AA-2', file: 'AA-2-b.md', family: 'alpha', locus: 'per-seam', provenance: 'X-2', title: 'B' },
];
const INDEX = [
  '## Claims (2)',
  '',
  '### Alpha',
  '',
  'Two claims: the first (AA-1), and the second (AA-2).',
  '',
  begin('alpha'),
  end('alpha'),
  '',
  'The split is 1 centralized, 1 per-seam.',
  '',
  'The alpha pass (2026-01-01) minted both.',
].join('\n');
const GENERATED = renderIndex(INDEX, CLAIMS).text;

const CONTROLS = [
  ['a claim file with no row in the generated table', () => checkIndexMatchesClaims(GENERATED, [...CLAIMS, { id: 'AA-3', file: 'AA-3-c.md', family: 'alpha', locus: 'centralized', provenance: '', title: 'C' }])],
  ['a heading count that disagrees with the file count', () => checkIndexMatchesClaims(GENERATED.replace('## Claims (2)', '## Claims (9)'), CLAIMS)],
  ['a family intro that omits one of its claims', () => checkFamilyIntros(GENERATED.replace('the second (AA-2)', 'the second'), CLAIMS)],
  ['a locus split that disagrees with the frontmatter', () => checkLocusSplit(GENERATED.replace('1 centralized, 1 per-seam', '7 centralized, 4 per-seam'), CLAIMS)],
  ['a cited claim id with no claim file', () => checkCitations(CLAIMS, [['a claim', 'composes with AA-9 for the write path']])],
  ['a provenance pass date named in no pass paragraph', () => checkProvenanceDates([{ ...CLAIMS[0], provenance: 'X-1, 2099-12-31' }], GENERATED)],
  ['a skill whose declared name does not match its directory', () => checkSkills([{ dir: 'alpha', hasFile: true, name: 'beta', description: 'd', violations: [] }], [])],
  ['a skill missing from an index that exists to list it', () => checkSkills([{ dir: 'alpha', hasFile: true, name: 'alpha', description: 'd', violations: [] }], [['an index', new Set()]])],
  ['a skill naming a product or a machine path', () => checkSkills([{ dir: 'alpha', hasFile: true, name: 'alpha', description: 'd', violations: [['a machine-local path', '/Users/']] }], [])],
  ['a stated count that disagrees with the tree', () => checkStatedCounts([['a doc', 'installs the 12 skills']], { skills: 13 })],
  ['a skill directory with no instruction file', () => checkSkills([{ dir: 'alpha', hasFile: false, name: null, description: null, violations: [] }], [])],
  ['a family carried by claims and named in no marker, so those claims are listed nowhere', () =>
    checkIndexMatchesClaims(GENERATED, [...CLAIMS, { id: 'ZZ-1', file: 'ZZ-1-z.md', family: 'omega', locus: 'centralized', provenance: '', title: 'Z' }])],
  ['a marker naming a family no claim declares, which is a table about nothing', () =>
    checkIndexMatchesClaims(GENERATED.replace(begin('alpha'), begin('alpha,ghost')).replace(end('alpha'), end('alpha,ghost')), CLAIMS)],
  // The plant that caught this tool. A skill named after an ordinary word, deleted from the index, with the
  // word still present in the surrounding prose: the first version of `isListed` stayed green on exactly this.
  ['a skill dropped from an index whose name still appears in that document as prose', () =>
    checkSkills([{ dir: 'kernel', hasFile: true, name: 'kernel', description: 'd', violations: [] }],
      [['an index', new Set(skills0(['the kernel enforces the invariants in the build']))]])],
];

// Helper for the control above: which skills a document lists, under the real predicate.
function skills0(lines) {
  return ['kernel'].filter((n) => isListed(lines.join('\n'), n));
}

const IGNORED = [
  ['a catalog that agrees with its claim files', () => checkIndexMatchesClaims(GENERATED, CLAIMS)],
  ['a family intro naming every claim', () => checkFamilyIntros(GENERATED, CLAIMS)],
  ['a locus split that agrees', () => checkLocusSplit(GENERATED, CLAIMS)],
  ['a record code that merely looks like a claim id', () => checkCitations(CLAIMS, [['a claim', 'provenance: INV-07, CONF-02, E-113']])],
  ['a provenance date the changelog names', () => checkProvenanceDates(CLAIMS, GENERATED)],
  ['a stated count that agrees with the tree', () => checkStatedCounts([['a doc', 'the 13 skills']], { skills: 13 })],
  ['a count of something this tool does not derive', () => checkStatedCounts([['a doc', 'returns 50 rows']], { skills: 13 })],
];

function selfTest() {
  const failures = [];
  for (const [name, run] of CONTROLS) {
    const { errors } = run();
    if (errors.length === 0) {
      failures.push(`control not caught: ${name}`);
    }
  }
  for (const [name, run] of IGNORED) {
    const { errors } = run();
    if (errors.length > 0) {
      failures.push(`false positive on ${name}: ${errors.join('; ')}`);
    }
  }
  // The control every other control rests on. S-14: a comparison reporting zero differences over zero
  // comparisons is the failure this tool exists to make impossible, so the healthy path must COMPARE.
  const healthy = checkIndexMatchesClaims(GENERATED, CLAIMS);
  if (healthy.compared === 0) {
    failures.push('the healthy-path check compared nothing, so a clean report would mean nothing (S-14).');
  }
  if (failures.length > 0) {
    process.stderr.write(`${failures.map((f) => `  ${f}`).join('\n')}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(`catalog-check --self-test ok: ${CONTROLS.length} caught, ${IGNORED.length} ignored.\n`);
}

// ---------------------------------------------------------------------------------------------------------
// Live run

const BANNED = [
  ['a machine-local path', /\/(Users|home)\//],
  ['a project or product name', /\b(x2-method|teklabsdigital|dotnet-react|node-react)\b/],
];

function readSkills() {
  return readdirSync(skillsDir)
    .filter((n) => statSync(join(skillsDir, n)).isDirectory())
    .map((dir) => {
      const path = join(skillsDir, dir, 'SKILL.md');
      if (!existsSync(path)) {
        return { dir, hasFile: false, name: null, description: null, violations: [] };
      }
      const text = readFileSync(path, 'utf8');
      const front = /^---\n([\s\S]*?)\n---/.exec(text);
      const field = (k) => (front === null ? null : (new RegExp(`^${k}:\\s*(.*)$`, 'm').exec(front[1])?.[1]?.trim() ?? null));
      return {
        dir,
        hasFile: true,
        name: field('name'),
        description: field('description'),
        violations: BANNED.filter(([, p]) => p.test(text)).map(([what, p]) => [what, String(p)]),
      };
    });
}

function run() {
  const claims = readClaims();
  const indexPath = join(claimsDir, 'README.md');
  const indexText = readFileSync(indexPath, 'utf8');
  const skills = readSkills();
  const editions = readdirSync(join(repoRoot, 'kernel')).filter((n) => /-/.test(n) && statSync(join(repoRoot, 'kernel', n)).isDirectory());

  if (process.argv.includes('--write')) {
    const rendered = renderIndex(indexText, claims);
    if (rendered.errors.length > 0) {
      process.stderr.write(`${rendered.errors.map((e) => `  ${e}`).join('\n')}\n`);
      process.exitCode = 1;
      return;
    }
    writeFileSync(indexPath, rendered.text);
    process.stdout.write(`catalog-check: wrote ${claims.length} claim rows into the catalog index.\n`);
    return;
  }

  // The two indexes that exist to list the skills. Keyed on the skill's directory name appearing as a word.
  const skillIndexes = [
    ['X2.md', join(repoRoot, 'X2.md')],
    ['skills/help/SKILL.md', join(skillsDir, 'help', 'SKILL.md')],
  ].map(([where, path]) => {
    const text = existsSync(path) ? readFileSync(path, 'utf8') : '';
    // `help` names itself as "this skill" rather than by name, which is correct and not an omission.
    const listed = new Set(skills.filter((s) => isListed(text, s.dir) || path.endsWith(`${s.dir}/SKILL.md`)).map((s) => s.dir));
    return [where, listed];
  });

  // Live documents only. The record layer and each edition's dated files are MEASUREMENTS at a date, and
  // rewriting a number in one falsifies history. The catalog index is excluded from the generic count scan and
  // checked by its own two predicates above, because its changelog quotes historical tallies on purpose.
  const live = [
    ['README.md', join(repoRoot, 'README.md')],
    ['X2.md', join(repoRoot, 'X2.md')],
    ['GLOSSARY.md', join(repoRoot, 'GLOSSARY.md')],
    ['.claude/CLAUDE.md', join(repoRoot, '.claude', 'CLAUDE.md')],
    ['.claude-plugin/marketplace.json', join(repoRoot, '.claude-plugin', 'marketplace.json')],
    ...skills.map((s) => [`skills/${s.dir}/SKILL.md`, join(skillsDir, s.dir, 'SKILL.md')]),
    // The editions' READMEs are deliberately NOT here, and the reason is worth keeping because it was tried.
    // Adding them on 2026-07-28 immediately reported four defects that were not defects: "Four claims name the
    // same surface", "two skills downstream of the seed". This predicate reads any "N claims" as the catalog's
    // size, which holds in the method's own documents and does not hold in an edition README, where counting a
    // SUBSET of claims is the ordinary way to write a sentence. Silencing those would have meant rewriting
    // correct prose to fit a check that cannot tell a subset from a total, which is the S-15 failure with the
    // roles reversed. The remedy is the fourth bucket instead: an edition README states no catalog total, and
    // the one that did was rewritten to cite the catalog rather than count it.
  ].filter(([, p]) => existsSync(p)).map(([where, p]) => [where, readFileSync(p, 'utf8')]);

  const claimTexts = claims.map((c) => [`${c.id}`, readFileSync(join(claimsDir, c.file), 'utf8')]);

  const results = [
    ['index against the claim files', checkIndexMatchesClaims(indexText, claims)],
    ['family intros', checkFamilyIntros(indexText, claims)],
    ['locus split', checkLocusSplit(indexText, claims)],
    ['claim citations', checkCitations(claims, [...claimTexts, ['the catalog index', indexText]])],
    ['provenance pass dates', checkProvenanceDates(claims, indexText)],
    ['skills', checkSkills(skills, skillIndexes)],
    ['stated counts', checkStatedCounts(live, { claims: claims.length, skills: skills.length, editions: editions.length })],
  ];

  const errors = results.flatMap(([, r]) => r.errors);
  if (errors.length > 0) {
    process.stderr.write(`${errors.map((e) => `  ${e}`).join('\n')}\n`);
    process.exitCode = 1;
    return;
  }
  const counts = results.map(([name, r]) => `${name} ${r.compared}`).join(', ');
  process.stdout.write(`catalog-check: ok (${claims.length} claims, ${skills.length} skills, ${editions.length} editions; compared: ${counts})\n`);
}

if (process.argv.includes('--self-test')) {
  selfTest();
} else {
  run();
}
