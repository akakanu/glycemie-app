using System.Text;
using System.Text.Json.Serialization;
using GlycemieApi.Health;
using GlycemieApi.Infrastructure;
using GlycemieApi.Services;
using GlycemieApi.Settings;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// En production (Kubernetes), une ligne JSON par log : lisible par kubectl logs et les outils de collecte.
if (!builder.Environment.IsDevelopment())
{
    builder.Logging.ClearProviders();
    builder.Logging.AddJsonConsole();
}

// --- Configuration (les secrets viennent des user-secrets en développement) ---
builder.Services.AddOptions<MongoSettings>()
    .Bind(builder.Configuration.GetSection(MongoSettings.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddOptions<JwtSettings>()
    .Bind(builder.Configuration.GetSection(JwtSettings.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

// --- MongoDB ---
builder.Services.AddSingleton<MongoContext>();
builder.Services.AddHostedService<MongoIndexInitializer>();

// --- Santé : /health/live (le processus répond) et /health/ready (MongoDB joignable) ---
builder.Services.AddHealthChecks()
    .AddCheck<MongoHealthCheck>("mongo", tags: ["ready"]);

// --- Derrière l'ingress Kubernetes : le TLS est terminé en amont ---
// On fait confiance aux en-têtes X-Forwarded-* pour connaître le schéma (https) et l'IP du client.
// L'IP de l'ingress n'est pas connue à l'avance : seul le trafic interne au cluster atteint le pod.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// --- Services métier ---
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<ReadingService>();
builder.Services.AddSingleton<TokenService>();

// --- Authentification JWT ---
// Les paramètres sont construits à partir des JwtSettings validés, au moment où ils servent :
// toute la configuration (user-secrets, variables d'environnement, Key Vault) est alors chargée.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<IOptions<JwtSettings>>((options, jwtOptions) =>
    {
        var jwt = jwtOptions.Value;
        // Garde les noms de claims d'origine ("sub" plutôt que l'URI NameIdentifier).
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),
        };
    });
builder.Services.AddAuthorization();

// --- CORS pour le frontend Angular ---
const string FrontendCorsPolicy = "frontend";
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
    options.AddPolicy(FrontendCorsPolicy, policy =>
        policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));

// --- API ---
builder.Services.AddProblemDetails();
builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Glycémie API", Version = "v1" });

    // Bouton « Authorize » dans Swagger pour tester les routes protégées.
    var scheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Collez le jeton renvoyé par /api/auth/login.",
        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" },
    };
    options.AddSecurityDefinition("Bearer", scheme);
    options.AddSecurityRequirement(new OpenApiSecurityRequirement { [scheme] = [] });
});

var app = builder.Build();

app.UseForwardedHeaders();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    // Pas de UseHttpsRedirection ni de UseHsts : l'ingress termine le TLS et gère HSTS.
    // Une redirection ici bouclerait, car le pod ne reçoit que du http.
    app.UseExceptionHandler();
}

app.UseCors(FrontendCorsPolicy);
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false }).AllowAnonymous();
app.MapHealthChecks("/health/ready", new HealthCheckOptions { Predicate = c => c.Tags.Contains("ready") }).AllowAnonymous();

app.MapControllers();

app.Run();

// Rend la classe Program accessible aux tests d'intégration.
public partial class Program;
