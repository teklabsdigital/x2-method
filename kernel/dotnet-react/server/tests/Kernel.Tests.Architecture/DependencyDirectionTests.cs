using System.Reflection;
using Kernel.App.Notes;
using Kernel.Contracts.Notes;
using Kernel.Persistence;
using NetArchTest.Rules;
using Xunit;

namespace Kernel.Tests.Architecture;

/// <summary>
/// DATA-1 downward-only dependencies, all three members of the claim's mechanism class: no endpoint or host type
/// reaches a store implementation or the DbContext, no persistence type reaches an application service, and store
/// implementations are reachable only through their interfaces.
///
/// Three things here are deliberate and each of them is a repair (E-40, E-41, E-42).
///
/// The host ban is scoped to the whole of `Kernel.Api`, not to `Kernel.Api.Endpoints`. It was the narrower one,
/// and `Kernel.Api.Platform`, which holds the middleware, was therefore unguarded: the claim's own harm paragraph
/// is B2-2 finding "a controller injecting the security database context directly behind an anonymous surface",
/// and the middleware namespace is where an anonymous surface actually lives. `Program` is the composition root
/// and is excluded by construction rather than by an allowlist, because top-level statements put it in the global
/// namespace, which `ResideInNamespace("Kernel.Api")` does not match.
///
/// The two registries are discovered by reflection rather than written by hand, and each is asserted non-empty,
/// so a rename cannot quietly empty one.
///
/// Every selection is asserted non-empty before it is asserted clean. NetArchTest reports success when no type
/// matched, so "no types failed" and "no types were looked at" are the same result; measured on 2026-07-27, a
/// real violation sitting in `Kernel.Api.Endpoints` with the filter pointed at a namespace no type lives in left
/// all 113 tests green. The neutering edit and an ordinary namespace rename are the same edit.
/// </summary>
public sealed class DependencyDirectionTests
{
    private static readonly Assembly App = typeof(NoteService).Assembly;
    private static readonly Assembly Contracts = typeof(NoteResponse).Assembly;
    private static readonly Assembly Persistence = typeof(KernelDbContext).Assembly;
    private static readonly Assembly Api = typeof(Program).Assembly;

    // Application services: the collaborators DATA-1 says persistence must never reach up to.
    private static readonly string[] ApplicationServices = App.GetTypes()
        .Where(type => type is { IsClass: true, IsPublic: true }
            && type.Namespace?.StartsWith("Kernel.App", StringComparison.Ordinal) == true
            && type.Name.EndsWith("Service", StringComparison.Ordinal))
        .Select(type => type.FullName!)
        .OrderBy(name => name, StringComparer.Ordinal)
        .ToArray();

    // Store implementations: persistence classes realizing a store interface that lives in the application layer.
    private static readonly string[] StoreImplementations = Persistence.GetTypes()
        .Where(type => type is { IsClass: true, IsAbstract: false }
            && type.GetInterfaces().Any(contract =>
                contract.Namespace?.StartsWith("Kernel.App", StringComparison.Ordinal) == true
                && contract.Name.EndsWith("Store", StringComparison.Ordinal)))
        .Select(type => type.FullName!)
        .OrderBy(name => name, StringComparer.Ordinal)
        .ToArray();

    [Fact]
    public void The_registries_this_file_bans_against_are_not_empty()
    {
        Assert.NotEmpty(ApplicationServices);
        Assert.NotEmpty(StoreImplementations);
    }

    [Fact]
    public void App_does_not_depend_on_Persistence_or_Api() =>
        AssertClean(Whole(App, "Kernel.App")
            .ShouldNot().HaveDependencyOnAny("Kernel.Persistence", "Kernel.Api").GetResult());

    [Fact]
    public void Contracts_depends_on_no_higher_layer() =>
        AssertClean(Whole(Contracts, "Kernel.Contracts")
            .ShouldNot().HaveDependencyOnAny("Kernel.App", "Kernel.Persistence", "Kernel.Api").GetResult());

    [Fact]
    public void Persistence_does_not_depend_on_Api() =>
        AssertClean(Whole(Persistence, "Kernel.Persistence")
            .ShouldNot().HaveDependencyOn("Kernel.Api").GetResult());

    [Fact]
    public void Persistence_does_not_depend_on_an_application_service() =>
        AssertClean(Whole(Persistence, "Kernel.Persistence")
            .ShouldNot().HaveDependencyOnAny(ApplicationServices).GetResult());

    [Fact]
    public void No_host_type_outside_the_composition_root_depends_on_Persistence() =>
        AssertClean(HostTypes().ShouldNot().HaveDependencyOn("Kernel.Persistence").GetResult());

    [Fact]
    public void Store_implementations_are_named_only_by_the_composition_root()
    {
        AssertClean(HostTypes().ShouldNot().HaveDependencyOnAny(StoreImplementations).GetResult());
        AssertClean(Whole(App, "Kernel.App")
            .ShouldNot().HaveDependencyOnAny(StoreImplementations).GetResult());
    }

    // Everything under Kernel.Api.*, which excludes the top-level Program (global namespace, the composition root).
    private static PredicateList HostTypes() =>
        Selected(Types.InAssembly(Api).That().ResideInNamespace("Kernel.Api"), "Kernel.Api.*");

    private static PredicateList Selected(PredicateList types, string description)
    {
        Assert.True(types.GetTypes().Any(),
            $"The DATA-1 selection '{description}' matched no types, so the assertion below it would pass without looking at anything (E-42).");
        return types;
    }

    // An assembly-wide assertion stays assembly-wide: narrowing it to a namespace prefix here would rebuild
    // E-40 inside the repair for E-40. Only the non-emptiness is added.
    private static Types Whole(Assembly assembly, string description)
    {
        Assert.True(Types.InAssembly(assembly).GetTypes().Any(),
            $"The DATA-1 selection '{description}' matched no types, so the assertion below it would pass without looking at anything (E-42).");
        return Types.InAssembly(assembly);
    }

    private static void AssertClean(TestResult result) =>
        Assert.True(result.IsSuccessful,
            "Illegal dependency direction (DATA-1): " + string.Join(", ", result.FailingTypeNames ?? Enumerable.Empty<string>()));
}
