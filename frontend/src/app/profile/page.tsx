"use client";

import { useEffect, useState } from "react";
import { User, Flame, Trophy, Star, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useAuth } from "@/store/auth";

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
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="font-bold text-xl">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

// ── componente principal ──────────────────────────────────────────────────────

export default function ProfilePage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 text-danger bg-danger/10 border border-danger/20 rounded-xl p-4">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* cabeçalho */}
      <div className="flex items-center gap-3">
        <User className="w-6 h-6 text-gold-400" />
        <h1 className="text-2xl font-extrabold">Perfil</h1>
      </div>

      {/* card principal */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-start gap-4">
          {/* avatar */}
          <div className="w-14 h-14 rounded-2xl bg-gold-500/20 flex items-center justify-center text-2xl font-bold text-gold-400 shrink-0">
            {profile.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-extrabold truncate">@{profile.username}</h2>
            <p className="text-slate-400 text-sm">{profile.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs bg-gold-500/15 text-gold-400 px-2.5 py-1 rounded-full font-medium">
                {tierLabels[profile.leagueTier] ?? profile.leagueTier}
              </span>
              <span className="text-xs text-slate-500 capitalize">{profile.plan}</span>
            </div>
          </div>
        </div>

        {/* tier histórico */}
        {profile.bestLeagueTier !== profile.leagueTier && (
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-sm text-slate-400">
            <Trophy className="w-4 h-4 text-gold-400 shrink-0" />
            Melhor tier: <span className="text-gold-400 font-semibold ml-1">{tierLabels[profile.bestLeagueTier] ?? profile.bestLeagueTier}</span>
          </div>
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
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Conquistas
        </h2>

        {achievements.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-slate-500 text-sm">
            Ainda sem conquistas — joga mais semanas para as desbloquear!
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {achievements.map((a, i) => {
              const info = achievementLabels[a.type] ?? { icon: "🏅", label: a.type };
              return (
                <div key={i} className="glass glass-hover rounded-xl p-4 flex items-center gap-3">
                  <span className="text-2xl shrink-0">{info.icon}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{info.label}</div>
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
  );
}
