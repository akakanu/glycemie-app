using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace GlycemieApi.Models;

public class User
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    public string FirstName { get; set; } = null!;

    /// <summary>Toujours stocké en minuscules (index unique).</summary>
    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public DateTime CreatedAt { get; set; }
}
