using Kernel.App.Platform.Naming;
using Kernel.App.Platform.Tenancy;

namespace Kernel.Tests.Architecture;

/// <summary>
/// TEN-3's "an entity carrying a TenantId property", as a pure function of a property name, so it takes fixtures
/// directly rather than needing an EF model built around it.
///
/// It exists because TEN-3 was carrying a fourth tenant registry (E-51). The shipped list was
/// `["tenantid", "orgid", "organizationid", "organisationid"]` compared with
/// `list.Contains(name.ToLowerInvariant())`, which is precisely the comparison E-9 was recorded for and
/// `NameComparison` was built to replace: equality, so an entry matches one spelling and nothing else. Measured
/// on 2026-07-27, six of thirteen tenant-shaped spellings escaped it, `tenant_id` and `TenantIdentifier` and
/// `TenantKey` among them, and so did `WorkspaceId`, `workspaceslug` and `AccountId`, which the node-react round
/// 4 audit had already added to the canonical registry for exactly this reason.
///
/// So this is not a wider list. It is the same registry TEN-1's guards read, through the same comparison, and
/// TEN-3 stops having an opinion of its own about what a tenant is. The extent is asserted in TenantKeyTests
/// against an independently written floor, not against this registry, because a list read out of the thing under
/// test shrinks when the thing under test shrinks.
///
/// The registry itself is `TenantNames` in the application assembly, which is where it went when AI-1's runtime
/// chokepoint turned out to need it too (E-53). This wrapper survives only to name the question TEN-3 asks.
/// </summary>
internal static class TenantColumn
{
    public static bool IsTenantShaped(string propertyName) => TenantNames.IsTenantShaped(propertyName);
}
