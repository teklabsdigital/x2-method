using System.Text.Json;
using Kernel.App.Notes;

namespace Kernel.App.Agents;

/// <summary>
/// AI-2 exemplar: a read-only tool. Its execution path performs no writes, proven by ListNotesToolReadOnlyTests.
/// Capability derives only from the server-injected tenant scope (AI-1), never from actor-supplied content, so a
/// prompt-injected instruction inside a note body cannot widen what this tool can do.
/// </summary>
public sealed class ListNotesTool(NoteService notes) : ITool
{
    public string Name => "notes.list";

    public bool IsReadOnly => true;

    public async Task<object?> InvokeAsync(IReadOnlyDictionary<string, object?> arguments, CancellationToken cancellationToken = default)
    {
        var cursor = arguments.TryGetValue("cursor", out var c) ? AsString(c) : null;
        var limit = arguments.TryGetValue("limit", out var l) ? AsInt(l) : null;
        return await notes.ListAsync(cursor, limit, cancellationToken);
    }

    // Tool arguments come from an untrusted model, deserialized as JSON, so a number arrives as long/double or a
    // JsonElement, never a boxed int. Coerce the common shapes rather than silently dropping the argument.
    private static int? AsInt(object? value) => value switch
    {
        int i => i,
        long l => (int)l,
        double d => (int)d,
        string s when int.TryParse(s, out var parsed) => parsed,
        JsonElement { ValueKind: JsonValueKind.Number } e when e.TryGetInt32(out var parsed) => parsed,
        JsonElement { ValueKind: JsonValueKind.String } e when int.TryParse(e.GetString(), out var parsed) => parsed,
        _ => null,
    };

    private static string? AsString(object? value) => value switch
    {
        string s => s,
        JsonElement { ValueKind: JsonValueKind.String } e => e.GetString(),
        _ => null,
    };
}
