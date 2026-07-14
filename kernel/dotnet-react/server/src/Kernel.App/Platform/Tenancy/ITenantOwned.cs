namespace Kernel.App.Platform.Tenancy;

/// <summary>Marker for rows owned by a tenant. TEN-3 keys them tenant-first; TEN-4 guards their writes.</summary>
public interface ITenantOwned
{
    Guid TenantId { get; set; }
}
