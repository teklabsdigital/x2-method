using System.Buffers.Text;
using Kernel.Contracts.Notes;

namespace Kernel.App.Notes;

/// <summary>
/// Business logic for notes (DATA-1). Endpoints call exactly one method each. Time comes from
/// <see cref="TimeProvider"/> (standard library, not a custom clock). The keyset cursor is (CreatedAtUtc, Id),
/// encoded as base64url; Id is the tiebreaker, so equal timestamps never drop or duplicate a row across pages and
/// no uniqueness constraint on time is required (see NoteConfiguration and the KEYSET decision in BUILD-BRIEF).
/// </summary>
public sealed class NoteService(INoteStore store, TimeProvider timeProvider)
{
    private const int DefaultLimit = 20;
    private const int CursorByteLength = sizeof(long) + 16; // UtcTicks + Guid

    public async Task<NoteResponse> CreateAsync(CreateNoteRequest request, CancellationToken cancellationToken = default)
    {
        var note = new Note
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Body = request.Body,
            CreatedAtUtc = timeProvider.GetUtcNow(),
        };
        await store.AddAsync(note, cancellationToken);
        return ToResponse(note);
    }

    public async Task<NoteListResponse> ListAsync(string? cursor, int? limit, CancellationToken cancellationToken = default)
    {
        var pageSize = Math.Clamp(limit ?? DefaultLimit, 1, INoteStore.MaxPageSize);
        var before = DecodeCursor(cursor);
        var notes = await store.ListAsync(before, pageSize, cancellationToken);
        var nextCursor = notes.Count == pageSize ? EncodeCursor(notes[^1]) : null;
        return new NoteListResponse(notes.Select(ToResponse).ToList(), nextCursor);
    }

    public async Task<NoteResponse?> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var note = await store.GetAsync(id, cancellationToken);
        return note is null ? null : ToResponse(note);
    }

    public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default) =>
        store.DeleteAsync(id, cancellationToken);

    private static NoteResponse ToResponse(Note note) =>
        new(note.Id, note.Title, note.Body, note.CreatedAtUtc);

    private static string EncodeCursor(Note note)
    {
        Span<byte> buffer = stackalloc byte[CursorByteLength];
        BitConverter.TryWriteBytes(buffer, note.CreatedAtUtc.UtcTicks);
        note.Id.TryWriteBytes(buffer[sizeof(long)..]);
        return Base64Url.EncodeToString(buffer);
    }

    private static NoteCursor? DecodeCursor(string? cursor)
    {
        if (string.IsNullOrEmpty(cursor))
        {
            return null;
        }

        try
        {
            var bytes = Base64Url.DecodeFromChars(cursor);
            if (bytes.Length != CursorByteLength)
            {
                throw new FormatException("Cursor has the wrong length.");
            }

            var ticks = BitConverter.ToInt64(bytes);
            var id = new Guid(bytes.AsSpan(sizeof(long)));
            return new NoteCursor(new DateTimeOffset(ticks, TimeSpan.Zero), id);
        }
        catch (Exception exception) when (exception is FormatException or ArgumentException)
        {
            // A malformed client cursor is a bad request, not a server error. The endpoint maps this to 400.
            throw new FormatException("The cursor is not a valid keyset cursor.", exception);
        }
    }
}
