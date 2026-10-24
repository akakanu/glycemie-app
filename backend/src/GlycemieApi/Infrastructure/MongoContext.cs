using GlycemieApi.Models;
using GlycemieApi.Settings;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Conventions;
using MongoDB.Driver;

namespace GlycemieApi.Infrastructure;

public class MongoContext
{
    static MongoContext()
    {
        // camelCase dans la base, enums stockés en texte lisible ("Fasting" plutôt que 0).
        var conventions = new ConventionPack
        {
            new CamelCaseElementNameConvention(),
            new EnumRepresentationConvention(BsonType.String),
            new IgnoreExtraElementsConvention(true),
        };
        ConventionRegistry.Register("GlycemieConventions", conventions, _ => true);
    }

    public MongoContext(IOptions<MongoSettings> options)
    {
        var settings = options.Value;
        var client = new MongoClient(settings.ConnectionString);
        Database = client.GetDatabase(settings.DatabaseName);

        Users = Database.GetCollection<User>("users");
        Readings = Database.GetCollection<Reading>("readings");
    }

    public IMongoDatabase Database { get; }

    public IMongoCollection<User> Users { get; }

    public IMongoCollection<Reading> Readings { get; }

    /// <summary>Crée les index s'ils n'existent pas (opération idempotente).</summary>
    public async Task EnsureIndexesAsync(CancellationToken cancellationToken = default)
    {
        await Users.Indexes.CreateOneAsync(
            new CreateIndexModel<User>(
                Builders<User>.IndexKeys.Ascending(u => u.Email),
                new CreateIndexOptions { Unique = true, Name = "ux_email" }),
            cancellationToken: cancellationToken);

        await Readings.Indexes.CreateOneAsync(
            new CreateIndexModel<Reading>(
                Builders<Reading>.IndexKeys.Ascending(r => r.UserId).Descending(r => r.MeasuredAt),
                new CreateIndexOptions { Name = "ix_user_measuredAt" }),
            cancellationToken: cancellationToken);
    }
}
