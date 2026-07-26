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

const listenBan = {
  selector: "CallExpression[callee.property.name='listen']",
  message:
    'Only src/main.ts opens a socket. An app that cannot listen cannot serve unenumerated routes, which is the second half of the route-table guarantee.',
};

export default tseslint.config(
  { ignores: ['node_modules'] },
  ...tseslint.configs.recommended,
  {
    // Every source extension, not just .ts. A `.js` or `.mjs` file was ungoverned by the first version of this
    // config, which made the whole ban optional for anyone who renamed a file.
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    languageOptions: { parser: tseslint.parser },
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', { patterns: [frameworkBan, escapeHatchBan, socketBan] }],
      'no-restricted-syntax': ['error', ...dynamicImportBans, listenBan],
    },
  },
  {
    // The composition root owns the framework and the server modules. It is still forbidden to listen: creating
    // the app and serving it are separate responsibilities, and only one file does each.
    files: ['src/app.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', { patterns: [escapeHatchBan] }],
    },
  },
  {
    // The entrypoint is the one place a socket is opened, and it obtains its app from createApp like everyone
    // else. Tests are NOT exempt from anything: a test that builds its own instance, or that listens, proves a
    // property of an app nobody serves.
    files: ['src/main.ts'],
    rules: {
      'no-restricted-syntax': ['error', ...dynamicImportBans],
    },
  },
);
