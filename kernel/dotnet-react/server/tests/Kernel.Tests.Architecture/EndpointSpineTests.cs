using System.Reflection;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Metadata;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Xunit;

namespace Kernel.Tests.Architecture;

/// <summary>
/// SEC-1, TEN-1, SEC-3. Scans the composed route table: every endpoint is either allowlisted-anonymous or names a
/// perm policy; no route or query parameter carries a tenant or PII name; no body DTO carries a server-controlled
/// field (SEC-2, at any depth, including an internal, non-*Request, or immutable constructor-bound type); and the
/// deny-by-default fallback policy actually rejects anonymous callers. This is the single un-filterable home for
/// the host-wide spine (X-8 rule 3).
///
/// Two things this file used to do and does not any more, both recorded as E-2. It does not decide for itself
/// what binds from a URL: the URL surface is enumerated by exclusion, and the body surface is the framework's own
/// `IAcceptsMetadata`. And it does not compare names by equality: `NameComparison` resolves the morphology, which
/// is E-9. Both are held to something outside this file, a corpus run against the real binder and a set of
/// asserted spellings, because the failure mode in both cases was a scan that agreed with itself.
///
/// Residual limitation: a handler that takes HttpContext and reads Request.Query[...] at runtime is invisible to
/// any static route-table scan. That is measured rather than assumed (a handler reading `Request.Query`
/// ["emailAddress"] leaves this suite green) and it is now an obligation reading `owed` on SEC-3's row rather
/// than a note here, because a residual named only in a comment is a residual nothing tracks (E-20).
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

    // Base words only. "workspace" and "account" were absent until the node-react round 4 audit measured the two
    // registries against each other, and the compounds ("tenantid", "workspaceslug", "organisationid",
    // "firstname", "lastname", "dateofbirth") were listed one by one because the comparison was equality and every
    // spelling a caller might use had to be enumerated. The comparison derives them now (E-9), and every dropped
    // spelling is asserted to still match in NameComparisonTests, so the shorter list is a measured claim rather
    // than a tidy-up.
    internal static NameRule[] ForbiddenTenantParams { get; } =
        [
            NameRule.Rule("tenant"), NameRule.Rule("org"), NameRule.Rule("organization"),
            NameRule.Rule("organisation"), NameRule.Rule("workspace"), NameRule.Rule("account"),
        ];

    private static readonly NameRule[] ForbiddenPiiParams =
        [
            NameRule.Rule("email"), NameRule.Rule("phone"), NameRule.Rule("name"), NameRule.Rule("ssn"),
            NameRule.Rule("dob"), NameRule.Rule("dateOfBirth"),
        ];

    internal static IReadOnlyList<NameRule> ForbiddenUrlNames { get; } =
        [.. ForbiddenTenantParams, .. ForbiddenPiiParams];

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
        var isService = factory.Services.GetRequiredService<IServiceProviderIsService>();

        foreach (var endpoint in RouteEndpoints())
        {
            foreach (var name in ParameterNames(endpoint, isService))
            {
                Assert.False(NameComparison.Matches(ForbiddenUrlNames, name),
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
        foreach (var endpoint in RouteEndpoints())
        {
            foreach (var header in HeaderNames(endpoint))
            {
                Assert.False(NameComparison.Matches(ForbiddenUrlNames, NormalizeHeaderName(header)),
                    $"Endpoint '{endpoint.RoutePattern.RawText}' binds header '{header}' (TEN-1/SEC-3: tenant comes from the token, and PII never travels in a header any more than in a URL).");
            }
        }
    }

    [Fact]
    public void No_endpoint_binds_a_body_type_carrying_server_controlled_fields()
    {
        var isService = factory.Services.GetRequiredService<IServiceProviderIsService>();
        var scanned = 0;

        foreach (var endpoint in RouteEndpoints())
        {
            foreach (var body in BodyTypes(endpoint, isService))
            {
                scanned++;
                foreach (var name in BodyMemberWalk.MemberNames(body))
                {
                    Assert.False(ServerControlledFields.Matches(name),
                        $"Endpoint '{endpoint.RoutePattern.RawText}' binds body type '{body.Name}' carrying server-controlled field '{name}' (SEC-2). Body DTOs belong in Kernel.Contracts and carry no server-owned field.");

                    // TEN-1's contract half, which no mechanism applied to a body member until E-22. The tenant
                    // registry reached URL parameters only, so `tenantId` was caught by SEC-2's registry happening
                    // to list it and every other spelling the claim forbids, `workspaceId`, `organisationId`,
                    // `accountId`, was caught by nothing at all on any body.
                    Assert.False(NameComparison.Matches(ForbiddenTenantParams, name),
                        $"Endpoint '{endpoint.RoutePattern.RawText}' binds body type '{body.Name}' carrying tenant-shaped field '{name}' (TEN-1). Tenant comes from the validated credential, never from a request contract.");
                }
            }
        }

        // Non-vacuity. A body enumeration that finds nothing passes this test forever, and E-5's second instance
        // is the record of a guard in this tree whose green and whose blindness were the same colour.
        Assert.True(scanned > 0, "The SEC-2 body scan enumerated no body type at all, so its green result says nothing.");
    }

    /// <summary>
    /// The body types an endpoint binds, taken from the framework's own answer FIRST.
    ///
    /// E-2's finding is that this file reimplemented ASP.NET's binding rules informally, in the assertion, and
    /// could drift from the real binder in either direction without anything failing. Its proposed remedy was to
    /// split the one predicate in two, because the same predicate served SEC-2 and SEC-3/TEN-1 with opposite
    /// error directions. Measured against a real host, there is a better remedy available and this is it: the
    /// framework publishes what it inferred, as <see cref="IAcceptsMetadata"/> on the composed endpoint, so the
    /// enumeration can ASK instead of guessing. `RequestType` is what RequestDelegateFactory decided the body is.
    ///
    /// The parameter walk is kept as a second net, for the case the metadata is absent (a custom binder, a
    /// non-minimal-API endpoint added later). It errs toward scanning: a type it wrongly treats as a body costs a
    /// walk over members that are not posted, which is a false positive a human reads, while a body it misses is
    /// invisible and green.
    /// </summary>
    private static IEnumerable<Type> BodyTypes(RouteEndpoint endpoint, IServiceProviderIsService isService)
    {
        var declared = endpoint.Metadata.GetMetadata<IAcceptsMetadata>()?.RequestType;
        if (declared is not null)
        {
            yield return declared;
        }

        var method = endpoint.Metadata.OfType<MethodInfo>().FirstOrDefault();
        if (method is null)
        {
            yield break;
        }

        foreach (var parameter in method.GetParameters())
        {
            if (parameter.ParameterType != declared && IsBodyDto(parameter.ParameterType, isService))
            {
                yield return parameter.ParameterType;
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
        var names = BodyMemberWalk.MemberNames(typeof(DeepRequest)).ToList();

        Assert.Contains("Title", names);                       // depth 0
        Assert.Contains("CreatedBy", names);                   // depth 1, through a nested record property
        Assert.Contains("Nick", names);                        // depth 1
        Assert.Contains("Items", names);                       // depth 1
        // depth 2, through a collection element: the shape NoteListResponse already ships on the response side.
        Assert.Contains("Author", names);
        Assert.Single(names.Where(n => n == "CreatedBy").Take(1));

        // A server-controlled field at depth 2 is what the registry has to see for SEC-2's statement to hold.
        Assert.Contains(names, ServerControlledFields.Matches);

        // Self-reference terminates rather than stack-overflowing, which is why `seen` is a cycle set.
        Assert.Contains("Next", BodyMemberWalk.MemberNames(typeof(CyclicNode)).ToList());
    }

    /// <summary>
    /// The enumerations, checked against the REAL BINDER rather than against a reading of it. This is the test
    /// E-2 says did not exist: "a second, informal implementation of ASP.NET's binding rules living in the
    /// assertion, and it can drift from the real binder without anything failing, in either direction".
    ///
    /// So for every type in the corpus, a throwaway host maps an endpoint whose one parameter is named `tenantId`
    /// and typed with it, and the framework itself decides what that parameter is. Then the two enumerations this
    /// file runs on the composed route table are run on that endpoint, and the rule is exact: if the framework
    /// did not take the parameter as the body, TEN-1's scan must see the name `tenantId`; if it did, SEC-2's scan
    /// must see the type's members. Every parameter lands in one surface or the other, and neither surface may
    /// claim a parameter the other one owns.
    ///
    /// The corpus is E-2's own measured list plus the shapes the old predicate got right, so a narrowing that
    /// reintroduces the hole fails here rather than in a later audit.
    /// </summary>
    [Fact]
    public void Both_enumerations_agree_with_the_real_binder_over_a_corpus_of_parameter_types()
    {
        var isService = factory.Services.GetRequiredService<IServiceProviderIsService>();

        Type[] corpus =
        [
            // E-2's measured disagreements: every one of these bound from the URL and was rejected by the old
            // closed enumeration, so its name was compared against nothing.
            typeof(TenantKey), typeof(TimeSpan), typeof(Uri), typeof(System.Net.IPAddress), typeof(Int128),
            typeof(LegacyTryParseKey), typeof(TenantKey?),
            // What the old enumeration already had, which a repair may not lose.
            typeof(string), typeof(Guid), typeof(int), typeof(decimal), typeof(DateTimeOffset), typeof(DateOnly),
            typeof(TimeOnly), typeof(DayOfWeek),
            // And the body shapes, including the two the old predicate called URL-bound: an array of a scalar and
            // an array of a value object are both posted bodies on a POST.
            typeof(DeepRequest), typeof(Guid[]), typeof(TenantKey[]), typeof(List<DeepRequest>),
        ];

        foreach (var type in corpus)
        {
            var endpoint = ProbeEndpoint(type);
            var body = endpoint.Metadata.GetMetadata<IAcceptsMetadata>()?.RequestType;
            var urlNames = ParameterNames(endpoint, isService).ToList();
            var bodyMembers = BodyTypes(endpoint, isService).SelectMany(BodyMemberWalk.MemberNames).ToList();

            if (body is null)
            {
                Assert.True(urlNames.Contains("tenantId", StringComparer.Ordinal),
                    $"The framework binds a '{type.Name}' parameter from the URL and the TEN-1/SEC-3 enumeration does not see its name (E-2).");
            }
            else
            {
                Assert.True(bodyMembers.Count > 0,
                    $"The framework takes a '{type.Name}' parameter as the request body and the SEC-2 enumeration walked no member of it (E-2).");
            }
        }

        // The other direction, and the only place a name may leave the scanned surface: what the pipeline supplies
        // is not what a caller spells. If this list ever swallows a real parameter, these two are the canary.
        foreach (var type in new[] { typeof(CancellationToken), typeof(HttpContext) })
        {
            Assert.DoesNotContain("tenantId", ParameterNames(ProbeEndpoint(type), isService));
        }
    }

    /// <summary>
    /// One endpoint, in a throwaway host, whose only parameter is named `tenantId` and typed as asked. The host is
    /// built rather than mocked because the point of the test above is to consult the binder that actually runs,
    /// and RequestDelegateFactory publishes its inference as endpoint metadata at map time.
    /// </summary>
    private static RouteEndpoint ProbeEndpoint(Type parameterType)
    {
        var app = WebApplication.CreateBuilder().Build();
        var handler = typeof(EndpointSpineTests)
            .GetMethod(nameof(TenantIdParameter), BindingFlags.NonPublic | BindingFlags.Static)!
            .MakeGenericMethod(parameterType);

        app.MapPost("/probe", handler.CreateDelegate(typeof(Func<,>).MakeGenericType(parameterType, typeof(string))));

        return ((IEndpointRouteBuilder)app).DataSources.SelectMany(source => source.Endpoints).OfType<RouteEndpoint>().Single();
    }

    private static string TenantIdParameter<T>(T tenantId) => "ok";

    /// <summary>
    /// A tenant id wrapped in a strong type, which is E-2's exhibit: it implements the framework's own parse
    /// interface, so the real binder takes it from a route or a query string, and the old closed enumeration of
    /// `string`, `Guid`, primitives, enums, `decimal` and the date types did not recognize it. Wrapping an id in
    /// a value object is the direction a codebase drifts INTO, which is what made this the dangerous half.
    /// </summary>
    private readonly record struct TenantKey(Guid Value) : IParsable<TenantKey>
    {
        public static TenantKey Parse(string s, IFormatProvider? provider) => new(Guid.Parse(s));

        public static bool TryParse(string? s, IFormatProvider? provider, out TenantKey result)
        {
            var parsed = Guid.TryParse(s, out var value);
            result = new TenantKey(value);
            return parsed;
        }
    }

    /// <summary>The pre-IParsable spelling of the same thing, which the binder still honours and the old
    /// enumeration also missed.</summary>
    private sealed class LegacyTryParseKey
    {
        public static bool TryParse(string? s, out LegacyTryParseKey result)
        {
            result = new LegacyTryParseKey();
            return s is not null;
        }
    }

    /// <summary>
    /// The caller-supplied parameter names an endpoint exposes outside its body, and the enumeration is INVERTED
    /// from what it used to be, which is E-2's repair.
    ///
    /// It used to ask "does this type bind from a URL?" through `BindsFromUrl`, a closed positive enumeration of
    /// `string`, `Guid`, primitives, enums, `decimal` and the date types. Under-inclusion there is silent and it
    /// is the direction a codebase drifts INTO: wrapping a tenant id in a strong type (`TenantKey : IParsable`)
    /// left TEN-1's named mechanism with nothing to compare, and so did `TimeSpan`, `Uri`, `IPAddress`, `Int128`
    /// and every legacy `TryParse` type, all measured against a real host.
    ///
    /// So nothing here asks what binds from a URL. It asks what is accounted for otherwise: the framework's own
    /// declared body type, a registered service, and the handful of infrastructure types the binder supplies
    /// itself. Everything else is a value a caller can spell, and its name is compared. A type nobody has
    /// thought of is inside the surface by default instead of outside it, which is the whole difference.
    /// </summary>
    private static IEnumerable<string> ParameterNames(RouteEndpoint endpoint, IServiceProviderIsService isService)
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

        var body = endpoint.Metadata.GetMetadata<IAcceptsMetadata>()?.RequestType;

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

                continue;
            }

            if (parameter.ParameterType == body
                || parameter.GetCustomAttributes(inherit: true).OfType<IFromBodyMetadata>().Any()
                || IsInfrastructure(parameter.ParameterType)
                || isService.IsService(parameter.ParameterType))
            {
                continue;
            }

            yield return parameter.Name;
        }
    }

    /// <summary>
    /// The types the binder supplies from the request pipeline rather than from anything a caller writes in a URL.
    /// This is a closed list on purpose and it is the one place a name can leave the scanned surface, so it holds
    /// only types no caller can spell a value for. Getting it wrong costs a false positive, not a hole.
    /// </summary>
    private static bool IsInfrastructure(Type type) =>
        type == typeof(HttpContext) || type == typeof(HttpRequest) || type == typeof(HttpResponse)
        || type == typeof(CancellationToken) || type == typeof(ClaimsPrincipal)
        || type == typeof(Stream) || type == typeof(System.IO.Pipelines.PipeReader)
        || type == typeof(IFormFile) || type == typeof(IFormFileCollection) || type == typeof(IFormCollection);

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
    /// lowercased, with a leading `x` dropped only when the source actually spelled a vendor prefix, so a header
    /// genuinely named `XTenant` is not silently rewritten.
    ///
    /// Note what the normalization destroys and what now survives it. Compacting `X-Tenant-Id` to `tenantid`
    /// removes every boundary, so a token matcher has nothing left to work with; E-9 measured that this is not an
    /// incidental loss but a structural one on the header surface, since the sibling's runtime lowercases header
    /// names before any hook sees them. The comparison this feeds resolves concatenations, so the compacted
    /// spelling is matched by the base entry rather than by a list of pre-glued spellings.
    /// </summary>
    private static string NormalizeHeaderName(string header)
    {
        var compact = new string(header.Where(char.IsLetterOrDigit).ToArray()).ToLowerInvariant();

        var hasVendorPrefix = header.StartsWith("x-", StringComparison.OrdinalIgnoreCase)
            || header.StartsWith("x_", StringComparison.OrdinalIgnoreCase);

        return hasVendorPrefix && compact.Length > 1 ? compact[1..] : compact;
    }

    /// <summary>
    /// A type the binder fills from a single string, so it is never a body and has no members worth walking.
    ///
    /// This is what survives of `BindsFromUrl` after E-2, and the change is the question it answers. It used to
    /// be asked "does this bind from a URL?", which made it a second, informal implementation of ASP.NET's
    /// binding rules living in an assertion, free to drift from the real binder in either direction with nothing
    /// failing. Nothing asks it that any more: the URL surface is enumerated by exclusion and the body surface
    /// comes from the framework's own metadata. What is left is a question about the type itself.
    ///
    /// It deliberately does NOT unwrap arrays or collections. Measured against a real host, `Guid[]` on a POST
    /// arrives as the body, so an array is a body candidate here even though each element is scalar.
    /// </summary>
    // The null-namespace exclusion is gone, which is the second half of E-6. It was never written down and it
    // skipped every type declared in a file with top-level statements: a public DTO in `Program.cs` has no
    // namespace, so it bound, returned 200, and was outside this scan entirely. E-15 records that the same file is
    // exempted by NamingPlacementTests and was outside the TIME-1 scan too, so one DTO declared there escaped
    // three mechanisms at once, by exemptions that were each written for an unrelated reason.
    private static bool IsBodyDto(Type type, IServiceProviderIsService isService)
    {
        type = Nullable.GetUnderlyingType(type) ?? type;

        if (BodyMemberWalk.BindsAsScalar(type) || type == typeof(CancellationToken)
            || type.Namespace?.StartsWith("System", StringComparison.Ordinal) == true
            || type.Namespace?.StartsWith("Microsoft", StringComparison.Ordinal) == true)
        {
            return false;
        }

        // A DI service parameter is not a body; anything else the JSON binder fills from the request body, whether
        // via writable/init properties or a parameterized constructor (an immutable record or class).
        return !isService.IsService(type);
    }
}
