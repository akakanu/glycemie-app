using GlycemieApi.Infrastructure;
using GlycemieApi.Models;
using MongoDB.Driver;

namespace GlycemieApi.Services;

public class UserService(MongoContext context)
{
    private const int BcryptWorkFactor = 12;

    // Hash factice : on vérifie quand même un mot de passe quand le courriel est inconnu,
    // pour que le temps de réponse ne révèle pas si un compte existe.
    private static readonly string DummyHash = BCrypt.Net.BCrypt.HashPassword("dummy-password", BcryptWorkFactor);

    /// <returns>Le nouvel utilisateur, ou null si le courriel est déjà utilisé.</returns>
    public async Task<User?> RegisterAsync(string firstName, string email, string password, CancellationToken ct)
    {
        var user = new User
        {
            FirstName = firstName.Trim(),
            Email = NormalizeEmail(email),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password, BcryptWorkFactor),
            CreatedAt = DateTime.UtcNow,
        };

        try
        {
            await context.Users.InsertOneAsync(user, cancellationToken: ct);
            return user;
        }
        catch (MongoWriteException ex) when (ex.WriteError.Category == ServerErrorCategory.DuplicateKey)
        {
            return null;
        }
    }

    /// <returns>L'utilisateur si les identifiants sont valides, sinon null.</returns>
    public async Task<User?> AuthenticateAsync(string email, string password, CancellationToken ct)
    {
        var normalized = NormalizeEmail(email);
        var user = await context.Users.Find(u => u.Email == normalized).FirstOrDefaultAsync(ct);

        var valid = BCrypt.Net.BCrypt.Verify(password, user?.PasswordHash ?? DummyHash);
        return user is not null && valid ? user : null;
    }

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}
