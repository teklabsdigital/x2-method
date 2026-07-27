using System.Reflection;

namespace Kernel.Tests.Architecture;

/// <summary>
/// The one walk over a body type's bindable members, shared by both SEC-2 guards: the composed-host scan in
/// EndpointSpineTests and the request-contract scan in ContractShapeTests.
///
/// It is shared rather than duplicated for the reason E-2 records, and E-2 is about this very file's neighbour.
/// The endpoint scan's `IsBodyDto` was a second, informal implementation of the framework's binding rules living
/// inside an assertion, and it could drift from the real binder in either direction with nothing failing. A second
/// walk here would have been the same defect one level down: two enumerations of "what a caller can populate",
/// diverging silently, each guard green against its own idea of the surface. There is one walk, so there is one
/// idea of the surface.
///
/// Recursive since the E-10 repair, and the depth is the point. Both guards were flat while the README and the
/// SEC-2 conformance row said otherwise, claiming coverage of "nested and immutable constructor-bound DTOs": the
/// constructor half was true and the nested half had never been implemented. A request of the shape
/// `CreateNoteRequest(string Title, AuthorDto Author)` carrying `CreatedBy` on `AuthorDto` passed both. E-10's
/// general statement is that where a mechanism's surface is a nested declaration, the completeness obligation is
/// not "the enumeration cannot miss a member" but "cannot miss a member AT ANY DEPTH", and a scan that stops at
/// level zero satisfies a claim about level zero only.
/// </summary>
internal static class BodyMemberWalk
{
    /// <summary>
    /// Names the JSON binder can populate: public instance properties AND constructor parameters, because an
    /// immutable DTO carries its server-controlled field only as a get-only property fed by the constructor.
    /// </summary>
    public static IEnumerable<string> MemberNames(Type type) => MemberNames(type, []);

    // `seen` is cycle protection, not a depth cap: a self-referential DTO is legal and must terminate, and there
    // is deliberately no maximum depth, because a maximum depth is the same bug with a larger constant.
    private static IEnumerable<string> MemberNames(Type type, HashSet<Type> seen)
    {
        if (!seen.Add(type))
        {
            yield break;
        }

        foreach (var property in type.GetProperties(BindingFlags.Public | BindingFlags.Instance))
        {
            yield return property.Name;

            foreach (var nested in Bindable(property.PropertyType).SelectMany(t => MemberNames(t, seen)))
            {
                yield return nested;
            }
        }

        foreach (var parameter in type.GetConstructors().SelectMany(constructor => constructor.GetParameters()))
        {
            if (parameter.Name is not null)
            {
                yield return parameter.Name;
            }

            foreach (var nested in Bindable(parameter.ParameterType).SelectMany(t => MemberNames(t, seen)))
            {
                yield return nested;
            }
        }
    }

    /// <summary>
    /// The types reachable from a member's declared type that the JSON binder would itself populate: the type,
    /// unwrapped through Nullable, arrays and generic arguments, and only where it is not a leaf the binder fills
    /// from a scalar. `IReadOnlyList&lt;NoteInput&gt;` yields `NoteInput`; `string` and `Guid` yield nothing.
    ///
    /// The leaf test is the NARROW half of E-2's split, and the direction matters as much here as in `IsBodyDto`:
    /// treating a type as a leaf ends the descent, so a wide leaf test is over-exclusion wearing a different hat.
    /// An `IParsable` value object carrying a `CreatedBy` property is a leaf under the URL predicate, and its
    /// members would never be walked.
    /// </summary>
    public static IEnumerable<Type> Bindable(Type type)
    {
        type = Nullable.GetUnderlyingType(type) ?? type;

        if (type.IsArray)
        {
            return Bindable(type.GetElementType()!);
        }

        if (type.IsGenericType)
        {
            return type.GetGenericArguments().SelectMany(Bindable);
        }

        var framework = type.Namespace?.StartsWith("System", StringComparison.Ordinal) == true
            || type.Namespace?.StartsWith("Microsoft", StringComparison.Ordinal) == true;

        return BindsAsScalar(type) || type.IsPrimitive || framework ? [] : [type];
    }

    /// <summary>
    /// Whether the binder fills this type from a single scalar. Shared with the endpoint scan because a leaf for
    /// one guard must be a leaf for the other; two answers to "is this a scalar?" is the drift E-2 is about.
    ///
    /// It deliberately does NOT unwrap arrays or collections. Measured against a real host, `Guid[]` on a POST
    /// arrives as the body, so an array is a body candidate even though each element is scalar.
    /// </summary>
    public static bool BindsAsScalar(Type type)
    {
        type = Nullable.GetUnderlyingType(type) ?? type;

        return type == typeof(string) || type == typeof(Guid) || type.IsPrimitive || type.IsEnum
            || type == typeof(decimal) || type == typeof(DateTimeOffset) || type == typeof(DateTime)
            || type == typeof(DateOnly) || type == typeof(TimeOnly);
    }
}
