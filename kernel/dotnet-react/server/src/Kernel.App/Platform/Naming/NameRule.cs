namespace Kernel.App.Platform.Naming;

/// <summary>One entry in a name registry, and how it is allowed to match (see <see cref="NameComparison"/>).</summary>
public readonly record struct NameRule(string Entry, NameMatchMode Mode)
{
    public static NameRule Rule(string entry) => new(entry, NameMatchMode.Run);

    public static NameRule Whole(string entry) => new(entry, NameMatchMode.Whole);
}
