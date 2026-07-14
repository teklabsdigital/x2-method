namespace Kernel.Api.Endpoints;

public static class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder app)
    {
        // SEC-1: the single allowlisted anonymous endpoint. EndpointSpineTests enumerates "/health" as the only
        // permitted anonymous route; any other AllowAnonymous endpoint fails the build.
        app.MapGet("/health", () => TypedResults.Ok(new HealthStatus("ok"))).AllowAnonymous();

        return app;
    }

    private sealed record HealthStatus(string Status);
}
