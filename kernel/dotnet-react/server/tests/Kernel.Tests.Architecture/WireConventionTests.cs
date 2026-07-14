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

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    private enum SampleEnum
    {
        FirstValue,
        SecondValue,
    }
}
