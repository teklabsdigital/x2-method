namespace Kernel.App.Platform.Tenancy;

/// <summary>
/// AsyncLocal ambient scope (TEN-2). Registered as a singleton; the AsyncLocal isolates the value per
/// execution flow (per request, per job) while sharing one accessor. Fail-closed: reading <see cref="Current"/>
/// with no scope established throws before any I/O, rather than defaulting to an unfiltered read.
/// </summary>
public sealed class AmbientTenantScope : ITenantScope
{
    private static readonly AsyncLocal<Guid?> Ambient = new();

    public bool IsEstablished => Ambient.Value.HasValue;

    public Guid Current => Ambient.Value ?? throw new InvalidOperationException(
        "Tenant scope is not established (TEN-2). Open scope with Begin(tenantId) at the entry point before any tenant-owned data access.");

    public IDisposable Begin(Guid tenantId)
    {
        if (tenantId == Guid.Empty)
        {
            throw new ArgumentException("Tenant id must not be empty (TEN-2).", nameof(tenantId));
        }

        var previous = Ambient.Value;
        Ambient.Value = tenantId;
        return new Restore(previous);
    }

    private sealed class Restore(Guid? previous) : IDisposable
    {
        public void Dispose() => Ambient.Value = previous;
    }
}
