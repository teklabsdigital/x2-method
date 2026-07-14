using Kernel.App.Notes;
using Kernel.App.Platform.Tenancy;
using Kernel.Persistence.Notes;
using Xunit;

namespace Kernel.Tests.Integration;

/// <summary>
/// DATA-2 keyset paging on the real engine: newest first, a strict boundary across the cursor, and the page-size
/// bound honored. Proven on SQL Server (native datetimeoffset ordering), the production provider.
/// </summary>
[Collection("sqlserver")]
public sealed class KeysetPagingTests(SqlServerFixture fixture)
{
    [Fact]
    public async Task Pages_are_newest_first_with_a_strict_boundary()
    {
        var tenant = Guid.NewGuid();
        var start = new DateTimeOffset(2026, 7, 10, 0, 0, 0, TimeSpan.Zero);
        for (var minute = 0; minute < 5; minute++)
        {
            await fixture.AddNoteAsync(tenant, Guid.NewGuid(), $"note-{minute}", start.AddMinutes(minute));
        }

        var scope = new AmbientTenantScope();
        await using var db = fixture.NewContext(scope);
        var store = new EfNoteStore(db, scope);

        using (scope.Begin(tenant))
        {
            var firstPage = await store.ListAsync(before: null, limit: 2);
            Assert.Equal(2, firstPage.Count);
            Assert.Equal(start.AddMinutes(4), firstPage[0].CreatedAtUtc);
            Assert.True(firstPage[0].CreatedAtUtc > firstPage[1].CreatedAtUtc);

            var secondPage = await store.ListAsync(before: new NoteCursor(firstPage[1].CreatedAtUtc, firstPage[1].Id), limit: 2);
            Assert.Equal(2, secondPage.Count);
            Assert.True(secondPage[0].CreatedAtUtc < firstPage[1].CreatedAtUtc);
        }
    }

    [Fact]
    public async Task Identical_timestamps_neither_crash_nor_drop_rows_across_pages()
    {
        var tenant = Guid.NewGuid();
        var sameInstant = new DateTimeOffset(2026, 7, 10, 9, 0, 0, TimeSpan.Zero);

        // Five notes for one tenant at the exact same instant: the old unique (TenantId, CreatedAtUtc) index made
        // the second insert throw; the (CreatedAtUtc, Id) cursor must page all five without loss or duplication.
        var ids = new List<Guid>();
        for (var i = 0; i < 5; i++)
        {
            var id = Guid.NewGuid();
            ids.Add(id);
            await fixture.AddNoteAsync(tenant, id, $"same-instant-{i}", sameInstant);
        }

        var scope = new AmbientTenantScope();
        await using var db = fixture.NewContext(scope);
        var store = new EfNoteStore(db, scope);

        using (scope.Begin(tenant))
        {
            var seen = new List<Guid>();
            NoteCursor? cursor = null;
            do
            {
                var page = await store.ListAsync(cursor, limit: 2);
                seen.AddRange(page.Select(n => n.Id));
                cursor = page.Count == 2 ? new NoteCursor(page[^1].CreatedAtUtc, page[^1].Id) : null;
            }
            while (cursor is not null);

            Assert.Equal(5, seen.Count);
            Assert.Equal(ids.OrderBy(id => id), seen.OrderBy(id => id));
        }
    }
}
