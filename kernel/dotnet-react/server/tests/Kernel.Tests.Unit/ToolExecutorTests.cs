using Kernel.App.Agents;
using Kernel.App.Platform.Tenancy;
using Xunit;

namespace Kernel.Tests.Unit;

/// <summary>
/// AI-1 chokepoint. Actor-supplied identity/tenant/scope is rejected before the merge (case-insensitive); the
/// server injects tenant from the ambient scope unconditionally; and an unset scope throws so a tool never runs
/// unscoped.
/// </summary>
public sealed class ToolExecutorTests
{
    [Fact]
    public async Task Actor_supplied_identity_is_rejected_and_server_tenant_is_injected()
    {
        var scope = new AmbientTenantScope();
        var tool = new RecordingTool();
        var tenant = Guid.NewGuid();

        using (scope.Begin(tenant))
        {
            await new ToolExecutor(scope).InvokeAsync(tool, new Dictionary<string, object?>
            {
                ["Role"] = "admin",                          // case-insensitive server-owned key
                ["tenantId"] = Guid.NewGuid().ToString(),    // an attacker-supplied tenant
                ["cursor"] = "abc",                          // a benign tool argument
            });
        }

        Assert.False(tool.Received!.ContainsKey("Role"));
        Assert.Equal(tenant, (Guid)tool.Received["tenantId"]!);
        Assert.Equal("abc", tool.Received["cursor"]);
    }

    [Fact]
    public async Task Actor_supplied_identity_nested_in_an_object_or_list_is_rejected()
    {
        var scope = new AmbientTenantScope();
        var tool = new RecordingTool();

        using (scope.Begin(Guid.NewGuid()))
        {
            await new ToolExecutor(scope).InvokeAsync(tool, new Dictionary<string, object?>
            {
                ["filter"] = new Dictionary<string, object?>
                {
                    ["tenantId"] = Guid.NewGuid().ToString(), // smuggled one level down
                    ["roles"] = new List<object?> { "admin" },
                    ["title"] = "keep me",                    // a benign nested field survives
                },
                ["batch"] = new List<object?>
                {
                    new Dictionary<string, object?> { ["orgId"] = "evil", ["q"] = "keep" },
                },
            });
        }

        var filter = Assert.IsAssignableFrom<IReadOnlyDictionary<string, object?>>(tool.Received!["filter"]);
        Assert.False(filter.ContainsKey("tenantId"));
        Assert.False(filter.ContainsKey("roles"));
        Assert.Equal("keep me", filter["title"]);

        var batch = Assert.IsAssignableFrom<System.Collections.IEnumerable>(tool.Received["batch"]);
        var firstItem = Assert.IsAssignableFrom<IReadOnlyDictionary<string, object?>>(batch.Cast<object?>().Single());
        Assert.False(firstItem.ContainsKey("orgId"));
        Assert.Equal("keep", firstItem["q"]);
    }

    [Fact]
    public async Task Server_tenant_is_injected_even_when_the_actor_supplies_nothing()
    {
        var scope = new AmbientTenantScope();
        var tool = new RecordingTool();
        var tenant = Guid.NewGuid();

        using (scope.Begin(tenant))
        {
            await new ToolExecutor(scope).InvokeAsync(tool, new Dictionary<string, object?>());
        }

        Assert.Equal(tenant, (Guid)tool.Received!["tenantId"]!);
    }

    [Fact]
    public async Task Invocation_without_a_scope_throws()
    {
        var executor = new ToolExecutor(new AmbientTenantScope());
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => executor.InvokeAsync(new RecordingTool(), new Dictionary<string, object?>()));
    }

    private sealed class RecordingTool : ITool
    {
        public IReadOnlyDictionary<string, object?>? Received { get; private set; }

        public string Name => "recording";

        public bool IsReadOnly => true;

        public Task<object?> InvokeAsync(IReadOnlyDictionary<string, object?> arguments, CancellationToken cancellationToken = default)
        {
            Received = arguments;
            return Task.FromResult<object?>(null);
        }
    }
}
