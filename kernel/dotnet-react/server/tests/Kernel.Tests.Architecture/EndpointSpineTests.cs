using System.Reflection;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Metadata;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Xunit;

namespace Kernel.Tests.Architecture;

/// <summary>
/// SEC-1, TEN-1, SEC-3. Scans the composed route table: every endpoint is either allowlisted-anonymous or names a
/// perm policy; no route or query parameter carries a tenant or PII name (including [AsParameters] wrapper
/// properties, collection-typed params, and DateTime/TimeOnly, which naive scans miss); no body DTO carries a
/// server-controlled field (SEC-2, even an internal, non-*Request, or immutable constructor-bound type); and the
/// deny-by-default fallback policy actually rejects anonymous callers. This is the single un-filterable home for
/// the host-wide spine (X-8 rule 3).
///
/// Residual limitation: a handler that takes HttpContext and reads Request.Query[...] at runtime is invisible to
/// any static route-table scan; ad-hoc query reads are a slice-level review item, called out here so it is not
/// mistaken for coverage.
/// </summary>
public sealed class EndpointSpineTests(KernelApiFactory factory) : IClassFixture<KernelApiFactory>
{
    /// <summary>
    /// SEC-1's anonymous carve-outs. E-8 is the record of what this was: `string[] AnonymousAllowlist = ["/health"]`,
    /// against a claim whose weakening notes rule that carve-outs "must be named in the scan itself with a
    /// justification comment" and whose statement requires the allowlist to be "reviewed as a security surface".
    /// The failure message told an author to "add it to the allowlist with a justification" that the data
    /// structure could not hold. Four defects in three lines, all closed here:
    ///
    /// - The key was a PATH, so allowlisting a health GET pre-authorized every future method on that URL,
    ///   including the anonymous POST that SEC-1's harm paragraph names as one of its three live failure shapes.
    ///   The key is now a method and a pattern.
    /// - There was nowhere to write the reason. `Why` is a field, and it is the reviewed surface.
    /// - A stale entry survived forever, so the list could only grow, and a list that only grows is not a surface
    ///   anyone reviews but a set of pre-authorized holes waiting for a URL to be re-registered under one. An
    ///   entry matching no endpoint now fails.
    /// - Matching was `Contains` with the default ordinal comparer, so it failed closed on a `/Health` spelling.
    ///   Route patterns are case-insensitive in ASP.NET routing, so the comparison is too.
    /// </summary>
    private sealed record AnonymousCarveOut(string Method, string Pattern, string Why);

    private static readonly AnonymousCarveOut[] AnonymousAllowlist =
    [
        new("GET", "/health",
            "Liveness and readiness. It is polled by the orchestrator before a credential exists, returns no "
            + "tenant-scoped or caller-specific data, and its response body is a fixed shape. Anonymous GET only: "
            + "no write method on this URL is covered by this entry."),
    ];

    // "workspace" and "account" were absent until the node-react round 4 audit measured the two registries
    // against each other. Matching here is whole-string equality, so every spelling a caller might use has to be
    // enumerated; the compounds are listed for the same reason "organisationid" already was.
    private static readonly string[] ForbiddenTenantParams =
        [
            "tenantid", "tenant", "orgid", "organizationid", "organisationid",
            "workspace", "workspaceid", "workspaceslug", "account", "accountid",
        ];

    private static readonly string[] ForbiddenPiiParams =
        ["email", "phone", "name", "firstname", "lastname", "ssn", "dob", "dateofbirth"];

    private IReadOnlyList<RouteEndpoint> RouteEndpoints() =>
        factory.Services.GetRequiredService<EndpointDataSource>().Endpoints.OfType<RouteEndpoint>().ToList();

    [Fact]
    public void Every_endpoint_is_permission_gated_or_allowlisted_anonymous()
    {
        var used = new HashSet<AnonymousCarveOut>();

        foreach (var endpoint in RouteEndpoints())
        {
            var pattern = "/" + (endpoint.RoutePattern.RawText ?? string.Empty).TrimStart('/');

            if (endpoint.Metadata.GetMetadata<IAllowAnonymous>() is not null)
            {
                // Every method the endpoint answers, each judged on its own. An endpoint that answers GET and
                // POST on one pattern needs two carve-outs, because they are two decisions.
                foreach (var method in HttpMethodsOf(endpoint))
                {
                    var carveOut = AnonymousAllowlist.FirstOrDefault(entry =>
                        string.Equals(entry.Method, method, StringComparison.OrdinalIgnoreCase)
                        && string.Equals(entry.Pattern, pattern, StringComparison.OrdinalIgnoreCase));

                    Assert.True(carveOut is not null,
                        $"Anonymous endpoint '{method} {pattern}' is not on the reviewed allowlist (SEC-1). Gate it, or add an AnonymousCarveOut naming the method, the pattern and why anonymity is safe for it.");
                    used.Add(carveOut!);
                }

                continue;
            }

            var policy = endpoint.Metadata.GetMetadata<IAuthorizeData>()?.Policy;
            Assert.True(policy?.StartsWith("perm:", StringComparison.Ordinal) == true && policy.Length > "perm:".Length,
                $"Endpoint '{pattern}' does not name a non-empty perm policy (SEC-1). Bare authentication is not enough; use RequireAuthorization(\"perm:...\").");
        }

        // A carve-out that matches nothing is a pre-authorized hole waiting for a URL to be registered under it.
        var stale = AnonymousAllowlist.Except(used).ToList();
        Assert.True(stale.Count == 0,
            $"Anonymous allowlist entries match no endpoint and must be removed (SEC-1): {string.Join(", ", stale.Select(entry => $"{entry.Method} {entry.Pattern}"))}.");

        // A carve-out with no reason is not a reviewed surface, whatever the list is called.
        foreach (var entry in AnonymousAllowlist)
        {
            Assert.True(entry.Why.Trim().Length >= 40,
                $"Anonymous carve-out '{entry.Method} {entry.Pattern}' carries no real justification (SEC-1).");
        }
    }

    /// <summary>
    /// The methods an endpoint actually answers, from the framework's own routing metadata. An endpoint with no
    /// method metadata answers ALL methods, and reporting that as `*` is the honest reading: it is the widest
    /// possible anonymous carve-out and should never match a specific entry.
    /// </summary>
    private static IEnumerable<string> HttpMethodsOf(RouteEndpoint endpoint)
    {
        var methods = endpoint.Metadata.GetMetadata<HttpMethodMetadata>()?.HttpMethods;
        return methods is null || methods.Count == 0 ? ["*"] : methods;
    }

    [Fact]
    public void No_endpoint_exposes_a_tenant_or_pii_parameter()
    {
        var forbidden = ForbiddenTenantParams.Concat(ForbiddenPiiParams).ToHashSet();

        foreach (var endpoint in RouteEndpoints())
        {
            foreach (var name in ParameterNames(endpoint))
            {
                Assert.False(forbidden.Contains(name.ToLowerInvariant()),
                    $"Endpoint '{endpoint.RoutePattern.RawText}' exposes parameter '{name}' (TEN-1/SEC-3: tenant comes from the token, PII never travels in a URL).");
            }
        }
    }

    /// <summary>
    /// TEN-1's fourth surface. Its statement is "Tenant identity never travels as a route, query, HEADER, or body
    /// parameter", and A-2 measured that nothing in this file examined a header: the route and query surfaces
    /// were scanned, the body surface was scanned by the SEC-2 test below, and the header surface was scanned by
    /// nothing in the catalog. The claim's statement has covered headers since it was written, so this is a row
    /// that was false against the claim's own text rather than a widening of it.
    ///
    /// Two things this deliberately does NOT do. It does not reimplement header binding: `IFromHeaderMetadata` is
    /// the framework's own view of what binds from a header, and E-2 is the record of what happens here when a
    /// scan reimplements the binder informally instead (`BindsFromUrl` is a closed positive enumeration that
    /// disagrees with the real binder in both directions). And it does not trust the C# parameter name, because
    /// `[FromHeader(Name = "X-Tenant-Id")] string scope` binds a forbidden header under an innocent identifier;
    /// the effective binding name is the attribute's when it sets one.
    /// </summary>
    [Fact]
    public void No_endpoint_binds_a_tenant_or_pii_header()
    {
        var forbidden = ForbiddenTenantParams.Concat(ForbiddenPiiParams).ToHashSet();

        foreach (var endpoint in RouteEndpoints())
        {
            foreach (var header in HeaderNames(endpoint))
            {
                Assert.False(forbidden.Contains(NormalizeHeaderName(header)),
                    $"Endpoint '{endpoint.RoutePattern.RawText}' binds header '{header}' (TEN-1/SEC-3: tenant comes from the token, and PII never travels in a header any more than in a URL).");
            }
        }
    }

    [Fact]
    public void No_endpoint_binds_a_body_type_carrying_server_controlled_fields()
    {
        var isService = factory.Services.GetRequiredService<IServiceProviderIsService>();

        foreach (var endpoint in RouteEndpoints())
        {
            var method = endpoint.Metadata.OfType<MethodInfo>().FirstOrDefault();
            if (method is null)
            {
                continue;
            }

            foreach (var parameter in method.GetParameters().Where(p => IsBodyDto(p.ParameterType, isService)))
            {
                foreach (var name in BindableMemberNames(parameter.ParameterType))
                {
                    Assert.False(ServerControlledFields.Names.Contains(name, StringComparer.OrdinalIgnoreCase),
                        $"Endpoint '{endpoint.RoutePattern.RawText}' binds body type '{parameter.ParameterType.Name}' carrying server-controlled field '{name}' (SEC-2). Body DTOs belong in Kernel.Contracts and carry no server-owned field.");
                }
            }
        }
    }

    /// <summary>
    /// SEC-1's mechanism class asks for "a host test asserting the fallback policy actually denies anonymous
    /// callers, not merely that it is registered". The previous version of this test read
    /// IOptions&lt;AuthorizationOptions&gt;.Value.FallbackPolicy and asserted a DenyAnonymousAuthorizationRequirement
    /// was present in its requirement list. That is reading the registration one level deeper, and an audit
    /// showed what it could not see: AuthorizationMiddleware takes the fallback from IAuthorizationPolicyProvider,
    /// not from the options object, so returning null from PermissionPolicyProvider.GetFallbackPolicyAsync left
    /// every metadata-free endpoint open to an anonymous caller with all 49 tests green.
    ///
    /// So this resolves the policy the way the middleware does, and EVALUATES it instead of inspecting it.
    /// </summary>
    [Fact]
    public async Task The_fallback_policy_denies_by_default()
    {
        var provider = factory.Services.GetRequiredService<IAuthorizationPolicyProvider>();
        var authorization = factory.Services.GetRequiredService<IAuthorizationService>();

        // Resolved from the provider, which is what the middleware consults. A null here is the whole hole.
        var fallback = await provider.GetFallbackPolicyAsync();
        Assert.NotNull(fallback);

        var anonymous = new ClaimsPrincipal(new ClaimsIdentity());
        Assert.False((await authorization.AuthorizeAsync(anonymous, resource: null, fallback!)).Succeeded);

        // And the case the previous assertion could never have expressed. A DenyAnonymousAuthorizationRequirement
        // is satisfied by any authenticated caller, so the old test passed against a fallback that admitted every
        // authenticated principal in the system with no permission and across tenants. Deny by default means the
        // credential does not help.
        var authenticated = new ClaimsPrincipal(new ClaimsIdentity(
            [
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                new Claim("tenant_id", Guid.NewGuid().ToString()),
                new Claim("sv", "1"),
                new Claim("perm", "notes.read"),
                new Claim("perm", "notes.write"),
            ],
            authenticationType: "Test"));
        Assert.True(authenticated.Identity!.IsAuthenticated);
        Assert.False((await authorization.AuthorizeAsync(authenticated, resource: null, fallback!)).Succeeded);
    }

    // Fixtures for the depth test below. Declared here rather than in Contracts because they are controls for the
    // scan, not contracts of the product, and MOD-2 places product contracts only in Kernel.Contracts.
    private sealed record DeepAuthor(string Nick, string CreatedBy);

    private sealed record DeepItem(string Title, DeepAuthor Author);

    private sealed record DeepRequest(string Title, DeepAuthor Author, IReadOnlyList<DeepItem> Items);

    private sealed record CyclicNode(string Name, CyclicNode? Next);

    /// <summary>
    /// The walk's DEPTH, asserted directly. The composed host binds only flat request records today, so the
    /// endpoint scan above cannot reach a nested violation and could go back to being flat without any test
    /// noticing; that is exactly how the flat walk survived while two shipped artifacts described it as
    /// recursive. E-10's point restated: red-green proof establishes that a guard binds and establishes nothing
    /// about how far it reaches, so the reach needs its own assertion.
    /// </summary>
    [Fact]
    public void Body_member_walk_reaches_every_depth_and_terminates_on_a_cycle()
    {
        var names = BindableMemberNames(typeof(DeepRequest)).ToList();

        Assert.Contains("Title", names);                       // depth 0
        Assert.Contains("CreatedBy", names);                   // depth 1, through a nested record property
        Assert.Contains("Nick", names);                        // depth 1
        Assert.Contains("Items", names);                       // depth 1
        // depth 2, through a collection element: the shape NoteListResponse already ships on the response side.
        Assert.Contains("Author", names);
        Assert.Single(names.Where(n => n == "CreatedBy").Take(1));

        // A server-controlled field at depth 2 is what the registry has to see for SEC-2's statement to hold.
        Assert.Contains(names, n => ServerControlledFields.Names.Contains(n, StringComparer.OrdinalIgnoreCase));

        // Self-reference terminates rather than stack-overflowing, which is why `seen` is a cycle set.
        Assert.Contains("Next", BindableMemberNames(typeof(CyclicNode)).ToList());
    }

    private static IEnumerable<string> ParameterNames(RouteEndpoint endpoint)
    {
        foreach (var parameter in endpoint.RoutePattern.Parameters)
        {
            yield return parameter.Name;
        }

        var method = endpoint.Metadata.OfType<MethodInfo>().FirstOrDefault();
        if (method is null)
        {
            yield break;
        }

        foreach (var parameter in method.GetParameters())
        {
            if (parameter.Name is null)
            {
                continue;
            }

            if (parameter.GetCustomAttribute<AsParametersAttribute>() is not null)
            {
                foreach (var property in parameter.ParameterType.GetProperties(BindingFlags.Public | BindingFlags.Instance))
                {
                    yield return property.Name; // every property of an [AsParameters] wrapper binds from route/query
                }
            }
            else if (BindsFromUrl(parameter.ParameterType))
            {
                yield return parameter.Name;
            }
        }
    }

    /// <summary>
    /// Every header name an endpoint declares a binding for, taken from the framework's own
    /// <see cref="IFromHeaderMetadata"/> rather than from a list of attribute types this test invented, and
    /// including the properties of an [AsParameters] wrapper, which bind exactly as top-level parameters do.
    /// </summary>
    private static IEnumerable<string> HeaderNames(RouteEndpoint endpoint)
    {
        var method = endpoint.Metadata.OfType<MethodInfo>().FirstOrDefault();
        if (method is null)
        {
            yield break;
        }

        foreach (var parameter in method.GetParameters())
        {
            foreach (var name in DeclaredHeaders(parameter, parameter.Name))
            {
                yield return name;
            }

            if (parameter.GetCustomAttribute<AsParametersAttribute>() is null)
            {
                continue;
            }

            foreach (var property in parameter.ParameterType.GetProperties(BindingFlags.Public | BindingFlags.Instance))
            {
                foreach (var name in DeclaredHeaders(property, property.Name))
                {
                    yield return name;
                }
            }
        }
    }

    private static IEnumerable<string> DeclaredHeaders(ICustomAttributeProvider member, string? memberName) =>
        member.GetCustomAttributes(inherit: true)
            .OfType<IFromHeaderMetadata>()
            .Select(metadata => metadata.Name ?? memberName ?? string.Empty)
            .Where(name => name.Length > 0);

    /// <summary>
    /// Header names are spelled with separators and a conventional vendor prefix that carry no meaning:
    /// `X-Tenant-Id`, `Tenant-Id`, `tenant_id` and `TenantId` are one name. Reduced to alphanumerics and
    /// lowercased so the existing whole-string registry matches them, with a leading `x` dropped only when the
    /// source actually spelled a vendor prefix, so a header genuinely named `XTenant` is not silently rewritten.
    ///
    /// E-9's cost applies here too and is not hidden: this is equality against an enumerated registry, so a
    /// novel spelling escapes it. What it no longer does is miss the spellings a caller would actually reach for.
    /// </summary>
    private static string NormalizeHeaderName(string header)
    {
        var compact = new string(header.Where(char.IsLetterOrDigit).ToArray()).ToLowerInvariant();

        var hasVendorPrefix = header.StartsWith("x-", StringComparison.OrdinalIgnoreCase)
            || header.StartsWith("x_", StringComparison.OrdinalIgnoreCase);

        return hasVendorPrefix && compact.Length > 1 ? compact[1..] : compact;
    }

    private static bool BindsFromUrl(Type type)
    {
        type = Nullable.GetUnderlyingType(type) ?? type;

        if (type.IsArray)
        {
            return BindsFromUrl(type.GetElementType()!);
        }

        if (type.IsGenericType && type.GetGenericTypeDefinition() == typeof(IEnumerable<>))
        {
            return BindsFromUrl(type.GetGenericArguments()[0]);
        }

        return type == typeof(string) || type == typeof(Guid) || type.IsPrimitive || type.IsEnum
            || type == typeof(decimal) || type == typeof(DateTimeOffset) || type == typeof(DateTime)
            || type == typeof(DateOnly) || type == typeof(TimeOnly);
    }

    private static bool IsBodyDto(Type type, IServiceProviderIsService isService)
    {
        type = Nullable.GetUnderlyingType(type) ?? type;

        if (BindsFromUrl(type) || type == typeof(CancellationToken)
            || type.Namespace is null
            || type.Namespace.StartsWith("System", StringComparison.Ordinal)
            || type.Namespace.StartsWith("Microsoft", StringComparison.Ordinal))
        {
            return false;
        }

        // A DI service parameter is not a body; anything else the JSON binder fills from the request body, whether
        // via writable/init properties or a parameterized constructor (an immutable record or class).
        return !isService.IsService(type);
    }

    // Names the JSON binder can populate: public instance properties AND constructor parameters, because an
    // immutable DTO carries its server-controlled field only as a get-only property fed by the constructor.
    //
    // Recursive since the E-10 repair, and the depth is the whole point of it. This walk was flat, and both
    // `kernel/dotnet-react/README.md` and the SEC-2 row of conformance.json said it was not: they claimed the
    // scan covered body DTOs "nested and immutable constructor-bound DTOs included", and the constructor half
    // was true while the nested half had never been implemented. A request of the shape
    // `CreateNoteRequest(string Title, AuthorDto Author)` with `CreatedBy` on `AuthorDto` passed both SEC-2
    // guards. The general statement E-10 makes is that where a mechanism's surface is a nested declaration, the
    // completeness obligation is not "the enumeration cannot miss a member" but "cannot miss a member AT ANY
    // DEPTH", and a scan that stops at level zero satisfies a claim about level zero only.
    //
    // `seen` is cycle protection, not a depth cap: a self-referential DTO is legal and must terminate, and there
    // is deliberately no maximum depth, because a maximum depth is the same bug with a larger constant.
    private static IEnumerable<string> BindableMemberNames(Type type) =>
        BindableMemberNames(type, []);

    private static IEnumerable<string> BindableMemberNames(Type type, HashSet<Type> seen)
    {
        if (!seen.Add(type))
        {
            yield break;
        }

        foreach (var property in type.GetProperties(BindingFlags.Public | BindingFlags.Instance))
        {
            yield return property.Name;

            foreach (var nested in Bindable(property.PropertyType).SelectMany(t => BindableMemberNames(t, seen)))
            {
                yield return nested;
            }
        }

        foreach (var parameter in type.GetConstructors().SelectMany(constructor => constructor.GetParameters()))
        {
            if (parameter.Name is not null)
            {
                yield return parameter.Name;
            }

            foreach (var nested in Bindable(parameter.ParameterType).SelectMany(t => BindableMemberNames(t, seen)))
            {
                yield return nested;
            }
        }
    }

    /// <summary>
    /// The types reachable from a member's declared type that the JSON binder would itself populate: the type,
    /// unwrapped through Nullable, arrays and generic arguments, and only where it is not a leaf the binder fills
    /// from a scalar. `IReadOnlyList&lt;NoteInput&gt;` yields `NoteInput`; `string` and `Guid` yield nothing.
    ///
    /// Note what is NOT excluded here and IS excluded in IsBodyDto: a null namespace. E-6 records that
    /// `IsBodyDto` carries a fifth, unwritten exclusion, `type.Namespace is null`, which skips a DTO declared in
    /// `Program.cs` (top-level statements, so no namespace) entirely. A nested type has no reason to inherit that
    /// exemption, so descent does not apply it.
    /// </summary>
    private static IEnumerable<Type> Bindable(Type type)
    {
        type = Nullable.GetUnderlyingType(type) ?? type;

        if (type.IsArray)
        {
            return Bindable(type.GetElementType()!);
        }

        if (type.IsGenericType)
        {
            return type.GetGenericArguments().SelectMany(Bindable);
        }

        var framework = type.Namespace?.StartsWith("System", StringComparison.Ordinal) == true
            || type.Namespace?.StartsWith("Microsoft", StringComparison.Ordinal) == true;

        return BindsFromUrl(type) || type.IsPrimitive || framework ? [] : [type];
    }
}
