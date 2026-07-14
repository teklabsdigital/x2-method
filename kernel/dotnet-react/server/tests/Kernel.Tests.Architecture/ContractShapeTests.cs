using System.Reflection;
using Kernel.App.Notes;
using Kernel.Contracts.Notes;
using Xunit;

namespace Kernel.Tests.Architecture;

/// <summary>
/// SEC-2 anti-mass-assignment. Request contracts carry no server-controlled field, and App/Api declare no
/// request/response types at all (they belong in Kernel.Contracts).
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
            foreach (var property in type.GetProperties(BindingFlags.Public | BindingFlags.Instance))
            {
                Assert.False(ServerControlledFields.Names.Contains(property.Name, StringComparer.OrdinalIgnoreCase),
                    $"Request contract '{type.Name}' exposes server-controlled field '{property.Name}' (SEC-2 anti-mass-assignment).");
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
