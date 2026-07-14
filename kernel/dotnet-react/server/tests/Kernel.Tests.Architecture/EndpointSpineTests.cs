using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.AspNetCore.Http;
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
    private static readonly string[] AnonymousAllowlist = ["/health"];

    private static readonly string[] ForbiddenTenantParams =
        ["tenantid", "tenant", "orgid", "organizationid", "organisationid"];

    private static readonly string[] ForbiddenPiiParams =
        ["email", "phone", "name", "firstname", "lastname", "ssn", "dob", "dateofbirth"];

    private IReadOnlyList<RouteEndpoint> RouteEndpoints() =>
        factory.Services.GetRequiredService<EndpointDataSource>().Endpoints.OfType<RouteEndpoint>().ToList();

    [Fact]
    public void Every_endpoint_is_permission_gated_or_allowlisted_anonymous()
    {
        foreach (var endpoint in RouteEndpoints())
        {
            var pattern = "/" + (endpoint.RoutePattern.RawText ?? string.Empty).TrimStart('/');

            if (endpoint.Metadata.GetMetadata<IAllowAnonymous>() is not null)
            {
                Assert.True(AnonymousAllowlist.Contains(pattern),
                    $"Anonymous endpoint '{pattern}' is not on the reviewed allowlist (SEC-1). Gate it, or add it to the allowlist with a justification.");
                continue;
            }

            var policy = endpoint.Metadata.GetMetadata<IAuthorizeData>()?.Policy;
            Assert.True(policy?.StartsWith("perm:", StringComparison.Ordinal) == true && policy.Length > "perm:".Length,
                $"Endpoint '{pattern}' does not name a non-empty perm policy (SEC-1). Bare authentication is not enough; use RequireAuthorization(\"perm:...\").");
        }
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

    [Fact]
    public void The_fallback_policy_denies_by_default()
    {
        var options = factory.Services.GetRequiredService<IOptions<AuthorizationOptions>>().Value;

        Assert.NotNull(options.FallbackPolicy);

        // Non-null is not enough: assert it actually rejects anonymous callers, so a weakening to a permissive
        // fallback (e.g. RequireAssertion(_ => true)) fails the build rather than silently opening the host.
        Assert.Contains(options.FallbackPolicy!.Requirements, requirement => requirement is DenyAnonymousAuthorizationRequirement);
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
    private static IEnumerable<string> BindableMemberNames(Type type)
    {
        foreach (var property in type.GetProperties(BindingFlags.Public | BindingFlags.Instance))
        {
            yield return property.Name;
        }

        foreach (var parameter in type.GetConstructors().SelectMany(constructor => constructor.GetParameters()))
        {
            if (parameter.Name is not null)
            {
                yield return parameter.Name;
            }
        }
    }
}
