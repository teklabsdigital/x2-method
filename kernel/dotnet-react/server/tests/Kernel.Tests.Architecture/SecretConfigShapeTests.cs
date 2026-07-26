using System.Text.Json;
using System.Text.RegularExpressions;
using Xunit;

namespace Kernel.Tests.Architecture;

/// <summary>
/// SEC-5 no secret in committed configuration. Scans every committed JSON config file across the server tree (any
/// appsettings*.json and any *.json under a Kernel.* project, wherever a pasted secret realistically lands) for a
/// secret-shaped key holding a real value, or any value carrying an embedded credential (a connection string with
/// a password). The brief only asserted user-secrets was wired; this asserts the actual invariant, so a pasted
/// secret fails the build. Dev secrets (Jwt:Key, the containerized ConnectionStrings:Kernel) live in user-secrets,
/// never here. The CI secret-scan job is the wider net over non-JSON files (.env, source).
/// </summary>
public sealed class SecretConfigShapeTests
{
    // Matched by TOKEN, never by containment. E-11 is the record of what containment did here: the predicate was
    // `SecretShapedKeys.Any(k => leafKey.Contains(k))`, so the leaf key `Key` was tested for whether it CONTAINED
    // "signingkey" and never could, being shorter than every term written to describe it. The edition's principal
    // development secret was the one key shape this list could not see. Tokens make `Key`, `Jwt:Key`, `ApiKey`,
    // `MSSQL_SA_PASSWORD` and `SigningKey` all match while `KeyboardLayout` and `TokenCount` do not.
    //
    // Still a registry, and E-9 is the finding that says so: a novel term carrying a credential escapes it. What
    // it no longer does is miss the terms it already lists. Kept in step with the term list in
    // tools/secret-scan.mjs, which is SEC-5's other half; the two mechanisms are deliberately different in KIND
    // (this one parses config and knows the schema, that one reads every line and knows none of it) because A-3's
    // point is that a pair of mechanisms is only belt-and-braces when their blind spots are independent.
    private static readonly HashSet<string> SecretTerms = new(StringComparer.Ordinal)
    {
        "password", "passwd", "pwd", "passphrase",
        "secret", "secrets",
        "key", "apikey", "accesskey", "privatekey", "signingkey", "secretkey",
        "token", "credential", "credentials", "auth",
        "sas", "dsn",
    };

    [Fact]
    public void No_committed_json_config_holds_a_secret_value()
    {
        // ASP.NET Core's config loader accepts // comments and trailing commas in appsettings, so parse leniently:
        // a legal config comment must not turn into a raw JsonException instead of a clean SEC-5 result.
        var options = new JsonDocumentOptions { CommentHandling = JsonCommentHandling.Skip, AllowTrailingCommas = true };

        foreach (var file in ConfigJsonFiles())
        {
            using var document = JsonDocument.Parse(File.ReadAllText(file), options);
            Inspect(document.RootElement, Path.GetFileName(file), string.Empty);
        }
    }

    // Every JSON config file a developer might paste a secret into: appsettings anywhere, plus any *.json committed
    // under a Kernel.* source project. Machine-generated lock files carry no secret-shaped keys, so they add noise
    // but not false positives; excluding them keeps the scan focused and fast.
    private static IEnumerable<string> ConfigJsonFiles() =>
        Directory.EnumerateFiles(TestPaths.SrcRoot, "*.json", SearchOption.AllDirectories)
            .Where(TestPaths.NotGenerated)
            .Where(file => !Path.GetFileName(file).Equals("packages.lock.json", StringComparison.OrdinalIgnoreCase));

    private static void Inspect(JsonElement element, string file, string keyPath)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                foreach (var property in element.EnumerateObject())
                {
                    Inspect(property.Value, file, keyPath.Length == 0 ? property.Name : $"{keyPath}:{property.Name}");
                }

                break;

            case JsonValueKind.Array:
                foreach (var item in element.EnumerateArray())
                {
                    Inspect(item, file, keyPath);
                }

                break;

            case JsonValueKind.String:
                var value = element.GetString() ?? string.Empty;
                var leafKey = keyPath.Split(':').Last();

                if (IsSecretShaped(leafKey) && !IsPlaceholder(value))
                {
                    Assert.Fail($"{file} key '{keyPath}' is secret-shaped and holds a real value (SEC-5). Move it to user-secrets or a vault.");
                }

                if (ContainsEmbeddedPassword(value) && !IsPlaceholder(value))
                {
                    Assert.Fail($"{file} key '{keyPath}' embeds a credential (SEC-5). Move the connection string to user-secrets.");
                }

                break;
        }
    }

    /// <summary>
    /// Splits a configuration key on camel, Pascal, snake and kebab boundaries and lowercases the parts, so that
    /// a term is matched as a WORD of the key rather than as a substring of it in either direction.
    /// </summary>
    internal static IReadOnlyList<string> Tokenize(string key)
    {
        var spaced = Regex.Replace(key, "([a-z0-9])([A-Z])", "$1 $2");
        spaced = Regex.Replace(spaced, "([A-Z]+)([A-Z][a-z])", "$1 $2");
        return spaced.Split([' ', '_', '-', '.', ':', '/'], StringSplitOptions.RemoveEmptyEntries)
            .Select(part => part.ToLowerInvariant())
            .ToArray();
    }

    internal static bool IsSecretShaped(string key)
    {
        var parts = Tokenize(key);
        if (parts.Any(SecretTerms.Contains))
        {
            return true;
        }

        // Compounds a splitter separates but a reader would not: `Api Key`, `Private Key`.
        return parts.Where((_, i) => i + 1 < parts.Count)
            .Select((part, i) => part + parts[i + 1])
            .Any(SecretTerms.Contains);
    }

    /// <summary>
    /// The predicate's EXTENT, asserted rather than described. E-11's mechanism was described accurately in its
    /// own summary comment and was still blind to the one key the edition actually has, because nothing executed
    /// the description. Every `true` case below is a spelling the containment predicate missed; every `false`
    /// case is a shape a widening of this list would break. E-10's lesson applied to a registry: red-green proof
    /// establishes that a guard binds and establishes nothing about how far it reaches, so the reach is a test.
    /// </summary>
    [Theory]
    // Caught now, missed by the containment predicate this replaced.
    [InlineData("Key", true)]
    [InlineData("SigningKey", true)]
    [InlineData("ApiKey", true)]
    [InlineData("api_key", true)]
    [InlineData("MSSQL_SA_PASSWORD", true)]
    [InlineData("Password", true)]
    [InlineData("accessKey", true)]
    [InlineData("ClientSecret", true)]
    [InlineData("Auth", true)]
    // The cost, asserted as a PASSING case rather than wished away. `TokenCount` is a token of the registry and
    // is therefore secret shaped to this predicate, which is a false positive and is exactly the price E-9 says
    // token matching buys. It is written down as `true` so that narrowing the registry later fails this test and
    // has to be argued, instead of silently changing what the mechanism covers.
    [InlineData("TokenCount", true)]
    // Not secret shaped. `KeyboardLayout` and `Monkey` are the shapes CONTAINMENT matching would get wrong in the
    // other direction, and they are the reason this is a token split rather than a substring search.
    [InlineData("KeyboardLayout", false)]
    [InlineData("Issuer", false)]
    [InlineData("Audience", false)]
    [InlineData("Monkey", false)]
    [InlineData("Default", false)]
    public void Secret_shaped_key_detection_covers_every_spelling_of_the_editions_own_keys(string key, bool expected) =>
        Assert.Equal(expected, IsSecretShaped(key));

    private static bool IsPlaceholder(string value) =>
        string.IsNullOrWhiteSpace(value)
        || value.Contains('{') || value.Contains('<') || value.Contains("$(", StringComparison.Ordinal)
        || value.Contains("user-secret", StringComparison.OrdinalIgnoreCase)
        || value.Contains("placeholder", StringComparison.OrdinalIgnoreCase);

    private static bool ContainsEmbeddedPassword(string value)
    {
        var index = value.IndexOf("password=", StringComparison.OrdinalIgnoreCase);
        if (index < 0)
        {
            index = value.IndexOf("pwd=", StringComparison.OrdinalIgnoreCase);
        }

        if (index < 0)
        {
            return false;
        }

        var after = value[(value.IndexOf('=', index) + 1)..].TrimStart();
        return after.Length > 0 && after[0] != ';';
    }
}
