namespace Kernel.App.Notes;

/// <summary>
/// Keyset pagination position (DATA-2). Ordering is (CreatedAtUtc desc, Id desc), so Id is the tiebreaker: a
/// timestamp collision can never drop or duplicate a row across pages, and no unique constraint on time is needed.
/// </summary>
public readonly record struct NoteCursor(DateTimeOffset CreatedAtUtc, Guid Id);
