using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Xunit;

namespace Kernel.Tests.Architecture;

/// <summary>
/// CON-1 one wire dialect. camelCase property naming, a single enum-as-string converter (enums round-trip as
/// camelCase strings, never integers), and an unknown route rendering RFC 9457 problem+json.
/// </summary>
public sealed class WireConventionTests(KernelApiFactory factory) : IClassFixture<KernelApiFactory>
{
    private JsonSerializerOptions HostJsonOptions() =>
        factory.Services.GetRequiredService<IOptions<JsonOptions>>().Value.SerializerOptions;

    [Fact]
    public void Json_naming_is_camelCase_with_an_enum_converter()
    {
        var options = HostJsonOptions();
        Assert.Equal(JsonNamingPolicy.CamelCase, options.PropertyNamingPolicy);
        Assert.Contains(options.Converters, converter => converter is JsonStringEnumConverter);
    }

    [Fact]
    public void Enums_round_trip_as_camelCase_strings()
    {
        var options = HostJsonOptions();
        var json = JsonSerializer.Serialize(SampleEnum.SecondValue, options);
        Assert.Equal("\"secondValue\"", json);
        Assert.Equal(SampleEnum.SecondValue, JsonSerializer.Deserialize<SampleEnum>(json, options));
    }

    [Fact]
    public async Task A_malformed_cursor_returns_a_bad_request()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestTokens.Mint(Guid.NewGuid(), permissions: "notes.read"));

        var response = await client.GetAsync("/notes?cursor=@@@");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Unknown_route_returns_problem_json()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestTokens.Mint(Guid.NewGuid(), permissions: "notes.read"));

        var response = await client.GetAsync("/no-such-route");

        // This asserted NotFound until SEC-1's fallback was changed from RequireAuthenticatedUser to a deny (see
        // Program.cs and E-7). The authorization middleware applies the fallback to requests that match no
        // endpoint as well as to endpoints carrying no authorization metadata, so an unknown route is now refused
        // rather than reported absent. The old assertion is recorded here rather than quietly swapped, because
        // the status change is a real behaviour change and not a test detail.
        //
        // Refusing is the better answer and the node-react edition reached the same 403 by a different route: an
        // unauthenticated caller learns nothing about which URLs exist, and 404 stays available and meaningful
        // inside a gated endpoint, where One_tenant_cannot_read_another_tenants_note depends on it.
        //
        // What this test is actually about is unchanged: CON-1's one wire dialect, so the error renders RFC 9457
        // problem+json whatever the code.
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    private enum SampleEnum
    {
        FirstValue,
        SecondValue,
    }
}
