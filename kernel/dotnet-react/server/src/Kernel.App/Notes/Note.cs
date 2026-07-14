using Kernel.App.Platform.Tenancy;

namespace Kernel.App.Notes;

/// <summary>Exemplar tenant-owned entity. Pure data; persistence shape lives in NoteConfiguration.</summary>
public sealed class Note : ITenantOwned
{
    public const int TitleMaxLength = 200;
    public const int BodyMaxLength = 8000;

    public Guid TenantId { get; set; }

    public Guid Id { get; set; }

    public required string Title { get; set; }

    public required string Body { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; }
}
