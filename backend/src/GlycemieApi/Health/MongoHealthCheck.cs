using GlycemieApi.Infrastructure;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using MongoDB.Bson;
using MongoDB.Driver;

namespace GlycemieApi.Health;

/// <summary>
/// Vérifie que MongoDB répond ET que l'API y est authentifiée. Utilisé par la sonde readiness de
/// Kubernetes : un pod qui ne peut pas réellement utiliser la base ne reçoit pas de trafic.
/// </summary>
/// <remarks>
/// Pas de « ping » : MongoDB l'accepte sans authentification, la sonde réussirait donc avec un mauvais
/// mot de passe. listCollections exige une connexion authentifiée et un droit de lecture sur la base.
/// </remarks>
public class MongoHealthCheck(MongoContext context) : IHealthCheck
{
    private static readonly TimeSpan Timeout = TimeSpan.FromSeconds(3);

    private static readonly BsonDocument AuthenticatedCommand = new()
    {
        { "listCollections", 1 },
        { "nameOnly", true },
        { "authorizedCollections", true },
    };

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext healthContext, CancellationToken cancellationToken = default)
    {
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(Timeout);

        try
        {
            await context.Database.RunCommandAsync<BsonDocument>(AuthenticatedCommand, cancellationToken: cts.Token);
            return HealthCheckResult.Healthy();
        }
        catch (Exception ex)
        {
            // Pas de détail de l'exception dans la réponse : elle pourrait contenir l'hôte de la base.
            return HealthCheckResult.Unhealthy("MongoDB injoignable.", ex);
        }
    }
}
