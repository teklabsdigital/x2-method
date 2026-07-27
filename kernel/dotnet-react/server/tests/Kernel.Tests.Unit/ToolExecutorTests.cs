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
    // An independently written floor of identity-shaped argument names. NOT derived from ServerOwnedKeys: the point
    // is to catch that registry shrinking, and a list read out of it shrinks with it (the E-30 lesson). Five of
    // these survived the twenty-one entry equality-matched set this replaced, `workspaceId` and `accountId` among
    // them, while that set's own comment claimed parity with the URL and EF-model guards (E-53).
    [Theory]
    [InlineData("tenantId")]
    [InlineData("tenant_id")]
    [InlineData("TenantIdentifier")]
    [InlineData("orgId")]
    [InlineData("organizationId")]
    [InlineData("organisation_id")]
    [InlineData("workspaceId")]
    [InlineData("workspaceSlug")]
    [InlineData("accountId")]
    [InlineData("userId")]
    [InlineData("user_id")]
    [InlineData("actorId")]
    [InlineData("sub")]
    [InlineData("oid")]
    [InlineData("tid")]
    [InlineData("roles")]
    [InlineData("scope")]
    [InlineData("permissions")]
    [InlineData("act")]
    [InlineData("on_behalf_of")]
    public void An_identity_shaped_argument_name_is_server_owned(string key) =>
        Assert.True(ToolExecutor.IsServerOwned(key),
            $"'{key}' is not recognised as server-owned, so an actor could supply it and the executor would merge it (AI-1, E-53).");

    // The cost side, asserted rather than described. Every one of these is an argument a real tool would declare,
    // and every one of them is a word this comparison could reach if the wrong match mode were chosen: `scopeOfWork`
    // and `subtotal` are why the claim vocabulary is Whole rather than Run, and `origin` is the header the sibling
    // edition rejected a prefix rule over.
    [Theory]
    [InlineData("cursor")]
    [InlineData("limit")]
    [InlineData("title")]
    [InlineData("origin")]
    [InlineData("scopeOfWork")]
    [InlineData("subtotal")]
    [InlineData("roleplayPrompt")]
    [InlineData("groupBy")]
    [InlineData("noteId")]
    [InlineData("activity")]
    public void An_ordinary_tool_argument_is_not_stripped(string key) =>
        Assert.False(ToolExecutor.IsServerOwned(key),
            $"'{key}' is wrongly treated as server-owned, so the chokepoint silently eats a legitimate tool argument (AI-1).");

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
