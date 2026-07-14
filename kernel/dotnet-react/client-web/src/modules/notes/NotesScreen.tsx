import { Button } from '../../components/Button.tsx';
import { Text } from '../../components/Text.tsx';
import type { Note } from '../../data/notesRepo.ts';

// UI-3: a screen composes primitives only; it imports no tokens. Atoms are marked with data-atom so the fidelity
// test (UI-4) can assert exhaustiveness and de-fabrication against the ledger.
export interface NotesScreenProps {
  notes: Note[];
  onCreate?: () => void;
}

export function NotesScreen({ notes, onCreate }: NotesScreenProps) {
  return (
    <main data-atom="screen">
      <header data-atom="header">
        <Text variant="heading">Notes</Text>
        <Button variant="primary" onClick={onCreate}>
          New note
        </Button>
      </header>
      {notes.length === 0 ? (
        <p data-atom="empty-state">
          <Text tone="muted">No notes yet.</Text>
        </p>
      ) : (
        <ul data-atom="note-list">
          {notes.map((note) => (
            <li key={note.id} data-atom="note-item">
              <Text variant="title">{note.title}</Text>
              <Text variant="body" tone="secondary">
                {note.body}
              </Text>
              <Text variant="caption" tone="muted">
                {note.createdAtUtc}
              </Text>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
