using System.Text.Json;
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
    private static readonly string[] SecretShapedKeys =
        ["password", "pwd", "secret", "apikey", "api_key", "accesskey", "privatekey", "token", "signingkey"];

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

                if (SecretShapedKeys.Any(k => leafKey.Contains(k, StringComparison.OrdinalIgnoreCase)) && !IsPlaceholder(value))
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
