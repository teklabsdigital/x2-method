using Kernel.App.Notes;
using Kernel.App.Platform.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace Kernel.Persistence.Notes;

/// <summary>
/// Bounded, untracked reads with an explicit tenant filter (DATA-2, X-1). The tenant Where is the primary
/// read-side scoping; there is no EF global query filter in the skeleton (defense-in-depth only, per project).
/// </summary>
public sealed class EfNoteStore(KernelDbContext db, ITenantScope tenantScope) : INoteStore
{
    public async Task AddAsync(Note note, CancellationToken cancellationToken = default)
    {
        db.Notes.Add(note);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Note>> ListAsync(NoteCursor? before, int limit, CancellationToken cancellationToken = default)
    {
        limit = Math.Clamp(limit, 1, INoteStore.MaxPageSize); // DATA-2 hard bound at the store, so a direct caller cannot read unbounded
        var tenantId = tenantScope.Current;
        var query = db.Notes.AsNoTracking().Where(n => n.TenantId == tenantId);

        if (before is { } cursor)
        {
            // Keyset by (CreatedAtUtc, Id): Id breaks timestamp ties so a page boundary never drops or repeats a row.
            query = query.Where(n =>
                n.CreatedAtUtc < cursor.CreatedAtUtc
                || (n.CreatedAtUtc == cursor.CreatedAtUtc && n.Id.CompareTo(cursor.Id) < 0));
        }

        return await query
            .OrderByDescending(n => n.CreatedAtUtc)
            .ThenByDescending(n => n.Id)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public Task<Note?> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var tenantId = tenantScope.Current;
        return db.Notes
            .AsNoTracking()
            .Where(n => n.TenantId == tenantId)
            .FirstOrDefaultAsync(n => n.Id == id, cancellationToken);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var tenantId = tenantScope.Current;
        var note = await db.Notes
            .Where(n => n.TenantId == tenantId)
            .FirstOrDefaultAsync(n => n.Id == id, cancellationToken);

        if (note is null)
        {
            return false;
        }

        db.Notes.Remove(note);
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
