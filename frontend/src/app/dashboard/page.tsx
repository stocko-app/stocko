"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Star, Zap, AlertCircle, Plus, ShieldCheck, CalendarClock, Target } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useAuth } from "@/store/auth";
import PickSelector from "@/components/picks/PickSelector";

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
      <div className="surface-card flex flex-col items-center justify-center min-h-64 gap-3">
        <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">A preparar o teu dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="surface-card flex items-center gap-3 text-danger bg-danger/10 border border-danger/20">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  const totalPoints = data?.picks.reduce((sum, p) => sum + p.weekPoints, 0) ?? 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 md:pb-8">
      <div className="surface-card relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-gold-500/10 blur-3xl pointer-events-none" />
        <div className="relative space-y-2">
          <p className="section-title">Jogo em curso</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Bem-vindo ao teu <span className="text-gradient-gold">cockpit</span>
          </h1>
          {data && (
            <p className="text-slate-300 text-sm md:text-base flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-gold-400" />
              Semana {formatRange(data.weekStart, data.weekEnd)}
            </p>
          )}
        </div>
      </div>

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
            <div className="glass rounded-2xl p-4 flex items-center gap-3 border border-gold-500/20">
              <ShieldCheck className="w-5 h-5 text-gold-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gold-300">Capitão activado</p>
                <p className="text-xs text-slate-400">
                  {activatedPick?.ticker} · {new Date(activatedPick!.captainActivatedDay!).toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "short" })}
                </p>
              </div>
            </div>
          );
        }

        if (!canActivate) {
          return (
            <div className="glass rounded-2xl p-4 flex items-center gap-3 border border-white/5">
              <Star className="w-5 h-5 text-slate-500 shrink-0" />
              <p className="text-sm text-slate-400">
                {todayDay === 5
                  ? "Hoje é Sexta — o capitão é activado automaticamente."
                  : "O capitão só pode ser activado de Segunda a Quinta."}
              </p>
            </div>
          );
        }

        return (
          <div className="glass rounded-2xl p-5 border border-gold-500/20 space-y-3">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-gold-400" />
              <p className="font-semibold">Activar capitão hoje</p>
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
                    "px-3 py-1.5 rounded-lg text-sm font-mono font-semibold border transition-all",
                    captainTicker === p.ticker
                      ? "bg-gold-500/20 border-gold-500/50 text-gold-300"
                      : "bg-navy-800 border-white/10 text-slate-300 hover:border-white/20"
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
              className="w-full py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {captainLoading ? "A activar..." : `Activar ${captainTicker || "—"} como capitão`}
            </button>
          </div>
        );
      })()}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="surface-card">
          <p className="text-slate-400 text-xs uppercase tracking-[0.12em]">Pontos da semana</p>
          <p className="kpi-value text-gradient-gold mt-1">{totalPoints.toFixed(1)}</p>
          <p className="text-xs text-slate-500 mt-1">Actualização após fecho de mercado</p>
        </div>
        <div className="surface-card">
          <p className="text-slate-400 text-xs uppercase tracking-[0.12em]">Picks activos</p>
          <p className="kpi-value mt-1">
            {data?.picks.length ?? 0}
            <span className="text-slate-500 text-lg font-semibold">/5</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">{data?.deadlinePassed ? "Deadline fechado" : "Ainda podes alterar picks"}</p>
        </div>
        <div className="surface-card">
          <p className="text-slate-400 text-xs uppercase tracking-[0.12em]">Estado do capitão</p>
          <p className="kpi-value mt-1 flex items-center gap-2 text-2xl md:text-3xl">
            <Target className="w-6 h-6 text-gold-400" />
            {data?.picks.some((p) => p.captainActivatedDay) ? "Activo" : "Pendente"}
          </p>
          <p className="text-xs text-slate-500 mt-1">Só pode ser activado uma vez por semana</p>
        </div>
      </div>

      {/* modal de selecção de picks */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl surface-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Escolher picks</h2>
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
              className="btn-ghost text-gold-300 border-gold-500/30 hover:border-gold-500/50"
            >
              <Plus className="w-4 h-4" />
              {data.picks.length === 0 ? "Escolher picks" : "Alterar picks"}
            </button>
          )}
        </div>

        {!data?.picks.length ? (
          <div className="surface-card text-center text-slate-400 border border-dashed border-white/15">
            <p className="text-lg font-semibold mb-1">Ainda sem picks</p>
            {data && !data.deadlinePassed ? (
              <p className="text-sm">Clica em <span className="text-gold-400 font-semibold">Escolher picks</span> para começar.</p>
            ) : (
              <p className="text-sm">O deadline passou. Podes já preparar a próxima semana abaixo.</p>
            )}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {data.picks.map((pick) => {
              const positive = (pick.latestPrice?.pctChange ?? 0) >= 0;
              return (
                <article
                  key={pick.id}
                  className="surface-card glass-hover rounded-xl p-4 flex items-center gap-4"
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
              className="btn-ghost text-gold-300 border-gold-500/30 hover:border-gold-500/50"
            >
              <Plus className="w-4 h-4" />
              {data.nextWeekDraft.picks.length === 0 ? "Preparar picks" : "Alterar picks"}
            </button>
          </div>

          {data.nextWeekDraft.picks.length === 0 ? (
            <div className="surface-card text-center text-slate-400 border border-dashed border-white/10">
              <p className="text-sm">Ainda sem picks para a próxima semana.</p>
              <p className="text-xs text-slate-500 mt-1">Podes preparar os teus picks já agora.</p>
            </div>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {data.nextWeekDraft.picks.map((pick) => (
                <div key={pick.id} className="surface-card rounded-xl p-3 flex items-center gap-3 border border-white/5">
                  <div className="w-10 h-10 rounded-lg bg-navy-700 flex items-center justify-center shrink-0">
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
