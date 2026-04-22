"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart2, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_RULE_HINT_PT,
  validateNewPassword,
} from "@/lib/passwordPolicy";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenType, setTokenType] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Ler o access_token do hash da URL (ex: #access_token=xxx&type=recovery)
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    setAccessToken(params.get("access_token"));
    setTokenType(params.get("type"));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("As passwords não coincidem.");
      return;
    }
    const pwdErr = validateNewPassword(password);
    if (pwdErr) {
      setError(pwdErr);
      return;
    }
    if (!accessToken) {
      setError("Link de recuperação inválido.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await api.post("/api/auth/reset-password", { accessToken, newPassword: password });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Token inválido ou expirado. Pede um novo link.");
    } finally {
      setLoading(false);
    }
  }

  // Link inválido ou não é recovery
  if (accessToken !== null && tokenType !== "recovery") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-navy-950">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle className="w-12 h-12 text-danger mx-auto" />
          <h2 className="text-lg font-bold text-white">Link inválido</h2>
          <p className="text-sm text-slate-400">
            Este link de recuperação é inválido ou já foi utilizado.
          </p>
          <Link href="/forgot-password" className="inline-block text-sm text-gold-400 hover:text-gold-300">
            Pedir novo link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-navy-950">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 justify-center">
            <BarChart2 className="w-7 h-7 text-gold-400" />
            <span className="font-bold text-2xl tracking-tight">
              Sto<span className="text-gradient-gold">cko</span>
            </span>
          </Link>
          <p className="text-slate-400 mt-2 text-sm">Definir nova password</p>
        </div>

        <div className="glass rounded-2xl p-8">
          {success ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-success mx-auto" />
              <div>
                <h2 className="text-lg font-bold text-white">Password alterada!</h2>
                <p className="text-sm text-slate-400 mt-1">
                  A tua password foi redefinida com sucesso. A redirecionar para o login...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* nova password */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Nova password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder={`mínimo ${PASSWORD_MIN_LENGTH} caracteres`}
                    required
                    autoFocus
                    className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-slate-500 text-xs mt-1">{PASSWORD_RULE_HINT_PT}</p>
              </div>

              {/* confirmar password */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Confirmar password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                  placeholder="repete a nova password"
                  required
                  className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 transition-all"
                />
              </div>

              {error && (
                <p className="text-danger text-sm bg-danger/10 border border-danger/20 rounded-lg px-4 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={
                  loading ||
                  !password ||
                  !confirm ||
                  !!validateNewPassword(password)
                }
                className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed text-navy-950 font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> A guardar...</>
                ) : (
                  "Guardar nova password"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
