using System.Reflection;
using System.Runtime.CompilerServices;
using Xunit;

namespace Kernel.Tests.Architecture;

/// <summary>
/// TIME-1. No System.DateTime anywhere in the public surface of any layer this server declares (recursing through
/// Nullable, arrays, and generic arguments). DateTimeOffset, DateOnly, and TimeOnly are allowed.
///
/// The layer set is DERIVED, not listed. E-15 is the record of what a hand-written list did here: this test named
/// Contracts, App and Persistence, and a naive DateTime on a public type in Kernel.Api left all 49 tests green
/// while the identical type one assembly over turned them red. The omission looked exactly like coverage, which
/// is TIME-1's own argument for a rule the test can check: "a layer that exists and is not in the enumeration
/// fails the build too, which is the part that makes the closure checkable rather than asserted".
///
/// So the enumeration is every project under server/src, taken from the filesystem, and a layer whose assembly is
/// not beside the test binary fails <see cref="Every_declared_layer_is_reachable_by_the_scan"/> instead of being
/// skipped. Adding a layer to the server adds it to this scan with no edit here.
/// </summary>
public sealed class TimeTypeTests
{
    /// <summary>
    /// Every layer the server declares, derived from the projects under src/ rather than from a list in this file.
    /// Tests are not layers: server/tests holds the mechanisms, and a scan fixture carrying a forbidden type on
    /// purpose (this file's own controls, EndpointSpineTests' DeepRequest) is not a declaration of product time.
    /// </summary>
    private static IReadOnlyList<string> DeclaredLayers() =>
        Directory.EnumerateFiles(TestPaths.SrcRoot, "*.csproj", SearchOption.AllDirectories)
            .Where(TestPaths.NotGenerated)
            .Select(project => Path.GetFileNameWithoutExtension(project))
            .OrderBy(name => name, StringComparer.Ordinal)
            .ToList();

    [Fact]
    public void No_public_surface_uses_DateTime()
    {
        foreach (var assembly in DeclaredLayers().Select(LayerAssembly))
        {
            foreach (var type in assembly.GetTypes().Where(IsInspectable))
            {
                foreach (var (member, memberType) in PublicSurface(type))
                {
                    Assert.False(MentionsDateTime(memberType),
                        $"{type.FullName}.{member} in {assembly.GetName().Name} uses System.DateTime (TIME-1). Use DateTimeOffset, DateOnly, or TimeOnly.");
                }
            }
        }
    }

    /// <summary>
    /// The remedy half of TIME-1's completeness obligation, and the half a hand-written list cannot have: a layer
    /// that exists and is not reachable by this scan fails here. A project added under src/ and not referenced by
    /// the architecture test project has no assembly beside the test binary, so it would otherwise be enumerated
    /// and silently skipped, which is E-15 with an extra step.
    ///
    /// The second assertion is the non-vacuity guard on the derivation itself. If the src/ walk returned nothing
    /// (a moved directory, a changed layout), the scan above would pass over an empty set and read green, so the
    /// derived set is cross-checked against a second, independent derivation: the assembly graph of the composed
    /// host. Every Kernel assembly the host actually loads has to be a layer this scan enumerates.
    /// </summary>
    [Fact]
    public void Every_declared_layer_is_reachable_by_the_scan()
    {
        var declared = DeclaredLayers();
        Assert.NotEmpty(declared);

        foreach (var layer in declared)
        {
            LayerAssembly(layer);
        }

        var loaded = typeof(Program).Assembly.GetReferencedAssemblies()
            .Select(reference => reference.Name!)
            .Append(typeof(Program).Assembly.GetName().Name!)
            .Where(name => name.StartsWith("Kernel.", StringComparison.Ordinal))
            .Distinct();

        foreach (var name in loaded)
        {
            Assert.True(declared.Contains(name, StringComparer.Ordinal),
                $"The composed host loads '{name}' and the src/ walk did not enumerate it, so the TIME-1 layer derivation is not seeing what the server is made of.");
        }
    }

    private static Assembly LayerAssembly(string name)
    {
        var path = Path.Combine(AppContext.BaseDirectory, name + ".dll");

        Assert.True(File.Exists(path),
            $"Layer '{name}' is declared under server/src and its assembly is not beside the architecture tests, so the TIME-1 scan cannot reach it (TIME-1: a layer that exists and is not in the enumeration fails the build). Add a ProjectReference from Kernel.Tests.Architecture.");

        return Assembly.LoadFrom(path);
    }

    // Include nested public types (they report IsNestedPublic, not IsPublic).
    private static bool IsInspectable(Type type) =>
        (type.IsPublic || type.IsNestedPublic) && !type.IsDefined(typeof(CompilerGeneratedAttribute), false);

    // A null namespace is the GLOBAL namespace, which is app code and specifically the code in a file with
    // top-level statements. Treating it as framework is how E-6's null-namespace hole and E-15's missing layer met
    // on Program.cs: a public DTO declared there was outside SEC-2's body scan and outside this one at the same
    // time, by two gaps that were never designed to compose. Only System/Microsoft stop the walk now.
    private static bool IsFramework(Type type) =>
        type.Namespace?.StartsWith("System", StringComparison.Ordinal) == true
        || type.Namespace?.StartsWith("Microsoft", StringComparison.Ordinal) == true;

    private static IEnumerable<(string Member, Type Type)> PublicSurface(Type type)
    {
        const BindingFlags flags = BindingFlags.Public | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly;

        // Walk the type's own hierarchy so a DateTime inherited from an app-defined base class (even an internal
        // one) is scanned; stop at the first framework base so object/DbContext members are not swept in.
        for (var current = type; current is not null && !IsFramework(current); current = current.BaseType)
        {
            foreach (var property in current.GetProperties(flags))
            {
                yield return (property.Name, property.PropertyType);
            }

            foreach (var field in current.GetFields(flags))
            {
                yield return (field.Name, field.FieldType);
            }

            foreach (var method in current.GetMethods(flags).Where(m => !m.IsSpecialName))
            {
                yield return ($"{method.Name}()", method.ReturnType);
                foreach (var parameter in method.GetParameters())
                {
                    yield return ($"{method.Name}({parameter.Name})", parameter.ParameterType);
                }
            }

            foreach (var constructor in current.GetConstructors(flags))
            {
                foreach (var parameter in constructor.GetParameters())
                {
                    yield return ($".ctor({parameter.Name})", parameter.ParameterType);
                }
            }
        }
    }

    private static bool MentionsDateTime(Type type)
    {
        type = Nullable.GetUnderlyingType(type) ?? type;
        if (type == typeof(DateTime))
        {
            return true;
        }

        if (type.IsArray)
        {
            return MentionsDateTime(type.GetElementType()!);
        }

        return type.IsGenericType && type.GetGenericArguments().Any(MentionsDateTime);
    }
}
