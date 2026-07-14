using Kernel.App.Platform.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Kernel.Persistence;

/// <summary>
/// Design-time factory so `dotnet ef migrations add` can build the model against SqlServer. The connection
/// string is a dummy; `migrations add` never connects. The stub scope is never used for saves at design time.
/// </summary>
public sealed class KernelDbContextFactory : IDesignTimeDbContextFactory<KernelDbContext>
{
    public KernelDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<KernelDbContext>()
            .UseSqlServer("Server=design-time;Database=Kernel;Trusted_Connection=True;TrustServerCertificate=True")
            .Options;

        return new KernelDbContext(options, new DesignTimeTenantScope());
    }

    private sealed class DesignTimeTenantScope : ITenantScope
    {
        // Fail closed, matching the real scope: design-time only builds the model, never saves, so a read here is a
        // bug. Returning Guid.Empty would be a fail-open sentinel that stamps rows with an empty tenant (TEN-2/TEN-4).
        public Guid Current => throw new NotSupportedException("Tenant scope is not available at design time.");

        public bool IsEstablished => false;

        public IDisposable Begin(Guid tenantId) => throw new NotSupportedException();
    }
}
