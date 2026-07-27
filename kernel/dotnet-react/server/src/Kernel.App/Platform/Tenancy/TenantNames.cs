using Kernel.App.Platform.Naming;

namespace Kernel.App.Platform.Tenancy;

/// <summary>
/// What this kernel calls a tenant, in one place, for every guard that has an opinion about it: TEN-1's URL and
/// header scan, TEN-3's model-column scan, and AI-1's tool-argument chokepoint.
///
/// It is one list because it was four, and they disagreed. TEN-3 carried
/// `["tenantid", "orgid", "organizationid", "organisationid"]` compared by equality, which `tenant_id` and
/// `WorkspaceId` walked straight past (E-51); AI-1 carried a twenty-one entry set, also by equality, which
/// `workspaceId` and `accountId` walked past while its own comment claimed parity with the other two (E-53). Every
/// one of those was a list somebody wrote out by hand, and each was correct about a different set of spellings.
///
/// `workspace` and `account` are here because the node-react edition's round 4 audit put them in: both are the
/// ordinary product word for a tenant, and a guard that knows only the word `tenant` misses the systems that use
/// another one. `org` stays a three-character entry, which <see cref="NameComparison"/> will only glue to a
/// declared affix, so `orgId` matches and `origin` does not.
/// </summary>
public static class TenantNames
{
    public static IReadOnlyList<NameRule> Rules { get; } =
        [
            NameRule.Rule("tenant"), NameRule.Rule("org"), NameRule.Rule("organization"),
            NameRule.Rule("organisation"), NameRule.Rule("workspace"), NameRule.Rule("account"),
        ];

    /// <summary>Whether a name means "tenant" in any spelling this kernel recognises.</summary>
    public static bool IsTenantShaped(string name) => NameComparison.Matches(Rules, name);
}
