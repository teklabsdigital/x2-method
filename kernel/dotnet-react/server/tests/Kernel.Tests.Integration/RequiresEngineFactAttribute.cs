using System.Diagnostics;
using Xunit;

namespace Kernel.Tests.Integration;

/// <summary>
/// A fact in the real-engine tier: it runs when a container runtime is available and SKIPS, naming what went
/// untested, when one is not.
///
/// It exists because the tier used to FAIL without a daemon (E-49): four red tests whose messages were container
/// startup errors, in a suite where red means a conformance defect. A developer without Docker running got a red
/// run that looked like broken tenancy, and the honest reading of that run needed knowledge that was nowhere in
/// its output.
///
/// Skipping is the smaller of two dishonesty risks and it is not free. A skipped test proves nothing, and a tier
/// that silently skips everywhere is a tier that has never run: this is why TEST-1's integration obligation reads
/// `latent` in the conformance record rather than `proven`, and why the skip reason names the claim. The gate
/// against skip-everywhere is CI, where the daemon is present and a skip would be the anomaly.
///
/// No new package. xunit 2 reads `Skip` at discovery, so a FactAttribute subclass that sets it in its constructor
/// is the whole mechanism; `Assert.Skip` is a v3 API and moving to v3 for this would be a much larger change than
/// the problem justifies.
/// </summary>
public sealed class RequiresEngineFactAttribute : FactAttribute
{
    public RequiresEngineFactAttribute()
    {
        if (!ContainerRuntime.Available)
        {
            Skip = "No container runtime is responding, so the real-engine tier (TEST-1) did not run. What is untested here is engine-specific: DateTimeOffset ordering under the keyset cursor and composite-key behaviour, neither of which SQLite can answer for. Start Docker (or colima) and re-run; CI always has one.";
        }
    }
}

internal static class ContainerRuntime
{
    private static readonly Lazy<bool> Probe = new(() =>
    {
        try
        {
            using var process = Process.Start(new ProcessStartInfo("docker", "info")
            {
                RedirectStandardOutput = true,
                RedirectStandardError = true,
            });

            if (process is null)
            {
                return false;
            }

            // Bounded, because a daemon that is starting up can hang this for a long time and a test run that
            // hangs is worse than one that reports the tier untested.
            return process.WaitForExit(milliseconds: 15_000) && process.ExitCode == 0;
        }
        catch (Exception)
        {
            return false; // no docker binary at all
        }
    });

    public static bool Available => Probe.Value;
}
