"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart2, Loader2, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import type { Metadata } from "next";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      await api.post("/api/auth/forgot-password", { email });
      setSent(true);
    } catch {
      setError("Erro ao enviar o email. Tenta novamente.");
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
          <p className="text-slate-400 mt-2 text-sm">Recuperar password</p>
        </div>

        <div className="glass rounded-2xl p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="w-12 h-12 text-success" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Email enviado!</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Se <span className="text-slate-200">{email}</span> estiver registado,
                  receberás um link para redefinir a tua password.
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Verifica também a pasta de spam.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-block mt-2 text-sm text-gold-400 hover:text-gold-300 transition-colors"
              >
                Voltar ao login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <p className="text-sm text-slate-400 mb-4">
                  Indica o teu email e enviamos um link para redefinires a tua password.
                </p>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="o@teu.email"
                  required
                  autoFocus
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
                disabled={loading || !email.trim()}
                className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed text-navy-950 font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> A enviar...</>
                ) : (
                  "Enviar link de recuperação"
                )}
              </button>

              <p className="text-center text-sm text-slate-500">
                <Link href="/login" className="text-gold-400 hover:text-gold-300 transition-colors">
                  Voltar ao login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
