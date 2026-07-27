import { openDatabase } from '../src/persistence/database.ts';
import { migrate } from '../src/persistence/migrator.ts';
import { systemClock } from '../src/platform/clock.ts';
import { resolveSettings } from '../src/platform/settings.ts';

// Applying the schema, as an explicit step and never as a side effect of serving.
//
// CFG-1: the database file is READ from the resolved settings, not written here. A script that carries a copy of a
// committed configuration value is the defect E-75 measured four instances of in the sibling's CI, where a value
// restated in four places meant changing the committed one left every copy green and every other caller broken.
//
// Idempotent, and it says which migrations it applied rather than reporting success either way. "Applied 0
// migrations" and "the directory was empty" are different facts, and a runner that prints the same line for both
// is one whose reach nobody has checked.
const settings = resolveSettings();
const db = openDatabase(settings.database.file);
const applied = migrate(db, systemClock.now());

process.stdout.write(
  applied.length === 0
    ? `schema is up to date at ${settings.database.file}\n`
    : `applied ${applied.length} migration(s) at ${settings.database.file}: ${applied.join(', ')}\n`,
);
