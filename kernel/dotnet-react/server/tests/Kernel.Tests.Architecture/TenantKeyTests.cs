using Kernel.App.Platform.Tenancy;
using Kernel.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Xunit;

namespace Kernel.Tests.Architecture;

/// <summary>
/// TEN-3. Built from the EF model (no connection needed): every tenant-owned entity leads its primary key with
/// TenantId, and every entity carrying a TenantId property is marked ITenantOwned (no unmarked tenant data).
/// </summary>
public sealed class TenantKeyTests
{
    [Fact]
    public void Every_tenant_owned_entity_leads_its_key_with_TenantId()
    {
        foreach (var entity in Model().GetEntityTypes().Where(e => typeof(ITenantOwned).IsAssignableFrom(e.ClrType)))
        {
            var key = entity.FindPrimaryKey();
            Assert.NotNull(key);
            Assert.Equal("TenantId", key!.Properties[0].Name);
        }
    }

    // Tenant-shaped column names; an entity carrying one of these must be tenant-owned, not just one named TenantId.
    private static readonly string[] TenantColumnNames = ["tenantid", "orgid", "organizationid", "organisationid"];

    [Fact]
    public void Every_entity_with_a_tenant_column_is_marked_tenant_owned()
    {
        foreach (var entity in Model().GetEntityTypes())
        {
            var tenantColumn = entity.GetProperties().FirstOrDefault(p => TenantColumnNames.Contains(p.Name.ToLowerInvariant()));
            if (tenantColumn is null)
            {
                continue;
            }

            Assert.True(typeof(ITenantOwned).IsAssignableFrom(entity.ClrType),
                $"Entity '{entity.ClrType.Name}' has a tenant-shaped column '{tenantColumn.Name}' but does not implement ITenantOwned (TEN-3).");
        }
    }

    private static IModel Model()
    {
        var options = new DbContextOptionsBuilder<KernelDbContext>().UseSqlite("Data Source=:memory:").Options;
        using var db = new KernelDbContext(options, new StubScope());
        return db.Model;
    }

    private sealed class StubScope : ITenantScope
    {
        // Building the model never reads the scope; fail closed so a future test that does read it surfaces the
        // mistake instead of silently getting an empty tenant.
        public Guid Current => throw new NotSupportedException();

        public bool IsEstablished => false;

        public IDisposable Begin(Guid tenantId) => throw new NotSupportedException();
    }
}
