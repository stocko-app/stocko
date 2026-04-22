/**
 * Regra única para passwords novas (registo + recuperação).
 * Mantém-se igual ao Supabase Auth por omissão e a POST /api/auth/reset-password (mín. 6).
 */
export const PASSWORD_MIN_LENGTH = 6;

export const PASSWORD_RULE_HINT_PT = `Mínimo ${PASSWORD_MIN_LENGTH} caracteres (igual no registo e ao recuperar a password).`;

/** Erro em PT ou null se a password nova é aceite. */
export function validateNewPassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `A password deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }
  return null;
}

/** No login só faz sentido pedir o mesmo mínimo que nas novas passwords (evita pedidos inúteis à API). */
export function isPasswordLongEnoughForLogin(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH;
}
