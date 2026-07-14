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
}
