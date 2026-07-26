import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Note } from '../../../data/notesRepo.ts';
import { NotesScreen } from '../NotesScreen.tsx';

// UI-4 fidelity ledger for the Notes screen, transcribed from the locked prototype. Every branch is rendered
// (populated and empty), so a conditional atom cannot hide from the guard. Exhaustiveness: every ledger atom
// renders across the branches. De-fabrication: nothing renders that is not in the ledger.
const LEDGER = ['screen', 'header', 'note-list', 'note-item', 'empty-state'] as const;

const sampleNotes: Note[] = [
  { id: '1', title: 'First', body: 'Body one', createdAtUtc: '2026-07-10T12:00:00Z' },
  { id: '2', title: 'Second', body: 'Body two', createdAtUtc: '2026-07-10T12:01:00Z' },
];

const atomsOf = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-atom]'), (element) => element.getAttribute('data-atom')).filter(
    (atom): atom is string => atom !== null,
  );

const renderedAtoms = new Set([
  ...atomsOf(render(<NotesScreen notes={sampleNotes} />).container),
  ...atomsOf(render(<NotesScreen notes={[]} />).container),
]);

describe('NotesScreen fidelity (UI-4)', () => {
  it('renders every atom in the ledger (exhaustiveness)', () => {
    for (const atom of LEDGER) {
      expect(renderedAtoms).toContain(atom);
    }
  });

  it('renders no atom outside the ledger (de-fabrication)', () => {
    for (const atom of renderedAtoms) {
      expect(LEDGER).toContain(atom as (typeof LEDGER)[number]);
    }
  });
});
