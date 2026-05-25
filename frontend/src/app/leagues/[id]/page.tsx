"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Trophy, AlertCircle, Users } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useAuth } from "@/store/auth";
import { AppShell } from "@/components/stocko/AppShell";
import { EmptyCard, GlassPanel, PageHeader, StatChip } from "@/components/stocko/ui";

interface LeagueRankingRow {
  rank: number;
  username: string;
  totalPoints: number;
  isMe: boolean;
  hasPlayed: boolean;
}

interface LeagueRankingsResponse {
  id: string;
  name: string;
  inviteCode: string;
  totalMembers: number;
  gameWeek: { weekStart: string; weekEnd: string };
  rankings: LeagueRankingRow[];
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-gold-400 font-bold">🥇</span>;
  if (rank === 2) return <span className="text-slate-300 font-bold">🥈</span>;
  if (rank === 3) return <span className="text-amber-600 font-bold">🥉</span>;
  return <span className="text-slate-500 font-mono text-sm">{rank}</span>;
}

export default function LeagueDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0] ?? "";
  const { token } = useAuth();
  const [data, setData] = useState<LeagueRankingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setData(null);
    setError("");
    setLoading(true);
    api
      .get<LeagueRankingsResponse>(`/api/leagues/${id}/rankings`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao carregar a liga."))
      .finally(() => setLoading(false));
  }, [id, token]);

  return (
    <AppShell>
    <div className="max-w-5xl mx-auto space-y-6 pb-20 md:pb-8">
      <Link
        href="/leagues"
        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-slate-400 transition-all hover:border-electric/30 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar às ligas
      </Link>

      <PageHeader
        eyebrow="League arena"
        title={data?.name ?? "Liga"}
        subtitle={
          data ? (
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4 text-electric" />
              {data.totalMembers} membros · ranking semanal privado
            </span>
          ) : (
            "A carregar arena privada..."
          )
        }
        action={<Trophy className="hidden h-16 w-16 text-gold-400 md:block" />}
      />

      {loading && (
        <GlassPanel className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-electric border-t-transparent rounded-full animate-spin" />
        </GlassPanel>
      )}

      {!loading && error && (
        <GlassPanel tone="coral" className="flex items-center gap-3 text-danger">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </GlassPanel>
      )}

      {!loading && !error && data && (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <GlassPanel tone="gold">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Código convite</p>
              <p className="mt-2 font-mono text-3xl font-black tracking-widest text-gold-400">{data.inviteCode}</p>
            </GlassPanel>
            <GlassPanel>
              <StatChip label="Membros" value={data.totalMembers} />
            </GlassPanel>
            <GlassPanel tone="green">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Semana</p>
              <p className="mt-2 text-sm font-bold text-slate-300">
                {new Date(data.gameWeek.weekStart).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}
                {" -> "}
                {new Date(data.gameWeek.weekEnd).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}
              </p>
            </GlassPanel>
          </div>

          <div className="glass rounded-[1.75rem] overflow-hidden p-0">
            <div className="px-5 py-4 border-b border-white/5 text-xs font-black text-slate-500 uppercase tracking-[0.16em]">
              Pontuação na liga (esta semana)
            </div>
            {data.rankings.length === 0 ? (
              <EmptyCard title="Ainda sem pontuações" copy="Quando houver scoring esta semana, a tabela aparece aqui." />
            ) : (
              <ul>
                {data.rankings.map((row, i) => (
                  <li
                    key={`${row.username}-${row.rank}`}
                    className={cn(
                      "flex items-center justify-between gap-3 px-5 py-4 text-sm",
                      i < data.rankings.length - 1 && "border-b border-white/5",
                      row.isMe && "bg-gold-400/10 shadow-[inset_3px_0_0_rgba(255,215,0,0.65)]"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-8 flex justify-center shrink-0">
                        <RankBadge rank={row.rank} />
                      </span>
                      <span className={cn("font-black truncate", row.isMe && "text-gold-400")}>
                        @{row.username}
                        {row.isMe && " (tu)"}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-black text-electric">
                        {row.totalPoints.toFixed(1)}
                      </span>
                      {!row.hasPlayed && (
                        <span className="block text-[10px] text-slate-500 uppercase">sem jogo</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
    </AppShell>
  );
}
