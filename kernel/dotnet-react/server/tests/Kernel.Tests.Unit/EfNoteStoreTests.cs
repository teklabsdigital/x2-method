using Kernel.App.Notes;
using Kernel.Persistence.Notes;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Kernel.Tests.Unit;

/// <summary>
/// DATA-2 at the store, which is where the claim's mechanism actually lives: "store base helpers expose
/// keyset-paginated, no-tracking query shapes, so writing an unbounded tracked read requires deliberately
/// bypassing the provided seam".
///
/// Every assertion here exists because the thing it asserts could be deleted in silence (E-48). Measured on
/// 2026-07-27 against 113 architecture tests and 19 unit tests: removing `.AsNoTracking()` from `GetAsync` was
/// green, removing the store's `Math.Clamp` was green, and removing `.Take(limit)` outright, which is the
/// unbounded table read the claim's harm paragraph is about, was also green. `KernelApiFactory` runs this exact
/// store against SQLite, so it was inside the tested path the whole time and nothing asserted how it reads.
///
/// Removing `.AsNoTracking()` from `ListAsync` did turn a test red, and that was worse rather than better: the
/// test was `ListNotesToolReadOnlyTests`, which is AI-2's, and its message was "Assert.Empty() Failure: Collection
/// was not empty". A guard carrying another claim's load with a message naming neither is E-22's shape, and the
/// reason DATA-2 read `patterned` on a store nothing was checking.
///
/// SQLite, not SQL Server, so these run with no Docker daemon. That is deliberate: the row's previously cited
/// proof was the integration suite, which does not skip without Docker but fails, and which per E-39 runs in no
/// CI anywhere (E-49). The same-timestamp collision page stays with the integration suite, because Guid ordering
/// is provider-specific and that tie is the one place it matters.
/// </summary>
public sealed class EfNoteStoreTests
{
    private static readonly DateTimeOffset Origin = new(2026, 7, 10, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task A_list_read_leaves_nothing_tracked()
    {
        using var db = Seeded(3, out var tenant);
        var store = new EfNoteStore(db.Context, db.Scope);

        using (db.Scope.Begin(tenant))
        {
            await store.ListAsync(before: null, limit: 10);
        }

        Assert.Empty(db.Context.ChangeTracker.Entries());
    }

    [Fact]
    public async Task A_single_read_leaves_nothing_tracked()
    {
        using var db = Seeded(3, out var tenant);
        var store = new EfNoteStore(db.Context, db.Scope);
        var target = db.Context.Notes.AsNoTracking().First().Id;
        db.Context.ChangeTracker.Clear();

        using (db.Scope.Begin(tenant))
        {
            Assert.NotNull(await store.GetAsync(target));
        }

        Assert.Empty(db.Context.ChangeTracker.Entries());
    }

    /// <summary>
    /// The store's own bound, not the service's. `NoteServiceTests.List_clamps_the_page_size` drives a
    /// `FakeNoteStore`, so it proves the service clamp and never reaches this one, and the store's clamp carries
    /// the comment "a direct caller cannot read unbounded". A direct caller is what this is.
    /// </summary>
    [Theory]
    [InlineData(int.MaxValue)]
    [InlineData(INoteStore.MaxPageSize + 1)]
    [InlineData(1000)]
    public async Task A_direct_caller_cannot_read_past_the_maximum_page_size(int requested)
    {
        using var db = Seeded(INoteStore.MaxPageSize + 5, out var tenant);
        var store = new EfNoteStore(db.Context, db.Scope);

        using (db.Scope.Begin(tenant))
        {
            var page = await store.ListAsync(before: null, limit: requested);
            Assert.True(page.Count <= INoteStore.MaxPageSize,
                $"A request for {requested} returned {page.Count} rows, past DATA-2's bound of {INoteStore.MaxPageSize}.");
        }
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    public async Task A_nonsense_limit_is_clamped_upward_rather_than_returning_everything(int requested)
    {
        using var db = Seeded(5, out var tenant);
        var store = new EfNoteStore(db.Context, db.Scope);

        using (db.Scope.Begin(tenant))
        {
            Assert.Single(await store.ListAsync(before: null, limit: requested));
        }
    }

    /// <summary>
    /// Keyset, not offset: paging the whole table one page at a time visits every row exactly once. Offset paging
    /// is what silently skips rows under concurrent writes, and this is the property that distinguishes them
    /// without needing a concurrent writer.
    /// </summary>
    [Fact]
    public async Task Paging_by_cursor_visits_every_row_exactly_once()
    {
        const int Rows = 25;
        using var db = Seeded(Rows, out var tenant);
        var store = new EfNoteStore(db.Context, db.Scope);
        var seen = new List<Guid>();

        using (db.Scope.Begin(tenant))
        {
            NoteCursor? cursor = null;
            for (var page = 0; page < Rows; page++)
            {
                var items = await store.ListAsync(cursor, limit: 4);
                if (items.Count == 0)
                {
                    break;
                }

                seen.AddRange(items.Select(note => note.Id));
                var last = items[^1];
                cursor = new NoteCursor(last.CreatedAtUtc, last.Id);
            }
        }

        Assert.Equal(Rows, seen.Count);
        Assert.Equal(Rows, seen.Distinct().Count());
    }

    [Fact]
    public async Task A_read_never_crosses_into_another_tenant()
    {
        using var db = Seeded(3, out var tenant);
        var other = Guid.NewGuid();
        using (db.Scope.Begin(other))
        {
            db.Context.Notes.Add(new Note { Id = Guid.NewGuid(), Title = "theirs", Body = "b", CreatedAtUtc = Origin });
            await db.Context.SaveChangesAsync();
        }

        db.Context.ChangeTracker.Clear();
        var store = new EfNoteStore(db.Context, db.Scope);

        using (db.Scope.Begin(tenant))
        {
            Assert.Equal(3, (await store.ListAsync(before: null, limit: 100)).Count);
        }
    }

    private static TenantDb Seeded(int rows, out Guid tenant)
    {
        var db = new TenantDb();
        tenant = Guid.NewGuid();

        using (db.Scope.Begin(tenant))
        {
            for (var i = 0; i < rows; i++)
            {
                db.Context.Notes.Add(new Note
                {
                    Id = Guid.NewGuid(),
                    Title = $"note-{i}",
                    Body = "body",
                    CreatedAtUtc = Origin.AddMinutes(i),
                });
            }

            db.Context.SaveChanges();
        }

        db.Context.ChangeTracker.Clear();
        return db;
    }
}
