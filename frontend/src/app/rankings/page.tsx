"use client";

import { useEffect, useState } from "react";
import { Trophy, Crown, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useAuth } from "@/store/auth";
import { GlassPanel, PageHeader, StatChip, TierBadge } from "@/components/stocko/ui";
import { AppShell } from "@/components/stocko/AppShell";

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
    <AppShell>
    <div className="max-w-6xl mx-auto space-y-6 pb-20 md:pb-8">
      <PageHeader
        eyebrow="Leaderboard"
        title={<>Caça o <span className="text-gradient-gold">topo</span></>}
        subtitle="Ranking semanal, zonas de promoção e relegação. A tua linha tem de saltar à vista."
        action={<Trophy className="hidden h-16 w-16 text-gold-400 md:block" />}
      />

      {/* tabs */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 flex gap-2">
        {(["global", "tier"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-black transition-all",
              tab === t
                ? "bg-electric text-navy-950 shadow-[0_0_24px_rgba(0,255,136,0.18)]"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            {t === "global" ? "Global" : "O meu Tier"}
          </button>
        ))}
      </div>

      {/* loading */}
      {loading && (
        <GlassPanel className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-electric border-t-transparent rounded-full animate-spin" />
        </GlassPanel>
      )}

      {/* erro */}
      {!loading && error && (
        <GlassPanel tone="coral" className="flex items-center gap-3 text-danger">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </GlassPanel>
      )}

      {/* ranking global */}
      {!loading && !error && tab === "global" && global && (
        <div className="space-y-4">
          {/* a minha posição */}
          {global.myRank > 0 && (
            <GlassPanel tone="gold" className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">A tua posição</p>
                <p className="font-mono text-5xl font-black text-gold-400">#{global.myRank}</p>
                <p className="text-sm text-slate-500">de {global.totalPlayers} jogadores</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatChip label="Pontos" value={global.myPoints.toFixed(1)} tone="gold" />
                <StatChip label="Percentil" value={`top ${global.myPercentile}%`} tone="green" />
              </div>
            </GlassPanel>
          )}

          {/* lista */}
          <div className="glass rounded-[1.75rem] overflow-hidden p-0">
            <div className="px-5 py-4 border-b border-white/5 text-xs font-black text-slate-500 uppercase tracking-[0.16em]">
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
                    "px-5 py-4 flex items-center gap-4 hover:bg-white/[0.03] transition-colors",
                    i < global.rankings.length - 1 && "border-b border-white/5",
                    row.isMe && "bg-gold-400/10 shadow-[inset_3px_0_0_rgba(255,215,0,0.65)]"
                  )}
                >
                  <div className="w-8 text-center shrink-0">
                    <RankBadge rank={row.rank} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-black truncate", row.isMe && "text-gold-400")}>
                        {row.username}
                        {row.isMe && <span className="text-xs ml-1">(tu)</span>}
                      </span>
                      {row.isMe && <Crown className="w-3.5 h-3.5 text-gold-400 shrink-0" />}
                    </div>
                    <TierBadge tier={row.leagueTier} />
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-black font-mono text-base text-electric">{row.totalPoints.toFixed(1)}</div>
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
          <GlassPanel tone="gold" className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 mb-2">O teu tier</p>
              <TierBadge tier={tier.tier} />
              <p className="text-xs text-slate-500">{tier.totalInTier} jogadores</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 mb-0.5">Posição no tier</p>
              <p className="font-mono font-black text-gold-400 text-4xl">#{tier.myRank}</p>
              <p className="font-mono text-sm text-electric">{tier.myPoints.toFixed(1)} pts</p>
            </div>
          </GlassPanel>

          {/* legenda */}
          <div className="flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-success shrink-0" />
              Zona de promoção (top 20%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-danger shrink-0" />
              Zona de relegação (bottom 20%)
            </span>
          </div>

          {/* lista */}
          <div className="glass rounded-[1.75rem] overflow-hidden p-0">
            {tier.rankings.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Ainda sem pontuações esta semana.
              </div>
            ) : (
              tier.rankings.map((row, i) => (
                <div
                  key={row.rank}
                  className={cn(
                    "px-5 py-4 flex items-center gap-4",
                    i < tier.rankings.length - 1 && "border-b border-white/5",
                    row.isMe && "bg-gold-400/10",
                    row.isPromotionZone && "bg-success/[0.05] shadow-[inset_3px_0_0_rgba(0,255,136,0.65)]",
                    row.isRelegationZone && "bg-danger/[0.05] shadow-[inset_3px_0_0_rgba(255,71,87,0.65)]"
                  )}
                >
                  <div className="w-8 text-center shrink-0">
                    <RankBadge rank={row.rank} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={cn("text-sm font-black truncate block", row.isMe && "text-gold-400")}>
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
                  <div className="font-black font-mono text-base text-electric shrink-0">
                    {row.totalPoints.toFixed(1)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
    </AppShell>
  );
}
