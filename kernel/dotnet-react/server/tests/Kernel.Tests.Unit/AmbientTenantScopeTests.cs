using Kernel.App.Platform.Tenancy;
using Xunit;

namespace Kernel.Tests.Unit;

/// <summary>TEN-2. The ambient scope throws when unset, establishes and restores across Begin/Dispose, and nests.</summary>
public sealed class AmbientTenantScopeTests
{
    [Fact]
    public void Current_throws_when_scope_is_unset()
    {
        var scope = new AmbientTenantScope();
        Assert.False(scope.IsEstablished);
        Assert.Throws<InvalidOperationException>(() => scope.Current);
    }

    [Fact]
    public void Begin_establishes_scope_and_dispose_restores_it()
    {
        var scope = new AmbientTenantScope();
        var tenant = Guid.NewGuid();

        using (scope.Begin(tenant))
        {
            Assert.True(scope.IsEstablished);
            Assert.Equal(tenant, scope.Current);
        }

        Assert.False(scope.IsEstablished);
    }

    [Fact]
    public void Begin_nests_and_restores_the_previous_tenant()
    {
        var scope = new AmbientTenantScope();
        var outer = Guid.NewGuid();
        var inner = Guid.NewGuid();

        using (scope.Begin(outer))
        {
            Assert.Equal(outer, scope.Current);
            using (scope.Begin(inner))
            {
                Assert.Equal(inner, scope.Current);
            }

            Assert.Equal(outer, scope.Current);
        }
    }

    [Fact]
    public void Begin_rejects_the_empty_tenant()
    {
        var scope = new AmbientTenantScope();
        Assert.Throws<ArgumentException>(() => scope.Begin(Guid.Empty));
    }
}
