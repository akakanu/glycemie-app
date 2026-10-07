using GlycemieApi.Infrastructure;
using GlycemieApi.Models;
using MongoDB.Bson;
using MongoDB.Driver;

namespace GlycemieApi.Services;

public class ReadingService(MongoContext context)
{
    private const int MaxHistory = 200;

    public async Task<Reading> CreateAsync(
        string userId, decimal value, MeasurementMoment moment, DateTime measuredAtUtc, string? note, CancellationToken ct)
    {
        var reading = new Reading
        {
            UserId = userId,
            // Un glucomètre affiche une décimale : on arrondit pour que les seuils s'appliquent sans ambiguïté.
            Value = Math.Round(value, 1, MidpointRounding.AwayFromZero),
            Moment = moment,
            MeasuredAt = measuredAtUtc,
            Note = string.IsNullOrWhiteSpace(note) ? null : note.Trim(),
            CreatedAt = DateTime.UtcNow,
        };

        await context.Readings.InsertOneAsync(reading, cancellationToken: ct);
        return reading;
    }

    /// <summary>Historique de l'utilisateur, le plus récent d'abord.</summary>
    public Task<List<Reading>> ListAsync(string userId, MeasurementMoment? moment, CancellationToken ct)
    {
        var filter = Builders<Reading>.Filter.Eq(r => r.UserId, userId);
        if (moment is not null)
            filter &= Builders<Reading>.Filter.Eq(r => r.Moment, moment.Value);

        return context.Readings.Find(filter)
            .SortByDescending(r => r.MeasuredAt)
            .Limit(MaxHistory)
            .ToListAsync(ct);
    }

    /// <returns>La mesure si elle existe ET appartient à l'utilisateur, sinon null.</returns>
    public async Task<Reading?> GetAsync(string userId, string id, CancellationToken ct)
    {
        if (!ObjectId.TryParse(id, out _))
            return null;

        return await context.Readings
            .Find(r => r.Id == id && r.UserId == userId)
            .FirstOrDefaultAsync(ct);
    }
}
