import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { EDITION_ROOT } from '../platform/settings.ts';
import type { Violation } from './endpointSpine.ts';

// Two obligations, one walk, because they are two questions about the same three lines of every handler.
//
// **DATA-1**: "an endpoint never touches a store: it calls one service method." The first half is the import
// graph's, and it binds. The second half was held by reading: each of the four handlers calls exactly one, and
// nothing refused a fifth that called two, or that called a service method and then reached for another.
//
// **TEN-2**: "a guard refuses rather than defaulting." The hole is a handler that obtains a REAL `TenantId` and
// passes the wrong one, which no type can close. Three request-level tests close it per route, and the row says
// so: `patterned`, because the fifth handler owes its own test. A scan does not owe anything per route.
//
// So: for every route handler in `routes/`, at most one call on a service binding, and that call's tenant
// argument is resolved from the request rather than from anywhere else.
//
// **What makes this checkable is a convention, and the convention is stated rather than assumed.** Every
// `NoteService` method takes its `TenantId` first, so "the tenant argument" is "the first argument". A service
// method that took it second would pass this scan while violating the claim, which is why the ORDER is part of
// what the store interface is for and belongs in review of that interface rather than here.

const ROUTE_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'all']);
// The one sanctioned resolver, and the scan checks its BODY too rather than trusting the name: a `tenantFor` that
// returned a constant would satisfy a name-shaped rule perfectly, which is E-99's lesson from the other side.
const RESOLVER = 'tenantFor';
// Named for the request property it looks for rather than for the value, and that is not a style choice: SEC-5's
// registry treats `credential` as a run, so a constant called CREDENTIAL holding a string literal is reported as
// a committed secret, correctly, by a rule that cannot know this one is a selector. Renaming beats exempting,
// because an exemption is a pre-authorized hole and this binding has no need of one.
const REQUEST_PROPERTY = 'credential';

export type Handler = Readonly<{ at: string; url: string; serviceCalls: readonly string[] }>;

export function scanHandlerBodies(root: string = path.join(EDITION_ROOT, 'server', 'src', 'routes')): readonly Violation[] {
  const violations: Violation[] = [];
  const handlers: Handler[] = [];

  for (const file of walk(root)) {
    const relative = path.relative(EDITION_ROOT, file).split(path.sep).join('/');
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
    const bindings = serviceBindings(source);

    // The resolver's own body, checked once per file. A file that never calls a service does not need one.
    if (bindings.size > 0) {
      const resolver = resolverIn(source);
      if (resolver === undefined) {
        violations.push({
          claim: 'TEN-2',
          at: relative,
          message: `calls a service and declares no \`${RESOLVER}\`, so its tenant comes from somewhere this scan cannot name. Every route surface resolves the tenant through one function, so there is one place to read and one place to break.`,
        });
      } else if (!resolvesFromCredential(resolver)) {
        violations.push({
          claim: 'TEN-2',
          at: relative,
          message: `declares \`${RESOLVER}\` and its body never reads \`.${REQUEST_PROPERTY}\`. A resolver that returns anything else is a tenant asserted rather than minted, and a rule keyed on the NAME alone would pass it (E-99).`,
        });
      }
    }

    for (const found of routeHandlers(source)) {
      const calls = serviceCallsIn(found.handler, bindings, found.request);
      handlers.push(Object.freeze({ at: relative, url: found.url, serviceCalls: calls.map((call) => call.method) }));

      if (calls.length > 1) {
        violations.push({
          claim: 'DATA-1',
          at: `${relative} ${found.url}`,
          message: `calls ${calls.length} service methods (${calls.map((call) => call.method).join(', ')}). An endpoint calls ONE: a handler that calls two is orchestrating, and orchestration that lives in the transport layer is invisible to every test that does not go through HTTP.`,
        });
      }

      for (const call of calls) {
        if (call.tenantArgument === 'missing') {
          violations.push({
            claim: 'TEN-2',
            at: `${relative} ${found.url}`,
            message: `calls \`${call.method}\` with no arguments at all, so it passes no tenant. Every service method takes its tenant first.`,
          });
        } else if (call.tenantArgument !== 'resolved') {
          violations.push({
            claim: 'TEN-2',
            at: `${relative} ${found.url}`,
            message: `passes ${call.tenantArgument} as the tenant to \`${call.method}\` instead of \`${RESOLVER}(${found.request ?? 'request'})\`. A handler can hold a real \`TenantId\` and still pass the wrong one, which is the hole no type closes: the value has to come from THIS request.`,
          });
        }
      }
    }
  }

  // E-11 and E-92. This scan reports what it did not like, so a walk that found no handlers approves of nothing
  // and reads exactly like a clean tree.
  if (handlers.length === 0) {
    violations.push({
      claim: 'DATA-1',
      at: path.relative(EDITION_ROOT, root),
      message:
        'found no route handlers at all, so both rules below passed by reaching nothing. A renamed directory or a changed registration shape would produce this silently.',
    });
  }

  return Object.freeze(violations);
}

// The enumeration, exposed, because a green scan cannot say which handlers it read (E-92).
export function handlersIn(root: string = path.join(EDITION_ROOT, 'server', 'src', 'routes')): readonly Handler[] {
  const found: Handler[] = [];
  for (const file of walk(root)) {
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
    const bindings = serviceBindings(source);
    for (const route of routeHandlers(source)) {
      found.push(
        Object.freeze({
          at: path.relative(EDITION_ROOT, file).split(path.sep).join('/'),
          url: route.url,
          serviceCalls: serviceCallsIn(route.handler, bindings, route.request).map((call) => call.method),
        }),
      );
    }
  }
  return Object.freeze(found);
}

export function assertHandlerBodies(): void {
  const violations = scanHandlerBodies();
  if (violations.length > 0) {
    throw new Error(
      `route handlers violate DATA-1 or TEN-2 in ${violations.length} place(s):\n` +
        violations.map((violation) => `  ${violation.at}: ${violation.message}`).join('\n'),
    );
  }
}

// A binding is a parameter whose declared TYPE is imported from `app/`, which is the layer that owns the
// services. Derived rather than named, so a second service under a second parameter is covered the day it is
// written, and a renamed parameter changes nothing.
function serviceBindings(source: ts.SourceFile): ReadonlySet<string> {
  const fromApp = new Set<string>();
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }
    if (!/(^|\/)app\//.test(statement.moduleSpecifier.text)) {
      continue;
    }
    const named = statement.importClause?.namedBindings;
    if (named !== undefined && ts.isNamedImports(named)) {
      for (const element of named.elements) {
        fromApp.add(element.name.text);
      }
    }
  }

  const bindings = new Set<string>();
  const visit = (node: ts.Node): void => {
    if (ts.isParameter(node) && ts.isIdentifier(node.name) && node.type !== undefined) {
      const typeName = ts.isTypeReferenceNode(node.type) && ts.isIdentifier(node.type.typeName) ? node.type.typeName.text : undefined;
      if (typeName !== undefined && fromApp.has(typeName)) {
        bindings.add(node.name.text);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return bindings;
}

// A registration by SHAPE rather than by the receiver's name: a string url, and a function last. A renamed `app`
// is still a registration, and a helper that happens to be called `get` is not one.
function routeHandlers(source: ts.SourceFile): readonly { url: string; handler: ts.Node; request: string | undefined }[] {
  const found: { url: string; handler: ts.Node; request: string | undefined }[] = [];
  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ROUTE_METHODS.has(node.expression.name.text) &&
      node.arguments.length >= 2
    ) {
      const url = node.arguments[0];
      const last = node.arguments[node.arguments.length - 1];
      if (url !== undefined && ts.isStringLiteral(url) && url.text.startsWith('/') && last !== undefined && isFunction(last)) {
        const first = last.parameters[0];
        found.push({
          url: url.text,
          handler: last,
          request: first !== undefined && ts.isIdentifier(first.name) ? first.name.text : undefined,
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

type ServiceCall = Readonly<{ method: string; tenantArgument: string }>;

function serviceCallsIn(handler: ts.Node, bindings: ReadonlySet<string>, request: string | undefined): readonly ServiceCall[] {
  const calls: ServiceCall[] = [];
  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      bindings.has(node.expression.expression.text)
    ) {
      const first = node.arguments[0];
      calls.push(
        Object.freeze({
          method: `${node.expression.expression.text}.${node.expression.name.text}`,
          tenantArgument: first === undefined ? 'missing' : resolvedFrom(first, request) ? 'resolved' : `\`${first.getText()}\``,
        }),
      );
    }
    ts.forEachChild(node, visit);
  };
  visit(handler);
  return calls;
}

// The resolver call AND its argument, because checking the callee alone leaves the hole the whole obligation is
// about. `tenantFor(someOtherRequest)` is a real `TenantId`, minted by the sanctioned resolver, belonging to a
// different caller: a rule that stopped at the function's name would pass it, and that is E-99's lesson arriving
// inside the repair for E-102. Found by writing this scan's own row, which is the third time this session that
// stating a mechanism in prose has been what exposed its gap.
function resolvedFrom(argument: ts.Expression, request: string | undefined): boolean {
  if (!ts.isCallExpression(argument) || !ts.isIdentifier(argument.expression) || argument.expression.text !== RESOLVER) {
    return false;
  }
  const passed = argument.arguments[0];
  return request !== undefined && passed !== undefined && ts.isIdentifier(passed) && passed.text === request;
}

function resolverIn(source: ts.SourceFile): ts.Node | undefined {
  let found: ts.Node | undefined;
  const visit = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === RESOLVER) {
      found = node;
    }
    if (ts.isFunctionDeclaration(node) && node.name?.text === RESOLVER) {
      found = node;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

function resolvesFromCredential(resolver: ts.Node): boolean {
  let reads = false;
  const visit = (node: ts.Node): void => {
    if (ts.isPropertyAccessExpression(node) && node.name.text === REQUEST_PROPERTY) {
      reads = true;
    }
    ts.forEachChild(node, visit);
  };
  visit(resolver);
  return reads;
}

function isFunction(node: ts.Node): node is ts.ArrowFunction | ts.FunctionExpression {
  return ts.isArrowFunction(node) || ts.isFunctionExpression(node);
}

function walk(root: string): readonly string[] {
  let entries: string[];
  try {
    entries = readdirSync(root);
  } catch {
    return [];
  }
  const found: string[] = [];
  for (const entry of entries) {
    if (entry === '__tests__' || entry === 'node_modules') {
      continue;
    }
    const full = path.join(root, entry);
    if (statSync(full).isDirectory()) {
      found.push(...walk(full));
    } else if (path.extname(entry) === '.ts') {
      found.push(full);
    }
  }
  return found;
}
