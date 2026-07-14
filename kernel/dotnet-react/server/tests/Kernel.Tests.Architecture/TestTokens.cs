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

    private static string Build(Guid? tenantId, string sub, int? sv, string[] permissions, string algorithm = SecurityAlgorithms.HmacSha256)
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
        var token = new JwtSecurityToken(
            issuer: KernelApiFactory.JwtIssuer,
            audience: KernelApiFactory.JwtAudience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddMinutes(30),
            signingCredentials: new SigningCredentials(key, algorithm));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
