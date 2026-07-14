namespace Kernel.App.Notes;

public interface INoteStore
{
    /// <summary>Hard upper bound on a single page (DATA-2). Enforced at the service and again at the store.</summary>
    const int MaxPageSize = 100;

    Task AddAsync(Note note, CancellationToken cancellationToken = default);

    /// <summary>Keyset page (DATA-2): rows strictly older than <paramref name="before"/> by (CreatedAtUtc, Id), newest first, at most <paramref name="limit"/>.</summary>
    Task<IReadOnlyList<Note>> ListAsync(NoteCursor? before, int limit, CancellationToken cancellationToken = default);

    Task<Note?> GetAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
