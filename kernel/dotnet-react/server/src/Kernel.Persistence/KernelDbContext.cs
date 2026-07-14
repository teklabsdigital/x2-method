using Kernel.App.Notes;
using Kernel.App.Platform.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Kernel.Persistence;

/// <summary>
/// The single save pipeline (TEN-4). Both SaveChanges overrides funnel through <see cref="GuardTenancy"/>,
/// which stamps the tenant onto new rows and refuses any write touching another tenant's row. Reading
/// <c>tenantScope.Current</c> throws when scope is unset, so a tenant-owned save with no scope fails closed.
/// This is the fail-closed behavior TEN-4 demands: a guard that runs only when context is set silently
/// skips its check on the unset path, which is exactly the regression this pipeline forbids.
/// </summary>
public sealed class KernelDbContext(DbContextOptions<KernelDbContext> options, ITenantScope tenantScope)
    : DbContext(options)
{
    public DbSet<Note> Notes => Set<Note>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(KernelDbContext).Assembly);

        // SQLite cannot ORDER BY or compare DateTimeOffset, which the keyset list (DATA-2) requires. Store it as
        // UtcTicks on SQLite so the SQLite-backed test tiers exercise the real query; production (SqlServer) keeps
        // native datetimeoffset. Our times are UTC (NoteService stamps GetUtcNow), so UtcTicks is lossless here.
        if (Database.ProviderName == "Microsoft.EntityFrameworkCore.Sqlite")
        {
            var toTicks = new ValueConverter<DateTimeOffset, long>(
                offset => offset.UtcTicks,
                ticks => new DateTimeOffset(ticks, TimeSpan.Zero));

            foreach (var property in modelBuilder.Model.GetEntityTypes()
                         .SelectMany(entity => entity.GetProperties())
                         .Where(property => (Nullable.GetUnderlyingType(property.ClrType) ?? property.ClrType) == typeof(DateTimeOffset)))
            {
                property.SetValueConverter(toTicks);
            }
        }
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        GuardTenancy();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        GuardTenancy();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void GuardTenancy()
    {
        foreach (var entry in ChangeTracker.Entries<ITenantOwned>())
        {
            if (entry.State is not (EntityState.Added or EntityState.Modified or EntityState.Deleted))
            {
                continue;
            }

            var current = tenantScope.Current; // throws when scope unset: fail-closed (TEN-4)

            if (entry.State == EntityState.Added && entry.Entity.TenantId == Guid.Empty)
            {
                entry.Entity.TenantId = current;
                continue;
            }

            if (entry.Entity.TenantId != current)
            {
                throw new InvalidOperationException(
                    $"Cross-tenant write blocked (TEN-4): {entry.Entity.GetType().Name} belongs to tenant {entry.Entity.TenantId} but the active scope is {current}.");
            }
        }
    }
}
