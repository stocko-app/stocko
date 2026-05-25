"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Star, Zap, AlertCircle, Plus, ShieldCheck, CalendarClock, Target } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useAuth } from "@/store/auth";
import PickSelector from "@/components/picks/PickSelector";
import { EmptyCard, GlassPanel, PageHeader } from "@/components/stocko/ui";

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

interface NextWeekDraft {
  gameWeekId: string;
  weekStart: string;
  weekEnd: string;
  deadline: string;
  picks: { id: string; ticker: string; name: string; sector: string; isCaptainDraft: boolean }[];
}

interface WeekData {
  gameWeekId: string;
  weekStart: string;
  weekEnd: string;
  deadline: string;
  status: string;
  deadlinePassed: boolean;
  picks: Pick[];
  nextWeekDraft: NextWeekDraft | null;
}

export default function DashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [pickerInitialPicks, setPickerInitialPicks] = useState<{ ticker: string; isCaptainDraft: boolean }[]>([]);

  function openPicker(picks: { ticker: string; isCaptainDraft: boolean }[]) {
    setPickerInitialPicks(picks);
    setShowPicker(true);
  }
  const [captainTicker, setCaptainTicker] = useState("");
  const [captainLoading, setCaptainLoading] = useState(false);
  const [captainError, setCaptainError] = useState("");
  const [captainSuccess, setCaptainSuccess] = useState("");

  function loadWeek() {
    setLoading(true);
    api.get<WeekData>("/api/picks/week")
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setData(null);
    setError("");
    loadWeek();
  }, [token]); // re-fetch sempre que o utilizador muda

  async function activateCaptain() {
    if (!captainTicker) return;
    setCaptainLoading(true);
    setCaptainError("");
    setCaptainSuccess("");
    try {
      const res = await api.post<{ message: string }>("/api/picks/captain", { ticker: captainTicker });
      setCaptainSuccess(res.message);
      loadWeek();
    } catch (e: unknown) {
      setCaptainError(e instanceof Error ? e.message : "Erro ao activar capitão.");
    } finally {
      setCaptainLoading(false);
    }
  }

  function formatRange(start: string, end: string) {
    return `${new Date(start).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })} – ${new Date(end).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}`;
  }

  if (loading) {
    return (
      <GlassPanel className="flex min-h-64 flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-electric border-t-transparent" />
        <p className="text-sm text-slate-400">A preparar o teu scoreboard...</p>
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

  const totalPoints = data?.picks.reduce((sum, p) => sum + p.weekPoints, 0) ?? 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20 md:pb-8">
      <PageHeader
        eyebrow="Live dashboard"
        title={<>O teu <span className="text-gradient-score">scoreboard</span></>}
        subtitle={
          data ? (
            <span className="inline-flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-electric" />
              Semana {formatRange(data.weekStart, data.weekEnd)} · pontos atualizados por fecho de mercado
            </span>
          ) : (
            "Acompanha picks, capitão e ranking semanal."
          )
        }
      />

      {/* card activação de capitão */}
      {(() => {
        if (!data?.deadlinePassed || !data.picks.length) return null;
        const captainDraft = data.picks.find((p) => p.isCaptainDraft);
        if (!captainDraft) return null;
        const alreadyActivated = data.picks.some((p) => p.captainActivatedDay !== null);
        const todayDay = new Date().getDay(); // 0=Dom, 1=Seg, ..., 5=Sex, 6=Sab
        const canActivate = !alreadyActivated && todayDay >= 1 && todayDay <= 4;

        if (alreadyActivated) {
          const activatedPick = data.picks.find((p) => p.captainActivatedDay !== null);
          return (
            <GlassPanel tone="gold" className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-gold-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gold-300">Capitão activado</p>
                <p className="text-xs text-slate-400">
                  {activatedPick?.ticker} · {new Date(activatedPick!.captainActivatedDay!).toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "short" })}
                </p>
              </div>
            </GlassPanel>
          );
        }

        if (!canActivate) {
          return (
            <GlassPanel className="flex items-center gap-3">
              <Star className="w-5 h-5 text-slate-500 shrink-0" />
              <p className="text-sm text-slate-400">
                {todayDay === 5
                  ? "Hoje é Sexta — o capitão é activado automaticamente."
                  : "O capitão só pode ser activado de Segunda a Quinta."}
              </p>
            </GlassPanel>
          );
        }

        return (
          <GlassPanel tone="gold" className="space-y-3">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-gold-400 animate-pulse-gold" />
              <p className="font-black text-gold-300">Activar capitão hoje</p>
            </div>
            <p className="text-sm text-slate-400">
              Escolhe qual dos teus picks conta a dobrar hoje. Só podes usar uma vez por semana.
            </p>

            <div className="flex gap-2 flex-wrap">
              {data.picks.map((p) => (
                <button
                  key={p.ticker}
                  onClick={() => setCaptainTicker(p.ticker)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-sm font-mono font-bold border transition-all",
                    captainTicker === p.ticker
                      ? "bg-gold-400/20 border-gold-400/60 text-gold-300"
                      : "bg-white/5 border-white/10 text-slate-300 hover:border-white/20"
                  )}
                >
                  {p.ticker}
                </button>
              ))}
            </div>

            {captainError && (
              <p className="text-sm text-danger flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {captainError}
              </p>
            )}
            {captainSuccess && (
              <p className="text-sm text-success flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" /> {captainSuccess}
              </p>
            )}

            <button
              onClick={activateCaptain}
              disabled={!captainTicker || captainLoading}
              className="w-full py-3 rounded-2xl bg-gold-400 hover:bg-gold-300 text-navy-950 font-black text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(255,215,0,0.22)]"
            >
              {captainLoading ? "A activar..." : `Activar ${captainTicker || "—"} como capitão`}
            </button>
          </GlassPanel>
        );
      })()}

      <div className="grid gap-3 md:grid-cols-3">
        <GlassPanel tone="green">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500 font-black">Pontos da semana</p>
          <p className="kpi-value text-gradient-score mt-2 animate-score-pop">{totalPoints.toFixed(1)}</p>
          <p className="text-xs text-slate-500 mt-2">Actualização após fecho de mercado</p>
        </GlassPanel>
        <GlassPanel tone={(data?.picks.length ?? 0) === 5 ? "green" : "gold"}>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500 font-black">Picks activos</p>
          <p className="kpi-value mt-2 text-white">
            {data?.picks.length ?? 0}
            <span className="text-slate-500 text-lg font-semibold">/5</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">{data?.deadlinePassed ? "Deadline fechado" : "Ainda podes alterar picks"}</p>
        </GlassPanel>
        <GlassPanel tone="gold">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500 font-black">Estado do capitão</p>
          <p className="kpi-value mt-2 flex items-center gap-2 text-2xl md:text-3xl text-gold-400">
            <Target className="w-6 h-6 text-gold-400" />
            {data?.picks.some((p) => p.captainActivatedDay) ? "Activo" : "Pendente"}
          </p>
          <p className="text-xs text-slate-500 mt-2">Só pode ser activado uma vez por semana</p>
        </GlassPanel>
      </div>

      {/* modal de selecção de picks */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl glass rounded-[2rem] border-electric/20 p-5 md:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tight">Draft room</h2>
              <button onClick={() => setShowPicker(false)} className="text-slate-400 hover:text-white">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <p className="text-sm text-slate-400">
              Escolhe exactamente 5 acções. Marca ⭐ numa para a definir como capitão (pontos duplicados).
            </p>
            <PickSelector
              maxPicks={5}
              initialPicks={pickerInitialPicks}
              onSuccess={() => { setShowPicker(false); loadWeek(); }}
              onCancel={() => setShowPicker(false)}
            />
          </div>
        </div>
      )}

      {/* lista de picks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">
            Os teus picks
          </h2>
          {data && !data.deadlinePassed && (
            <button
              onClick={() => openPicker(data.picks.map((p) => ({ ticker: p.ticker, isCaptainDraft: p.isCaptainDraft })))}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              {data.picks.length === 0 ? "Escolher picks" : "Alterar picks"}
            </button>
          )}
        </div>

        {!data?.picks.length ? (
          <EmptyCard
            title="Ainda sem picks"
            copy={data && !data.deadlinePassed ? "Escolhe exatamente 5 ativos para entrares no jogo semanal." : "O deadline passou. Podes já preparar a próxima semana abaixo."}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {data.picks.map((pick) => {
              const positive = (pick.latestPrice?.pctChange ?? 0) >= 0;
              return (
                <article
                  key={pick.id}
                  className={cn(
                    "glass glass-hover rounded-[1.4rem] p-4 flex items-center gap-4 border",
                    positive ? "border-electric/25 bg-electric/[0.05]" : "border-coral/25 bg-coral/[0.05]",
                    pick.isCaptainDraft && "border-gold-400/40 bg-gold-400/[0.07]"
                  )}
                >
                  {/* ticker */}
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-white">{pick.ticker}</span>
                  </div>

                  {/* info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm truncate">{pick.name}</span>
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
                      <div className={cn("flex items-center gap-1 font-mono text-base font-black", positive ? "text-success" : "text-danger")}>
                        {positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {Math.abs(pick.latestPrice.pctChange).toFixed(2)}%
                      </div>
                    ) : (
                      <span className="text-slate-500 text-sm">—</span>
                    )}
                    <div className="text-xs text-slate-500 mt-0.5 font-bold">
                      {pick.weekPoints.toFixed(1)} pts
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* secção próxima semana */}
      {data?.nextWeekDraft && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="section-title">
                Próxima semana
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {new Date(data.nextWeekDraft.weekStart).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}
                {" – "}
                {new Date(data.nextWeekDraft.weekEnd).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}
                {" · deadline "}
                {new Date(data.nextWeekDraft.deadline).toLocaleTimeString("pt-PT", { weekday: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <button
              onClick={() => openPicker(data.nextWeekDraft!.picks.map((p) => ({ ticker: p.ticker, isCaptainDraft: p.isCaptainDraft })))}
              className="btn-ghost text-gold-300 border-gold-400/30 hover:border-gold-400/50"
            >
              <Plus className="w-4 h-4" />
              {data.nextWeekDraft.picks.length === 0 ? "Preparar picks" : "Alterar picks"}
            </button>
          </div>

          {data.nextWeekDraft.picks.length === 0 ? (
            <EmptyCard title="Ainda sem picks para a próxima semana" copy="Podes preparar os teus picks já agora." />
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {data.nextWeekDraft.picks.map((pick) => (
                <div key={pick.id} className="glass rounded-2xl p-3 flex items-center gap-3 border border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-gold-400">{pick.ticker}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold truncate">{pick.name}</span>
                      {pick.isCaptainDraft && <Star className="w-3 h-3 text-gold-400 shrink-0" />}
                    </div>
                    <span className="text-xs text-slate-500">{pick.sector}</span>
                  </div>
                  <span className="text-xs text-slate-400 bg-navy-800 px-2 py-0.5 rounded-full border border-white/5">
                    agendado
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
