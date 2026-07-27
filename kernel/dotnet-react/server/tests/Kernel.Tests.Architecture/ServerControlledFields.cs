namespace Kernel.Tests.Architecture;

/// <summary>
/// One registry of server-controlled field names, shared by both SEC-2 guards (the request-contract scan in
/// ContractShapeTests and the route-table body-DTO scan in EndpointSpineTests) so the two nets cannot drift apart.
///
/// The registry is now two shapes of the same list, and the reason is E-9. <see cref="Rules"/> is the list the
/// comparison reads: base words, with the compounds and plurals DERIVED rather than enumerated, which is what
/// SEC-2's comparison obligation asks for. <see cref="Names"/> is the flat enumeration it replaced.
///
/// `Names` is no longer read by any guard. Both now compare through <see cref="NameComparison"/>: the second one
/// did match by equality, and this comment used to say so and to record that repairing it belonged to a claim
/// that had not had its delta pass. That premise was measured on 2026-07-27 and was false (S-12). `Names` is kept
/// as a CONTROL, not as a net: NameComparisonTests asserts that every spelling the flat list used to enumerate is
/// still matched by the rules, so the shorter list is a measured claim rather than a tidy-up, and a narrowing of
/// the comparison goes red there rather than passing unnoticed.
/// </summary>
internal static class ServerControlledFields
{
    public static readonly NameRule[] Rules =
    [
        NameRule.Whole("id"),
        NameRule.Rule("tenantId"),
        NameRule.Rule("createdAt"),
        NameRule.Rule("updatedAt"),
        NameRule.Rule("createdBy"),
        NameRule.Rule("updatedBy"),
        NameRule.Rule("status"),
        NameRule.Rule("state"),
        NameRule.Rule("rowVersion"),
        NameRule.Rule("concurrencyToken"),
        NameRule.Rule("version"),
        NameRule.Rule("role"),
        NameRule.Rule("permission"),
        NameRule.Rule("isAdmin"),
    ];

    // The spellings the rules above derive: `CreatedAtUtc` from `createdAt`, `Roles` from `role`, `Permissions`
    // from `permission`. They stay here because the flat guard compares by equality and would lose them, and each
    // one is asserted to still match through the comparison.
    public static readonly string[] Names =
    [
        "Id", "TenantId", "CreatedAt", "CreatedAtUtc", "UpdatedAt", "UpdatedAtUtc",
        "CreatedBy", "UpdatedBy", "Status", "State", "RowVersion", "ConcurrencyToken",
        "Version", "Role", "Roles", "Permissions", "IsAdmin",
    ];

    public static bool Matches(string name) => NameComparison.Matches(Rules, name);
}
