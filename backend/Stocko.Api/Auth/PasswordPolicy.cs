namespace Stocko.Api.Auth;

/// <summary>Alinhado com Supabase Auth (mínimo por omissão) e com o frontend.</summary>
public static class PasswordPolicy
{
    public const int MinLength = 6;

    public static string MinLengthMessage =>
        $"A password deve ter pelo menos {MinLength} caracteres.";
}
