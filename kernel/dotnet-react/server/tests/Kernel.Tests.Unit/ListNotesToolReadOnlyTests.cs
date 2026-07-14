using Kernel.App.Agents;
using Kernel.App.Notes;
using Kernel.Contracts.Notes;
using Kernel.Persistence.Notes;
using Xunit;

namespace Kernel.Tests.Unit;

/// <summary>
/// AI-2. The read-only tool declares itself read-only and its execution path is proven to perform no writes: no
/// tracked changes and an unchanged row count after invocation through the chokepoint.
/// </summary>
public sealed class ListNotesToolReadOnlyTests
{
    [Fact]
    public async Task Read_only_tool_reads_but_never_writes()
    {
        using var db = new TenantDb();
        var tenant = Guid.NewGuid();

        using (db.Scope.Begin(tenant))
        {
            db.Context.Notes.Add(new Note { Id = Guid.NewGuid(), Title = "seed", Body = "b", CreatedAtUtc = DateTimeOffset.UtcNow });
            db.Context.SaveChanges();
        }

        db.Context.ChangeTracker.Clear();
        var rowsBefore = db.Context.Notes.Count();

        var tool = new ListNotesTool(new NoteService(new EfNoteStore(db.Context, db.Scope), new TestClock(DateTimeOffset.UtcNow)));
        Assert.True(tool.IsReadOnly);

        using (db.Scope.Begin(tenant))
        {
            var result = await new ToolExecutor(db.Scope).InvokeAsync(tool, new Dictionary<string, object?>());
            Assert.Single(Assert.IsType<NoteListResponse>(result).Items);
        }

        Assert.Empty(db.Context.ChangeTracker.Entries());
        Assert.Equal(rowsBefore, db.Context.Notes.Count());
    }
}
