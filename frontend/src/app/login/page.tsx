"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Loader2, Shield, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { PASSWORD_RULE_HINT_PT, isPasswordLongEnoughForLogin } from "@/lib/passwordPolicy";
import { useAuth } from "@/store/auth";
import { AuthShell, authInputClass, authLabelClass } from "@/components/stocko/AuthShell";
import { cn } from "@/lib/cn";

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
  const [passwordChangedBanner, setPasswordChangedBanner] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("passwordChanged") === "1") {
      setPasswordChangedBanner("Password alterada com sucesso. Entra com a nova password.");
      router.replace("/login", { scroll: false });
    }
  }, [router]);

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
    <AuthShell
      eyebrow="Entrar na arena"
      title={
        <>
          Volta ao <span className="text-gradient-score">jogo.</span>
        </>
      }
      subtitle="Entra com email ou username. A tua semana, o teu draft e os rankings estão à tua espera."
      aside={
        <div className="space-y-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-electric">Player access</p>
          <h1 className="text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white">
            Volta ao <span className="text-gradient-score">jogo.</span>
          </h1>
          <p className="max-w-md text-base leading-7 text-slate-400">
            Pick semanal, capitão 2x, ligas privadas e tiers mensais — tudo num só sítio.
          </p>
          <div className="space-y-3">
            {[
              ["Draft", "5 ativos por semana até domingo 23:59"],
              ["Capitão", "Activa no dia certo para duplicar pontos"],
              ["Rankings", "Global, por tier e nas tuas ligas"],
            ].map(([title, copy]) => (
              <div
                key={title}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              >
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-electric/25 bg-electric/10">
                  {title === "Draft" ? (
                    <Sparkles className="h-4 w-4 text-electric" />
                  ) : (
                    <Shield className="h-4 w-4 text-electric" />
                  )}
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
          Ainda não tens conta?{" "}
          <Link href="/register" className="font-bold text-electric hover:text-white">
            Regista-te grátis
          </Link>
        </p>
      }
    >
      <div className="mb-6 flex items-center gap-2">
        {(["identifier", "password"] as const).map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "grid h-8 w-8 place-items-center rounded-full border text-xs font-black",
                step === s || (s === "identifier" && step === "password")
                  ? "border-electric/40 bg-electric/15 text-electric"
                  : "border-white/10 bg-white/[0.04] text-slate-500"
              )}
            >
              {i + 1}
            </span>
            <span
              className={cn(
                "text-xs font-black uppercase tracking-[0.12em]",
                step === s ? "text-white" : "text-slate-500"
              )}
            >
              {s === "identifier" ? "Conta" : "Password"}
            </span>
            {i === 0 ? <div className="h-px flex-1 bg-white/10" /> : null}
          </div>
        ))}
      </div>

      {passwordChangedBanner && (
        <p className="mb-5 rounded-2xl border border-electric/25 bg-electric/10 px-4 py-3 text-sm font-semibold text-electric">
          {passwordChangedBanner}
        </p>
      )}

      {step === "identifier" && (
        <form onSubmit={handleIdentifier} className="space-y-5">
          <div>
            <label className={authLabelClass}>Email ou username</label>
            <input
              type="text"
              value={emailOrUsername}
              onChange={(e) => {
                setEmailOrUsername(e.target.value);
                setError("");
              }}
              placeholder="o@teu.email ou o teu username"
              required
              autoFocus
              autoComplete="username"
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
            disabled={checking || !emailOrUsername.trim()}
            className="btn-primary w-full rounded-2xl py-3.5 text-base font-black"
          >
            {checking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> A verificar...
              </>
            ) : (
              "Continuar"
            )}
          </button>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={handleLogin} className="space-y-5">
          <button
            type="button"
            onClick={() => {
              setStep("identifier");
              setError("");
              setPassword("");
            }}
            className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition-colors hover:border-electric/25 hover:bg-electric/[0.06]"
          >
            <ArrowLeft className="h-4 w-4 shrink-0 text-slate-500" />
            <span className="truncate text-sm font-semibold text-slate-300">{emailOrUsername}</span>
          </button>

          <div>
            <label className={authLabelClass}>Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="A tua password"
                required
                autoFocus
                autoComplete="current-password"
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
            disabled={loading || !isPasswordLongEnoughForLogin(password)}
            className="btn-primary w-full rounded-2xl py-3.5 text-base font-black"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> A entrar...
              </>
            ) : (
              "Entrar na arena"
            )}
          </button>

          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-sm font-bold text-slate-500 transition-colors hover:text-electric"
            >
              Esqueceu-se da password?
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
