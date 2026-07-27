namespace Kernel.App.Platform.Naming;

/// <summary>
/// `Run` matches the entry anywhere inside the name; `Whole` matches only the entire name.
///
/// The distinction exists for one entry and is worth the machinery, for the reason the sibling edition found:
/// SEC-2 forbids "entity ids on create", and `id` as a run matches `parentId`, `noteId` and every other foreign
/// key a legitimate body carries. As a whole-name entry it matches the field the claim is about and nothing else.
/// </summary>
public enum NameMatchMode
{
    Run,
    Whole,
}
