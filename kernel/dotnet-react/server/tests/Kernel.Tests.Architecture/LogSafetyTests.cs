using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.RegularExpressions;
using Kernel.App.Notes;
using Kernel.Contracts.Notes;
using Kernel.Persistence.Notes;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Xunit;

namespace Kernel.Tests.Architecture;

/// <summary>
/// SEC-6 at the error-handler surface, which is one of the three the claim's mechanism class names and the only
/// one this edition's server has. Harness output is covered on the client by `redact.test.ts`; there is no hub, so
/// realtime logging has no surface here yet.
///
/// It exists because the server half had nothing (E-56). `ILogger`, `Serilog` and every redaction helper returned
/// zero occurrences across `server/src`, while `app.UseExceptionHandler()` was wired, so the framework logged
/// unhandled exceptions and nothing asserted what those entries contained. The claim is explicit that this is what
/// discharges the obligation: "Redaction is tested, not promised: each logging surface that could see sensitive
/// material carries a named test asserting known secret shapes and content fields never reach the sink."
///
/// The store is replaced with one that throws, so the exception arrives through the real pipeline: real
/// authentication, real middleware, the real `UseExceptionHandler`. A test that logged an exception directly would
/// be asserting about its own arrangement.
///
/// What it does NOT claim: no test can stop a developer interpolating a token into a log statement. This asserts
/// what the surface emits on its own, for a request that carries a bearer token and a body with content in it.
/// Measured on 2026-07-27: adding request-header logging to the pipeline, which is the ordinary diagnostic mistake,
/// turns it red.
/// </summary>
public sealed class LogSafetyTests(KernelApiFactory factory) : IClassFixture<KernelApiFactory>
{
    private const string Title = "zebrafish-invoice-particulars";
    private const string Body = "sturgeon-ledger-remittance-detail";

    /// <summary>
    /// Anchored on `eyJ`, the base64url of `{"`, which every JWT header segment begins with because every JWT
    /// header is a JSON object.
    ///
    /// The client's `redact.ts` uses the unanchored form, three dot-separated runs of eight or more token
    /// characters, and that form is wrong here in a way worth knowing: its first match on this log was the string
    /// `Microsoft.EntityFrameworkCore.Database.Command`. Every .NET logger category and every stack frame is a
    /// dotted identifier, so the unanchored pattern reports a token in log lines that carry none. On the client the
    /// same over-match does not fail anything, it silently rewrites dotted identifiers in harness output to
    /// `[REDACTED-JWT]`, which is E-58.
    /// </summary>
    private static readonly Regex JwtShaped = new(@"eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}");

    [Fact]
    public async Task No_authorization_header_or_token_reaches_the_log() =>
        AssertAbsent(await Exercise(), token => token, "the bearer token itself");

    [Fact]
    public async Task No_jwt_shaped_string_reaches_the_log()
    {
        var (entries, _) = await Exercise();
        var offender = entries.FirstOrDefault(entry => JwtShaped.IsMatch(entry));
        Assert.True(offender is null,
            $"A JWT-shaped string reached the log (SEC-6). Entry: {Truncate(offender)}");
    }

    [Fact]
    public async Task No_request_body_content_reaches_the_log()
    {
        var (entries, _) = await Exercise();
        foreach (var content in new[] { Title, Body })
        {
            var offender = entries.FirstOrDefault(entry => entry.Contains(content, StringComparison.OrdinalIgnoreCase));
            Assert.True(offender is null,
                $"User content '{content}' reached the log (SEC-6: identifiers and shapes are logged, payloads are not). Entry: {Truncate(offender)}");
        }
    }

    /// <summary>
    /// The arrangement's own guard. Every assertion above is over a list, and a list that is empty satisfies all of
    /// them: if the capture were never wired, or the request never reached the error handler, these would report a
    /// clean log rather than an unexercised surface (E-42, E-43).
    /// </summary>
    [Fact]
    public async Task The_surface_these_assertions_read_was_actually_exercised()
    {
        var (entries, _) = await Exercise();

        Assert.True(entries.Count > 0, "Nothing was logged at all, so the assertions over this log would pass without reading anything.");
        Assert.Contains(entries, entry => entry.Contains(ThrowOnReadStore.Marker, StringComparison.Ordinal));
    }

    /// <summary>
    /// Two requests, because the two things being asserted reach a log by different routes. The create SUCCEEDS
    /// through the real store, so the title and body travel all the way into an EF command and whatever EF logs
    /// about that command is in the capture; asserting content is absent while nothing ever wrote any would be an
    /// assertion about the arrangement. The read then throws, which is what puts the real `UseExceptionHandler` on
    /// the surface being measured.
    /// </summary>
    private async Task<(IReadOnlyList<string> Entries, string Token)> Exercise()
    {
        var capture = new LogCapture();
        var token = TestTokens.Mint(Guid.NewGuid(), null, 1, "notes.read", "notes.write");

        using var host = factory.WithWebHostBuilder(builder => builder.ConfigureServices(services =>
        {
            services.AddLogging(logging => logging.AddProvider(capture));
            services.AddScoped<INoteStore>(provider =>
                new ThrowOnReadStore(ActivatorUtilities.CreateInstance<EfNoteStore>(provider)));
        }));

        var client = host.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var created = await client.PostAsJsonAsync("/notes", new CreateNoteRequest(Title, Body));
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);

        await client.GetAsync("/notes");

        return (capture.Entries, token);
    }

    private static void AssertAbsent((IReadOnlyList<string> Entries, string Token) captured, Func<string, string> needle, string what)
    {
        var value = needle(captured.Token);
        var offender = captured.Entries.FirstOrDefault(entry => entry.Contains(value, StringComparison.Ordinal));
        Assert.True(offender is null, $"The log carries {what} (SEC-6). Entry: {Truncate(offender)}");
    }

    private static string Truncate(string? entry) =>
        entry is null ? "(none)" : entry.Length <= 300 ? entry : entry[..300] + "...";

    /// <summary>The real store for writes, a throw for reads: one arrangement that both stores content and reaches
    /// the error handler.</summary>
    private sealed class ThrowOnReadStore(INoteStore inner) : INoteStore
    {
        public const string Marker = "log-safety-probe";

        public Task<IReadOnlyList<Note>> ListAsync(NoteCursor? before, int limit, CancellationToken cancellationToken = default) =>
            throw new InvalidOperationException(Marker);

        public Task<Note?> GetAsync(Guid id, CancellationToken cancellationToken = default) =>
            throw new InvalidOperationException(Marker);

        public Task AddAsync(Note note, CancellationToken cancellationToken = default) =>
            inner.AddAsync(note, cancellationToken);

        public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default) =>
            inner.DeleteAsync(id, cancellationToken);
    }
}
