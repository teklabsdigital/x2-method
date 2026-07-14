using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Kernel.Api.Endpoints;
using Kernel.Api.Platform;
using Kernel.App.Notes;
using Kernel.App.Platform.Sessions;
using Kernel.App.Platform.Tenancy;
using Kernel.Persistence;
using Kernel.Persistence.Notes;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// DATA-5: mandatory configuration is read at startup and fails fast with a named error. Dev values (Jwt:Key and
// the containerized ConnectionStrings:Kernel) live in user-secrets (SEC-5); committed config carries no secrets.
string Required(string key)
{
    var value = builder.Configuration[key];
    return string.IsNullOrWhiteSpace(value)
        ? throw new InvalidOperationException(
            $"Mandatory configuration '{key}' is missing (DATA-5). Set it via user-secrets in development or the environment in deployment.")
        : value;
}

var jwtKey = Required("Jwt:Key");
var jwtIssuer = Required("Jwt:Issuer");
var jwtAudience = Required("Jwt:Audience");
var connectionString = Required("ConnectionStrings:Kernel");

// TEST-2 / INV-10: the gated harness (e2e) profile. A product that owns an external effect (identity delivery, a
// model provider) re-binds that provider port HERE under this flag, so the out-of-process harness can drive the
// real flow deterministically (the pilot's harness profile is the reference: OTP to a harness-readable file
// sink, the model to a canned reply; bindings only, no production code path changes). The kernel ships no such
// effect yet, so the profile carries no re-bindings; what ships is the guarantee that matters: the profile can
// NEVER be on outside Development or Testing. It refuses to boot, DATA-5 style, naming itself.
var harnessEnabled = string.Equals(builder.Configuration["Harness:Enabled"], "true", StringComparison.OrdinalIgnoreCase);
if (harnessEnabled && !(builder.Environment.IsDevelopment() || builder.Environment.IsEnvironment("Testing")))
{
    throw new InvalidOperationException(
        $"Harness mode (Harness:Enabled) is a test seam and must never run in the '{builder.Environment.EnvironmentName}' environment; it is permitted only in Development or Testing.");
}

builder.Services.AddDbContext<KernelDbContext>(options => options.UseSqlServer(connectionString));

builder.Services.AddSingleton<ITenantScope, AmbientTenantScope>();
builder.Services.AddSingleton<ISessionVersionStore, InMemorySessionVersionStore>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<INoteStore, EfNoteStore>();
builder.Services.AddScoped<NoteService>();

// SEC-4: pin the algorithm and require a signature. Never trust the token header's alg, so alg=none and the
// RS-to-HS confusion family are rejected explicitly rather than left to a library default.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            NameClaimType = "sub",
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateLifetime = true,
            RequireExpirationTime = true,
            RequireSignedTokens = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            ValidAlgorithms = [SecurityAlgorithms.HmacSha256],
        };
    });

// SEC-1: deny by default. An endpoint that forgets its attribute is unreachable, not public.
builder.Services.AddAuthorizationBuilder()
    .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();

// CON-1: one wire dialect. Problem details for errors, a single enum converter, camelCase (the web default).
builder.Services.AddProblemDetails();
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase)));

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();
// Route first so the revocation and tenant gates can see the matched endpoint's metadata and leave the
// allowlisted-anonymous endpoint (e.g. /health) untouched even when a stale token is presented (SEC-1).
app.UseRouting();
app.UseAuthentication();
app.UseMiddleware<SessionVersionMiddleware>();
app.UseMiddleware<TenantScopeMiddleware>();
app.UseAuthorization();

app.MapHealthEndpoints();
app.MapNotesEndpoints();

app.Run();

// Exposed for WebApplicationFactory<Program> in the architecture test project.
public partial class Program;
