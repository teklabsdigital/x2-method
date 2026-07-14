using System.Collections;
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
    // The server owns these; an actor never supplies them. Matched case-insensitively at every depth. The list
    // includes the common OIDC / Azure AD claim names (tid, oid, groups, scope(s)) and delegation keys, plus the
    // tenant synonyms (org*) the URL and EF-model guards also reject, because a tool schema mirroring an IdP's or a
    // tenant's claim vocabulary is the realistic confused-deputy vector.
    private static readonly HashSet<string> ServerOwnedKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "tenantId", "tenant_id", "tenant", "tid", "orgId", "org_id", "org", "orgid",
        "organizationId", "organisationId", "userId", "user_id", "sub", "oid",
        "scope", "scopes", "role", "roles", "groups", "permissions", "act", "on_behalf_of",
    };

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
            if (ServerOwnedKeys.Contains(key))
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
