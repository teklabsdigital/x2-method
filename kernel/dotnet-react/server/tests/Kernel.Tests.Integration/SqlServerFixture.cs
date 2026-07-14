using Kernel.App.Notes;
using Kernel.App.Platform.Tenancy;
using Kernel.Persistence;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Testcontainers.MsSql;
using Xunit;

namespace Kernel.Tests.Integration;

/// <summary>
/// TEST-1 real-engine tier. One ephemeral SQL Server container per run, a unique database, and the real
/// InitialCreate migration applied (not EnsureCreated), so these tests exercise the shipped schema.
/// </summary>
public sealed class SqlServerFixture : IAsyncLifetime
{
    // The image is the one pinned tag@digest from VERSIONS.md (DEP-1 / INV-05), stated explicitly rather than
    // inherited from the Testcontainers default, so all three tiers run the same engine build as the runbook and CI.
    private const string SqlServerImage =
        "mcr.microsoft.com/mssql/server:2022-CU14-ubuntu-22.04@sha256:c1aa8afe9b06eab64c9774a4802dcd032205d1be785b1fd51e1c0151e7586b74";

    private readonly MsSqlContainer _container = new MsSqlBuilder().WithImage(SqlServerImage).Build();

    public string ConnectionString { get; private set; } = string.Empty;

    public async Task InitializeAsync()
    {
        await _container.StartAsync();
        ConnectionString = new SqlConnectionStringBuilder(_container.GetConnectionString())
        {
            InitialCatalog = $"Kernel_{Guid.NewGuid():N}",
        }.ConnectionString;

        var scope = new AmbientTenantScope();
        await using var db = NewContext(scope);
        await db.Database.MigrateAsync();
    }

    public Task DisposeAsync() => _container.DisposeAsync().AsTask();

    public KernelDbContext NewContext(ITenantScope scope) =>
        new(new DbContextOptionsBuilder<KernelDbContext>().UseSqlServer(ConnectionString).Options, scope);

    public async Task AddNoteAsync(Guid tenant, Guid id, string title, DateTimeOffset createdAt)
    {
        var scope = new AmbientTenantScope();
        await using var db = NewContext(scope);
        using (scope.Begin(tenant))
        {
            db.Notes.Add(new Note { Id = id, TenantId = tenant, Title = title, Body = "body", CreatedAtUtc = createdAt });
            await db.SaveChangesAsync();
        }
    }
}

[CollectionDefinition("sqlserver")]
public sealed class SqlServerCollection : ICollectionFixture<SqlServerFixture>;
