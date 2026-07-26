import { composeApp } from './compose.ts';

// The process entrypoint, deliberately thin: it composes, it listens, and it holds no behaviour of its own. The
// same `composeApp` the architecture tests scan is the one that serves, so a scan over the composed table is a
// scan over what actually runs, and the spine assertion inside it means a violating server does not start.
//
// This file used to read `Number(process.env.PORT ?? 5080)` and bind a hardcoded `'0.0.0.0'`, and that line was
// CFG-1's finding rather than an oversight. The env read is not a literal in code, so CFG-1's literal registry
// could not see it; it is not committed configuration, so it escaped the config-review surface and the
// per-environment surface; and the `??` was a silent default of exactly the kind DATA-5 forbids. The claim names
// two right homes and one wrong one, and the ambient process environment is a fourth home it does not name. Both
// values now resolve through the settings seam, where they are declared, validated at startup, and overridable
// per environment through a name derived from the key.
const app = await composeApp();

await app.listen({ port: app.settings.http.port, host: app.settings.http.host });
