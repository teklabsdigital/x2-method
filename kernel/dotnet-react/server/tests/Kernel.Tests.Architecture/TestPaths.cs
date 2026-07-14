using Xunit;

namespace Kernel.Tests.Architecture;

/// <summary>
/// Shared filesystem anchors for the source-scan guards, so the walk-up-to-Kernel.sln logic and the
/// generated-file filter live in exactly one place instead of being copied into each scan test.
/// </summary>
internal static class TestPaths
{
    public static string ServerRoot { get; } = FindServerRoot();

    public static string SrcRoot { get; } = Path.Combine(ServerRoot, "src");

    public static string TestsRoot { get; } = Path.Combine(ServerRoot, "tests");

    /// <summary>All non-generated C# source files under src/ (excludes bin, obj, and EF Migrations).</summary>
    public static IEnumerable<string> SourceFiles() =>
        Directory.EnumerateFiles(SrcRoot, "*.cs", SearchOption.AllDirectories).Where(NotGenerated);

    public static bool NotGenerated(string file) =>
        !file.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}", StringComparison.Ordinal) &&
        !file.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}", StringComparison.Ordinal) &&
        !file.Contains($"{Path.DirectorySeparatorChar}Migrations{Path.DirectorySeparatorChar}", StringComparison.Ordinal);

    private static string FindServerRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null && !File.Exists(Path.Combine(dir.FullName, "Kernel.sln")))
        {
            dir = dir.Parent;
        }

        Assert.NotNull(dir);
        return dir!.FullName;
    }
}
