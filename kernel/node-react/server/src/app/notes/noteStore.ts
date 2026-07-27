import type { TenantId } from '../tenancy.ts';

// DATA-1: the record is a pure data holder with zero behaviour, and the store is an interface in the application
// layer. The implementation lives under `persistence/` and is named only by the composition root.

export type Note = Readonly<{
  tenantId: TenantId;
  id: string;
  title: string;
  body: string;
  createdAtUtc: string;
}>;

// DATA-2's keyset cursor, and it carries BOTH ordering columns.
//
// A cursor of `createdAtUtc` alone is the version the sibling's build brief still documents as settled, and the
// sibling's shipped code does the opposite because a unique index on a timestamp threw the moment two notes were
// created inside one clock tick. Two rows may share an instant; the id is the tiebreak that makes the ordering
// total, so a page boundary landing between two equal timestamps neither drops a row nor serves one twice.
export type NoteCursor = Readonly<{ createdAtUtc: string; id: string }>;

export type NotePage = Readonly<{ items: readonly Note[]; nextCursor: NoteCursor | null }>;

export type NewNote = Readonly<{ title: string; body: string }>;

// DATA-2: the bound is explicit, it is a constant on the interface rather than a number in a handler, and it is
// the store's own. A limit enforced only at the route is a limit that any second caller of the store bypasses,
// which is the difference between "every list endpoint has a maximum page size" and "the list read is bounded".
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 20;

// Every method takes the tenant FIRST and takes it as a `TenantId`, which is a type only obtainable from a
// verified credential. That is this edition's answer to TEN-2: not an ambient scope whose accessor throws when
// unset, but a signature that cannot be satisfied without the value. There is no method here that reads or writes
// without naming a tenant, so "a query that forgot the tenant" is not a defect to be caught, it is a call that
// does not compile.
export interface NoteStore {
  add: (tenant: TenantId, note: NewNote, now: Date) => Note;
  list: (tenant: TenantId, cursor: NoteCursor | null, limit: number) => NotePage;
  get: (tenant: TenantId, id: string) => Note | null;
  remove: (tenant: TenantId, id: string) => boolean;
}
