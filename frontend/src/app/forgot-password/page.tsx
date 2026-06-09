"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, KeyRound, Loader2, Mail, Shield } from "lucide-react";
import { api } from "@/lib/api";
import { AuthShell, authInputClass, authLabelClass } from "@/components/stocko/AuthShell";

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
    <AuthShell
      eyebrow="Recuperar acesso"
      title={
        <>
          Repõe a tua <span className="text-gradient-score">password.</span>
        </>
      }
      subtitle="Indica o email da conta. Se existir no STOCKO, enviamos um link seguro para redefinires a password."
      aside={
        <div className="space-y-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-electric">Account recovery</p>
          <h1 className="text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white">
            Repõe a tua <span className="text-gradient-score">password.</span>
          </h1>
          <p className="max-w-md text-base leading-7 text-slate-400">
            Por segurança, não revelamos se o email existe. Se estiver registado, recebes o link em minutos.
          </p>
          <div className="space-y-3">
            {[
              { icon: Mail, title: "Link por email", copy: "Válido por tempo limitado, uso único" },
              { icon: Shield, title: "Conta protegida", copy: "O link só funciona para o teu endereço" },
              { icon: KeyRound, title: "Volta ao jogo", copy: "Depois entras com a nova password" },
            ].map(({ icon: Icon, title, copy }) => (
              <div
                key={title}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              >
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-electric/25 bg-electric/10">
                  <Icon className="h-4 w-4 text-electric" />
                </span>
                <div>
                  <p className="font-black text-white">{title}</p>
                  <p className="mt-1 text-sm text-slate-500">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      }
      footer={
        <p className="text-center text-sm text-slate-500">
          Lembras-te da password?{" "}
          <Link href="/login" className="font-bold text-electric hover:text-white">
            Voltar ao login
          </Link>
        </p>
      }
    >
      {sent ? (
        <div className="space-y-5 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-electric/25 bg-electric/10">
            <CheckCircle className="h-8 w-8 text-electric" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Email enviado</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Se <span className="font-semibold text-white">{email}</span> estiver registado,
              receberás um link para redefinir a tua password.
            </p>
            <p className="mt-2 text-xs text-slate-500">Verifica também a pasta de spam.</p>
          </div>
          <Link href="/login" className="btn-primary inline-flex rounded-2xl px-6 py-3 text-sm font-black">
            Voltar ao login
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl border border-electric/25 bg-electric/10">
              <KeyRound className="h-5 w-5 text-electric" />
            </span>
            <div>
              <p className="text-sm font-black text-white">Recuperar password</p>
              <p className="text-xs text-slate-500">Enviaremos um link para o teu email</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={authLabelClass}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="o@teu.email"
                required
                autoFocus
                className={authInputClass}
              />
            </div>

            {error && (
              <p className="rounded-2xl border border-coral/25 bg-coral/10 px-4 py-3 text-sm font-semibold text-coral">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="btn-primary w-full rounded-2xl py-3.5 text-base font-black"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> A enviar...
                </>
              ) : (
                "Enviar link de recuperação"
              )}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
