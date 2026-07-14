import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { KernelClient } from './api/client.ts';
import { NotesRepo } from './data/notesRepo.ts';
import { NotesScreen } from './modules/notes/NotesScreen.tsx';

// UI-5: this file is the composition root, the ONE place that constructs the transport and the data services.
// Screens receive data and callbacks; they import neither the transport nor the repos (the eslint import ban
// holds that), so testing the services e2e (TEST-2) carries the coverage and the composed-entrypoint smoke
// proves a real request leaves the app per primary flow.
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5080';
const token = import.meta.env.VITE_API_TOKEN ?? ''; // dev: mint one (tools/harness/mintToken.mjs) into .env.local
const notesRepo = new NotesRepo(new KernelClient(baseUrl, token));

const root = document.getElementById('root');
if (!root) {
  // Fail fast: index.html always ships #root, so a missing element is a build/template regression, not a state to
  // silently render a blank page for.
  throw new Error('Root element #root was not found in index.html.');
}

const reactRoot = createRoot(root);

// Fail loudly (DATA-5 spirit): a failed load surfaces the error, never a plausible empty screen.
function surface(error: unknown): never {
  root!.textContent = `Failed to reach the server at ${baseUrl}: ${error instanceof Error ? error.message : String(error)}`;
  throw error;
}

async function refresh(): Promise<void> {
  const page = await notesRepo.list();
  reactRoot.render(
    <StrictMode>
      <NotesScreen notes={page.items} onCreate={createNote} />
    </StrictMode>,
  );
}

function createNote(): void {
  void notesRepo.create({ title: 'New note', body: 'Created from the composed client.' }).then(refresh, surface);
}

void refresh().catch(surface);
