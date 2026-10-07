using System.ComponentModel.DataAnnotations;

namespace GlycemieApi.Dtos;

public class RegisterRequest
{
    [Required(ErrorMessage = "Le prénom est obligatoire.")]
    [StringLength(50, ErrorMessage = "Le prénom ne doit pas dépasser 50 caractères.")]
    public string FirstName { get; set; } = "";

    [Required(ErrorMessage = "Le courriel est obligatoire.")]
    [EmailAddress(ErrorMessage = "Le courriel n'est pas valide.")]
    [StringLength(254)]
    public string Email { get; set; } = "";

    [Required(ErrorMessage = "Le mot de passe est obligatoire.")]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "Le mot de passe doit contenir entre 8 et 100 caractères.")]
    public string Password { get; set; } = "";
}

public class LoginRequest
{
    [Required(ErrorMessage = "Le courriel est obligatoire.")]
    public string Email { get; set; } = "";

    [Required(ErrorMessage = "Le mot de passe est obligatoire.")]
    public string Password { get; set; } = "";
}

public record UserDto(string Id, string FirstName, string Email);

public record AuthResponse(string Token, DateTime ExpiresAt, UserDto User);
