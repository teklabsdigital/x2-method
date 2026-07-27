-- 0001_initial: the notes table.
--
-- TEN-3: the primary key LEADS with the tenant id. Not a tenant column beside an id, and not a unique index added
-- afterwards: the tenant is the first component of row identity, so a row cannot be addressed without naming the
-- tenant it belongs to. A query that forgets the tenant cannot use the key at all, which is the property the claim
-- is asking for and is why it is a key shape rather than a filter convention.
--
-- STRICT, which SQLite makes optional and which is not optional here. Without it a column declared TEXT accepts an
-- integer and stores it as one, so the type in this file would describe intent rather than content. E-66 measured
-- the sibling's fast tier accepting a five hundred character value into a column declared nvarchar(10), and type
-- affinity is the same family of surprise.
--
-- The CHECK constraints are the other half of that, and they are worth stating because E-66 recorded 'value past
-- max length is refused: NO' for SQLite as a provider capability. That measurement is about SQLite's TYPE system,
-- which has no length on TEXT at all; a CHECK is not the type system and does enforce it. So this edition does
-- refuse an over-length title, and the capability table's row is about a default this schema declines to accept.
CREATE TABLE notes (
  tenant_id      TEXT NOT NULL,
  id             TEXT NOT NULL,
  title          TEXT NOT NULL CHECK (length(title) > 0 AND length(title) <= 200),
  body           TEXT NOT NULL CHECK (length(body) <= 10000),
  created_at_utc TEXT NOT NULL,
  PRIMARY KEY (tenant_id, id)
) STRICT;

-- DATA-2's keyset index, and it is deliberately NOT unique.
--
-- Inherited from the sibling rather than rediscovered: an earlier UNIQUE (tenant_id, created_at_utc) there made
-- the second insert at the same instant throw, because two notes created inside one clock tick are ordinary and a
-- uniqueness constraint on a timestamp is a bet that they are not. The cursor carries (created_at_utc, id) with
-- the id as tiebreak, so equal timestamps never drop or repeat a row, and the index only has to make the ordering
-- cheap rather than to enforce anything.
CREATE INDEX notes_keyset ON notes (tenant_id, created_at_utc, id);
