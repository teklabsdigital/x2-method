using System.Reflection;
using Kernel.App.Notes;
using Kernel.Contracts.Notes;
using Kernel.Persistence;
using NetArchTest.Rules;
using Xunit;

namespace Kernel.Tests.Architecture;

/// <summary>
/// DATA-1 downward-only dependencies. Contracts references nothing; App references only Contracts; Persistence
/// does not reach the Api; and Api endpoints go through App services, never Persistence directly.
/// </summary>
public sealed class DependencyDirectionTests
{
    private static readonly Assembly App = typeof(NoteService).Assembly;
    private static readonly Assembly Contracts = typeof(NoteResponse).Assembly;
    private static readonly Assembly Persistence = typeof(KernelDbContext).Assembly;
    private static readonly Assembly Api = typeof(Program).Assembly;

    [Fact]
    public void App_does_not_depend_on_Persistence_or_Api() =>
        AssertClean(Types.InAssembly(App).ShouldNot().HaveDependencyOnAny("Kernel.Persistence", "Kernel.Api").GetResult());

    [Fact]
    public void Contracts_depends_on_no_higher_layer() =>
        AssertClean(Types.InAssembly(Contracts).ShouldNot().HaveDependencyOnAny("Kernel.App", "Kernel.Persistence", "Kernel.Api").GetResult());

    [Fact]
    public void Persistence_does_not_depend_on_Api() =>
        AssertClean(Types.InAssembly(Persistence).ShouldNot().HaveDependencyOn("Kernel.Api").GetResult());

    [Fact]
    public void Endpoints_do_not_depend_on_Persistence() =>
        AssertClean(Types.InAssembly(Api).That().ResideInNamespace("Kernel.Api.Endpoints")
            .ShouldNot().HaveDependencyOn("Kernel.Persistence").GetResult());

    private static void AssertClean(TestResult result) =>
        Assert.True(result.IsSuccessful,
            "Illegal dependency direction (DATA-1): " + string.Join(", ", result.FailingTypeNames ?? Enumerable.Empty<string>()));
}
