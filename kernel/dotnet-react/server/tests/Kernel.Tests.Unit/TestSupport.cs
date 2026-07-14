using Kernel.App.Notes;
using Kernel.App.Platform.Tenancy;
using Kernel.Persistence;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace Kernel.Tests.Unit;

/// <summary>Controllable clock, standard-library TimeProvider (no clock package).</summary>
internal sealed class TestClock(DateTimeOffset now) : TimeProvider
{
    public DateTimeOffset Now { get; set; } = now;

    public override DateTimeOffset GetUtcNow() => Now;
}

/// <summary>
/// A real KernelDbContext over SQLite (never EF InMemory, per TEST-1). The connection stays open so the in-memory
/// schema survives for the lifetime of the harness.
/// </summary>
internal sealed class TenantDb : IDisposable
{
    private readonly SqliteConnection _connection;

    public AmbientTenantScope Scope { get; } = new();

    public KernelDbContext Context { get; }

    public TenantDb()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();
        Context = new KernelDbContext(
            new DbContextOptionsBuilder<KernelDbContext>().UseSqlite(_connection).Options, Scope);
        Context.Database.EnsureCreated();
    }

    public void Dispose()
    {
        Context.Dispose();
        _connection.Dispose();
    }
}

/// <summary>In-memory INoteStore with keyset semantics, for isolating NoteService logic from persistence.</summary>
internal sealed class FakeNoteStore : INoteStore
{
    public List<Note> Notes { get; } = [];

    public int LastLimit { get; private set; }

    public Task AddAsync(Note note, CancellationToken cancellationToken = default)
    {
        Notes.Add(note);
        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<Note>> ListAsync(NoteCursor? before, int limit, CancellationToken cancellationToken = default)
    {
        // Mirrors EfNoteStore's keyset shape. The Id tiebreak uses .NET Guid ordering here; SQL Server orders
        // uniqueidentifier differently, but each provider is internally consistent (WHERE and ORDER BY agree), so
        // paging is correct on both. The same-timestamp tie is the SQL Server integration test's authority.
        LastLimit = limit;
        IEnumerable<Note> query = Notes
            .OrderByDescending(n => n.CreatedAtUtc)
            .ThenByDescending(n => n.Id);
        if (before is { } cursor)
        {
            query = query.Where(n =>
                n.CreatedAtUtc < cursor.CreatedAtUtc
                || (n.CreatedAtUtc == cursor.CreatedAtUtc && n.Id.CompareTo(cursor.Id) < 0));
        }

        return Task.FromResult<IReadOnlyList<Note>>(query.Take(limit).ToList());
    }

    public Task<Note?> GetAsync(Guid id, CancellationToken cancellationToken = default) =>
        Task.FromResult(Notes.FirstOrDefault(n => n.Id == id));

    public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var note = Notes.FirstOrDefault(n => n.Id == id);
        if (note is null)
        {
            return Task.FromResult(false);
        }

        Notes.Remove(note);
        return Task.FromResult(true);
    }
}
