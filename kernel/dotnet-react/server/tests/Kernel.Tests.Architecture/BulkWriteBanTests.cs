using System.Text.RegularExpressions;
using Xunit;

namespace Kernel.Tests.Architecture;

/// <summary>
/// TEN-4 and AI-2 backstop. Two families of write bypass the tenancy save guard because they never enter
/// SaveChanges: EF Core set-based and raw-SQL operators (ExecuteUpdate/Delete, ExecuteSql*, FromSql*), and raw
/// ADO.NET reached through the DbConnection (GetDbConnection + a DbCommand executed directly). A read-only tool
/// could mutate through either, so both are banned in src. There is no v1 use for them; a future sanctioned use
/// adds a TEN-5 ledger entry and its own tenant-guarded wrapper, not a bare call here.
/// </summary>
public sealed class BulkWriteBanTests
{
    private static readonly Regex BannedApis = new(
        @"\.(ExecuteUpdate|ExecuteUpdateAsync|ExecuteDelete|ExecuteDeleteAsync|ExecuteSql|ExecuteSqlAsync|ExecuteSqlRaw|ExecuteSqlRawAsync|ExecuteSqlInterpolated|ExecuteSqlInterpolatedAsync|FromSql|FromSqlRaw|FromSqlInterpolated|GetDbConnection|CreateCommand|ExecuteNonQuery|ExecuteNonQueryAsync|ExecuteReader|ExecuteReaderAsync|ExecuteScalar|ExecuteScalarAsync)\s*\(",
        RegexOptions.Compiled);

    [Fact]
    public void No_source_file_uses_a_guard_bypassing_ef_write_or_raw_sql_api()
    {
        foreach (var file in TestPaths.SourceFiles())
        {
            var match = BannedApis.Match(File.ReadAllText(file));
            Assert.False(match.Success,
                $"{file} calls '{match.Value.Trim()}' (TEN-4/AI-2): set-based, raw-SQL, and raw-ADO operators bypass the tenancy save guard. Route the change through the guarded store, or add a TEN-5 ledger entry with a tenant-scoped wrapper.");
        }
    }
}
