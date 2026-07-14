using System.Security.Claims;
using Kernel.App.Platform.Sessions;
using Microsoft.AspNetCore.Authorization;

namespace Kernel.Api.Platform;

/// <summary>
/// SEC-4 revocation gate. An authenticated principal must carry an "sv" claim equal to the store's current
/// version for its user, or the request is 401. Deliberately stricter than a pass-through: a missing or
/// unparseable sv on an authenticated request is rejected, so a token minted before a version bump dies at once.
/// An allowlisted-anonymous endpoint is exempt: it declares it needs no identity, so a stale token presented to it
/// is ignored rather than turned into a spurious 401 (SEC-1).
/// </summary>
public sealed class SessionVersionMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, ISessionVersionStore store)
    {
        var allowsAnonymous = context.GetEndpoint()?.Metadata.GetMetadata<IAllowAnonymous>() is not null;

        if (!allowsAnonymous && context.User.Identity?.IsAuthenticated == true)
        {
            var userId = context.User.FindFirstValue("sub");

            if (userId is null
                || !int.TryParse(context.User.FindFirstValue("sv"), out var version)
                || version != await store.GetCurrentAsync(userId, context.RequestAborted))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return;
            }
        }

        await next(context);
    }
}
