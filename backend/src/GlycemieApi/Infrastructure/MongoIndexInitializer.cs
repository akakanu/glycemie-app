namespace GlycemieApi.Infrastructure;

/// <summary>
/// Crée les index MongoDB au démarrage. Un échec est journalisé sans bloquer l'API,
/// pour qu'elle démarre même si Atlas est momentanément injoignable.
/// </summary>
public class MongoIndexInitializer(MongoContext context, ILogger<MongoIndexInitializer> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        try
        {
            await context.EnsureIndexesAsync(cancellationToken);
            logger.LogInformation("Index MongoDB vérifiés.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Impossible de créer les index MongoDB. Vérifiez la chaîne de connexion et l'accès réseau Atlas.");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
