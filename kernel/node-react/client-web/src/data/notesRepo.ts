import type { HttpResponse, KernelClient } from '../api/client.ts';

// The client half of the hand-mirrored Note contract (CON-2). Field sets are pinned by the shared fixture that
// both this repo's test and the server's ContractParityTests assert against.
export interface Note {
  id: string;
  title: string;
  body: string;
  createdAtUtc: string;
}

export interface NoteList {
  items: Note[];
  nextCursor: string | null;
}

export interface CreateNote {
  title: string;
  body: string;
}

export class NotesRepo {
  readonly #client: KernelClient;

  constructor(client: KernelClient) {
    this.#client = client;
  }

  async list(cursor?: string, limit?: number): Promise<NoteList> {
    const query = new URLSearchParams();
    if (cursor !== undefined) {
      query.set('cursor', cursor);
    }
    if (limit !== undefined) {
      query.set('limit', String(limit));
    }

    const suffix = query.toString();
    const response = await this.#client.get<NoteList>(`/notes${suffix.length > 0 ? `?${suffix}` : ''}`);
    return expect(response, 'list notes', 200);
  }

  async create(note: CreateNote): Promise<Note> {
    const response = await this.#client.post<Note>('/notes', note);
    return expect(response, 'create note', 201);
  }

  // Fail-fast on the status (no fallback that hides failure): 404 is a real absence and returns null; any other
  // non-200 (401/403/500) is a failure the caller must see, so it throws rather than masquerade as not-found.
  async get(id: string): Promise<Note | null> {
    const response = await this.#client.get<Note>(`/notes/${id}`);
    if (response.status === 404) {
      return null;
    }

    return expect(response, `get note ${id}`, 200);
  }

  async remove(id: string): Promise<boolean> {
    const response = await this.#client.delete<unknown>(`/notes/${id}`);
    if (response.status === 204) {
      return true;
    }

    if (response.status === 404) {
      return false;
    }

    throw new Error(`delete note ${id}: unexpected status ${response.status}`);
  }
}

function expect<T>(response: HttpResponse<T>, action: string, okStatus: number): T {
  if (response.status !== okStatus) {
    throw new Error(`${action}: expected status ${okStatus}, got ${response.status}`);
  }

  return response.body;
}
