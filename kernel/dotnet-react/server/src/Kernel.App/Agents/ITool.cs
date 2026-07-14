namespace Kernel.App.Agents;

/// <summary>
/// A capability an AI actor may invoke. Tools receive arguments only through the <see cref="ToolExecutor"/>
/// chokepoint, never directly, so identity and tenant are always server-injected (AI-1). A read-only tool
/// declares <see cref="IsReadOnly"/> true and proves it with a guard test (AI-2).
/// </summary>
public interface ITool
{
    string Name { get; }

    bool IsReadOnly { get; }

    Task<object?> InvokeAsync(IReadOnlyDictionary<string, object?> arguments, CancellationToken cancellationToken = default);
}
