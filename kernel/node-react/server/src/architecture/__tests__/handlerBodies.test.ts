import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { handlersIn, scanHandlerBodies } from '../handlerBodies.ts';

// DATA-1's "one service method" and TEN-2's "the tenant comes from THIS request", asserted over every handler
// rather than over the four that exist. Both were held by reading until this scan, and both rows said so.

const routes = (files: Readonly<Record<string, string>>): string => {
  const root = mkdtempSync(path.join(tmpdir(), 'handlers-'));
  for (const [relative, contents] of Object.entries(files)) {
    const full = path.join(root, relative);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, contents, 'utf8');
  }
  return root;
};

// The shape every fixture starts from: a service imported from `app/`, a resolver that reads the credential, and
// one registration. Each test below changes exactly one thing about it (E-101).
const surface = (body: string, resolver = 'const tenantFor = (request) => tenantOf(request.credential);') => `
import type { NoteService } from '../app/notes/noteService.ts';
import { tenantOf } from '../app/tenancy.ts';
${resolver}
export function notesSurface(service: NoteService) {
  return async function register(app) {
    app.get('/notes', { config: {} }, async (request) => {
${body}
    });
  };
}
`;

describe('DATA-1 and TEN-2 hold over every handler in the tree', () => {
  it('finds no violation in the routes as they stand', () => {
    expect(scanHandlerBodies()).toEqual([]);
  });

  // What the green scan cannot say about itself (E-92): that it read anything. Every handler this edition serves
  // is named, so a registration shape it stops recognizing is a failure here rather than a quieter scan.
  it('enumerates every handler, including the one that calls no service', () => {
    const found = handlersIn().map((handler) => `${handler.url} ${handler.serviceCalls.join(',')}`);

    expect(found).toEqual([
      '/health ',
      '/notes service.page',
      '/notes/:noteId service.read',
      '/notes service.create',
      '/notes/:noteId service.discard',
    ]);
  });
});

describe('DATA-1: an endpoint calls one service method', () => {
  it('refuses a handler that calls two', () => {
    const root = routes({
      'notes.ts': surface('      const a = service.read(tenantFor(request), 1);\n      return service.page(tenantFor(request));'),
    });

    expect(scanHandlerBodies(root)).toMatchObject([
      { claim: 'DATA-1', message: expect.stringContaining('calls 2 service methods') },
    ]);
  });

  it('permits a handler that calls none, because a liveness route has no data to fetch', () => {
    const root = routes({
      'health.ts': "export async function registerHealth(app) {\n  app.get('/health', {}, async () => ({ status: 'ok' }));\n}\n",
    });

    expect(scanHandlerBodies(root)).toEqual([]);
  });
});

describe('TEN-2: the tenant comes from this request and from nowhere else', () => {
  it('refuses a tenant that is a literal', () => {
    const root = routes({ 'notes.ts': surface("      return service.page('tenant-a');") });

    expect(scanHandlerBodies(root)).toMatchObject([
      { claim: 'TEN-2', message: expect.stringContaining("passes `'tenant-a'` as the tenant") },
    ]);
  });

  // The hole no type closes, in its most plausible form: a real `TenantId`, from the wrong place. E-102 is why
  // this needs a scan rather than a test, because a system uniformly wrong about tenancy is self-consistent.
  it('refuses a real tenant that did not come from the request', () => {
    const root = routes({
      'notes.ts': surface('      const other = tenantFor(someOtherRequest);\n      return service.page(other);'),
    });

    expect(scanHandlerBodies(root)).toMatchObject([
      { claim: 'TEN-2', message: expect.stringContaining('passes `other` as the tenant') },
    ]);
  });

  // The hole found by writing this row's own text: the resolver is the sanctioned one, the tenant it returns is
  // real, and it belongs to a different caller. A rule that stopped at the callee's NAME would pass it.
  it('refuses the sanctioned resolver called on something other than this request', () => {
    const root = routes({ 'notes.ts': surface('      return service.page(tenantFor(someOtherRequest));') });

    expect(scanHandlerBodies(root)).toMatchObject([
      { claim: 'TEN-2', message: expect.stringContaining('passes `tenantFor(someOtherRequest)` as the tenant') },
    ]);
  });

  it('refuses a service call with no arguments at all', () => {
    const root = routes({ 'notes.ts': surface('      return service.page();') });

    expect(scanHandlerBodies(root)).toMatchObject([
      { claim: 'TEN-2', message: expect.stringContaining('no arguments at all') },
    ]);
  });

  it('refuses a surface that calls a service and declares no resolver', () => {
    const root = routes({
      'notes.ts': surface('      return service.page(tenantFor(request));', '// no resolver here'),
    });

    expect(scanHandlerBodies(root)).toMatchObject([
      { claim: 'TEN-2', message: expect.stringContaining('declares no') },
    ]);
  });

  // E-99 from the other side. A rule keyed on the resolver's NAME would pass this perfectly, and the value
  // reaching the store would be a constant.
  it('refuses a resolver whose body never reads the credential', () => {
    const root = routes({
      'notes.ts': surface(
        '      return service.page(tenantFor(request));',
        "const tenantFor = (request) => tenantForTesting('tenant-a');",
      ),
    });

    expect(scanHandlerBodies(root)).toMatchObject([
      { claim: 'TEN-2', message: expect.stringContaining('never reads') },
    ]);
  });
});

describe('what the scan must not miss and must not invent', () => {
  it('reports finding no handlers rather than approving of nothing', () => {
    expect(scanHandlerBodies(routes({ 'notes.ts': 'export const nothing = 1;\n' }))).toMatchObject([
      { claim: 'DATA-1', message: expect.stringContaining('found no route handlers at all') },
    ]);
  });

  // Registration is recognized by SHAPE, not by the receiver being called `app`, so renaming it does not turn the
  // scan silently vacuous the way a name-keyed rule would.
  it('still finds a registration when the instance is named something else', () => {
    const root = routes({
      'notes.ts': `
import type { NoteService } from '../app/notes/noteService.ts';
const tenantFor = (request) => request.credential.tenantId;
export function notesSurface(service: NoteService) {
  return async function register(server) {
    server.post('/notes', {}, async (request) => service.create(tenantFor(request), 1) && service.read(tenantFor(request), 2));
  };
}
`,
    });

    expect(scanHandlerBodies(root)).toMatchObject([{ claim: 'DATA-1', message: expect.stringContaining('calls 2') }]);
  });

  // The binding is derived from the parameter's TYPE being imported from `app/`, so a second service under a
  // second name is covered the day it is written rather than the day somebody remembers to add it here.
  it('covers a second service binding it was never told about', () => {
    const root = routes({
      'tags.ts': `
import type { TagService } from '../app/tags/tagService.ts';
const tenantFor = (request) => request.credential.tenantId;
export function tagsSurface(tags: TagService) {
  return async function register(app) {
    app.get('/tags', {}, async (request) => tags.list('tenant-a'));
  };
}
`,
    });

    expect(scanHandlerBodies(root)).toMatchObject([
      { claim: 'TEN-2', message: expect.stringContaining("passes `'tenant-a'` as the tenant to `tags.list`") },
    ]);
  });

  // A helper that happens to share a route method's name is not a registration: the shape requires a url string
  // and a function last. Without this the scan would report ordinary code as an ungated handler.
  it('does not mistake an ordinary method call for a route registration', () => {
    const root = routes({
      'notes.ts': "export const x = list.get('/notes');\nexport const y = cache.delete(key);\n",
    });

    expect(scanHandlerBodies(root)).toMatchObject([{ message: expect.stringContaining('found no route handlers') }]);
  });
});
