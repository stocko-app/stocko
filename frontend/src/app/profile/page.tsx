"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Flame,
  Trophy,
  Star,
  Calendar,
  TrendingUp,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  PASSWORD_RULE_HINT_PT,
  validateNewPassword,
} from "@/lib/passwordPolicy";
import { useAuth } from "@/store/auth";
import { GlassPanel, PageHeader, TierBadge } from "@/components/stocko/ui";
import { AppShell } from "@/components/stocko/AppShell";

// ── tipos ─────────────────────────────────────────────────────────────────────

interface Profile {
  username: string;
  email: string;
  plan: string;
  leagueTier: string;
  bestLeagueTier: string;
  streakWeeks: number;
  streakBest: number;
  achievementCount: number;
  totalWeeksPlayed: number;
  bestScore: number;
  createdAt: string;
}

interface Achievement {
  type: string;
  earnedAt: string;
}

interface ChangePasswordResponse {
  message: string;
  accessToken?: string | null;
  requiresRelogin?: boolean;
}

// ── helpers ───────────────────────────────────────────────────────────────────

const tierLabels: Record<string, string> = {
  bronze:   "Bronze 🥉",
  silver:   "Prata 🥈",
  gold:     "Ouro 🥇",
  platinum: "Platina 💎",
  diamond:  "Diamante 💠",
  elite:    "Elite 👑",
};

const achievementLabels: Record<string, { icon: string; label: string }> = {
  first_pick:       { icon: "🎯", label: "Primeiro Pick" },
  streak_3:         { icon: "🔥", label: "3 Semanas Seguidas" },
  streak_5:         { icon: "💥", label: "5 Semanas Seguidas" },
  streak_10:        { icon: "⚡", label: "10 Semanas Seguidas" },
  top_10_percent:   { icon: "🏆", label: "Top 10%" },
  beat_index:       { icon: "📈", label: "Bateu o S&P500" },
  captain_win:      { icon: "⭐", label: "Capitão Vencedor" },
  perfect_week:     { icon: "💎", label: "Semana Perfeita" },
};

function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="glass rounded-[1.35rem] border-white/10 p-4">
      <div className="flex items-center gap-2 text-slate-400 text-xs mb-2 font-black uppercase tracking-[0.12em]">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="font-mono font-black text-2xl text-white">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

// ── componente principal ──────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const { token, username, setAuth, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [pwdOpen, setPwdOpen] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdOk, setPwdOk] = useState("");

  useEffect(() => {
    setProfile(null);
    setAchievements([]);
    setError("");
    setLoading(true);
    Promise.all([
      api.get<Profile>("/api/users/me"),
      api.get<Achievement[]>("/api/users/me/achievements"),
    ])
      .then(([p, a]) => {
        setProfile(p);
        setAchievements(a);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]); // re-fetch quando o utilizador muda

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdError("");
    setPwdOk("");
    if (newPwd !== confirmPwd) {
      setPwdError("As passwords não coincidem.");
      return;
    }
    const v = validateNewPassword(newPwd);
    if (v) {
      setPwdError(v);
      return;
    }
    setPwdLoading(true);
    try {
      const res = await api.post<ChangePasswordResponse>("/api/auth/change-password", {
        currentPassword: currentPwd,
        newPassword: newPwd,
      });
      if (res.requiresRelogin || !res.accessToken) {
        logout();
        router.push("/login?passwordChanged=1");
        return;
      }
      setAuth(res.accessToken, username ?? profile?.username ?? "");
      setPwdOk(res.message);
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      setShowCurrentPwd(false);
      setShowNewPwd(false);
      setShowConfirmPwd(false);
    } catch (err: unknown) {
      setPwdError(err instanceof Error ? err.message : "Não foi possível alterar a password.");
    } finally {
      setPwdLoading(false);
    }
  }

  if (loading) {
    return (
      <GlassPanel className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-electric border-t-transparent rounded-full animate-spin" />
      </GlassPanel>
    );
  }

  if (error) {
    return (
      <GlassPanel tone="coral" className="flex items-center gap-3 text-danger">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span className="text-sm">{error}</span>
      </GlassPanel>
    );
  }

  if (!profile) return null;

  return (
    <AppShell>
    <div className="max-w-6xl mx-auto space-y-6 pb-20 md:pb-8">
      <PageHeader
        eyebrow="Player card"
        title={<>@{profile.username}</>}
        subtitle="Streaks, tiers e conquistas: o teu histórico competitivo dentro do Stocko."
        action={<User className="hidden h-16 w-16 text-electric md:block" />}
      />

      {/* card principal */}
      <GlassPanel tone="gold">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          {/* avatar */}
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-[1.7rem] bg-gold-400/15 border border-gold-400/30 flex items-center justify-center text-4xl font-black text-gold-400 shrink-0 shadow-[0_0_34px_rgba(255,215,0,0.16)]">
              {profile.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-black truncate">@{profile.username}</h2>
              <p className="text-slate-400 text-sm">{profile.email}</p>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <TierBadge tier={profile.leagueTier} />
                <span className="text-xs text-slate-500 capitalize font-black tracking-[0.12em]">{profile.plan}</span>
              </div>
            </div>
          </div>
          <div className="text-left md:text-right">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Streak atual</p>
            <p className="font-mono text-6xl font-black text-gold-400 leading-none">{profile.streakWeeks}</p>
            <p className="text-xs text-slate-400 mt-1">semanas seguidas</p>
          </div>
        </div>

        {/* tier histórico */}
        {profile.bestLeagueTier !== profile.leagueTier && (
          <div className="mt-5 pt-4 border-t border-white/5 flex items-center gap-2 text-sm text-slate-400">
            <Trophy className="w-4 h-4 text-gold-400 shrink-0" />
            Melhor tier: <span className="text-gold-400 font-semibold ml-1">{tierLabels[profile.bestLeagueTier] ?? profile.bestLeagueTier}</span>
          </div>
        )}
      </GlassPanel>

      {/* alterar password */}
      <div className="glass rounded-[1.5rem] overflow-hidden p-0">
        <button
          type="button"
          onClick={() => {
            setPwdOpen((o) => !o);
            setPwdError("");
            setPwdOk("");
          }}
          className="w-full flex items-center justify-between gap-3 px-6 py-4 text-left hover:bg-white/[0.03] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-electric shrink-0" />
            <span className="font-semibold text-white">Alterar password</span>
          </div>
          <span className="text-slate-500 text-sm">{pwdOpen ? "Fechar" : "Abrir"}</span>
        </button>

        {pwdOpen && (
          <form onSubmit={handleChangePassword} className="px-6 pb-6 pt-0 space-y-4 border-t border-white/5">
            <p className="text-slate-500 text-xs pt-4">{PASSWORD_RULE_HINT_PT}</p>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password actual</label>
              <div className="relative">
                <input
                  type={showCurrentPwd ? "text" : "password"}
                  value={currentPwd}
                  onChange={(e) => { setCurrentPwd(e.target.value); setPwdError(""); setPwdOk(""); }}
                  autoComplete="current-password"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-electric/50 focus:ring-1 focus:ring-electric/20 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPwd((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  aria-label={showCurrentPwd ? "Ocultar password actual" : "Mostrar password actual"}
                >
                  {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Nova password</label>
              <div className="relative">
                <input
                  type={showNewPwd ? "text" : "password"}
                  value={newPwd}
                  onChange={(e) => { setNewPwd(e.target.value); setPwdError(""); setPwdOk(""); }}
                  autoComplete="new-password"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-electric/50 focus:ring-1 focus:ring-electric/20 pr-10"
                  placeholder="nova password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPwd((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  aria-label={showNewPwd ? "Ocultar nova password" : "Mostrar nova password"}
                >
                  {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirmar nova password</label>
              <div className="relative">
                <input
                  type={showConfirmPwd ? "text" : "password"}
                  value={confirmPwd}
                  onChange={(e) => { setConfirmPwd(e.target.value); setPwdError(""); setPwdOk(""); }}
                  autoComplete="new-password"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-electric/50 focus:ring-1 focus:ring-electric/20 pr-10"
                  placeholder="repete a nova password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPwd((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  aria-label={showConfirmPwd ? "Ocultar confirmação" : "Mostrar confirmação"}
                >
                  {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {pwdError && (
              <p className="text-danger text-sm bg-danger/10 border border-danger/20 rounded-lg px-4 py-2">{pwdError}</p>
            )}
            {pwdOk && (
              <p className="text-success text-sm bg-success/10 border border-success/20 rounded-lg px-4 py-2">{pwdOk}</p>
            )}

            <button
              type="submit"
              disabled={
                pwdLoading ||
                !currentPwd ||
                !newPwd ||
                !confirmPwd ||
                !!validateNewPassword(newPwd)
              }
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {pwdLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> A guardar...
                </>
              ) : (
                "Guardar nova password"
              )}
            </button>

            <p className="text-center text-xs text-slate-600">
              Preferes por email?{" "}
              <Link href="/forgot-password" className="text-gold-400 hover:text-gold-300">
                Recuperar password
              </Link>
            </p>
          </form>
        )}
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Flame}
          label="Streak actual"
          value={`${profile.streakWeeks}🔥`}
          sub={`Máximo: ${profile.streakBest}`}
        />
        <StatCard
          icon={Calendar}
          label="Semanas jogadas"
          value={profile.totalWeeksPlayed}
        />
        <StatCard
          icon={TrendingUp}
          label="Melhor semana"
          value={profile.bestScore.toFixed(1)}
          sub="pontos"
        />
        <StatCard
          icon={Star}
          label="Conquistas"
          value={profile.achievementCount}
        />
      </div>

      {/* conquistas */}
      <div>
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.16em] mb-3">
          Conquistas
        </h2>

        {achievements.length === 0 ? (
          <GlassPanel className="p-8 text-center text-slate-500 text-sm">
            Ainda sem conquistas — joga mais semanas para as desbloquear!
          </GlassPanel>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {achievements.map((a, i) => {
              const info = achievementLabels[a.type] ?? { icon: "🏅", label: a.type };
              return (
                <div key={i} className="glass glass-hover rounded-[1.35rem] p-4 flex items-center gap-3 border-electric/20">
                  <span className="text-2xl shrink-0 drop-shadow-[0_0_12px_rgba(0,255,136,0.25)]">{info.icon}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-black truncate">{info.label}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(a.earnedAt).toLocaleDateString("pt-PT", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* membro desde */}
      <p className="text-center text-xs text-slate-600">
        Membro desde {new Date(profile.createdAt).toLocaleDateString("pt-PT", {
          day: "numeric", month: "long", year: "numeric"
        })}
      </p>
    </div>
    </AppShell>
  );
}
