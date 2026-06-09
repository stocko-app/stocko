"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Crown,
  Eye,
  EyeOff,
  Loader2,
  Trophy,
  UserPlus,
  XCircle,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_RULE_HINT_PT,
  validateNewPassword,
} from "@/lib/passwordPolicy";
import { useAuth } from "@/store/auth";
import { AuthShell, authInputClass, authLabelClass } from "@/components/stocko/AuthShell";
import { cn } from "@/lib/cn";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuth();

  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [usernameTimer, setUsernameTimer] = useState<NodeJS.Timeout | null>(null);
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");

    if (name === "email") {
      setEmailValid(value.length > 0 ? EMAIL_RE.test(value) : null);
    }

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
    if (!EMAIL_RE.test(form.email)) {
      setEmailValid(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.post<{ accessToken: string; userId: string }>(
        "/api/auth/register",
        form
      );
      setAuth(res.accessToken, form.username);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  const passwordError = validateNewPassword(form.password);
  const canSubmit =
    !loading &&
    usernameStatus !== "taken" &&
    emailValid !== false &&
    !passwordError &&
    form.username.length >= 3 &&
    EMAIL_RE.test(form.email);

  return (
    <AuthShell
      eyebrow="Nova conta"
      title={
        <>
          Entra na <span className="text-gradient-score">arena.</span>
        </>
      }
      subtitle="Cria a tua conta em menos de um minuto e começa a competir com a bolsa real."
      aside={
        <div className="space-y-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-electric">Join the league</p>
          <h1 className="text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white">
            Entra na <span className="text-gradient-score">arena.</span>
          </h1>
          <p className="max-w-md text-base leading-7 text-slate-400">
            Grátis para começar. Escolhe 5 ativos, sobe no ranking e desafia amigos em ligas privadas.
          </p>
          <div className="space-y-3">
            {[
              { icon: Zap, title: "Semana 1", copy: "Faz o teu primeiro draft logo após o registo" },
              { icon: Crown, title: "Capitão 2x", copy: "Duplica pontos no ativo certo no dia certo" },
              { icon: Trophy, title: "Bronze → Elite", copy: "Sobe de tier mês a mês com performance real" },
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
          Já tens conta?{" "}
          <Link href="/login" className="font-bold text-electric hover:text-white">
            Entrar
          </Link>
        </p>
      }
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl border border-electric/25 bg-electric/10">
          <UserPlus className="h-5 w-5 text-electric" />
        </span>
        <div>
          <p className="text-sm font-black text-white">Criar conta grátis</p>
          <p className="text-xs text-slate-500">Username, email e password</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={authLabelClass}>Username</label>
          <div className="relative">
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="ex: brunosilva"
              autoComplete="off"
              required
              className={cn(authInputClass, "pr-12")}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {usernameStatus === "checking" && (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              )}
              {usernameStatus === "available" && (
                <CheckCircle className="h-4 w-4 text-electric" />
              )}
              {usernameStatus === "taken" && (
                <XCircle className="h-4 w-4 text-coral" />
              )}
            </div>
          </div>
          {usernameStatus === "taken" && (
            <p className="mt-2 text-xs font-semibold text-coral">Este username já está ocupado.</p>
          )}
          {usernameStatus === "available" && (
            <p className="mt-2 text-xs font-semibold text-electric">Username disponível.</p>
          )}
        </div>

        <div>
          <label className={authLabelClass}>Email</label>
          <div className="relative">
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="o@teu.email"
              required
              className={cn(authInputClass, "pr-12")}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {emailValid === true && <CheckCircle className="h-4 w-4 text-electric" />}
              {emailValid === false && <XCircle className="h-4 w-4 text-coral" />}
            </div>
          </div>
          {emailValid === false && (
            <p className="mt-2 text-xs font-semibold text-coral">Endereço de email inválido.</p>
          )}
        </div>

        <div>
          <label className={authLabelClass}>Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder={`mínimo ${PASSWORD_MIN_LENGTH} caracteres`}
              required
              minLength={PASSWORD_MIN_LENGTH}
              className={cn(authInputClass, "pr-12")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition-colors hover:text-white"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">{PASSWORD_RULE_HINT_PT}</p>
        </div>

        {error && (
          <p className="rounded-2xl border border-coral/25 bg-coral/10 px-4 py-3 text-sm font-semibold text-coral">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="btn-primary w-full rounded-2xl py-3.5 text-base font-black"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> A criar conta...
            </>
          ) : (
            "Entrar na arena"
          )}
        </button>
      </form>
    </AuthShell>
  );
}
