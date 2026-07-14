using System.Collections.Concurrent;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace Kernel.Api.Platform;

/// <summary>
/// Turns a "perm:{suffix}" policy name into RequireAuthenticatedUser + RequireClaim("perm", suffix). Everything
/// else, including the deny-by-default fallback policy, delegates to the framework provider. SEC-1: every
/// endpoint names a perm policy; a bare RequireAuthorization is caught at build time by EndpointSpineTests.
/// The DB-backed permission handler is the identity-slice upgrade; v1 reads perms straight off the token.
///
/// A given policy name always yields the same immutable policy, so built policies are cached and
/// <see cref="AllowsCachingPolicies"/> lets the authorization middleware cache the combined per-endpoint policy
/// instead of rebuilding it on every request.
/// </summary>
public sealed class PermissionPolicyProvider(IOptions<AuthorizationOptions> options) : IAuthorizationPolicyProvider
{
    public const string Prefix = "perm:";

    private static readonly ConcurrentDictionary<string, AuthorizationPolicy> PermissionPolicies = new(StringComparer.Ordinal);

    private readonly DefaultAuthorizationPolicyProvider _fallback = new(options);

    public bool AllowsCachingPolicies => true;

    public Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        if (policyName.StartsWith(Prefix, StringComparison.Ordinal))
        {
            var policy = PermissionPolicies.GetOrAdd(policyName, static name => new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .RequireClaim("perm", name[Prefix.Length..])
                .Build());
            return Task.FromResult<AuthorizationPolicy?>(policy);
        }

        return _fallback.GetPolicyAsync(policyName);
    }

    public Task<AuthorizationPolicy> GetDefaultPolicyAsync() => _fallback.GetDefaultPolicyAsync();

    public Task<AuthorizationPolicy?> GetFallbackPolicyAsync() => _fallback.GetFallbackPolicyAsync();
}
