using System.Text.Json;
using Kernel.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Kernel.Tests.Architecture;

/// <summary>
/// DB2: the database engine is a project choice, declared once in `edition.json`, and this is what stops the
/// declaration from being a comment.
///
/// The engine was named in five places that agreed by hand: the DEP-1 ledger row, `scripts/db-up.sh`, the CI
/// workflow, the Testcontainers fixture and the runbook (E-64). DEP-1's cross-surface agreement check now makes
/// the IMAGE unable to drift between them, which is the half a linter can answer. It cannot answer the half that
/// matters more: whether the engine the project SAYS it uses is the engine the host actually registers. A
/// declaration and a composition root can disagree with every text-matching gate green, and the disagreement
/// only shows up in production, where the migrations were generated for one engine and the connection is to
/// another.
///
/// So this reads `Database.ProviderName` off the real composition. Not a scan for `UseSqlServer` in Program.cs,
/// which would be a second, lexical idea of what the host does, and not the architecture-test host either, whose
/// whole job is to REPLACE the provider with SQLite. It builds the production composition, resolves the context
/// EF would resolve, and asks it. Nothing here connects: EF resolves a provider at registration and opens a
/// connection at first query.
/// </summary>
public sealed class EngineChoiceTests
{
    [Fact]
    public void The_host_registers_the_engine_the_edition_declares()
    {
        var declared = DeclaredEngine();

        using var factory = new ProductionCompositionFactory();
        using var scope = factory.Services.CreateScope();
        var registered = scope.ServiceProvider.GetRequiredService<KernelDbContext>().Database.ProviderName;

        Assert.True(declared.Provider == registered,
            $"DB2: edition.json declares the engine provider '{declared.Provider}' and the production composition registers '{registered}'. The declaration is what a project switching engines edits, so a declaration the host does not honour is worse than no declaration: it reads as the answer.");
    }

    /// <summary>
    /// The declaration is only worth checking if it is there and complete, and a missing key reading as `null`
    /// would make the assertion above compare null to null the day someone deletes the block. Every field the
    /// swap set depends on is required by name.
    /// </summary>
    [Fact]
    public void The_edition_declares_a_complete_engine_choice()
    {
        var engine = EngineElement();

        foreach (var field in new[] { "name", "provider", "image", "container", "volume", "connectionStringKey" })
        {
            Assert.True(engine.TryGetProperty(field, out var value) && value.GetString()?.Length > 0,
                $"DB2: edition.json's engine block declares no '{field}'. Every field here is read by something (the image by docs-lint's agreement check, the container and volume by scripts/db-up.sh, the provider by this test), so a missing one silently drops a surface out of the swap set.");
        }

        Assert.True(engine.TryGetProperty("port", out var port) && port.TryGetInt32(out var portNumber) && portNumber > 0,
            "DB2: edition.json's engine block declares no numeric port.");
    }

    /// <summary>The engine's own package is a dependency like any other, so DEP-1 covers its pin and its ledger
    /// row. What DEP-1 cannot see is that it is the engine at all: this asserts the declared provider is actually
    /// referenced, so a declaration naming a package the build does not use fails here rather than at runtime.</summary>
    [Fact]
    public void The_declared_provider_package_is_referenced_by_the_build()
    {
        var declared = DeclaredEngine();
        var packages = File.ReadAllText(Path.Combine(TestPaths.ServerRoot, "Directory.Packages.props"));

        Assert.Contains($"Include=\"{declared.Provider}\"", packages, StringComparison.Ordinal);
    }

    private static (string Name, string Provider, string Image) DeclaredEngine()
    {
        var engine = EngineElement();
        return (engine.GetProperty("name").GetString()!, engine.GetProperty("provider").GetString()!, engine.GetProperty("image").GetString()!);
    }

    private static JsonElement EngineElement()
    {
        var editionFile = Path.Combine(Directory.GetParent(TestPaths.ServerRoot)!.FullName, "edition.json");
        Assert.True(File.Exists(editionFile), $"DB2: edition.json is missing at '{editionFile}'; it is where the engine choice is declared.");

        using var document = JsonDocument.Parse(File.ReadAllText(editionFile));
        Assert.True(document.RootElement.TryGetProperty("engine", out var engine),
            "DB2: edition.json declares no engine block, so the database choice has no home and every surface naming it is an independent assertion (E-64).");

        return engine.Clone();
    }

    /// <summary>
    /// The composition root as it ships, with configuration supplied and NOTHING replaced. `KernelApiFactory`
    /// cannot be reused for this: it exists to swap the provider out for SQLite, so asking it which provider is
    /// registered answers a question about the test harness.
    /// </summary>
    private sealed class ProductionCompositionFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Production");
            builder.UseSetting("Jwt:Key", KernelApiFactory.JwtKey);
            builder.UseSetting("Jwt:Issuer", KernelApiFactory.JwtIssuer);
            builder.UseSetting("Jwt:Audience", KernelApiFactory.JwtAudience);
            builder.UseSetting("ConnectionStrings:Kernel", "Server=never-connected;Database=Kernel;Trusted_Connection=True");
        }
    }
}
