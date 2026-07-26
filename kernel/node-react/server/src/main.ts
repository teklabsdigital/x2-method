import { createApp } from './app.ts';
import { registerHealth } from './routes/health.ts';

// The process entrypoint, deliberately thin: it composes, it listens, and it holds no behaviour of its own. The
// same `createApp` the tests build is the one that serves, so a scan over the composed app is a scan over what
// actually runs.
const app = createApp();
await registerHealth(app);
await app.ready();

const port = Number(process.env.PORT ?? 5080);
await app.listen({ port, host: '0.0.0.0' });
