namespace Kernel.Tests.Architecture;

/// <summary>
/// One registry of server-controlled field names, shared by both SEC-2 guards (the request-contract scan in
/// ContractShapeTests and the route-table body-DTO scan in EndpointSpineTests) so the two nets cannot drift apart.
/// </summary>
internal static class ServerControlledFields
{
    public static readonly string[] Names =
    [
        "Id", "TenantId", "CreatedAt", "CreatedAtUtc", "UpdatedAt", "UpdatedAtUtc",
        "CreatedBy", "UpdatedBy", "Status", "State", "RowVersion", "ConcurrencyToken",
        "Version", "Role", "Roles", "Permissions", "IsAdmin",
    ];
}
