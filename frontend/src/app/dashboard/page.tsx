"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Star, Zap, AlertCircle, Plus, CalendarClock, Target, Crown } from "lucide-react";
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

  useEffect(() => {
    if (!data) return;
    const activated = data.picks.find((p) => p.captainActivatedDay);
    if (activated) {
      setCaptainTicker(activated.ticker);
      return;
    }
    const draft = data.picks.find((p) => p.isCaptainDraft);
    setCaptainTicker(draft?.ticker ?? "");
    setCaptainError("");
    setCaptainSuccess("");
  }, [data?.gameWeekId, data?.picks]);

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
  const todayDay = new Date().getDay();
  const activatedPick = data?.picks.find((p) => p.captainActivatedDay) ?? null;
  const alreadyActivated = !!activatedPick;
  const canActivateCaptain =
    !!data?.deadlinePassed &&
    (data?.picks.length ?? 0) > 0 &&
    !alreadyActivated &&
    todayDay >= 1 &&
    todayDay <= 4;

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
          <p className="text-xs text-slate-500 mt-2">
            {alreadyActivated
              ? `Bala usada · ${activatedPick?.ticker}`
              : canActivateCaptain
                ? "Toca num pick abaixo para activar"
                : todayDay === 5
                  ? "Hoje activa-se automaticamente"
                  : "Segunda a quinta, uma vez por semana"}
          </p>
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
              Escolhe exactamente 5 acções. O ⭐ é opcional — marca a tua sugestão de capitão; activas no dashboard de segunda a quinta.
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

      {/* lista de picks + capitão integrado */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="section-title">
              {canActivateCaptain ? "Os teus picks · escolhe o capitão" : "Os teus picks"}
            </h2>
            {canActivateCaptain && (
              <p className="mt-1 text-sm text-slate-400">
                Toca no card que queres a <span className="font-bold text-gold-400">2x</span> hoje — uma bala por semana.
              </p>
            )}
          </div>
          {data && !data.deadlinePassed && (
            <button
              onClick={() => openPicker(data.picks.map((p) => ({ ticker: p.ticker, isCaptainDraft: p.isCaptainDraft })))}
              className="btn-primary shrink-0"
            >
              <Plus className="w-4 h-4" />
              {data.picks.length === 0 ? "Escolher picks" : "Alterar picks"}
            </button>
          )}
        </div>

        {canActivateCaptain && (
          <div className="relative overflow-hidden rounded-[1.5rem] border border-gold-400/20 bg-gradient-to-br from-gold-400/[0.12] via-navy-900/60 to-transparent p-4 md:p-5">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold-400/15 blur-2xl" />
            <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl border border-gold-400/35 bg-gold-400/15 glow-gold">
                  <Crown className="h-5 w-5 text-gold-400" />
                </span>
                <div>
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-gold-400">
                    Captain arm
                  </p>
                  <p className="text-sm text-slate-300">
                    {captainTicker
                      ? <>Seleccionado: <span className="font-mono font-black text-white">{captainTicker}</span></>
                      : "Selecciona um pick na grelha"}
                  </p>
                </div>
              </div>
              <button
                onClick={activateCaptain}
                disabled={!captainTicker || captainLoading}
                className={cn(
                  "shrink-0 rounded-2xl px-6 py-3 text-sm font-black transition-all",
                  captainTicker
                    ? "bg-gradient-to-r from-gold-400 to-amber-300 text-navy-950 shadow-[0_0_28px_rgba(255,215,0,0.25)] hover:brightness-105"
                    : "border border-white/10 bg-white/5 text-slate-500 cursor-not-allowed"
                )}
              >
                {captainLoading ? "A activar..." : captainTicker ? `Confirmar ${captainTicker} · 2x` : "Escolhe um pick"}
              </button>
            </div>
            {captainError && (
              <p className="relative mt-3 flex items-center gap-2 text-sm text-coral">
                <AlertCircle className="h-4 w-4 shrink-0" /> {captainError}
              </p>
            )}
            {captainSuccess && (
              <p className="relative mt-3 text-sm font-semibold text-electric">{captainSuccess}</p>
            )}
          </div>
        )}

        {!data?.picks.length ? (
          <EmptyCard
            title="Ainda sem picks"
            copy={data && !data.deadlinePassed ? "Escolhe exatamente 5 ativos para entrares no jogo semanal." : "O deadline passou. Podes já preparar a próxima semana abaixo."}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {activatedPick && (
              <article className="md:col-span-2 relative overflow-hidden rounded-[1.5rem] border border-gold-400/40 bg-gradient-to-r from-gold-400/[0.14] to-gold-400/[0.04] p-5 glow-gold">
                <div className="flex items-center gap-4">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl border border-gold-400/50 bg-gold-400/20">
                    <Crown className="h-7 w-7 text-gold-400" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-gold-400">
                      Capitão activado
                    </p>
                    <p className="font-mono text-2xl font-black text-white">{activatedPick.ticker}</p>
                    <p className="text-sm text-slate-400 truncate">{activatedPick.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(activatedPick.captainActivatedDay!).toLocaleDateString("pt-PT", {
                        weekday: "long",
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-4xl font-black text-gradient-gold">2x</p>
                    <p className="text-xs font-bold text-slate-500">{activatedPick.weekPoints.toFixed(1)} pts</p>
                  </div>
                </div>
              </article>
            )}

            {data.picks
              .filter((pick) => !activatedPick || pick.id !== activatedPick.id)
              .map((pick) => {
              const positive = (pick.latestPrice?.pctChange ?? 0) >= 0;
              const isActivated = !!pick.captainActivatedDay;
              const isSelected = canActivateCaptain && captainTicker === pick.ticker;
              const isDraft = pick.isCaptainDraft && !isActivated;

              const CardWrapper = canActivateCaptain ? "button" : "article";

              return (
                <CardWrapper
                  key={pick.id}
                  type={canActivateCaptain ? "button" : undefined}
                  onClick={canActivateCaptain ? () => setCaptainTicker(pick.ticker) : undefined}
                  className={cn(
                    "relative w-full text-left rounded-[1.4rem] p-4 flex items-center gap-4 border transition-all duration-200",
                    canActivateCaptain && "cursor-pointer hover:scale-[1.01]",
                    !isActivated && !isSelected && (positive
                      ? "glass glass-hover border-electric/20 bg-electric/[0.04]"
                      : "glass glass-hover border-coral/20 bg-coral/[0.04]"),
                    isDraft && !isSelected && !isActivated && "border-gold-400/25",
                    isSelected && "border-gold-400/70 bg-gold-400/[0.12] glow-gold scale-[1.02] ring-1 ring-gold-400/30",
                    isActivated && "border-gold-400/50 bg-gold-400/[0.1] opacity-90"
                  )}
                >
                  {isSelected && (
                    <span className="absolute right-3 top-3 rounded-full border border-gold-400/50 bg-gold-400/20 px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-wider text-gold-300">
                      2x hoje
                    </span>
                  )}
                  {isDraft && !isSelected && (
                    <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full border border-gold-400/30 bg-gold-400/10">
                      <Star className="h-3 w-3 fill-gold-400 text-gold-400" />
                    </span>
                  )}

                  <div
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border",
                      isSelected || isActivated
                        ? "border-gold-400/40 bg-gold-400/15"
                        : "border-white/10 bg-white/[0.06]"
                    )}
                  >
                    {isActivated ? (
                      <Crown className="h-6 w-6 text-gold-400" />
                    ) : (
                      <span className="text-xs font-black text-white">{pick.ticker}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm truncate">{pick.name}</span>
                      {pick.isAuto && (
                        <span title="Auto-pick">
                          <Zap className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{pick.sector}</span>
                  </div>

                  <div className="text-right shrink-0">
                    {pick.latestPrice ? (
                      <div
                        className={cn(
                          "flex items-center justify-end gap-1 font-mono text-base font-black",
                          positive ? "text-electric" : "text-coral"
                        )}
                      >
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
                </CardWrapper>
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
