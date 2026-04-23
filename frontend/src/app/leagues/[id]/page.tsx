"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Trophy, AlertCircle, Users } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useAuth } from "@/store/auth";

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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/leagues"
          className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all"
          aria-label="Voltar às ligas"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Trophy className="w-6 h-6 text-gold-400 shrink-0" />
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold truncate">
            {data?.name ?? "Liga"}
          </h1>
          {data && (
            <p className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
              <Users className="w-3.5 h-3.5" />
              {data.totalMembers} membros · semana actual
            </p>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-3 text-danger bg-danger/10 border border-danger/20 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="glass rounded-2xl p-5 text-sm text-slate-400">
            <span className="text-slate-300 font-medium">Semana: </span>
            {new Date(data.gameWeek.weekStart).toLocaleDateString("pt-PT", {
              day: "numeric",
              month: "short",
            })}
            {" → "}
            {new Date(data.gameWeek.weekEnd).toLocaleDateString("pt-PT", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>

          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pontuação na liga (esta semana)
            </div>
            {data.rankings.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Ainda não há pontuações esta semana.
              </div>
            ) : (
              <ul>
                {data.rankings.map((row, i) => (
                  <li
                    key={`${row.username}-${row.rank}`}
                    className={cn(
                      "flex items-center justify-between gap-3 px-4 py-3 text-sm",
                      i < data.rankings.length - 1 && "border-b border-white/5",
                      row.isMe && "bg-gold-500/10"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-8 flex justify-center shrink-0">
                        <RankBadge rank={row.rank} />
                      </span>
                      <span className={cn("font-medium truncate", row.isMe && "text-gold-400")}>
                        @{row.username}
                        {row.isMe && " (tu)"}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-semibold text-white">
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
  );
}
