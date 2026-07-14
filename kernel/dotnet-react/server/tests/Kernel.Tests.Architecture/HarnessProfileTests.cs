using Microsoft.AspNetCore.Hosting;
using Xunit;

namespace Kernel.Tests.Architecture;

/// <summary>
/// The gated harness (e2e) profile (TEST-2 / INV-10). Because the profile exists to weaken seams for the
/// out-of-process harness (a product re-binds provider ports under it), the load-bearing guarantee is that it can
/// NEVER be turned on outside Development or Testing: the host refuses to start and names itself. The kernel
/// ships the gate with no re-bindings (no product-owned external effect yet), so the allowed-environment test
/// asserts the host still boots normally with the flag on; the first product provider port adds its own
/// binding-swap assertions here, the pilot's HarnessProfileTests being the reference.
/// </summary>
public sealed class HarnessProfileTests(KernelApiFactory factory) : IClassFixture<KernelApiFactory>
{
    [Theory]
    [InlineData("Production")]
    [InlineData("Staging")]
    public void Enabling_the_harness_profile_outside_development_or_testing_fails_startup(string environment)
    {
        using var refused = factory.WithWebHostBuilder(webHost =>
        {
            webHost.UseSetting("Harness:Enabled", "true");
            webHost.UseEnvironment(environment);
        });

        var exception = Record.Exception(() => refused.CreateClient());

        Assert.NotNull(exception);
        Assert.Contains("Harness", exception!.ToString(), StringComparison.Ordinal);
    }

    [Fact]
    public void The_profile_is_honored_in_the_testing_environment()
    {
        // The factory's base environment is Testing (allowlisted), so the flag must not refuse the boot.
        using var harness = factory.WithWebHostBuilder(webHost => webHost.UseSetting("Harness:Enabled", "true"));

        using var client = harness.CreateClient();

        Assert.NotNull(client);
    }
}
