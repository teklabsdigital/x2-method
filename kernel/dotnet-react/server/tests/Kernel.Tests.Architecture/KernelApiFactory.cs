using Kernel.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Kernel.Tests.Architecture;

/// <summary>
/// Composed-host test factory. Config is injected with UseSetting (not ConfigureAppConfiguration) because
/// Program reads Jwt:* and the connection string at configure time, before Build(). The SqlServer DbContext is
/// swapped for a temp-file SQLite database created with EnsureCreated, and deleted on dispose. UseEnvironment
/// "Testing" keeps the fail-closed key path (a key is always required) exercised with a configured key.
/// </summary>
public sealed class KernelApiFactory : WebApplicationFactory<Program>
{
    public const string JwtKey = "kernel-architecture-tests-symmetric-signing-key-0123456789";
    public const string JwtIssuer = "kernel";
    public const string JwtAudience = "kernel";

    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"kernel-arch-{Guid.NewGuid():N}.db");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("Jwt:Key", JwtKey);
        builder.UseSetting("Jwt:Issuer", JwtIssuer);
        builder.UseSetting("Jwt:Audience", JwtAudience);
        builder.UseSetting("ConnectionStrings:Kernel", "Server=architecture-tests-unused;Database=Kernel;Trusted_Connection=True");

        builder.ConfigureServices(services =>
        {
            // Remove the SqlServer registration completely. EF Core 9 configures the provider through an
            // accumulating IDbContextOptionsConfiguration<T>, so dropping only DbContextOptions<T> would leave
            // both providers registered ("only a single database provider can be registered").
            foreach (var descriptor in services.Where(IsKernelDbRegistration).ToList())
            {
                services.Remove(descriptor);
            }

            // Pooling=False so the file handle is released on dispose and the temp DB can be deleted.
            services.AddDbContext<KernelDbContext>(options => options.UseSqlite($"Data Source={_dbPath};Pooling=False"));
        });
    }

    private static bool IsKernelDbRegistration(ServiceDescriptor descriptor)
    {
        var type = descriptor.ServiceType;
        if (type == typeof(DbContextOptions<KernelDbContext>) || type == typeof(KernelDbContext))
        {
            return true;
        }

        return type.IsGenericType
            && type.GetGenericArguments().Contains(typeof(KernelDbContext))
            && type.Name.Contains("DbContextOptionsConfiguration", StringComparison.Ordinal);
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);
        using var scope = host.Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<KernelDbContext>().Database.EnsureCreated();
        return host;
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing && File.Exists(_dbPath))
        {
            try
            {
                File.Delete(_dbPath);
            }
            catch (IOException)
            {
                // Best effort: a lingering handle leaves a temp file the OS reclaims later; never fail a run on it.
            }
        }
    }
}
