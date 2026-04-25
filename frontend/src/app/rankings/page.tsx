"use client";

import { useEffect, useState } from "react";
import { Trophy, Crown, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useAuth } from "@/store/auth";

// ── tipos ─────────────────────────────────────────────────────────────────────

interface RankingRow {
  rank: number;
  username: string;
  leagueTier?: string;
  totalPoints: number;
  percentile?: number;
  isMe: boolean;
  isPromotionZone?: boolean;
  isRelegationZone?: boolean;
}

interface GlobalData {
  totalPlayers: number;
  myRank: number;
  myPoints: number;
  myPercentile: number;
  rankings: RankingRow[];
}

interface TierData {
  tier: string;
  totalInTier: number;
  myRank: number;
  myPoints: number;
  promotionCutoff: number;
  relegationCutoff: number;
  rankings: RankingRow[];
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

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-gold-400 font-bold">🥇</span>;
  if (rank === 2) return <span className="text-slate-300 font-bold">🥈</span>;
  if (rank === 3) return <span className="text-amber-600 font-bold">🥉</span>;
  return <span className="text-slate-500 font-mono text-sm">{rank}</span>;
}

// ── componente principal ──────────────────────────────────────────────────────

export default function RankingsPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<"global" | "tier">("global");
  const [global, setGlobal] = useState<GlobalData | null>(null);
  const [tier, setTier] = useState<TierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setGlobal(null);
    setTier(null);
    setLoading(true);
    setError("");

    const endpoint = tab === "global" ? "/api/rankings/global" : "/api/rankings/tier";

    api.get<GlobalData | TierData>(endpoint)
      .then((data) => {
        if (tab === "global") setGlobal(data as GlobalData);
        else setTier(data as TierData);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tab, token]); // re-fetch quando muda de tab ou de utilizador

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 md:pb-8">
      <div className="surface-card">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-gold-400" />
          <div>
            <p className="section-title">Competicao</p>
            <h1 className="text-2xl md:text-3xl font-extrabold">Rankings</h1>
          </div>
        </div>
      </div>

      {/* tabs */}
      <div className="surface-muted rounded-xl p-1.5 flex gap-2">
        {(["global", "tier"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all",
              tab === t
                ? "bg-gold-500 text-navy-950"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            {t === "global" ? "Global" : "O meu Tier"}
          </button>
        ))}
      </div>

      {/* loading */}
      {loading && (
        <div className="surface-card flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* erro */}
      {!loading && error && (
        <div className="surface-card flex items-center gap-3 text-danger bg-danger/10 border border-danger/20">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* ranking global */}
      {!loading && !error && tab === "global" && global && (
        <div className="space-y-4">
          {/* a minha posição */}
          {global.myRank > 0 && (
            <div className="surface-card rounded-xl p-4 flex items-center justify-between border border-gold-500/20">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">A tua posição</p>
                <p className="font-bold text-lg">
                  #{global.myRank}
                  <span className="text-slate-500 font-normal text-sm ml-2">
                    de {global.totalPlayers} jogadores
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 mb-0.5">Pontos</p>
                <p className="font-bold text-gold-400 font-mono">{global.myPoints.toFixed(1)}</p>
                <p className="text-xs text-slate-500">top {global.myPercentile}%</p>
              </div>
            </div>
          )}

          {/* lista */}
          <div className="surface-card rounded-2xl overflow-hidden p-0">
            <div className="px-5 py-3 border-b border-white/5 text-xs text-slate-500 uppercase tracking-wider">
              Top jogadores esta semana
            </div>
            {global.rankings.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Ainda sem pontuações esta semana.
              </div>
            ) : (
              global.rankings.map((row, i) => (
                <div
                  key={row.rank}
                  className={cn(
                    "px-5 py-3.5 flex items-center gap-4 hover:bg-white/[0.02]",
                    i < global.rankings.length - 1 && "border-b border-white/5",
                    row.isMe && "bg-gold-500/5"
                  )}
                >
                  <div className="w-8 text-center shrink-0">
                    <RankBadge rank={row.rank} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-semibold truncate", row.isMe && "text-gold-400")}>
                        {row.username}
                        {row.isMe && <span className="text-xs ml-1">(tu)</span>}
                      </span>
                      {row.isMe && <Crown className="w-3.5 h-3.5 text-gold-400 shrink-0" />}
                    </div>
                    <span className="text-xs text-slate-500">
                      {tierLabels[row.leagueTier ?? ""] ?? row.leagueTier}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold font-mono text-sm">{row.totalPoints.toFixed(1)}</div>
                    <div className="text-xs text-slate-500">top {row.percentile}%</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ranking tier */}
      {!loading && !error && tab === "tier" && tier && (
        <div className="space-y-4">
          {/* info do tier */}
          <div className="surface-card rounded-xl p-4 flex items-center justify-between border border-gold-500/20">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">O teu tier</p>
              <p className="font-bold text-lg">{tierLabels[tier.tier] ?? tier.tier}</p>
              <p className="text-xs text-slate-500">{tier.totalInTier} jogadores</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 mb-0.5">Posição no tier</p>
              <p className="font-bold text-gold-400 text-lg">#{tier.myRank}</p>
              <p className="font-mono text-sm">{tier.myPoints.toFixed(1)} pts</p>
            </div>
          </div>

          {/* legenda */}
          <div className="flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-success/60 shrink-0" />
              Zona de promoção (top 20%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-danger/60 shrink-0" />
              Zona de relegação (bottom 20%)
            </span>
          </div>

          {/* lista */}
          <div className="surface-card rounded-2xl overflow-hidden p-0">
            {tier.rankings.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Ainda sem pontuações esta semana.
              </div>
            ) : (
              tier.rankings.map((row, i) => (
                <div
                  key={row.rank}
                  className={cn(
                    "px-5 py-3.5 flex items-center gap-4",
                    i < tier.rankings.length - 1 && "border-b border-white/5",
                    row.isMe && "bg-gold-500/5",
                    row.isPromotionZone && "border-l-2 border-l-success/50",
                    row.isRelegationZone && "border-l-2 border-l-danger/50"
                  )}
                >
                  <div className="w-8 text-center shrink-0">
                    <RankBadge rank={row.rank} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={cn("text-sm font-semibold truncate block", row.isMe && "text-gold-400")}>
                      {row.username}
                      {row.isMe && <span className="text-xs ml-1">(tu)</span>}
                    </span>
                    {row.isPromotionZone && (
                      <span className="text-xs text-success">↑ promoção</span>
                    )}
                    {row.isRelegationZone && (
                      <span className="text-xs text-danger">↓ relegação</span>
                    )}
                  </div>
                  <div className="font-bold font-mono text-sm shrink-0">
                    {row.totalPoints.toFixed(1)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
