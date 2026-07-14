using Kernel.App.Platform.Tenancy;
using Microsoft.AspNetCore.Authorization;

namespace Kernel.Api.Platform;

/// <summary>
/// TEN-2 at HTTP ingress. Unauthenticated requests pass through (the deny-by-default fallback policy rejects any
/// non-allowlisted endpoint downstream). An authenticated request whose tenant_id claim will not parse is 403.
/// Otherwise the tenant scope is open for the duration of the request and disposed after. An allowlisted-anonymous
/// endpoint is exempt: it declares it needs no tenant, so a token missing tenant_id is ignored, not turned into a
/// spurious 403 (SEC-1).
/// </summary>
public sealed class TenantScopeMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, ITenantScope scope)
    {
        var allowsAnonymous = context.GetEndpoint()?.Metadata.GetMetadata<IAllowAnonymous>() is not null;

        if (allowsAnonymous || context.User.Identity?.IsAuthenticated != true)
        {
            await next(context);
            return;
        }

        if (!Guid.TryParse(context.User.FindFirst("tenant_id")?.Value, out var tenantId) || tenantId == Guid.Empty)
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return;
        }

        using (scope.Begin(tenantId))
        {
            await next(context);
        }
    }
}
