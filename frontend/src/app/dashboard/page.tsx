"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Star, Zap, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

interface Pick {
  id: string;
  ticker: string;
  name: string;
  sector: string;
  isCaptainDraft: boolean;
  captainActivatedDay: string | null;
  weekPoints: number;
  isAuto: boolean;
  latestPrice: { close: number; pctChange: number } | null;
}

interface WeekData {
  gameWeekId: string;
  weekStart: string;
  weekEnd: string;
  deadline: string;
  status: string;
  deadlinePassed: boolean;
  picks: Pick[];
}

export default function DashboardPage() {
  const [data, setData] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<WeekData>("/api/picks/week")
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

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

  const totalPoints = data?.picks.reduce((sum, p) => sum + p.weekPoints, 0) ?? 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* cabeçalho */}
      <div>
        <h1 className="text-2xl font-extrabold">Dashboard</h1>
        {data && (
          <p className="text-slate-400 text-sm mt-1">
            Semana {new Date(data.weekStart).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}
            {" – "}
            {new Date(data.weekEnd).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}
          </p>
        )}
      </div>

      {/* pontos da semana */}
      <div className="glass rounded-2xl p-6 flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">Pontos esta semana</p>
          <p className="text-4xl font-extrabold text-gradient-gold mt-1">
            {totalPoints.toFixed(1)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-slate-400 text-sm">Picks</p>
          <p className="text-2xl font-bold mt-1">
            {data?.picks.length ?? 0}
            <span className="text-slate-500 text-base font-normal">/5</span>
          </p>
        </div>
      </div>

      {/* lista de picks */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Os teus picks
        </h2>

        {!data?.picks.length ? (
          <div className="glass rounded-2xl p-8 text-center text-slate-400">
            <p className="text-lg font-semibold mb-1">Ainda sem picks</p>
            <p className="text-sm">O deadline ainda não passou — escolhe as tuas acções.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.picks.map((pick) => {
              const positive = (pick.latestPrice?.pctChange ?? 0) >= 0;
              return (
                <div
                  key={pick.id}
                  className="glass glass-hover rounded-xl p-4 flex items-center gap-4"
                >
                  {/* ticker */}
                  <div className="w-12 h-12 rounded-xl bg-navy-700 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-gold-400">{pick.ticker}</span>
                  </div>

                  {/* info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{pick.name}</span>
                      {pick.isCaptainDraft && (
                        <span title="Capitão">
                          <Star className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                        </span>
                      )}
                      {pick.isAuto && (
                        <span title="Auto-pick">
                          <Zap className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{pick.sector}</span>
                  </div>

                  {/* variação */}
                  <div className="text-right shrink-0">
                    {pick.latestPrice ? (
                      <div className={cn("flex items-center gap-1 text-sm font-semibold", positive ? "text-success" : "text-danger")}>
                        {positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {Math.abs(pick.latestPrice.pctChange).toFixed(2)}%
                      </div>
                    ) : (
                      <span className="text-slate-500 text-sm">—</span>
                    )}
                    <div className="text-xs text-slate-500 mt-0.5">
                      {pick.weekPoints.toFixed(1)} pts
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
