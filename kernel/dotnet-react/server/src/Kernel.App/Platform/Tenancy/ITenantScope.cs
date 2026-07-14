namespace Kernel.App.Platform.Tenancy;

/// <summary>
/// Ambient tenant scope (TEN-2). <see cref="Current"/> throws when scope is unset: an unset scope is an
/// error, never "no filter". Every entry point opens scope with <see cref="Begin"/> before any data access.
/// </summary>
public interface ITenantScope
{
    Guid Current { get; }

    bool IsEstablished { get; }

    IDisposable Begin(Guid tenantId);
}
