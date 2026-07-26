import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// SEC-5 committed-secret scan. Plain node, no dependencies. Runs from anywhere; paths resolve relative to the
// edition root.
//
//   node tools/secret-scan.mjs              scan the edition tree, exit 1 on a finding
//   node tools/secret-scan.mjs --self-test  run the detector against its own controls and exit
//
// Why this is a script and not a grep in the CI workflow. It was a grep, and the grep was blind three ways at
// once (E-11, plus the JSON blindness recorded as E-16): no `-i` against a PascalCase configuration platform,
// no whole-word `key` term, and a separator rule that could not see a QUOTED key, which is every key in every
// appsettings.json and package.json in both editions. None of that was noticed for four rounds because a
// regular expression living in YAML cannot be executed by the person editing it and has nowhere to state what
// it catches. `--self-test` is the answer to that specific failure: the detector's extent is asserted in the
// same artifact as the detector, so widening or narrowing it red-greens here rather than in a CI run nobody
// reruns. Both editions compose this file, so the repair lands once.
//
// The pairing this mechanism is half of: `SecretConfigShapeTests` (dotnet-react) parses committed JSON and
// knows the config schema; this scan reads every line of every text surface and knows none of it. A-3's point
// is that two mechanisms are only belt-and-braces if their BLIND SPOTS are independent, and E-11 is what it
// looks like when they are not. They are kept independent here deliberately: this one is textual and format
// blind, that one is structural and format aware.

const editionRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const selfTest = process.argv.includes('--self-test');
// `findingsInLine` is exported so a caller can drive the detector without driving the filesystem. Without this
// guard, importing it RAN the scan as a side effect, which is a small instance of the wiring defect E-10
// records: the thing you can call and the thing that actually runs were not the same thing.
const invokedDirectly = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

// Surfaces a pasted secret realistically lands on. Wider than the grep it replaces, which omitted shell
// scripts even though the edition's secret-generating script is one.
const SCANNED = new Set([
  '.json', '.cs', '.ts', '.tsx', '.js', '.mjs', '.jsx', '.yml', '.yaml',
  '.props', '.config', '.npmrc', '.env', '.sh', '.ps1', '.tf', '.ini', '.toml',
]);
const SCANNED_NAMES = new Set(['.npmrc', '.env']);
const SKIP_DIRS = new Set(['node_modules', 'bin', 'obj', 'dist', '.git', '.vite', 'Migrations']);
const SKIP_FILES = new Set(['package-lock.json', 'packages.lock.json']);

// A key whose TOKENS include one of these is secret shaped. Token matching, not containment: E-11 is the
// record of what containment does here, `leafKey.Contains("signingkey")` never firing on the leaf key `Key`
// because the leaf is shorter than the term meant to describe it. Tokens make `Key`, `Jwt__Key`, `apiKey` and
// `MSSQL_SA_PASSWORD` all match and leave `keyboardLayout` and `tokenCount` alone.
//
// The cost, stated because E-9 is the finding that both editions' registries hide theirs: this is still a
// registry, and a novel term carrying a credential escapes it. What it no longer does is miss the terms it
// already lists.
const SECRET_TERMS = new Set([
  'password', 'passwd', 'pwd', 'passphrase',
  'secret', 'secrets',
  'key', 'apikey', 'accesskey', 'privatekey', 'signingkey', 'secretkey',
  'token', 'credential', 'credentials', 'auth',
  'sas', 'dsn',
]);

// A term that only counts when it is not the whole story: `auth: true` is a flag, `auth: "Bearer eyJ..."` is a
// credential. Handled by the value rules rather than by a second registry.

const PEM = /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/;

// A committed connection string carries its credential inside the value, where no key token reaches it.
const EMBEDDED = /\b(password|pwd|user id|uid|accountkey|sharedaccesskey)\s*=\s*([^;'"\s]{6,})/i;

// key: value / key=value, with the key optionally quoted (the case the grep could not see) and the value
// either a quoted literal or an unquoted run. Global: a one-line JSON object holds several.
const PAIR =
  /["'`]?\b([A-Za-z_$][A-Za-z0-9_.$-]{0,63})["'`]?[ \t]*(:|=|:=)[ \t]*(?:"([^"]*)"|'([^']*)'|`([^`]*)`|([^\s,;)}\]]+))/g;

function tokens(key) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((t) => t.toLowerCase());
}

function isSecretShapedKey(key) {
  const parts = tokens(key);
  if (parts.some((t) => SECRET_TERMS.has(t))) {
    return true;
  }
  // Adjacent-pair compounds a splitter separates but a reader would not: `api key`, `private key`.
  return parts.some((t, i) => i + 1 < parts.length && SECRET_TERMS.has(`${t}${parts[i + 1]}`));
}

// Not a real value. Mirrors the arch test's placeholder rule and adds the shell and workflow interpolations,
// because a value that is computed at run time is by construction not committed.
function isPlaceholder(value) {
  const v = value.trim();
  if (v.length === 0) {
    return true;
  }
  if (/[{}<>]/.test(v) || v.includes('$(') || v.startsWith('$') || v.includes('${')) {
    return true;
  }
  if (/^(true|false|null|none|nil|undefined)$/i.test(v)) {
    return true;
  }
  if (/(user-secret|placeholder|example|changeme|redacted|xxxx|\*\*\*\*|your-|dummy|sample)/i.test(v)) {
    return true;
  }
  // A bare type name, identifier or call is source code, not a literal. `var token = TestTokens.Mint` is the
  // shape that made the first draft of this scan fire on four test files.
  return /^[A-Za-z_$][A-Za-z0-9_$]*(\.[A-Za-z_$][A-Za-z0-9_$]*)*$/.test(v) && !/[0-9]/.test(v);
}

// A credential looks like entropy: long enough to be one, and drawn from a credential charset. Eight is the
// arch test's floor and is kept so the two halves of SEC-5 agree about what "a real value" means.
function isCredentialShaped(value) {
  const v = value.trim();
  return v.length >= 8 && /^[A-Za-z0-9+/=_.:@!#%^&*()-]{8,}$/.test(v);
}

// Justified exceptions, with the justification IN the mechanism. E-8 is the finding that the sibling's
// anonymous allowlist is a bare `string[]` with nowhere to write the reason its own failure message demands;
// this is that finding answered rather than repeated. `why` is required, an entry matching nothing is a
// failure, and the key is a (file, key) pair rather than a file, because allowlisting a FILE pre-authorizes
// every secret a later edit pastes into it.
//
// It lives in the edition, not here, for the reason S-7 gives: the shared tool fixes the SHAPE of a
// declaration and an edition declares its own contents. A shared list would carry one edition's exceptions
// into the other, where they match nothing and are reported stale, which is what the first run of this
// mechanism did.
const allowFile = join(editionRoot, 'secret-scan.allow.json');
const ALLOWLIST = existsSync(allowFile) ? JSON.parse(readFileSync(allowFile, 'utf8')).allow : [];

for (const entry of ALLOWLIST) {
  if (!entry.file || !entry.key || !entry.why || entry.why.length < 40) {
    console.error(`secret-scan: every allowlist entry needs file, key and a real 'why' (SEC-5): ${JSON.stringify(entry)}`);
    process.exit(1);
  }
}

function walk(root, rel = '') {
  const full = join(root, rel);
  if (!existsSync(full)) {
    return [];
  }
  if (!statSync(full).isDirectory()) {
    return [rel];
  }
  return readdirSync(full).flatMap((entry) =>
    SKIP_DIRS.has(entry) ? [] : walk(root, rel === '' ? entry : `${rel}/${entry}`),
  );
}

// The claim is about what is COMMITTED, so the file set is the tracked one. Walking the working tree instead
// reports a correctly ignored local `.env` as a committed secret, which is a false positive that trains a
// reader to ignore the scan, and it misses nothing a checkout would contain.
//
// This is deliberately NOT an answer to E-12. That finding is that the edition's `.env` sits inside the
// repository tree while SEC-5's statement says development secrets live outside it, and a gitignore entry is a
// property of a tool's configuration rather than a property of a path. Reading tracked files is right for THIS
// mechanism and leaves that one exactly as open as it was.
function trackedFiles(root) {
  try {
    // --cached plus --others --exclude-standard: tracked files AND untracked files that are not ignored, which
    // together are exactly the set a commit from this tree would contain. `--cached` alone misses a new file
    // that has never been added, and a new file is the likeliest place a fresh secret is sitting.
    const args = ['ls-files', '-z', '--cached', '--others', '--exclude-standard'];
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .split('\0')
      .filter(Boolean);
  } catch {
    // Not a git checkout (an archive, a seeded tree before `git init`): fall back to the working tree, which
    // over-reports rather than under-reports.
    return walk(root);
  }
}

function scanned(rel) {
  const name = rel.split('/').pop();
  if (SKIP_FILES.has(name)) {
    return false;
  }
  // This file's own CATCH controls are credential-shaped by construction, and it is the one file in the
  // edition whose bytes are pinned to kernel/shared/ by `compose --check`, so a secret cannot be parked here
  // without failing a different gate first.
  if (rel === 'tools/secret-scan.mjs') {
    return false;
  }
  if (rel.split('/').some((segment) => SKIP_DIRS.has(segment))) {
    return false;
  }
  if (SCANNED_NAMES.has(name) || name.startsWith('.env.')) {
    return true;
  }
  const dot = name.lastIndexOf('.');
  return dot > 0 && SCANNED.has(name.slice(dot));
}

// The detector, isolated from the filesystem so --self-test drives exactly what the scan drives.
export function findingsInLine(line) {
  const found = [];
  if (PEM.test(line)) {
    found.push({ key: 'PEM', reason: 'a private key block is committed' });
  }

  PAIR.lastIndex = 0;
  for (const m of line.matchAll(PAIR)) {
    const key = m[1];
    const value = m[3] ?? m[4] ?? m[5] ?? m[6] ?? '';
    const quoted = m[3] !== undefined || m[4] !== undefined || m[5] !== undefined;
    // An unquoted value is only a literal when whitespace does not separate it from its key. `password=Abc12345`
    // in a .env or a connection string is one; `var token = TestTokens.Mint(...)` is source, and is the shape
    // that made the first draft of this scan fire on four test files.
    const spaced = /[ \t]/.test(m[0].slice(0, m[0].length - value.length));

    if (isSecretShapedKey(key) && !isPlaceholder(value) && isCredentialShaped(value) && (quoted || !spaced)) {
      found.push({ key, reason: 'a secret-shaped key holds a real value' });
    }

    const embedded = EMBEDDED.exec(value);
    if (embedded && !isPlaceholder(embedded[2]) && embedded[2].length >= 8 && (quoted || !spaced)) {
      found.push({ key, reason: `the value embeds a credential (${embedded[1]}=)` });
    }
  }
  return found;
}

// Controls. Every one of these is a case the shipped grep got wrong or a case a widening of this scan would
// break; they are asserted rather than described because E-11's mechanism was described accurately and was
// still blind. The three CATCH cases marked (E-11) and (E-16) are the exact inputs that evaded the grep.
const CATCH = [
  ['    "Key": "Sup3rSecretValue123",', 'E-16 + E-11: quoted JSON key, whole-word key term'],
  ['    "password": "Sup3rSecretValue123",', 'E-16: quoted JSON key, the grep saw no quoted key at all'],
  ['  Password: "Sup3rSecretValue123"', 'E-11: PascalCase, the grep carried no -i'],
  ['  secret: "Sup3rSecretValue123"', 'the one spelling the grep did catch, kept as a regression control'],
  ['Jwt__Key=Sup3rSecretValue123', 'env-var spelling of the same key'],
  ['MSSQL_SA_PASSWORD=Ci_Harness_Pass123!', 'unquoted .env assignment'],
  ["  apiKey: 'abcdef1234567890'", 'camelCase compound'],
  ['  SigningKey = "abcdef1234567890";', 'PascalCase source assignment with a literal'],
  ['CS: "Server=x;User Id=sa;Password=Ci_Harness_Pass123!;"', 'credential embedded in a connection string'],
  ['-----BEGIN RSA PRIVATE KEY-----', 'PEM block'],
  ['  "accessKey": "AKIAIOSFODNN7RQ4M2LB"', 'compound split by camelCase'],
];

const IGNORE = [
  ['  "Issuer": "kernel",', 'a committed non-secret config value'],
  ['        var token = TestTokens.Mint(Guid.NewGuid(), sub: userId);', 'source assignment, not a literal'],
  ['  const token = mintToken({', 'source assignment, not a literal'],
  ['  keyboardLayout: "qwerty-intl-12"', 'a key whose tokens are not secret terms'],
  ['  tokenCount = 12345678;', 'E-9 records this as the cost of token matching; it is a number, not a credential'],
  ['      "Jwt__Key": "${{ secrets.HARN_JWT_KEY }}"', 'a workflow interpolation is not a committed value'],
  ["  MSSQL_SA_PASSWORD=$(openssl rand -base64 24)", 'a generated value is not a committed value'],
  ['  "Key": "<your-signing-key-here>"', 'a placeholder'],
  ['  "password": "user-secret"', 'the documented pointer to the secret store'],
  ['  "secret": ""', 'an empty value'],
  ['  private static readonly string[] SecretShapedKeys =', 'a registry declaration, not an assignment of a literal'],
  ['  "enableSecret": true', 'a boolean flag'],
  ['  "Password": "short"', 'below the eight-character floor both halves of SEC-5 share'],
];

if (invokedDirectly && selfTest) {
  const failures = [];
  for (const [line, why] of CATCH) {
    if (findingsInLine(line).length === 0) {
      failures.push(`MISSED  ${JSON.stringify(line)}  (${why})`);
    }
  }
  for (const [line, why] of IGNORE) {
    const hits = findingsInLine(line);
    if (hits.length > 0) {
      failures.push(`FALSE POSITIVE  ${JSON.stringify(line)}  (${why}) -> ${JSON.stringify(hits)}`);
    }
  }
  if (failures.length > 0) {
    console.error('secret-scan --self-test FAILED:');
    for (const f of failures) {
      console.error(`  ${f}`);
    }
    process.exit(1);
  }
  console.log(`secret-scan --self-test ok: ${CATCH.length} caught, ${IGNORE.length} ignored.`);
  process.exit(0);
}

// Imported for the detector alone: the scan is the CLI's job, not an import side effect.
if (invokedDirectly) {
  const findings = [];
  const used = new Set();

  for (const rel of trackedFiles(editionRoot).filter(scanned)) {
    const text = readFileSync(join(editionRoot, rel), 'utf8');
    text.split(/\r?\n/).forEach((line, i) => {
      for (const f of findingsInLine(line)) {
        const allowed = ALLOWLIST.findIndex((a) => a.file === rel && a.key === f.key);
        if (allowed >= 0) {
          used.add(allowed);
          continue;
        }
        findings.push({ rel, line: i + 1, key: f.key, reason: f.reason, text: line.trim() });
      }
    });
  }

  // A stale exception is a pre-authorized hole waiting for a file to be re-registered under it (E-8).
  const stale = ALLOWLIST.map((a, i) => (used.has(i) ? null : a)).filter(Boolean);

  if (findings.length > 0 || stale.length > 0) {
    for (const f of findings) {
      console.error(`${f.rel}:${f.line}  '${f.key}': ${f.reason} (SEC-5)`);
      console.error(`    ${f.text}`);
    }
    for (const a of stale) {
      console.error(`allowlist entry ${a.file} '${a.key}' matches nothing (SEC-5): remove it.`);
    }
    console.error('\nMove the value to the developer-local secret store or a vault. If it is genuinely not a');
    console.error("secret, add a {file, key, why} entry to secret-scan.allow.json. The 'why' is the review");
    console.error('surface SEC-5 asks for, so write the reason, not a restatement of the exemption.');
    process.exit(1);
  }

  const count = ALLOWLIST.length;
  console.log(
    `secret-scan ok: no committed secrets across ${relative(process.cwd(), editionRoot) || '.'}${sep}, ` +
      `${count} justified exception${count === 1 ? '' : 's'} live.`,
  );
}
