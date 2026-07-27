using System.Text.RegularExpressions;
using Xunit;

namespace Kernel.Tests.Architecture;

/// <summary>
/// CFG-1: operational settings are configuration, not code. Non-secret operational settings (a model id, a
/// provider endpoint) resolve from IConfiguration and live in committed appsettings; secrets live in user-secrets
/// (SEC-5); mandatory values fail fast at startup (DATA-5). This scan closes the third, wrong home: a literal in
/// host source or a script, which the acceptance-test pilot hit twice (a model id in Program.cs, then a script
/// duplicating committed issuer/audience values). The registry is heuristic by design, the cheap net; it is
/// extended per project at D-000 when the project gains new operational-setting shapes.
/// </summary>
public sealed class OperationalSettingsTests
{
    private static readonly (string Name, Regex Pattern)[] BannedLiterals =
    [
        ("AI model id", new Regex(@"\b(?:claude|gpt|gemini|mistral)-[a-z0-9][a-z0-9.-]*\b", RegexOptions.Compiled | RegexOptions.IgnoreCase)),
        ("model provider endpoint", new Regex(@"https://(?:api\.anthropic\.com|api\.openai\.com|generativelanguage\.googleapis\.com|api\.mistral\.ai)", RegexOptions.Compiled | RegexOptions.IgnoreCase)),
    ];

    [Fact]
    public void Host_source_and_scripts_carry_no_operational_setting_literals()
    {
        // The scan surface: every non-generated source file under server/src, plus the edition's shipped shell
        // scripts (the pilot's e2e.sh recurrence is why scripts are first-class here). appsettings*.json is the
        // sanctioned home and is not a scanned surface.
        var editionRoot = Directory.GetParent(TestPaths.ServerRoot)!.FullName;
        var scriptsRoot = Path.Combine(editionRoot, "scripts");
        var surfaces = TestPaths.SourceFiles().Concat(
            Directory.Exists(scriptsRoot)
                ? Directory.EnumerateFiles(scriptsRoot, "*.sh", SearchOption.TopDirectoryOnly)
                : []);

        var violations = new List<string>();
        foreach (var file in surfaces)
        {
            var text = File.ReadAllText(file);
            foreach (var (name, pattern) in BannedLiterals)
            {
                var match = pattern.Match(text);
                if (match.Success)
                {
                    violations.Add($"{file}: {name} literal '{match.Value}' (CFG-1: operational settings resolve from configuration, never code).");
                }
            }
        }

        Assert.True(violations.Count == 0, string.Join(Environment.NewLine, violations));
    }

    /// <summary>
    /// The registry's EXTENT, asserted rather than described, following the repair SecretConfigShapeTests already
    /// carries for E-11. Measured 2026-07-27 (E-29): with both patterns above narrowed to tokens appearing
    /// nowhere, the whole architecture suite stayed green, because a Fact scanning a clean tree passes equally
    /// whether the predicate reaches everything or nothing. Red-green proof establishes that a guard binds and
    /// establishes nothing about how far it reaches, so the reach is a test. Every `true` case is a literal the
    /// planting round saw fail by name; every `false` case is a shape a careless widening would break.
    /// </summary>
    [Theory]
    // Model ids, the shape the acceptance-test pilot shipped into Program.cs.
    [InlineData("claude-opus-4-20250514", true)]
    [InlineData("gpt-4o-mini", true)]
    [InlineData("gemini-1.5-pro", true)]
    [InlineData("mistral-large-latest", true)]
    // Provider endpoints, all four hosts the registry names.
    [InlineData("https://api.anthropic.com", true)]
    [InlineData("https://api.openai.com/v1/chat", true)]
    [InlineData("https://generativelanguage.googleapis.com", true)]
    [InlineData("https://api.mistral.ai", true)]
    // Not operational settings. These are the shapes a careless widening would start failing on, written down so
    // that widening has to be argued rather than discovered by a red build.
    [InlineData("claude", false)]
    [InlineData("the gpt era", false)]
    [InlineData("https://example.com/api", false)]
    [InlineData("https://docs.anthropic.com", false)]
    [InlineData("Gemini is a constellation", false)]
    public void Banned_literal_registry_reaches_every_shape_it_claims(string text, bool expected) =>
        Assert.Equal(expected, BannedLiterals.Any(entry => entry.Pattern.IsMatch(text)));
}
