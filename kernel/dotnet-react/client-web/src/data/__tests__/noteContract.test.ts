import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { CreateNote, Note, NoteList } from '../notesRepo.ts';

// CON-2 client consumer: the same fixture the server's ContractParityTests links to. A rename on either side
// fails that side's build.
const fixture = JSON.parse(
  readFileSync(join(process.cwd(), 'src', 'data', '__fixtures__', 'note-contract.fixture.json'), 'utf8'),
) as Record<string, string[]>;

const createNoteRequest: CreateNote = { title: 't', body: 'b' };
const noteResponse: Note = { id: 'i', title: 't', body: 'b', createdAtUtc: 'u' };
const noteListResponse: NoteList = { items: [], nextCursor: null };

const sorted = (names: string[]) => [...names].sort();

describe('note contract parity (CON-2)', () => {
  it('createNoteRequest matches the shared fixture', () => {
    expect(sorted(Object.keys(createNoteRequest))).toEqual(sorted(fixture.createNoteRequest));
  });

  it('noteResponse matches the shared fixture', () => {
    expect(sorted(Object.keys(noteResponse))).toEqual(sorted(fixture.noteResponse));
  });

  it('noteListResponse matches the shared fixture', () => {
    expect(sorted(Object.keys(noteListResponse))).toEqual(sorted(fixture.noteListResponse));
  });
});
