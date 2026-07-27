using System.Text.Json;
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

    // -------------------------------------------------------------------------------------------------------
    // CFG-1's second closure route: "a script never duplicates a committed configuration value, it reads it."
    //
    // That sentence is in the claim's statement and it is the second half of the harm the claim was minted from:
    // the pilot hardcoded a model id in Program.cs, and then duplicated committed issuer and audience values into
    // a script so the two copies could drift. The registry above closes the first half. The second half was
    // enforced by nothing for three rounds while this row's own mechanism text described the current state of
    // `e2e.sh` as though it were a mechanism (E-13, E-36). Appending literal issuer and audience values to
    // `e2e.sh` left the suite at 100 passed.
    //
    // The comparison runs the other way round from the registry above. The registry knows the shapes it bans and
    // looks for them; this knows nothing in advance, reads the values out of the committed appsettings, and looks
    // for THOSE. It therefore needs no entry when a project adds a setting, which is why this obligation can be
    // `proven` where the registry obligation is `patterned`.
    // -------------------------------------------------------------------------------------------------------

    /// <summary>
    /// An assignment in a shell script: `NAME=value`, `NAME="value"`, `export NAME='value'`, and the inline
    /// environment prefix form (`NAME=value cmd ...`) which is how a script most often passes a setting on.
    /// A right-hand side containing `$` or a backtick is a READ, not a literal, and is deliberately unmatched:
    /// reading the value is exactly what the claim asks for.
    /// </summary>
    private static readonly Regex ShellAssignment = new(
        """(?<![\w$])(?:export\s+)?(?<name>[A-Za-z_][A-Za-z0-9_]*)=(?:"(?<value>[^"$`]*)"|'(?<value>[^']*)'|(?<value>[^\s"'$`;&|()<>]+))""",
        RegexOptions.Compiled);

    /// <summary>A quoted literal anywhere else: an argument, a header, a here-doc line. The duplication the claim
    /// forbids is the VALUE appearing in the script, and it does not stop being a duplicate because it was passed
    /// straight to a command instead of being parked in a variable first.</summary>
    private static readonly Regex QuotedLiteral = new("""
        "(?<value>[^"$`]*)"|'(?<value>[^']*)'
        """, RegexOptions.Compiled | RegexOptions.IgnorePatternWhitespace);

    /// <summary>
    /// A YAML mapping entry, which is the form a workflow's `env:` block writes a setting in. The separator is a
    /// colon followed by whitespace, and the whitespace is what makes this safe: `http://localhost:5080` and
    /// `Server=localhost,1433` both carry a colon and neither carries one followed by a space.
    /// </summary>
    private static readonly Regex YamlEntry = new(
        """^\s*(?<name>[A-Za-z_][A-Za-z0-9_.-]*):[ \t]+(?:"(?<value>[^"$`]*)"|'(?<value>[^']*)'|(?<value>[^\s#][^#\r\n]*))""",
        RegexOptions.Compiled | RegexOptions.Multiline);

    [Fact]
    public void No_shipped_script_duplicates_a_committed_configuration_value()
    {
        var settings = CommittedSettings();
        var scripts = ShippedScripts();

        // Both extent assertions, and both are the E-30 shape rather than defensive coding. This scan is a
        // comparison of two sets read off disk, and either set arriving empty makes it pass while asserting
        // nothing. The registry scan above needed a Theory to prove it reached anything; this one needs to know
        // its inputs are real.
        Assert.True(settings.Count > 0,
            "CFG-1: no value was read out of the committed appsettings, so the duplication scan compared scripts against nothing (E-30).");
        Assert.True(scripts.Count > 0,
            "CFG-1: no shipped script was found, so the duplication scan compared the committed values against nothing (E-30).");

        var declaredKeys = settings.Keys.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var keysByValue = settings
            .GroupBy(entry => entry.Value, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => string.Join(" and ", group.Select(entry => entry.Key)), StringComparer.Ordinal);

        var violations = new List<string>();
        foreach (var script in scripts)
        {
            var yaml = Path.GetExtension(script) is ".yml" or ".yaml";

            foreach (var (value, variable) in ScriptLiterals(File.ReadAllText(script), yaml))
            {
                if (!keysByValue.TryGetValue(value, out var keys))
                {
                    continue;
                }

                // The sanctioned fourth home, and its limit. CFG-1 permits overriding a setting through the
                // ambient environment provided the read resolves through the declared configuration surface under
                // a name derived from a declared key, so `Logging__LogLevel__Default=Warning` over a committed
                // `Information` is the claim working. An override set to the value ALREADY COMMITTED is not an
                // override, it is a copy, and it is the copy the claim was minted from: the harm is "the two
                // copies could drift", and a redundant override drifts exactly as a duplicated literal does. This
                // distinction is not decoration. Without it the scan exempted `Jwt__Issuer: kernel` in the CI
                // workflow, which is a copy of the committed issuer sitting in the file that decides whether the
                // build is green (E-75).
                var key = variable?.Replace("__", ":", StringComparison.Ordinal);
                if (key is not null && declaredKeys.Contains(key) && !string.Equals(settings[key], value, StringComparison.Ordinal))
                {
                    continue;
                }

                violations.Add(
                    $"{Path.GetFileName(script)}: the literal '{value}' duplicates committed configuration {keys}{(variable is null ? string.Empty : $" (assigned to {variable})")}. CFG-1: a script never duplicates a committed configuration value, it reads it (E-13, E-36).");
            }
        }

        Assert.True(violations.Count == 0, string.Join(Environment.NewLine, violations));
    }

    /// <summary>
    /// The extent of the literal parser, driven by a floor written from what a shell script can look like rather
    /// than from what these five scripts happen to contain. Without it, a parser that matched nothing would leave
    /// the scan above green forever, which is the same defect E-29 found in the registry beside it.
    /// </summary>
    [Theory]
    // Duplications, in the forms a script writes them.
    [InlineData("""ISSUER="kernel" """, "kernel", "ISSUER")]
    [InlineData("AUDIENCE=kernel", "kernel", "AUDIENCE")]
    [InlineData("export ISSUER='kernel'", "kernel", "ISSUER")]
    [InlineData("""node mint.mjs "kernel" --scope all""", "kernel", null)]
    [InlineData("""ISS="kernel" node mint.mjs""", "kernel", "ISS")]
    public void The_script_literal_parser_reaches_the_forms_a_script_writes(string line, string value, string? variable)
    {
        var literals = ScriptLiterals(line).ToList();

        Assert.True(literals.Any(literal => literal.Value == value && literal.Variable == variable),
            $"CFG-1: the parser read {(literals.Count == 0 ? "nothing" : string.Join(", ", literals.Select(l => $"'{l.Value}' from {l.Variable ?? "no variable"}")))} out of `{line}`, and the floor says '{value}' from {variable ?? "no variable"}.");
    }

    /// <summary>The other direction: a right-hand side that READS a value is what the claim asks for, so the
    /// parser must not report it. Every case here is a line the shipped scripts actually contain.</summary>
    [Theory]
    [InlineData("""ISSUER="$(node -e "process.stdout.write(cfg.Jwt.Issuer)")" """)]
    [InlineData("""HARN_JWT_ISSUER="$ISSUER" node "$MINT" """)]
    [InlineData("""BASE_URL="${HARN_BASE_URL:-http://localhost:5080}" """)]
    public void The_script_literal_parser_does_not_report_a_read(string line) =>
        Assert.True(ScriptLiterals(line).All(literal => !literal.Value.Contains("Issuer", StringComparison.Ordinal) && literal.Value != "kernel"),
            $"CFG-1: the parser treated a read as a literal in `{line}`, which would fail the build for doing exactly what the claim requires.");

    private readonly record struct ScriptLiteral(string Value, string? Variable);

    private static IEnumerable<ScriptLiteral> ScriptLiterals(string source, bool yaml = false)
    {
        var text = MaskSubstitutions(source);
        var assigned = new List<(int Start, int End)>();

        // A workflow carries both forms at once: `env:` entries in YAML mapping form, and shell inside its `run:`
        // blocks. Both passes run over a workflow; only the shell pass runs over a shell script, because a YAML
        // rule applied to shell reads every `# Note: something` comment as an assignment.
        if (yaml)
        {
            foreach (Match match in YamlEntry.Matches(text))
            {
                var entry = match.Groups["value"].Value.Trim();
                if (entry.Length > 0)
                {
                    yield return new ScriptLiteral(entry, match.Groups["name"].Value);
                }
            }
        }

        foreach (Match match in ShellAssignment.Matches(text))
        {
            var value = match.Groups["value"];
            assigned.Add((value.Index, value.Index + value.Length));

            if (value.Value.Length > 0)
            {
                yield return new ScriptLiteral(value.Value, match.Groups["name"].Value);
            }
        }

        foreach (Match match in QuotedLiteral.Matches(text))
        {
            var value = match.Groups["value"];

            // Already reported with its variable name, and reporting it twice would lose the name that decides
            // whether it is the sanctioned fourth home.
            if (value.Value.Length == 0 || assigned.Any(span => value.Index >= span.Start && value.Index < span.End))
            {
                continue;
            }

            yield return new ScriptLiteral(value.Value, null);
        }
    }

    /// <summary>
    /// Blank out every command substitution, parameter expansion and backtick span, masking with `$` so that the
    /// enclosing literal is disqualified by the same rule that disqualifies any other read.
    ///
    /// This exists because the negative control below caught the parser without it. `ISSUER="$(node -e
    /// "process.stdout.write(cfg.Jwt.Issuer)")"` is the canonical CORRECT read, the exact line CFG-1 asks a script
    /// to write, and the quoted-literal pass walked into the middle of it and came out with the node program's own
    /// text as a script literal. Harmless against the shipped tree, where no such fragment equals a committed
    /// value, and a false positive waiting for the first script that greps a value out with a quoted pattern. A
    /// guard that fails the build for obeying the claim gets deleted by whoever hits it, so the false-positive
    /// direction is the one that decides whether this guard survives.
    /// </summary>
    private static string MaskSubstitutions(string text)
    {
        var masked = text.ToCharArray();

        for (var i = 0; i < masked.Length; i++)
        {
            var span = SubstitutionLength(text, i);
            if (span == 0)
            {
                continue;
            }

            for (var j = i; j < i + span; j++)
            {
                masked[j] = '$';
            }

            i += span - 1;
        }

        return new string(masked);
    }

    /// <summary>The length of the substitution starting at `start`, or 0 if none does. Nesting is tracked, because
    /// `$(node -e "$(cat x)")` closes twice and a first-match scan would end the span in the wrong place.</summary>
    private static int SubstitutionLength(string text, int start)
    {
        if (text[start] == '`')
        {
            var close = text.IndexOf('`', start + 1);
            return close < 0 ? text.Length - start : close - start + 1;
        }

        if (text[start] != '$' || start + 1 >= text.Length || (text[start + 1] != '(' && text[start + 1] != '{'))
        {
            return 0;
        }

        var open = text[start + 1];
        var shut = open == '(' ? ')' : '}';
        var depth = 0;

        for (var i = start + 1; i < text.Length; i++)
        {
            if (text[i] == open)
            {
                depth++;
            }
            else if (text[i] == shut && --depth == 0)
            {
                return i - start + 1;
            }
        }

        return text.Length - start;
    }

    /// <summary>Every leaf value in the committed appsettings, keyed by its configuration key. The committed
    /// files ONLY: a value in user-secrets is SEC-5's, and a value a script duplicates from there is a secret in
    /// a script, which `secret-scan.mjs` owns.</summary>
    private static Dictionary<string, string> CommittedSettings()
    {
        var settings = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        var apiRoot = Path.Combine(TestPaths.ServerRoot, "src", "Kernel.Api");

        foreach (var file in Directory.EnumerateFiles(apiRoot, "appsettings*.json", SearchOption.TopDirectoryOnly))
        {
            using var document = JsonDocument.Parse(File.ReadAllText(file));
            Flatten(document.RootElement, prefix: string.Empty, settings);
        }

        return settings;
    }

    private static void Flatten(JsonElement element, string prefix, Dictionary<string, string> into)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                foreach (var property in element.EnumerateObject())
                {
                    Flatten(property.Value, prefix.Length == 0 ? property.Name : $"{prefix}:{property.Name}", into);
                }

                break;

            case JsonValueKind.Array:
                var index = 0;
                foreach (var item in element.EnumerateArray())
                {
                    Flatten(item, $"{prefix}:{index++}", into);
                }

                break;

            case JsonValueKind.Null or JsonValueKind.Undefined:
                break;

            default:
                var text = element.ValueKind == JsonValueKind.String ? element.GetString()! : element.GetRawText();
                if (text.Length > 0)
                {
                    into[prefix] = text;
                }

                break;
        }
    }

    /// <summary>
    /// The files this scan calls a script: the edition's shell scripts and its CI workflows. A workflow is a
    /// script by every reading that matters here. It ships, it orchestrates the system, it sets the same
    /// environment variables `e2e.sh` sets, and it is where the duplication actually was: widening this method to
    /// include it turned the scan red on two live values (E-75).
    ///
    /// It is a list, and CFG-1's completeness obligation says the enumeration should be "a rule the test can
    /// check rather than a list of directories somebody maintains". This list is not that rule, which is why the
    /// obligation is `patterned`. What blocks the rule is not effort: the shipped tree also contains a
    /// `.vscode/tasks.json` whose window group is coincidentally named `kernel` and a secret-scan fixture line
    /// that quotes `"Issuer": "kernel"` as test data, so a scan over every shipped file reports both. Widening
    /// needs a carve-out with a justification field, which is a design decision and not a wider glob.
    /// </summary>
    private static IReadOnlyList<string> ShippedScripts()
    {
        var editionRoot = Directory.GetParent(TestPaths.ServerRoot)!.FullName;

        return Surface(Path.Combine(editionRoot, "scripts"), "*.sh")
            .Concat(Surface(Path.Combine(editionRoot, ".github", "workflows"), "*.yml"))
            .Concat(Surface(Path.Combine(editionRoot, ".github", "workflows"), "*.yaml"))
            .ToList();

        static IEnumerable<string> Surface(string root, string pattern) =>
            Directory.Exists(root) ? Directory.EnumerateFiles(root, pattern, SearchOption.TopDirectoryOnly) : [];
    }
}
