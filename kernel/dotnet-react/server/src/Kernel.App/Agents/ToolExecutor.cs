using System.Collections;
using Kernel.App.Platform.Naming;
using Kernel.App.Platform.Tenancy;

namespace Kernel.App.Agents;

/// <summary>
/// AI-1 chokepoint: the single seam every AI tool call passes through. The model is an untrusted parameter
/// source, so identity, tenant, and scope are injected by the server from the authenticated context, and any
/// actor-supplied value for those keys is rejected before the merge (case-insensitive), recursively through the
/// nested dictionaries and lists the executor receives. A raw JSON subtree (a <c>JsonElement</c> value) is not
/// walked; keep deserializing actor arguments into dictionaries/lists, or move to a per-tool allowlist, before
/// wiring a real JSON pipeline (see the edition README, Known limitations). If tenant scope is unset the call
/// throws: a tool never runs unscoped. Injection reads the same fail-closed source as everything else (TEN-2),
/// so a prompt-injected identity has nothing to escalate into.
/// </summary>
public sealed class ToolExecutor(ITenantScope tenantScope)
{
    // The server owns these; an actor never supplies them. The tenant half is TenantNames, shared with the URL and
    // EF-model guards, because a tool schema mirroring a tenant's vocabulary is the realistic confused-deputy
    // vector and three lists that each meant "tenant" disagreed about which spellings counted (E-53). The rest are
    // the common OIDC / Azure AD claim names and the delegation keys.
    //
    // Match mode is the judgement call. The identity entries are runs, so `userId`, `user_id` and `actorId` are all
    // one entry: a name that CONTAINS an identity word is identity, and rejecting a legitimate argument here costs
    // a tool a parameter, where accepting a smuggled one costs the tenant. The claim vocabulary is `Whole`, because
    // `scope`, `role`, `act` and `sub` are ordinary English inside longer words: as runs they would strip
    // `scopeOfWork`, `roleplayPrompt` and `subtotal` from every tool schema in the system, and a chokepoint that
    // silently eats ordinary arguments gets routed around, which is the failure that matters most here.
    private static readonly IReadOnlyList<NameRule> ServerOwnedKeys =
        [
            .. TenantNames.Rules,
            NameRule.Rule("userId"), NameRule.Rule("actorId"), NameRule.Rule("principalId"),
            NameRule.Whole("user"), NameRule.Whole("actor"), NameRule.Whole("principal"),
            NameRule.Whole("sub"), NameRule.Whole("oid"), NameRule.Whole("tid"),
            NameRule.Whole("scope"), NameRule.Whole("scopes"), NameRule.Whole("role"), NameRule.Whole("roles"),
            NameRule.Whole("group"), NameRule.Whole("groups"), NameRule.Whole("permission"), NameRule.Whole("permissions"),
            NameRule.Whole("act"), NameRule.Whole("on_behalf_of"), NameRule.Whole("impersonate"),
        ];

    /// <summary>Exposed so the extent of what this rejects can be asserted against an independently written floor
    /// rather than against itself, which is the only way a registry's shrinking is visible (AI-1, E-53).</summary>
    public static bool IsServerOwned(string key) => NameComparison.Matches(ServerOwnedKeys, key);

    public Task<object?> InvokeAsync(ITool tool, IReadOnlyDictionary<string, object?> actorArguments, CancellationToken cancellationToken = default)
    {
        var tenantId = tenantScope.Current; // throws when scope unset: a tool never proceeds unscoped (AI-1)

        var arguments = Sanitize(actorArguments);
        arguments["tenantId"] = tenantId; // unconditional server injection at the top level

        return tool.InvokeAsync(arguments, cancellationToken);
    }

    // Strip server-owned keys from a map and every nested map, so an identity key smuggled inside an object or a
    // list of objects is rejected too, not just a top-level one.
    private static Dictionary<string, object?> Sanitize(IEnumerable<KeyValuePair<string, object?>> map)
    {
        var result = new Dictionary<string, object?>(StringComparer.Ordinal);
        foreach (var (key, value) in map)
        {
            if (IsServerOwned(key))
            {
                continue; // reject actor-supplied identity/tenant/scope before any merge, at any depth
            }

            result[key] = SanitizeValue(value);
        }

        return result;
    }

    private static object? SanitizeValue(object? value) => value switch
    {
        IReadOnlyDictionary<string, object?> nested => Sanitize(nested),
        IDictionary<string, object?> nested => Sanitize(nested),
        string => value, // a string is a leaf, never a nested map
        IEnumerable list => list.Cast<object?>().Select(SanitizeValue).ToList(),
        _ => value,
    };
}
