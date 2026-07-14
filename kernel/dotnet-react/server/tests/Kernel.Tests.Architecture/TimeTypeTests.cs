using System.Reflection;
using System.Runtime.CompilerServices;
using Kernel.App.Notes;
using Kernel.Contracts.Notes;
using Kernel.Persistence;
using Xunit;

namespace Kernel.Tests.Architecture;

/// <summary>
/// TIME-1. No System.DateTime anywhere in the public surface of Contracts, App, or Persistence (recursing through
/// Nullable, arrays, and generic arguments). DateTimeOffset, DateOnly, and TimeOnly are allowed. Persistence is
/// included deliberately: it closes the gap the reference verification found (a persistence-layer DateTime slips
/// past a scan that only covers contracts).
/// </summary>
public sealed class TimeTypeTests
{
    [Fact]
    public void No_public_surface_uses_DateTime()
    {
        var assemblies = new[]
        {
            typeof(NoteResponse).Assembly,
            typeof(NoteService).Assembly,
            typeof(KernelDbContext).Assembly,
        };

        foreach (var assembly in assemblies)
        {
            foreach (var type in assembly.GetTypes().Where(IsInspectable))
            {
                foreach (var (member, memberType) in PublicSurface(type))
                {
                    Assert.False(MentionsDateTime(memberType),
                        $"{type.FullName}.{member} uses System.DateTime (TIME-1). Use DateTimeOffset, DateOnly, or TimeOnly.");
                }
            }
        }
    }

    // Include nested public types (they report IsNestedPublic, not IsPublic).
    private static bool IsInspectable(Type type) =>
        (type.IsPublic || type.IsNestedPublic) && !type.IsDefined(typeof(CompilerGeneratedAttribute), false);

    private static bool IsFramework(Type type) =>
        type.Namespace is null
        || type.Namespace.StartsWith("System", StringComparison.Ordinal)
        || type.Namespace.StartsWith("Microsoft", StringComparison.Ordinal);

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
