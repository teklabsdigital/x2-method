using System.Text.Json;
using Kernel.Contracts.Notes;
using Xunit;

namespace Kernel.Tests.Architecture;

/// <summary>
/// CON-2 contract parity. The Note contract is hand-mirrored (C# here, TypeScript on the client), so one shared
/// fixture pins both sides. This is the C# consumer: it reflects the contract types into their camelCase wire
/// names and asserts they equal the shared corpus. The client asserts the same corpus against its own types, so
/// a rename on either side fails that side's build. The fixture is linked into this project (None Include + Link).
/// </summary>
public sealed class ContractParityTests
{
    [Theory]
    [InlineData(typeof(CreateNoteRequest), "createNoteRequest")]
    [InlineData(typeof(NoteResponse), "noteResponse")]
    [InlineData(typeof(NoteListResponse), "noteListResponse")]
    public void Contract_type_matches_the_shared_fixture(Type type, string fixtureKey)
    {
        var expected = Fixture()[fixtureKey].OrderBy(name => name, StringComparer.Ordinal).ToList();
        var actual = type.GetProperties()
            .Select(property => JsonNamingPolicy.CamelCase.ConvertName(property.Name))
            .OrderBy(name => name, StringComparer.Ordinal)
            .ToList();

        Assert.Equal(expected, actual);
    }

    private static Dictionary<string, List<string>> Fixture()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "note-contract.fixture.json");
        using var document = JsonDocument.Parse(File.ReadAllText(path));

        var corpus = new Dictionary<string, List<string>>(StringComparer.Ordinal);
        foreach (var property in document.RootElement.EnumerateObject().Where(p => !p.Name.StartsWith('_')))
        {
            corpus[property.Name] = property.Value.EnumerateArray().Select(element => element.GetString()!).ToList();
        }

        return corpus;
    }
}
