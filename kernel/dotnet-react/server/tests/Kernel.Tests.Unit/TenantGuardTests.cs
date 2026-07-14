using Kernel.App.Notes;
using Xunit;

namespace Kernel.Tests.Unit;

/// <summary>
/// TEN-4 save pipeline. Stamp on create, throw on a foreign-tenant modify, throw on a foreign-tenant delete, and
/// critically throw when the scope is unset. The unset case is the fail-closed test: a guard that runs only when
/// tenant context is set would silently skip its check when context is null; here an unset scope fails closed.
/// </summary>
public sealed class TenantGuardTests
{
    private static Note NewNote() =>
        new() { Id = Guid.NewGuid(), Title = "title", Body = "body", CreatedAtUtc = DateTimeOffset.UtcNow };

    [Fact]
    public void Save_stamps_the_current_tenant_on_new_rows()
    {
        using var db = new TenantDb();
        var tenant = Guid.NewGuid();

        using (db.Scope.Begin(tenant))
        {
            var note = NewNote();
            db.Context.Notes.Add(note);
            db.Context.SaveChanges();
            Assert.Equal(tenant, note.TenantId);
        }
    }

    [Fact]
    public void Save_without_a_scope_throws_for_tenant_owned_rows()
    {
        using var db = new TenantDb();
        db.Context.Notes.Add(NewNote());
        Assert.Throws<InvalidOperationException>(() => db.Context.SaveChanges());
    }

    [Fact]
    public void Modifying_another_tenants_row_throws()
    {
        using var db = new TenantDb();
        SeedOneNoteUnder(db, Guid.NewGuid());

        using (db.Scope.Begin(Guid.NewGuid()))
        {
            var note = db.Context.Notes.Single();
            note.Body = "hacked";
            Assert.Throws<InvalidOperationException>(() => db.Context.SaveChanges());
        }
    }

    [Fact]
    public void Deleting_another_tenants_row_throws()
    {
        using var db = new TenantDb();
        SeedOneNoteUnder(db, Guid.NewGuid());

        using (db.Scope.Begin(Guid.NewGuid()))
        {
            db.Context.Notes.Remove(db.Context.Notes.Single());
            Assert.Throws<InvalidOperationException>(() => db.Context.SaveChanges());
        }
    }

    private static void SeedOneNoteUnder(TenantDb db, Guid tenant)
    {
        using (db.Scope.Begin(tenant))
        {
            db.Context.Notes.Add(NewNote());
            db.Context.SaveChanges();
        }

        db.Context.ChangeTracker.Clear();
    }
}
