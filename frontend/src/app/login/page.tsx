"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart2, Eye, EyeOff, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post<{ token: string; username: string }>(
        "/api/auth/login",
        form
      );
      setAuth(res.token, res.username);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Email ou password incorrectos.");
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
          <form onSubmit={handleSubmit} className="space-y-5">

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
                  placeholder="a tua password"
                  required
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
              disabled={loading}
              className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed text-navy-950 font-bold py-3 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  A entrar...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

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
