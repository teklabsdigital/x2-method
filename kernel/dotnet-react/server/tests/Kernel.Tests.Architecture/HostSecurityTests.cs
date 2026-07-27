using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Kernel.App.Platform.Sessions;
using Kernel.Contracts.Notes;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace Kernel.Tests.Architecture;

/// <summary>
/// SEC-4 hardening and the tenancy end-to-end probes, exercised through the composed host: a valid token reaches
/// notes; a tampered signature is 401; a bumped session version rejects the old token; a missing perm is 403; a
/// missing tenant is 403; and one tenant cannot read another tenant's note (404, not 403, so existence does not
/// leak).
/// </summary>
public sealed class HostSecurityTests(KernelApiFactory factory) : IClassFixture<KernelApiFactory>
{
    private HttpClient ClientWith(string token)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    [Fact]
    public async Task Valid_token_reaches_notes()
    {
        var response = await ClientWith(TestTokens.Mint(Guid.NewGuid(), permissions: "notes.read")).GetAsync("/notes");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Tampered_signature_is_unauthorized()
    {
        var response = await ClientWith(TestTokens.Tampered(Guid.NewGuid(), "notes.read")).GetAsync("/notes");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Bumped_session_version_rejects_the_old_token()
    {
        var userId = Guid.NewGuid().ToString();
        var token = TestTokens.Mint(Guid.NewGuid(), sub: userId, sv: 1, permissions: "notes.read");

        Assert.Equal(HttpStatusCode.OK, (await ClientWith(token).GetAsync("/notes")).StatusCode);

        await factory.Services.GetRequiredService<ISessionVersionStore>().BumpAsync(userId);

        Assert.Equal(HttpStatusCode.Unauthorized, (await ClientWith(token).GetAsync("/notes")).StatusCode);
    }

    [Fact]
    public async Task A_token_signed_with_a_different_algorithm_is_rejected()
    {
        // Pinning is ValidAlgorithms=[HS256]. A token minted HS384 over the same key must not authenticate.
        var token = TestTokens.MintWithAlgorithm(Guid.NewGuid(), SecurityAlgorithms.HmacSha384, "notes.read");
        var response = await ClientWith(token).GetAsync("/notes");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    /// <summary>
    /// The pin itself, not a token that fails it. `A_token_signed_with_a_different_algorithm_is_rejected` mints
    /// HS384 and proves HS384 is excluded; it says nothing about what else the list admits. Measured on 2026-07-27:
    /// adding `RsaSha256` to `ValidAlgorithms` left all twelve host tests green (E-54). SEC-4's statement is "pins
    /// the exact expected signing algorithm", which is a statement about the set, so the set is what is asserted.
    ///
    /// Read off the composed host rather than restated: a constant repeated in the test is a second copy of the
    /// configuration, and it agrees with itself when the host changes.
    /// </summary>
    [Fact]
    public void Token_validation_pins_exactly_one_algorithm()
    {
        foreach (var (scheme, options) in BearerSchemes())
        {
            var pinned = options.TokenValidationParameters.ValidAlgorithms;
            Assert.True(pinned is not null && pinned.SequenceEqual([SecurityAlgorithms.HmacSha256]),
                $"Scheme '{scheme}' admits {(pinned is null ? "every algorithm its key supports (ValidAlgorithms is unset, which is the unpinned default)" : $"[{string.Join(", ", pinned)}]")}. SEC-4 pins exactly one: {SecurityAlgorithms.HmacSha256}.");
        }
    }

    /// <summary>
    /// The flag itself. Measured on 2026-07-27: `RequireSignedTokens = false` left all twelve host tests green
    /// (E-55), because nothing sent an unsigned token.
    ///
    /// Worth knowing, because it was predicted the other way and the control said otherwise: with the flag off and
    /// `ValidAlgorithms` still `[HS256]`, an alg:none token AUTHENTICATES. The algorithm pin does not refuse it,
    /// because an unsigned token never reaches signature validation at all. So the behavioural test below does
    /// carry this flag rather than being shadowed by the pin. Both assertions are kept anyway: the flag can be
    /// switched, and a configuration assertion names which switch, where a 401 only says something refused.
    /// </summary>
    [Fact]
    public void Token_validation_requires_a_signature()
    {
        foreach (var (scheme, options) in BearerSchemes())
        {
            Assert.True(options.TokenValidationParameters.RequireSignedTokens,
                $"Scheme '{scheme}' does not require signed tokens, so it accepts a token carrying no signature at all (SEC-4).");
        }
    }

    [Fact]
    public async Task An_unsigned_token_is_rejected()
    {
        var response = await ClientWith(TestTokens.Unsigned(Guid.NewGuid(), "notes.read")).GetAsync("/notes");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    /// <summary>
    /// Every bearer scheme the host registers, not the default one by name. A second scheme configured with looser
    /// validation is the way a pin like this stops being total, and reading only `JwtBearerDefaults` would not see
    /// it. Non-empty is asserted because a scan over nothing passes (E-42): if `AddJwtBearer` is dropped, this
    /// fails rather than reporting that every scheme it found was hardened.
    /// </summary>
    private IReadOnlyList<(string Scheme, JwtBearerOptions Options)> BearerSchemes()
    {
        var monitor = factory.Services.GetRequiredService<IOptionsMonitor<JwtBearerOptions>>();
        var schemes = factory.Services.GetRequiredService<IAuthenticationSchemeProvider>()
            .GetAllSchemesAsync().GetAwaiter().GetResult()
            .Where(scheme => typeof(JwtBearerHandler).IsAssignableFrom(scheme.HandlerType))
            .Select(scheme => (scheme.Name, monitor.Get(scheme.Name)))
            .ToList();

        Assert.True(schemes.Count > 0, "The host registers no JWT bearer scheme, so SEC-4's token-validation assertions would pass without reading any configuration (E-42).");
        return schemes;
    }

    [Fact]
    public async Task An_authenticated_token_without_a_session_version_is_rejected()
    {
        var token = TestTokens.MintWithoutSessionVersion(Guid.NewGuid(), "notes.read");
        var response = await ClientWith(token).GetAsync("/notes");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Missing_permission_claim_is_forbidden()
    {
        var response = await ClientWith(TestTokens.Mint(Guid.NewGuid())).GetAsync("/notes");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Missing_tenant_claim_is_forbidden()
    {
        var response = await ClientWith(TestTokens.MintWithoutTenant(permissions: "notes.read")).GetAsync("/notes");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Health_is_reachable_even_with_a_stale_or_tenantless_token()
    {
        // /health is allowlisted-anonymous (SEC-1): the revocation and tenant gates run only for endpoints that
        // require identity, so a token missing sv or tenant_id is ignored here rather than turned into a 401/403.
        Assert.Equal(HttpStatusCode.OK,
            (await ClientWith(TestTokens.MintWithoutSessionVersion(Guid.NewGuid(), "notes.read")).GetAsync("/health")).StatusCode);
        Assert.Equal(HttpStatusCode.OK,
            (await ClientWith(TestTokens.MintWithoutTenant(permissions: "notes.read")).GetAsync("/health")).StatusCode);
    }

    [Fact]
    public async Task One_tenant_cannot_read_another_tenants_note()
    {
        var created = await ClientWith(TestTokens.Mint(Guid.NewGuid(), permissions: "notes.write"))
            .PostAsJsonAsync("/notes", new CreateNoteRequest("A tenant-A note", "body"));
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var note = await created.Content.ReadFromJsonAsync<NoteResponse>();

        var response = await ClientWith(TestTokens.Mint(Guid.NewGuid(), permissions: "notes.read"))
            .GetAsync($"/notes/{note!.Id}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    /// <summary>
    /// TEN-1's header surface at run time, which is the half a scan cannot cover. `EndpointSpineTests` proves no
    /// endpoint DECLARES a tenant header binding; this proves that a header arriving anyway changes nothing,
    /// which is the property the claim's statement actually asserts ("the tenant a request operates in is
    /// resolved SOLELY from the validated authentication credential").
    ///
    /// The two are not redundant, and A-3 is the reason to say so: the scan is a static enumeration and its blind
    /// spot is a surface it does not enumerate, while this reads a status code and its blind spot is a route it
    /// does not exercise. A middleware that started preferring a header over the claim would leave the scan green
    /// and turn this red.
    /// </summary>
    [Fact]
    public async Task A_forged_tenant_header_does_not_move_the_request_into_another_tenant()
    {
        var victimTenant = Guid.NewGuid();
        var created = await ClientWith(TestTokens.Mint(victimTenant, permissions: "notes.write"))
            .PostAsJsonAsync("/notes", new CreateNoteRequest("A tenant-A note", "body"));
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var note = await created.Content.ReadFromJsonAsync<NoteResponse>();

        // An attacker in their own tenant, naming the victim's tenant in every spelling a middleware might read.
        var attacker = ClientWith(TestTokens.Mint(Guid.NewGuid(), permissions: "notes.read"));
        foreach (var header in new[] { "X-Tenant-Id", "Tenant-Id", "tenant_id", "TenantId", "X-Org-Id" })
        {
            attacker.DefaultRequestHeaders.Remove(header);
            attacker.DefaultRequestHeaders.Add(header, victimTenant.ToString());
        }

        var response = await attacker.GetAsync($"/notes/{note!.Id}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    /// <summary>
    /// TEN-2's mechanism class ends "cross-tenant e2e probes assert uniform not-found behavior", and uniform is
    /// the load-bearing word. Until E-50 the only such probe was a GET, so the read verb was covered and the
    /// mutating one was not. Removing the tenant filter from EfNoteStore.DeleteAsync left every runnable test
    /// green, and the path then answered 500 rather than 404, because TEN-4's SaveChanges guard stops the write
    /// but announces itself. Nothing leaked and the answers still differed, which is an existence oracle: a
    /// caller learns that a note exists in some other tenant. This test reads the status, so it holds whichever
    /// layer does the refusing.
    /// </summary>
    [Fact]
    public async Task One_tenant_cannot_delete_another_tenants_note()
    {
        var created = await ClientWith(TestTokens.Mint(Guid.NewGuid(), permissions: "notes.write"))
            .PostAsJsonAsync("/notes", new CreateNoteRequest("A tenant-A note", "body"));
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var note = await created.Content.ReadFromJsonAsync<NoteResponse>();

        var response = await ClientWith(TestTokens.Mint(Guid.NewGuid(), permissions: "notes.write"))
            .DeleteAsync($"/notes/{note!.Id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    /// <summary>TEN-2 uniformity, the list verb: another tenant's note is absent, not merely unreadable.</summary>
    [Fact]
    public async Task Another_tenants_note_is_absent_from_the_list()
    {
        var created = await ClientWith(TestTokens.Mint(Guid.NewGuid(), permissions: "notes.write"))
            .PostAsJsonAsync("/notes", new CreateNoteRequest("A tenant-A note", "body"));
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var note = await created.Content.ReadFromJsonAsync<NoteResponse>();

        var list = await ClientWith(TestTokens.Mint(Guid.NewGuid(), permissions: "notes.read"))
            .GetFromJsonAsync<NoteListResponse>("/notes");

        Assert.DoesNotContain(list!.Items, item => item.Id == note!.Id);
    }
}
