using System.Text.RegularExpressions;
using Xunit;

namespace Kernel.Tests.Architecture;

/// <summary>
/// MOD-2 deterministic naming and placement, by source scan. A file's name and location are a pure function of
/// what it contains, so a generator or reader can jump, never search. One public type per file (name == type
/// name), a closed suffix registry mapped to legal locations, routes declared only in *Endpoints.cs, no EF
/// InMemory in test projects (TEST-1), and UserSecretsId present in the Api csproj (SEC-5).
/// </summary>
public sealed class NamingPlacementTests
{
    private static readonly Regex NamedPublicType = new(
        @"\bpublic\s+(?:sealed\s+|abstract\s+|static\s+|partial\s+|readonly\s+|ref\s+|unsafe\s+)*(?:record\s+struct|record\s+class|class|interface|record|struct|enum)\s+([A-Za-z_][A-Za-z0-9_]*)",
        RegexOptions.Compiled);

    // Delegates are public types too, but their name is not the token after the keyword; count them separately so
    // a second public type declared as a delegate still trips the one-type check.
    private static readonly Regex PublicDelegate = new(
        @"\bpublic\s+(?:sealed\s+|static\s+|unsafe\s+)*delegate\b", RegexOptions.Compiled);

    // Any framework route-binding Map* call (MapGet..MapGroup, MapMethods, MapHub<T>, MapFallback*, bare Map),
    // but NOT a custom Map{Resource}Endpoints aggregator (its name has no route suffix and no "(" after ".Map").
    private static readonly Regex RouteMapping = new(
        @"\.Map(Get|Post|Put|Delete|Patch|Group|Methods|Fallback\w*|Hub[\w<>, ]*|Connection\w*)?\s*\(",
        RegexOptions.Compiled);

    [Fact]
    public void Every_source_file_holds_one_public_type_named_for_the_file()
    {
        foreach (var file in TestPaths.SourceFiles())
        {
            var name = Path.GetFileNameWithoutExtension(file);
            var contractsRoot = Path.Combine(TestPaths.SrcRoot, "Kernel.Contracts") + Path.DirectorySeparatorChar;
            var isContractsFile = file.EndsWith("Contracts.cs", StringComparison.Ordinal) && file.StartsWith(contractsRoot, StringComparison.Ordinal);
            if (name == "Program" || isContractsFile)
            {
                continue; // Program.cs, and *Contracts.cs only under Kernel.Contracts, are the declared exceptions
            }

            var text = File.ReadAllText(file);
            var declared = NamedPublicType.Matches(text).Select(m => m.Groups[1].Value).ToList();
            var total = declared.Count + PublicDelegate.Matches(text).Count;
            Assert.True(total == 1,
                $"{file} declares {total} public types ([{string.Join(", ", declared)}]); expected exactly one (MOD-2).");
            if (declared.Count == 1)
            {
                Assert.True(declared[0] == name,
                    $"{file} declares public type '{declared[0]}' but the file is named '{name}' (MOD-2: file name == type name).");
            }
        }
    }

    [Fact]
    public void Registry_suffixes_live_in_their_legal_location()
    {
        foreach (var file in TestPaths.SourceFiles())
        {
            var name = Path.GetFileName(file);

            // Case-insensitive: NuGet/file names are case-insensitive on Windows, so an EFNoteStore or FooStore.CS
            // must not slip the placement rule on a casing trick.
            if (name.StartsWith("Ef", StringComparison.OrdinalIgnoreCase) && name.EndsWith("Store.cs", StringComparison.OrdinalIgnoreCase))
            {
                AssertUnder(file, "Kernel.Persistence", "Ef*Store");
            }
            else if (name.EndsWith("Store.cs", StringComparison.OrdinalIgnoreCase))
            {
                AssertUnder(file, "Kernel.App", "*Store");
            }

            if (name.EndsWith("Endpoints.cs", StringComparison.OrdinalIgnoreCase))
            {
                AssertUnder(file, Path.Combine("Kernel.Api", "Endpoints"), "*Endpoints");
            }

            if (name.EndsWith("Configuration.cs", StringComparison.OrdinalIgnoreCase))
            {
                AssertUnder(file, "Kernel.Persistence", "*Configuration");
            }

            if (name.EndsWith("Middleware.cs", StringComparison.OrdinalIgnoreCase))
            {
                AssertUnder(file, "Kernel.Api", "*Middleware");
            }

            if (name.EndsWith("Service.cs", StringComparison.OrdinalIgnoreCase))
            {
                AssertUnder(file, "Kernel.App", "*Service");
            }
        }
    }

    [Fact]
    public void Routes_are_declared_only_in_endpoint_files()
    {
        foreach (var file in TestPaths.SourceFiles().Where(f => RouteMapping.IsMatch(File.ReadAllText(f))))
        {
            var underEndpoints = file.Contains(Path.Combine("Kernel.Api", "Endpoints") + Path.DirectorySeparatorChar, StringComparison.Ordinal);
            Assert.True(underEndpoints,
                $"{file} maps routes but is not an *Endpoints.cs file under Kernel.Api/Endpoints (MOD-2/X-2: routes are declared in one place).");
        }
    }

    [Fact]
    public void Test_projects_do_not_reference_ef_in_memory()
    {
        // Case-insensitive (NuGet ids ignore case) and covers Directory.Build.props / Directory.Packages.props, so
        // the ban cannot be evaded by a case variant or a shared props file that no csproj mentions by name.
        var files = Directory.EnumerateFiles(TestPaths.TestsRoot, "*.csproj", SearchOption.AllDirectories)
            .Concat(Directory.EnumerateFiles(TestPaths.ServerRoot, "Directory.Build.props", SearchOption.AllDirectories))
            .Concat(Directory.EnumerateFiles(TestPaths.ServerRoot, "Directory.Packages.props", SearchOption.AllDirectories));

        foreach (var file in files)
        {
            Assert.DoesNotContain("EntityFrameworkCore.InMemory", File.ReadAllText(file), StringComparison.OrdinalIgnoreCase);
        }
    }

    [Fact]
    public void Api_project_declares_a_user_secrets_id()
    {
        var api = File.ReadAllText(Path.Combine(TestPaths.SrcRoot, "Kernel.Api", "Kernel.Api.csproj"));
        Assert.Contains("UserSecretsId", api, StringComparison.Ordinal);
    }

    private static void AssertUnder(string file, string relativeLocation, string kind)
    {
        var legal = Path.Combine(TestPaths.SrcRoot, relativeLocation) + Path.DirectorySeparatorChar;
        Assert.True(file.StartsWith(legal, StringComparison.Ordinal),
            $"{Path.GetFileName(file)} is a {kind} file but is not under {relativeLocation} (MOD-2).");
    }
}
