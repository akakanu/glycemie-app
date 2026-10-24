using GlycemieApi.Infrastructure;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using MongoDB.Bson;
using MongoDB.Driver;

namespace GlycemieApi.Health;

/// <summary>
/// Vérifie que MongoDB répond (commande ping). Utilisé par la sonde readiness de Kubernetes :
/// un pod qui ne joint plus la base ne reçoit plus de trafic.
/// </summary>
public class MongoHealthCheck(MongoContext context) : IHealthCheck
{
    private static readonly TimeSpan Timeout = TimeSpan.FromSeconds(3);

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext healthContext, CancellationToken cancellationToken = default)
    {
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(Timeout);

        try
        {
            await context.Database.RunCommandAsync<BsonDocument>(new BsonDocument("ping", 1), cancellationToken: cts.Token);
            return HealthCheckResult.Healthy();
        }
        catch (Exception ex)
        {
            // Pas de détail de l'exception dans la réponse : elle pourrait contenir l'hôte de la base.
            return HealthCheckResult.Unhealthy("MongoDB injoignable.", ex);
        }
    }
}
