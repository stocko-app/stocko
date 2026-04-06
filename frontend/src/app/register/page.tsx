"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart2, Eye, EyeOff, Loader2, CheckCircle, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuth();

  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [usernameTimer, setUsernameTimer] = useState<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "username") {
      setUsernameStatus("idle");
      if (usernameTimer) clearTimeout(usernameTimer);

      if (value.length >= 3) {
        setUsernameStatus("checking");
        const timer = setTimeout(async () => {
          try {
            const res = await api.get<{ available: boolean }>(
              `/api/auth/check-username/${value}`
            );
            setUsernameStatus(res.available ? "available" : "taken");
          } catch {
            setUsernameStatus("idle");
          }
        }, 500);
        setUsernameTimer(timer);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (usernameStatus === "taken") return;

    setLoading(true);
    setError("");

    try {
      const res = await api.post<{ token: string; username: string }>(
        "/api/auth/register",
        form
      );
      setAuth(res.token, res.username);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-navy-950">
      {/* fundo glow */}
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
          <p className="text-slate-400 mt-2 text-sm">Cria a tua conta e começa a jogar</p>
        </div>

        {/* card */}
        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* username */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="ex: brunosilva"
                  autoComplete="off"
                  required
                  className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 transition-all pr-10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus === "checking" && (
                    <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                  )}
                  {usernameStatus === "available" && (
                    <CheckCircle className="w-4 h-4 text-success" />
                  )}
                  {usernameStatus === "taken" && (
                    <XCircle className="w-4 h-4 text-danger" />
                  )}
                </div>
              </div>
              {usernameStatus === "taken" && (
                <p className="text-danger text-xs mt-1">Este username já está ocupado.</p>
              )}
              {usernameStatus === "available" && (
                <p className="text-success text-xs mt-1">Username disponível!</p>
              )}
            </div>

            {/* email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="o@teu.email"
                required
                className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 transition-all"
              />
            </div>

            {/* password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="mínimo 8 caracteres"
                  required
                  minLength={8}
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

            {/* erro */}
            {error && (
              <p className="text-danger text-sm bg-danger/10 border border-danger/20 rounded-lg px-4 py-2">
                {error}
              </p>
            )}

            {/* submit */}
            <button
              type="submit"
              disabled={loading || usernameStatus === "taken"}
              className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed text-navy-950 font-bold py-3 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  A criar conta...
                </>
              ) : (
                "Criar conta grátis"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Já tens conta?{" "}
            <Link href="/login" className="text-gold-400 hover:text-gold-300 transition-colors">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
