namespace Kernel.App.Platform.Sessions;

/// <summary>
/// Server-side session version per principal (SEC-4). Bumping a user's version immediately invalidates every
/// token minted before the bump, so revocation (role change, password change, sign-out-everywhere) takes
/// effect at once rather than at token expiry.
/// </summary>
public interface ISessionVersionStore
{
    Task<int> GetCurrentAsync(string userId, CancellationToken cancellationToken = default);

    Task BumpAsync(string userId, CancellationToken cancellationToken = default);
}
