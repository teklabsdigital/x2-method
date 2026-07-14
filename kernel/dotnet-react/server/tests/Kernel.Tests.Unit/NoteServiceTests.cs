using Kernel.App.Notes;
using Kernel.Contracts.Notes;
using Xunit;

namespace Kernel.Tests.Unit;

/// <summary>DATA-2 bounds and the keyset cursor round-trip, with time from a controllable TimeProvider.</summary>
public sealed class NoteServiceTests
{
    [Fact]
    public async Task Create_stamps_the_clock_time_and_returns_the_note()
    {
        var clock = new TestClock(new DateTimeOffset(2026, 7, 10, 12, 0, 0, TimeSpan.Zero));
        var store = new FakeNoteStore();
        var service = new NoteService(store, clock);

        var response = await service.CreateAsync(new CreateNoteRequest("Title", "Body"));

        Assert.Equal("Title", response.Title);
        Assert.Equal("Body", response.Body);
        Assert.Equal(clock.Now, response.CreatedAtUtc);
        Assert.Single(store.Notes);
    }

    [Theory]
    [InlineData(null, 20)]
    [InlineData(1000, 100)]
    [InlineData(0, 1)]
    [InlineData(50, 50)]
    public async Task List_clamps_the_page_size(int? requested, int expected)
    {
        var store = new FakeNoteStore();
        var service = new NoteService(store, new TestClock(DateTimeOffset.UtcNow));

        await service.ListAsync(cursor: null, limit: requested);

        Assert.Equal(expected, store.LastLimit);
    }

    [Fact]
    public async Task List_pages_forward_by_keyset_cursor()
    {
        var clock = new TestClock(new DateTimeOffset(2026, 7, 10, 0, 0, 0, TimeSpan.Zero));
        var service = new NoteService(new FakeNoteStore(), clock);

        for (var i = 0; i < 3; i++)
        {
            clock.Now = clock.Now.AddMinutes(1);
            await service.CreateAsync(new CreateNoteRequest($"note-{i}", "body"));
        }

        var firstPage = await service.ListAsync(cursor: null, limit: 2);
        Assert.Equal(2, firstPage.Items.Count);
        Assert.NotNull(firstPage.NextCursor);

        var secondPage = await service.ListAsync(cursor: firstPage.NextCursor, limit: 2);
        Assert.Single(secondPage.Items);
        Assert.Null(secondPage.NextCursor);

        // Newest first, strictly older across the boundary.
        Assert.True(firstPage.Items[0].CreatedAtUtc > firstPage.Items[1].CreatedAtUtc);
        Assert.True(secondPage.Items[0].CreatedAtUtc < firstPage.Items[1].CreatedAtUtc);
    }
}
