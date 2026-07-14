using Kernel.App.Platform.Tenancy;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Kernel.Tests.Integration;

/// <summary>
/// TEN-3 and TEN-4 on the real engine. The composite (TenantId, Id) key lets the same note id exist under two
/// tenants (a single-column key could not), and the save guard refuses a cross-tenant write against SQL Server.
/// </summary>
[Collection("sqlserver")]
public sealed class TenantPersistenceTests(SqlServerFixture fixture)
{
    [Fact]
    public async Task The_same_note_id_coexists_under_two_tenants()
    {
        var id = Guid.NewGuid();
        var tenantA = Guid.NewGuid();
        var tenantB = Guid.NewGuid();

        await fixture.AddNoteAsync(tenantA, id, "tenant A note", DateTimeOffset.UtcNow);
        await fixture.AddNoteAsync(tenantB, id, "tenant B note", DateTimeOffset.UtcNow);

        var scope = new AmbientTenantScope();
        await using var db = fixture.NewContext(scope);

        var a = await db.Notes.SingleAsync(n => n.TenantId == tenantA && n.Id == id);
        var b = await db.Notes.SingleAsync(n => n.TenantId == tenantB && n.Id == id);

        Assert.Equal("tenant A note", a.Title);
        Assert.Equal("tenant B note", b.Title);
    }

    [Fact]
    public async Task A_cross_tenant_modify_throws_on_the_real_engine()
    {
        var id = Guid.NewGuid();
        await fixture.AddNoteAsync(Guid.NewGuid(), id, "owned by A", DateTimeOffset.UtcNow);

        var scope = new AmbientTenantScope();
        await using var db = fixture.NewContext(scope);

        using (scope.Begin(Guid.NewGuid()))
        {
            var note = await db.Notes.SingleAsync(n => n.Id == id);
            note.Body = "hacked";
            await Assert.ThrowsAsync<InvalidOperationException>(() => db.SaveChangesAsync());
        }
    }
}
