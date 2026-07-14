using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using Kernel.App.Notes;
using Kernel.Contracts.Notes;
using Xunit;

namespace Kernel.Tests.Architecture;

/// <summary>
/// The create endpoint rejects malformed input with 400 (the CON-1 wire contract), rather than letting a null or
/// oversized field reach the NOT NULL / length-bounded column and surface as a 500. The SQLite test tiers do not
/// enforce column length, so this host-level check is the only tier that would catch a regression here.
/// </summary>
public sealed class NotesValidationTests(KernelApiFactory factory) : IClassFixture<KernelApiFactory>
{
    private HttpClient WriteClient()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestTokens.Mint(Guid.NewGuid(), permissions: "notes.write"));
        return client;
    }

    [Fact]
    public async Task A_valid_note_is_created()
    {
        var request = new CreateNoteRequest("a valid title", "a valid body");
        var response = await WriteClient().PostAsJsonAsync("/notes", request);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task An_empty_body_is_accepted()
    {
        // Only null and over-limit bodies are rejected; an empty string is a valid (if unusual) note body.
        var request = new CreateNoteRequest("a title", string.Empty);
        var response = await WriteClient().PostAsJsonAsync("/notes", request);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task A_title_over_the_limit_is_a_bad_request()
    {
        var request = new CreateNoteRequest(new string('a', Note.TitleMaxLength + 1), "body");
        var response = await WriteClient().PostAsJsonAsync("/notes", request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task A_body_over_the_limit_is_a_bad_request()
    {
        var request = new CreateNoteRequest("title", new string('b', Note.BodyMaxLength + 1));
        var response = await WriteClient().PostAsJsonAsync("/notes", request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task A_missing_body_field_is_a_bad_request_not_a_server_error()
    {
        // Body is declared non-null, but the JSON binder leaves it null when the field is absent; that must be a
        // 400, never a 500 from the NOT NULL column.
        var content = new StringContent("""{"title":"has a title but no body"}""", Encoding.UTF8, "application/json");
        var response = await WriteClient().PostAsync("/notes", content);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
