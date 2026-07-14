using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Kernel.Tests.Architecture;

/// <summary>
/// DATA-5 fail-fast configuration. The host refuses to start when any mandatory key is missing, and the thrown
/// error names the missing key. Buildable in v1 because all four keys exist; the reference systems had the
/// fail-fast read but no test proving each key is load-bearing.
/// </summary>
public sealed class StartupConfigTests
{
    [Theory]
    [InlineData("Jwt:Key")]
    [InlineData("Jwt:Issuer")]
    [InlineData("Jwt:Audience")]
    [InlineData("ConnectionStrings:Kernel")]
    public void Startup_fails_and_names_the_missing_mandatory_key(string missingKey)
    {
        using var factory = new MissingKeyFactory(missingKey);

        var exception = Record.Exception(() => factory.CreateClient());

        Assert.NotNull(exception);
        // ToString() includes every inner exception (and every branch of an AggregateException) recursively, so it
        // finds the named key wherever in the chain the host surfaced it.
        Assert.Contains(missingKey, exception!.ToString(), StringComparison.Ordinal);
    }

    private sealed class MissingKeyFactory(string missingKey) : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");
            // Blank the target key (overriding any committed appsettings default) so its absence is what fails.
            builder.UseSetting("Jwt:Key", ValueFor("Jwt:Key", KernelApiFactory.JwtKey));
            builder.UseSetting("Jwt:Issuer", ValueFor("Jwt:Issuer", KernelApiFactory.JwtIssuer));
            builder.UseSetting("Jwt:Audience", ValueFor("Jwt:Audience", KernelApiFactory.JwtAudience));
            builder.UseSetting("ConnectionStrings:Kernel", ValueFor("ConnectionStrings:Kernel", "Server=unused;Database=Kernel;Trusted_Connection=True"));

            string ValueFor(string key, string valid) =>
                string.Equals(key, missingKey, StringComparison.Ordinal) ? string.Empty : valid;
        }
    }
}
