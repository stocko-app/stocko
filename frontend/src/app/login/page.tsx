"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart2, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();

  const [step, setStep] = useState<"identifier" | "password">("identifier");
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleIdentifier(e: React.FormEvent) {
    e.preventDefault();
    if (!emailOrUsername.trim()) return;
    setChecking(true);
    setError("");
    try {
      const res = await api.post<{ exists: boolean }>("/api/auth/check-user", { emailOrUsername });
      if (!res.exists) {
        setError("Conta não encontrada. Verifica o email ou username.");
      } else {
        setStep("password");
      }
    } catch {
      setError("Erro ao verificar a conta. Tenta novamente.");
    } finally {
      setChecking(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post<{ accessToken: string; userId: string }>("/api/auth/login", {
        emailOrUsername,
        password,
      });
      setAuth(res.accessToken, emailOrUsername);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Credenciais incorrectas.");
    } finally {
      setLoading(false);
    }
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
          <p className="text-slate-400 mt-2 text-sm">Bem-vindo de volta</p>
        </div>

        {/* card */}
        <div className="glass rounded-2xl p-8">

          {/* passo 1 — identificador */}
          {step === "identifier" && (
            <form onSubmit={handleIdentifier} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Email ou username
                </label>
                <input
                  type="text"
                  value={emailOrUsername}
                  onChange={(e) => { setEmailOrUsername(e.target.value); setError(""); }}
                  placeholder="o@teu.email ou o teu username"
                  required
                  autoFocus
                  autoComplete="username"
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
                disabled={checking || !emailOrUsername.trim()}
                className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed text-navy-950 font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
              >
                {checking ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> A verificar...</>
                ) : (
                  "Continuar"
                )}
              </button>
            </form>
          )}

          {/* passo 2 — password */}
          {step === "password" && (
            <form onSubmit={handleLogin} className="space-y-5">
              {/* identificador (só leitura) + botão para voltar */}
              <div
                className="flex items-center gap-3 px-4 py-3 bg-navy-800 rounded-xl border border-white/10 cursor-pointer group"
                onClick={() => { setStep("identifier"); setError(""); setPassword(""); }}
              >
                <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors shrink-0" />
                <span className="text-sm text-slate-300 truncate">{emailOrUsername}</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="a tua password"
                    required
                    autoFocus
                    autoComplete="current-password"
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
              </div>

              {error && (
                <p className="text-danger text-sm bg-danger/10 border border-danger/20 rounded-lg px-4 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !password}
                className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed text-navy-950 font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> A entrar...</>
                ) : (
                  "Entrar"
                )}
              </button>

              <div className="text-center">
                <Link
                  href="/forgot-password"
                  className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Esqueceu-se da password?
                </Link>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-slate-500 mt-6">
            Ainda não tens conta?{" "}
            <Link href="/register" className="text-gold-400 hover:text-gold-300 transition-colors">
              Regista-te grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
