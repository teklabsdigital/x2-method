namespace Kernel.Contracts.Notes;

public sealed record CreateNoteRequest(string Title, string Body);

public sealed record NoteResponse(Guid Id, string Title, string Body, DateTimeOffset CreatedAtUtc);

public sealed record NoteListResponse(IReadOnlyList<NoteResponse> Items, string? NextCursor);
