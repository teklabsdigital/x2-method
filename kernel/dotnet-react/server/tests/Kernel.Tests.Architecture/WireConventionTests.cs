using System.Net;
using System.Net.Http.Headers;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;
using Kernel.App.Platform.Naming;
using Kernel.Contracts.Notes;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.AspNetCore.Routing;
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

    // CON-1 says "closed string sets", and closed is a property of the read side. Until E-45 the converter took
    // JsonStringEnumConverter's default of allowIntegerValues:true, so the undeclared-string case was rejected
    // (which is why the gap read as fine) and an integer sailed through into an undeclared value. Both directions
    // are asserted here, through the host's own options rather than a locally built set, so a change to the host
    // registration is what turns them red.
    [Fact]
    public void An_undeclared_enum_string_is_rejected() =>
        Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<SampleEnum>("\"notAMember\"", HostJsonOptions()));

    [Theory]
    [InlineData("7")]
    [InlineData("0")]
    [InlineData("-1")]
    public void An_integer_off_the_wire_is_not_an_enum_member(string document)
    {
        var options = HostJsonOptions();
        var thrown = Record.Exception(() => JsonSerializer.Deserialize<SampleEnum>(document, options));
        Assert.True(thrown is JsonException,
            $"CON-1: the document {document} deserialized instead of being rejected, so the wire enum set is not closed (E-45).");
    }

    private enum SampleEnum
    {
        FirstValue,
        SecondValue,
    }

    // ---------------------------------------------------------------------------------------------------------
    // CON-1's third clause: no endpoint invents its own error shape.
    //
    // Until this scan the claim was carried by two hand-picked routes asserted to render problem+json, so a
    // bespoke `{ok, why}` 400 returned from `CreateAsync` left all 113 tests green (E-46). Two routes are a
    // sample; the clause is about every endpoint, and the row said so while the mechanism did not.
    //
    // It reads the declared return type rather than driving each route, because "invents its own error shape" is
    // a property of what the handler is ALLOWED to return, not of what it happened to return for one request. A
    // handler declaring `Task<IResult>` has not yet invented a shape and can, at any status, with nothing to
    // report it. The typed result union is the mechanism the host already relies on, so the guard asserts the
    // union is closed rather than asserting a response.
    // ---------------------------------------------------------------------------------------------------------

    /// <summary>
    /// The dialect-conforming result types. An ALLOWLIST, not a ban list, because the violation shape is open:
    /// any `Xxx&lt;TBody&gt;` renders TBody raw at whatever status `Xxx` carries, so a ban list would have to
    /// enumerate every error-status result the framework ships today and every one it adds later, and would read
    /// green for the ones it had not heard of. Listed here is what renders problem+json at an error status,
    /// what carries no body at all and so falls to `UseStatusCodePages`, and what carries a body only at a
    /// success status.
    ///
    /// `NotFound` is here and `NotFound&lt;&gt;` is deliberately not. The generic one takes a body and renders it
    /// raw, which is precisely the bespoke error shape this clause forbids, spelled with a framework type.
    /// </summary>
    private static readonly Type[] DialectResults =
    [
        typeof(Ok), typeof(Ok<>), typeof(Created), typeof(Created<>), typeof(CreatedAtRoute), typeof(CreatedAtRoute<>),
        typeof(Accepted), typeof(Accepted<>), typeof(NoContent), typeof(NotFound), typeof(EmptyHttpResult),
        typeof(ValidationProblem), typeof(ProblemHttpResult), typeof(UnauthorizedHttpResult), typeof(ForbidHttpResult),
    ];

    [Fact]
    public void No_endpoint_declares_a_result_type_that_invents_an_error_shape()
    {
        var endpoints = factory.Services.GetRequiredService<EndpointDataSource>().Endpoints.OfType<RouteEndpoint>().ToList();

        // The extent assertion. Without it, a change that empties the endpoint source leaves this loop iterating
        // nothing and reporting success, which is the E-30 shape and the reason SEC-1's sibling scan grew the
        // same line.
        Assert.True(endpoints.Count > 0, "CON-1: the host mapped no routes, so this scan asserted nothing (E-30).");

        foreach (var endpoint in endpoints)
        {
            var route = endpoint.RoutePattern.RawText;
            var handler = endpoint.Metadata.GetMetadata<MethodInfo>();

            // A route whose handler is unreadable is not a pass. If the framework stops publishing the delegate's
            // MethodInfo, every route below silently stops being checked, so the absence is the failure.
            Assert.True(handler is not null,
                $"CON-1: '{route}' publishes no handler MethodInfo in its endpoint metadata, so its declared error shape cannot be read and this scan skipped it.");

            foreach (var arm in ResultArms(UnwrapAsync(handler!.ReturnType)))
            {
                Assert.True(IsDialectResult(arm),
                    $"CON-1: '{route}' can return '{TypeName(arm)}', which is not one of the dialect's result types. An error status carries RFC 9457 problem details or no body at all; a result generic over its own payload renders that payload raw and invents an error shape (E-46).");
            }
        }
    }

    /// <summary>
    /// The extent of the predicate the scan above runs, driven by a floor written from CON-1's statement rather
    /// than derived from the endpoints under test. Deriving the cases from the shipped handlers is the mistake
    /// E-30 records: the expected set and the measured set come from the same place and agree by construction.
    /// </summary>
    [Theory]
    // Conforming: problem details, no body, or a body only at a success status.
    [InlineData(typeof(Task<Results<Ok<string>, ValidationProblem>>), 0)]
    [InlineData(typeof(Task<Results<Ok<string>, NotFound>>), 0)]
    [InlineData(typeof(Task<Results<NoContent, NotFound>>), 0)]
    [InlineData(typeof(Task<Results<Created<string>, ProblemHttpResult>>), 0)]
    [InlineData(typeof(Ok<string>), 0)]
    [InlineData(typeof(ValueTask<Results<Ok<string>, ForbidHttpResult>>), 0)]
    // Not a result at all: the framework serializes it at 200 and no error shape is declared.
    [InlineData(typeof(Task<string>), 0)]
    // Inventing an error shape.
    [InlineData(typeof(Task<IResult>), 1)]
    [InlineData(typeof(Task<Results<Ok<string>, BadRequest<string>>>), 1)]
    [InlineData(typeof(Task<Results<Ok<string>, NotFound<string>>>), 1)]
    [InlineData(typeof(Task<Results<Ok<string>, Conflict<string>>>), 1)]
    [InlineData(typeof(Task<Results<Ok<string>, UnprocessableEntity<string>>>), 1)]
    [InlineData(typeof(Task<JsonHttpResult<object>>), 1)]
    [InlineData(typeof(Task<Results<Ok<string>, BadRequest<string>, NotFound<string>>>), 2)]
    public void The_result_predicate_reaches_the_shapes_CON_1_names(Type declared, int expected)
    {
        var invented = ResultArms(UnwrapAsync(declared)).Count(arm => !IsDialectResult(arm));

        Assert.True(expected == invented,
            $"CON-1: '{TypeName(declared)}' scored {invented} invented error shapes and the floor says {expected}. Either the predicate no longer reaches the shape, or the shape is no longer what CON-1 forbids.");
    }

    /// <summary>The result types a declared return type can actually produce. A `Results&lt;...&gt;` union is its
    /// arms; anything else that is an `IResult` is itself; anything that is not an `IResult` produces no error
    /// status at all and so contributes nothing.</summary>
    private static IEnumerable<Type> ResultArms(Type returnType)
    {
        if (!typeof(IResult).IsAssignableFrom(returnType))
        {
            yield break;
        }

        if (returnType.IsGenericType
            && returnType.Namespace == "Microsoft.AspNetCore.Http.HttpResults"
            && returnType.GetGenericTypeDefinition().Name.StartsWith("Results`", StringComparison.Ordinal))
        {
            foreach (var arm in returnType.GetGenericArguments().SelectMany(ResultArms))
            {
                yield return arm;
            }

            yield break;
        }

        yield return returnType;
    }

    private static Type UnwrapAsync(Type type)
    {
        while (type.IsGenericType
            && (type.GetGenericTypeDefinition() == typeof(Task<>) || type.GetGenericTypeDefinition() == typeof(ValueTask<>)))
        {
            type = type.GetGenericArguments()[0];
        }

        return type;
    }

    private static bool IsDialectResult(Type arm) =>
        DialectResults.Contains(arm.IsGenericType ? arm.GetGenericTypeDefinition() : arm);

    private static string TypeName(Type type) =>
        type.IsGenericType
            ? $"{type.Name[..type.Name.IndexOf('`', StringComparison.Ordinal)]}<{string.Join(", ", type.GetGenericArguments().Select(TypeName))}>"
            : type.Name;

    // ---------------------------------------------------------------------------------------------------------
    // CON-1's fourth clause: identifiers are opaque strings.
    //
    // Nothing asserted anything about identifier types before this scan. `ContractParityTests` compares camelCase
    // property NAMES against a fixture and never reads a property type, so `int Id` on a response satisfied every
    // contract guard in the suite (E-47).
    //
    // This is not SEC-7. SEC-7 is about what addresses an ANONYMOUS surface and about how the token is minted,
    // and it is honestly `owed` with a trigger (the exemplar has no anonymous resource). CON-1's clause is about
    // the wire dialect: whatever the minting, an identifier crosses the wire as a string, so a client never has
    // to know whether this endpoint's id is a number and that one's is not.
    // ---------------------------------------------------------------------------------------------------------

    /// <summary>
    /// Identifier-shaped member names, compared through the shared comparison rather than by equality, so
    /// `noteId` and `NoteID` reach the entry `id` without being listed. Heuristic in the direction the claim
    /// admits: a member that addresses a resource under some other spelling owes its own entry, which is why
    /// CON-1's row reads this obligation as `patterned` rather than `proven`.
    /// </summary>
    private static readonly NameRule[] IdentifierNames = [NameRule.Rule("id"), NameRule.Rule("key")];

    private static readonly string[] OpaqueOnTheWire = ["String", "Guid"];

    [Fact]
    public void Contract_identifiers_cross_the_wire_as_opaque_strings()
    {
        var contracts = typeof(CreateNoteRequest).Assembly;
        var identifiers = 0;

        foreach (var type in contracts.GetTypes()
            .Where(t => t.Namespace?.StartsWith("Kernel.Contracts", StringComparison.Ordinal) == true && !t.IsEnum))
        {
            foreach (var member in BodyMemberWalk.Members(type))
            {
                if (!NameComparison.Matches(IdentifierNames, member.Name))
                {
                    continue;
                }

                identifiers++;
                Assert.True(IsOpaque(member.Type),
                    $"CON-1: contract '{type.Name}' exposes identifier '{member.Name}' as '{TypeName(member.Type)}'. Identifiers cross the wire as opaque strings, so a client never has to know which endpoint's id is a number (E-47).");
            }
        }

        // The extent assertion. One identifier in the whole contracts assembly is a thin subject, and a rename
        // that emptied the scan would otherwise read as a clean pass.
        Assert.True(identifiers > 0,
            "CON-1: the scan found no identifier-shaped member anywhere in Kernel.Contracts, so it asserted nothing about identifier types (E-30).");
    }

    [Theory]
    // Opaque on the wire.
    [InlineData("id", typeof(Guid), true)]
    [InlineData("Id", typeof(string), true)]
    [InlineData("noteId", typeof(Guid), true)]
    [InlineData("NoteID", typeof(Guid?), true)]
    [InlineData("noteIds", typeof(Guid[]), true)]
    [InlineData("idempotencyKey", typeof(string), true)]
    // Dense, and a number on the wire.
    [InlineData("id", typeof(int), false)]
    [InlineData("noteId", typeof(long), false)]
    [InlineData("Id", typeof(int?), false)]
    [InlineData("noteIds", typeof(int[]), false)]
    [InlineData("rowKey", typeof(long), false)]
    public void The_identifier_predicate_reaches_the_shapes_CON_1_names(string name, Type declared, bool opaque)
    {
        Assert.True(NameComparison.Matches(IdentifierNames, name),
            $"CON-1: '{name}' is not identifier-shaped under the registry, so this case measures nothing about identifier types.");
        Assert.True(opaque == IsOpaque(declared),
            $"CON-1: '{name}' declared as '{TypeName(declared)}' scored {(opaque ? "dense" : "opaque")} and the floor says the opposite.");
    }

    /// <summary>The other direction. A registry that matched every member would make the scan above pass or fail
    /// for reasons that have nothing to do with identifiers.</summary>
    [Theory]
    [InlineData("title")]
    [InlineData("body")]
    [InlineData("createdAtUtc")]
    [InlineData("nextCursor")]
    [InlineData("identity")]
    [InlineData("items")]
    public void The_identifier_registry_does_not_reach_ordinary_fields(string name) =>
        Assert.False(NameComparison.Matches(IdentifierNames, name),
            $"CON-1: '{name}' is treated as an identifier, so the identifier scan is asserting the wire type of ordinary content.");

    private static bool IsOpaque(Type type)
    {
        type = Nullable.GetUnderlyingType(type) ?? type;

        if (type.IsArray)
        {
            return IsOpaque(type.GetElementType()!);
        }

        // A collection of identifiers is opaque exactly when its element type is.
        if (type.IsGenericType)
        {
            return type.GetGenericArguments().All(IsOpaque);
        }

        return OpaqueOnTheWire.Contains(type.Name, StringComparer.Ordinal);
    }
}
