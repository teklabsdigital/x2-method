import tseslint from 'typescript-eslint';

// The half of the route-table completeness obligation that lives outside the code.
//
// `createApp` installs the recorder before any route can be registered, which makes every route on THAT
// instance enumerable. It says nothing about a second instance. An app built anywhere else has no recorder,
// serves its routes, and is invisible to every scan built on the table, while the build stays green because the
// scans are still scanning the instance they were handed.
//
// An audit drove six evasions through the first version of this file and only one was caught. What was wrong:
// the `files` glob was `**/*.ts`, so a `.js` or `.mjs` file was ungoverned entirely; the ban named the exact
// specifier `fastify`, so the subpath `fastify/fastify.js` walked past it; and nothing looked at `import()` or
// at `createRequire`. Each is closed below.
//
// The residual, stated rather than papered over: a computed specifier cannot be resolved by static analysis, so
// `import(someVariable)` is banned outright rather than inspected, and a sufficiently determined `require`
// alias is beyond what any lint can see. That is why the second constraint exists. A rogue instance that cannot
// open a socket serves nothing, so `listen` is confined to the process entrypoint and the raw socket modules
// are confined with it. Completeness of the ROUTE TABLE rests on the first constraint; completeness of what is
// REACHABLE rests on the second.

const frameworkBan = {
  group: ['fastify', 'fastify/*', 'fastify/**'],
  message:
    'Only src/app.ts constructs the app: createApp installs the route recorder as its first act, and an instance built anywhere else is unenumerable (route-table completeness).',
  allowTypeImports: true,
};

// `createRequire` is the documented way to reach CommonJS resolution from ESM, which is the documented way
// around an import ban. A server has no other need for it.
const escapeHatchBan = {
  group: ['node:module', 'module'],
  message: 'createRequire is an import-ban escape hatch; there is no legitimate use for it in this server.',
};

// Nothing but the entrypoint opens a socket, and nothing at all reaches the raw server modules. An unrecorded
// instance is only dangerous if it can serve.
const socketBan = {
  group: ['node:http', 'node:https', 'node:http2', 'node:net', 'http', 'https', 'http2', 'net'],
  message: 'Only src/app.ts owns the server. Raw socket modules bypass the route table entirely.',
  allowTypeImports: true,
};

const dynamicImportBans = [
  {
    selector: "ImportExpression[source.value=/^fastify(\\/|$)/]",
    message: 'Dynamic import of the framework evades the import ban (route-table completeness). Use createApp.',
  },
  {
    // A computed specifier is unresolvable by static analysis, so it is refused rather than inspected. This is
    // the line past which a lint cannot see, and it is drawn here on purpose.
    selector: "ImportExpression:not([source.type='Literal'])",
    message: 'A computed import specifier cannot be checked by any lint. Import statically.',
  },
  {
    selector: "CallExpression[callee.name='createRequire']",
    message: 'createRequire is an import-ban escape hatch (route-table completeness).',
  },
  {
    selector: "CallExpression[callee.name='require']",
    message: 'CommonJS require bypasses the import ban (route-table completeness).',
  },
];

// CFG-1's fourth home, confined. The claim's partition is two right homes and one wrong one (a literal in code),
// and the ambient process environment is neither: not a literal, so the literal registry cannot see it, and not
// committed configuration, so it escapes config review and the per-environment surface. This edition's own
// `main.ts` carried `process.env.PORT ?? 5080` until this pass. The environment is not banned outright, because
// deploy-time override is legitimate and a ban would be routed around; it is confined to the settings seam,
// which admits it only under a name derived from a key the spec already declares.
const environmentBan = {
  selector: "MemberExpression[object.name='process'][property.name='env']",
  message:
    'process.env is read only by src/platform/settings.ts. Declare the key in SETTINGS_SPEC and read it from the resolved settings; the derived override name is what keeps the environment a channel into the config system rather than a way around it.',
};

// SEC-5's confinement. A secret resolves from the developer-local store outside the tree, and "outside the tree"
// is only a guarantee if one module does the reading. Confining the filesystem modules is what makes the arch
// test's assertion about the store's path a statement about the server rather than about one code path in it.
const filesystemBan = {
  group: ['node:fs', 'node:fs/*', 'fs', 'fs/*'],
  message:
    'Only src/platform/settings.ts reads configuration or secrets from disk, and only src/architecture/** scans the source tree. A second reader makes SEC-5 a claim about one code path instead of about the server.',
  allowTypeImports: true,
};

// TIME-1's clock seam, and the shape of the ban is the finding. The sibling bans a TYPE: `DateTime` is forbidden
// and `DateTimeOffset` is permitted, and a reflection scan tells them apart for free. TypeScript erases types, so
// there is nothing to reflect over at runtime, and a ban on declared positions would miss `const t = new Date()`
// which has no annotation to reject. The reachable ban is on the CONSTRUCTOR and the globals. The same is true of
// the monotonic half: the .NET idiom is `Stopwatch`, a type, and Node's monotonic source is a function on a
// global, so "one clock seam" has to be bought by confinement rather than found by a scan.
const clockBans = [
  {
    selector: "NewExpression[callee.name='Date']",
    message:
      'Only src/platform/clock.ts reads a clock. A JS Date is an instant and is not offset-aware, so TIME-1 needs the offset carried beside it; passing one around from anywhere means nothing knows where the offset went.',
  },
  {
    selector: "MemberExpression[object.name='Date'][property.name=/^(now|parse|UTC)$/]",
    message:
      'Only src/platform/clock.ts reads a clock. Date.now subtracted from another reading is a wall-clock delta, and the wall clock steps under NTP correction, so the difference across a step is not a duration (TIME-1).',
  },
  {
    selector: "MemberExpression[object.name='performance'][property.name='now']",
    message:
      'The monotonic source is exposed through clock.elapsed, not read directly. TIME-1 asks for durations to come from the monotonic source through ONE seam, and a function on a global has no type for a scan to find.',
  },
];

const listenBan = {
  selector: "CallExpression[callee.property.name='listen']",
  message:
    'Only src/main.ts opens a socket. An app that cannot listen cannot serve unenumerated routes, which is the second half of the route-table guarantee.',
};

// The socket ban above governs IMPORTS, and the round 4 audit walked around it without importing anything: the
// framework hands out the raw `http.Server` on the instance every module already holds. A route module that
// takes over `app.server`'s 'request' listener sits BELOW the framework's dispatcher, so it runs before every
// hook, including the deny-by-default hook that `createApp` installs in the expression that creates the
// instance. `/ghost?email=a@b.com` returned 200 with the query string leaked, the route table held two entries,
// and eslint and tsc were both clean. That is the residual A-4 recorded as closed, reopened by a route the
// closure argument does not cover: "every other hook is a later hook" is true and says nothing about a listener
// that is not a hook.
const rawServerBan = {
  selector: "MemberExpression[property.name='server']",
  message:
    'The raw http.Server sits below the framework dispatcher, so a request listener on it runs before every hook, including the deny-by-default fallback. Nothing outside src/app.ts may reach it.',
};

// Every confinement in this file, in one array, so that a block granting one exemption does not silently drop
// the rest. Each override below starts from this list and removes exactly what it is exempt from, by name. The
// previous version of this config restated the whole array in every block, which is how a five-item list becomes
// a four-item list in the one block nobody re-reads.
const allSyntaxBans = [...dynamicImportBans, listenBan, rawServerBan, environmentBan, ...clockBans];

const except = (...exempt) => allSyntaxBans.filter((ban) => !exempt.includes(ban));

export default tseslint.config(
  { ignores: ['node_modules'] },
  ...tseslint.configs.recommended,
  {
    // Every source extension, not just .ts. A `.js` or `.mjs` file was ungoverned by the first version of this
    // config, which made the whole ban optional for anyone who renamed a file.
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    languageOptions: { parser: tseslint.parser },
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        { patterns: [frameworkBan, escapeHatchBan, socketBan, filesystemBan] },
      ],
      'no-restricted-syntax': ['error', ...allSyntaxBans],
    },
  },
  {
    // The composition root owns the framework and the server modules. It is still forbidden to listen: creating
    // the app and serving it are separate responsibilities, and only one file does each.
    files: ['src/app.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', { patterns: [escapeHatchBan, filesystemBan] }],
      // The one file exempt from the raw-server ban, because it is the file that seals it. `createApp` captures
      // the dispatcher and refuses mutation of the 'request' event in the expression that creates the instance.
      'no-restricted-syntax': ['error', ...except(rawServerBan)],
    },
  },
  {
    // The configuration seam. It is the only reader of the environment and the only reader of a config file or
    // the secret store, which is what makes CFG-1's fourth-home finding and SEC-5's out-of-tree assertion
    // statements about the server rather than about one code path in it.
    files: ['src/platform/settings.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', { patterns: [frameworkBan, escapeHatchBan, socketBan] }],
      'no-restricted-syntax': ['error', ...except(environmentBan)],
    },
  },
  {
    // The clock seam. One file reads a clock, wall or monotonic, for the reason TIME-1 gives: a duration is
    // measured from the monotonic source, never computed by subtracting two wall-clock readings.
    files: ['src/platform/clock.ts'],
    rules: {
      'no-restricted-syntax': ['error', ...except(...clockBans)],
    },
  },
  {
    // The architecture tier scans the source tree, so it reads files. It is still confined out of the
    // environment and the clock: a scan that reads a setting is a scan whose result depends on the machine it
    // ran on.
    files: ['src/architecture/**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', { patterns: [frameworkBan, escapeHatchBan, socketBan] }],
      'no-restricted-syntax': ['error', ...allSyntaxBans],
    },
  },
  {
    // The entrypoint is the one place a socket is opened, and it obtains its app from composeApp like everyone
    // else. Tests are NOT exempt from anything: a test that builds its own instance, or that listens, proves a
    // property of an app nobody serves.
    files: ['src/main.ts'],
    rules: {
      'no-restricted-syntax': ['error', ...except(listenBan)],
    },
  },
  {
    // The file that proves the raw-server seal has to reach the raw server, the same way the endpoint spine's
    // red proofs have to reach `createApp`. One file, named, so a new file that quietly touches `app.server` is
    // a lint error rather than a silent weakening of the guard that holds A-4's hole narrowed.
    files: ['src/platform/__tests__/routeSurface.test.ts'],
    rules: {
      'no-restricted-syntax': ['error', ...except(rawServerBan)],
    },
  },
  {
    // The tests that prove the two seams behave. A clock test has to construct instants to have anything to
    // measure, and a settings test has to synthesize an environment to prove the override channel works. Named
    // files, one each, in the discipline the raw-server proof already uses: a new test file that quietly reads a
    // clock is a lint error rather than a silent widening of the seam.
    files: ['src/platform/__tests__/clock.test.ts', 'src/platform/__tests__/settings.test.ts'],
    rules: {
      'no-restricted-syntax': ['error', ...except(environmentBan, ...clockBans)],
    },
  },
  {
    // The architecture tests assert the four route-seam claims, and every one of them is a statement about THE
    // composed app. A test that reaches for `createApp` builds an app of its own and then proves a property of
    // an app nobody serves, which is the same failure the framework import ban exists to prevent, one level up:
    // the scan is still scanning the instance it was handed.
    //
    // The red proofs in the same directory need violating apps, and they get them from `createApp` on purpose,
    // which is why this is a ban on the DEFAULT rather than a ban outright. The exemption is one file and it is
    // named, so a new file that quietly builds its own app is a lint error rather than a silent weakening.
    files: ['src/architecture/__tests__/**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    ignores: ['src/architecture/__tests__/spineRefusals.test.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            frameworkBan,
            escapeHatchBan,
            socketBan,
            {
              // Extensions as well as the bare path. The round 3 audit walked `../../app.js` past the previous
              // group, which is the identical mistake the Phase 2 audit found in the framework ban's own glob;
              // it did not resolve at runtime here, so it was a lint hole with no exploit behind it, but a ban
              // that depends on the module resolver to finish the job is a ban that is one config change from
              // being nothing.
              group: ['**/app.ts', '**/app.js', '**/app.mjs', '../../app.ts', '../../app.js'],
              message:
                'An architecture test scans the COMPOSED app. Import composeApp from src/compose.ts; createApp builds an instance nobody serves.',
              allowTypeImports: true,
            },
          ],
        },
      ],
      // The ban above is on a PATH, and the round 3 audit walked past it with a two-line re-export module:
      // `src/reexport.ts` exports createApp, the test imports it from there, eslint is clean, and the test then
      // scans an app nobody serves while looking like it obeys the rule. A path ban cannot see through one
      // indirection and adding the indirection's path only moves the problem. So the symbol is banned too,
      // whatever module it arrives from.
      'no-restricted-syntax': [
        'error',
        ...allSyntaxBans,
        {
          selector: "ImportSpecifier[imported.name='createApp']",
          message:
            'An architecture test scans the COMPOSED app. createApp reaches an instance nobody serves, from any module that re-exports it; import composeApp from src/compose.ts.',
        },
        {
          // And the namespace form of the same evasion. `import * as m from './reexport.ts'` names no specifier,
          // so the rule above cannot see it; the use site can. There is no legitimate `.createApp` in an
          // architecture test, so banning the member access costs nothing and closes the last variant the audit
          // got through.
          selector: "MemberExpression[property.name='createApp']",
          message:
            'An architecture test scans the COMPOSED app. Reaching createApp through a namespace import is the same evasion by another route; import composeApp from src/compose.ts.',
        },
      ],
    },
  },
);
