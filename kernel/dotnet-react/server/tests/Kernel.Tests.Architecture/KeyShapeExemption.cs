namespace Kernel.Tests.Architecture;

/// <summary>
/// TEN-3's sanctioned exception: "a sanctioned exception carries a named justification and its own guard at the
/// key assertion".
///
/// It exists because there was nowhere to put one (E-44). The claim also rules where it does NOT go: "a key-shape
/// exemption is not a cross-tenant access path, so it does not belong in the TEN-5 access-ledger schema and has no
/// meaningful sole-reader test; the two exception kinds are recorded in different places". So this is a second
/// register, not a row in the first, and the claim says so before anyone has to discover it.
///
/// The shipped list is empty, and an empty list is exactly how a mechanism becomes vacuous. So the rules below are
/// a pure function of their inputs and are proven against fixtures in TenantKeyTests rather than against the
/// shipped model, which holds no exemption to prove anything with. The model check and the mechanism check are
/// separate assertions for that reason.
///
/// The shape follows `AnonymousCarveOut` in EndpointSpineTests, which is the register this kernel already trusts
/// for the same job on another claim: a justification per entry, and a stale entry fails. That last rule is the
/// one that matters. A register where a no-longer-needed entry can sit forever is how "sanctioned" decays into
/// "whatever accumulated".
/// </summary>
internal static class KeyShapeExemption
{
    /// <summary>
    /// What this edition sanctions. Empty: no entity here needs a key that does not lead with the tenant.
    /// </summary>
    public static IReadOnlyList<Exemption> Sanctioned { get; } = [];

    /// <summary>
    /// A justification shorter than this is a label, not a reason. The floor is crude and does not make a bad
    /// justification good; what it prevents is the one-word entry (`legacy`, `perf`, `migration`) that carries no
    /// information a reviewer could disagree with, which is the form an unargued exemption actually takes.
    /// </summary>
    private const int MinimumJustification = 40;

    /// <summary>
    /// Everything wrong with an exemption set, given what the model actually contains. Empty means the register is
    /// honest: every entry names a real entity, argues for itself, and is still needed.
    /// </summary>
    public static IReadOnlyList<string> Problems(
        IReadOnlyList<Exemption> exemptions,
        IReadOnlyCollection<string> entitiesInModel,
        IReadOnlyCollection<string> entitiesLeadingKeyWithTenant)
    {
        var problems = new List<string>();
        var seen = new HashSet<string>(StringComparer.Ordinal);

        foreach (var exemption in exemptions)
        {
            var entity = exemption.Entity;

            if (!seen.Add(entity))
            {
                problems.Add($"'{entity}' is exempted twice (TEN-3).");
            }

            if (!entitiesInModel.Contains(entity))
            {
                problems.Add($"'{entity}' is exempted from TEN-3's key rule but is not an entity in the model. A stale exemption is an exemption nobody is checking.");
                continue;
            }

            if (string.IsNullOrWhiteSpace(exemption.Justification) || exemption.Justification.Trim().Length < MinimumJustification)
            {
                problems.Add($"'{entity}' is exempted from TEN-3's key rule with no justification of substance. Say why the tenant cannot lead this key.");
            }

            if (entitiesLeadingKeyWithTenant.Contains(entity))
            {
                problems.Add($"'{entity}' is exempted from TEN-3's key rule and does not need to be: its key already leads with the tenant. Remove the exemption.");
            }
        }

        return problems;
    }

    internal readonly record struct Exemption(string Entity, string Justification);
}
