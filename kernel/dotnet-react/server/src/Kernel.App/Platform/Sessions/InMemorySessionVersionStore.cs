using System.Collections.Concurrent;

namespace Kernel.App.Platform.Sessions;

/// <summary>
/// In-memory session versions, default 1. Registered singleton. The EF-backed store is owed at the first
/// identity slice (see the conformance table); this keeps the skeleton dependency-free while the mechanism
/// and its tests are real.
/// </summary>
public sealed class InMemorySessionVersionStore : ISessionVersionStore
{
    private readonly ConcurrentDictionary<string, int> _versions = new();

    public Task<int> GetCurrentAsync(string userId, CancellationToken cancellationToken = default) =>
        Task.FromResult(_versions.GetOrAdd(userId, 1));

    public Task BumpAsync(string userId, CancellationToken cancellationToken = default)
    {
        _versions.AddOrUpdate(userId, 2, (_, current) => current + 1);
        return Task.CompletedTask;
    }
}
