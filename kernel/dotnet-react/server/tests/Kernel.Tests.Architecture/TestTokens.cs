using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Kernel.Tests.Architecture;

/// <summary>
/// Mints HS256 JWTs for the arch/host tests with the same key KernelApiFactory configures. Repeated perm claims
/// use a List of claims (a SecurityTokenDescriptor Dictionary cannot emit duplicate keys). No identity module in
/// v1, so tests mint their own tokens with the dev key.
/// </summary>
public static class TestTokens
{
    public static string Mint(Guid tenantId, string? sub = null, int sv = 1, params string[] permissions) =>
        Build(tenantId, sub ?? Guid.NewGuid().ToString(), sv, permissions);

    public static string MintWithoutTenant(string? sub = null, int sv = 1, params string[] permissions) =>
        Build(tenantId: null, sub ?? Guid.NewGuid().ToString(), sv, permissions);

    public static string MintWithAlgorithm(Guid tenantId, string algorithm, params string[] permissions) =>
        Build(tenantId, Guid.NewGuid().ToString(), sv: 1, permissions, algorithm);

    public static string MintWithoutSessionVersion(Guid tenantId, params string[] permissions) =>
        Build(tenantId, Guid.NewGuid().ToString(), sv: null, permissions);

    /// <summary>
    /// The four minters E-88 found missing, and the finding is about their absence rather than about the host.
    /// `Program.cs` sets ValidateIssuer, ValidateAudience, ValidateLifetime, RequireExpirationTime and a 30 second
    /// ClockSkew, and on 2026-07-27 all five were planted permissive at once (ClockSkew at a year) and 203 + 58
    /// tests stayed green. Nothing was wrong with the host. What was missing was any token this suite could send
    /// that those five properties are the only thing refusing, because every mint above routes through one `Build`
    /// that always passes the right issuer, the right audience and a thirty minute expiry.
    ///
    /// **A configuration assertion cannot be stronger than the inputs the harness can produce.** That is the
    /// sentence E-88 exists to record, and these are the inputs.
    /// </summary>
    public static string MintFromIssuer(Guid tenantId, string issuer, params string[] permissions) =>
        Build(tenantId, Guid.NewGuid().ToString(), sv: 1, permissions, issuer: issuer);

    public static string MintForAudience(Guid tenantId, string audience, params string[] permissions) =>
        Build(tenantId, Guid.NewGuid().ToString(), sv: 1, permissions, audience: audience);

    /// <summary>
    /// Expired by five minutes, not by one second. `ClockSkew` is 30 seconds, so a token that expired recently is
    /// still valid by design, and a test written against a one second margin would be asserting the opposite of
    /// what the host promises and would fail intermittently besides.
    /// </summary>
    public static string MintExpired(Guid tenantId, params string[] permissions) =>
        Build(
            tenantId,
            Guid.NewGuid().ToString(),
            sv: 1,
            permissions,
            notBefore: DateTime.UtcNow.AddMinutes(-30),
            expires: DateTime.UtcNow.AddMinutes(-5));

    public static string MintWithoutExpiry(Guid tenantId, params string[] permissions) =>
        Build(tenantId, Guid.NewGuid().ToString(), sv: 1, permissions, omitExpiry: true);

    /// <summary>
    /// The alg:none token SEC-4's harm paragraph names first: a well-formed header and payload, and no signature at
    /// all. Hand-assembled because no signing handler will emit one, which is the point.
    /// </summary>
    public static string Unsigned(Guid tenantId, params string[] permissions)
    {
        var expires = DateTimeOffset.UtcNow.AddMinutes(30).ToUnixTimeSeconds();
        var claims = new List<string>
        {
            $"\"sub\":\"{Guid.NewGuid()}\"",
            "\"sv\":\"1\"",
            $"\"tenant_id\":\"{tenantId}\"",
            $"\"iss\":\"{KernelApiFactory.JwtIssuer}\"",
            $"\"aud\":\"{KernelApiFactory.JwtAudience}\"",
            $"\"exp\":{expires}",
        };
        claims.AddRange(permissions.Select(p => $"\"perm\":\"{p}\""));

        var header = Base64UrlEncoder.Encode("{\"alg\":\"none\",\"typ\":\"JWT\"}");
        var payload = Base64UrlEncoder.Encode($"{{{string.Join(',', claims)}}}");

        return $"{header}.{payload}.";
    }

    public static string Tampered(Guid tenantId, params string[] permissions)
    {
        var parts = Mint(tenantId, permissions: permissions).Split('.');

        // Flip a byte of the decoded signature and re-encode, so the signature always changes. Flipping a base64url
        // character instead can be a no-op: the last character of a 32-byte HMAC signature carries padding bits a
        // lenient decoder discards, which made the old approach fail ~1 run in 16.
        var signature = Base64UrlEncoder.DecodeBytes(parts[2]);
        signature[0] ^= 0xFF;
        parts[2] = Base64UrlEncoder.Encode(signature);

        return string.Join('.', parts);
    }

    private static string Build(
        Guid? tenantId,
        string sub,
        int? sv,
        string[] permissions,
        string algorithm = SecurityAlgorithms.HmacSha256,
        string? issuer = null,
        string? audience = null,
        DateTime? notBefore = null,
        DateTime? expires = null,
        bool omitExpiry = false)
    {
        var claims = new List<Claim> { new("sub", sub) };

        if (sv is { } version)
        {
            claims.Add(new Claim("sv", version.ToString()));
        }

        if (tenantId is { } id)
        {
            claims.Add(new Claim("tenant_id", id.ToString()));
        }

        claims.AddRange(permissions.Select(p => new Claim("perm", p)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(KernelApiFactory.JwtKey));
        // `expires: null` is what omits the claim entirely; `JwtPayload` adds `exp` only when it has a value. The
        // tests that use it assert the absence on the minted token rather than trusting this line, because a
        // minter that quietly produces a VALID token turns a violating-input test into a test that passes for the
        // opposite reason, which is the failure mode this whole set exists to close.
        var token = new JwtSecurityToken(
            issuer: issuer ?? KernelApiFactory.JwtIssuer,
            audience: audience ?? KernelApiFactory.JwtAudience,
            claims: claims,
            notBefore: notBefore ?? DateTime.UtcNow,
            expires: omitExpiry ? null : expires ?? DateTime.UtcNow.AddMinutes(30),
            signingCredentials: new SigningCredentials(key, algorithm));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
