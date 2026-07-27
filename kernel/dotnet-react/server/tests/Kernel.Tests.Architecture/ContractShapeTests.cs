using Kernel.App.Notes;
using Kernel.Contracts.Notes;
using Xunit;

namespace Kernel.Tests.Architecture;

/// <summary>
/// SEC-2 anti-mass-assignment. Request contracts carry no server-controlled field, and App/Api declare no
/// request/response types at all (they belong in Kernel.Contracts).
///
/// This guard was the last flat one, and it stayed flat and equality-matching for three rounds after both defects
/// were named, on a premise that turned out to be false: three passes recorded that repairing it would burn
/// MOD-2's delta pass. MOD-2's realization is `NamingPlacementTests`; this file names MOD-2 nowhere and its own
/// summary names SEC-2. The constraint was measured and dropped, and S-12 is re-graded on that measurement.
/// </summary>
public sealed class ContractShapeTests
{
    [Fact]
    public void Request_contracts_declare_no_server_controlled_fields()
    {
        var contracts = typeof(CreateNoteRequest).Assembly;

        // Include non-public and nested types: an internal or nested *Request DTO still binds from the body.
        foreach (var type in contracts.GetTypes().Where(t => t.Name.EndsWith("Request", StringComparison.Ordinal)))
        {
            // The SHARED walk, at any depth, and the SHARED comparison. Both halves were repaired for the endpoint
            // scan and left undone here, which made this guard weaker than the claim in two independent ways at
            // once: a nested `AuthorInfo` carrying `CreatedBy` was never enumerated (E-6), and `CreatedByUser` at
            // depth zero walked past an equality match on `createdBy` (E-9). Neither defect was visible from the
            // other guard, because this is the only mechanism that looks at a contract type bound to no route.
            foreach (var name in BodyMemberWalk.MemberNames(type))
            {
                var owned = NameComparison.MatchingRule(ServerControlledFields.Rules, name);
                Assert.True(owned is null,
                    $"Request contract '{type.Name}' exposes server-controlled member '{name}' matching registry entry '{owned?.Entry}' (SEC-2 anti-mass-assignment).");

                // TEN-1's contract half. E-22: the tenant registry was applied to URL parameters and to nothing
                // else, so a contract carrying `WorkspaceId` and `OrganisationId` passed all 100 tests while
                // TEN-1's statement says no request contract carries a tenant identifier field.
                var tenant = NameComparison.MatchingRule(EndpointSpineTests.ForbiddenTenantParams, name);
                Assert.True(tenant is null,
                    $"Request contract '{type.Name}' exposes tenant-shaped member '{name}' matching registry entry '{tenant?.Entry}' (TEN-1). Tenant comes from the validated credential only.");
            }
        }
    }

    [Fact]
    public void App_and_Api_declare_no_request_or_response_types()
    {
        var assemblies = new[] { typeof(NoteService).Assembly, typeof(Program).Assembly };

        foreach (var assembly in assemblies)
        {
            foreach (var type in assembly.GetTypes().Where(t => t.IsPublic))
            {
                var isContractType = type.Name.EndsWith("Request", StringComparison.Ordinal)
                    || type.Name.EndsWith("Response", StringComparison.Ordinal);
                Assert.False(isContractType,
                    $"{assembly.GetName().Name} declares '{type.Name}'; request/response contracts belong in Kernel.Contracts (SEC-2/DATA-1).");
            }
        }
    }
}
