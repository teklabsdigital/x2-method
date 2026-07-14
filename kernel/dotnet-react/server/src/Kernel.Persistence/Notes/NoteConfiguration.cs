using Kernel.App.Notes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kernel.Persistence.Notes;

public sealed class NoteConfiguration : IEntityTypeConfiguration<Note>
{
    public void Configure(EntityTypeBuilder<Note> builder)
    {
        builder.HasKey(n => new { n.TenantId, n.Id }); // TEN-3: tenant-leading composite key
        builder.Property(n => n.Title).HasMaxLength(Note.TitleMaxLength).IsRequired();
        builder.Property(n => n.Body).HasMaxLength(Note.BodyMaxLength).IsRequired();

        // Covers the keyset scan: tenant filter, CreatedAtUtc range, Id tiebreak (see NoteService cursor decision).
        // Not unique: equal timestamps are legal; the (CreatedAtUtc, Id) cursor keeps paging correct without one.
        builder.HasIndex(n => new { n.TenantId, n.CreatedAtUtc, n.Id });
    }
}
