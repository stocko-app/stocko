"use client";

import { useEffect, useState } from "react";
import { Search, Star, X, Check, Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

// ── tipos ─────────────────────────────────────────────────────────────────────

interface Stock {
  id: string;
  ticker: string;
  name: string;
  market: string;
  sector: string;
  latestPrice: { close: number; pctChange: number } | null;
}

interface SelectedPick {
  ticker: string;
  isCaptainDraft: boolean;
}

interface Props {
  maxPicks: number;
  initialPicks?: SelectedPick[];
  onSuccess: () => void;
  onCancel: () => void;
}

// ── componente ────────────────────────────────────────────────────────────────

export default function PickSelector({ maxPicks, initialPicks = [], onSuccess, onCancel }: Props) {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SelectedPick[]>(initialPicks);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<Stock[]>("/api/stocks")
      .then(setStocks)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = stocks.filter((s) =>
    search.length < 2
      ? true
      : s.ticker.toLowerCase().includes(search.toLowerCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase())
  );

  function isSelected(ticker: string) {
    return selected.some((p) => p.ticker === ticker);
  }

  function isCaptain(ticker: string) {
    return selected.some((p) => p.ticker === ticker && p.isCaptainDraft);
  }

  function toggleStock(ticker: string) {
    if (isSelected(ticker)) {
      setSelected((prev) => prev.filter((p) => p.ticker !== ticker));
    } else {
      if (selected.length >= maxPicks) return;
      setSelected((prev) => [...prev, { ticker, isCaptainDraft: false }]);
    }
  }

  function toggleCaptain(ticker: string) {
    setSelected((prev) =>
      prev.map((p) => ({
        ...p,
        isCaptainDraft: p.ticker === ticker ? !p.isCaptainDraft : false,
      }))
    );
  }

  async function handleSubmit() {
    if (selected.length !== maxPicks) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post("/api/picks", { picks: selected });
      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao submeter picks.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* picks seleccionados */}
      <div className="glass rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              Picks seleccionados
            </span>
            <span className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full",
              selected.length === maxPicks
                ? "bg-success/20 text-success"
                : "bg-gold-500/20 text-gold-400"
            )}>
              {selected.length}/{maxPicks}
            </span>
          </div>
          <span className="text-xs text-slate-500">
            Marca ⭐ para capitão
          </span>
        </div>

        {selected.length === 0 ? (
          <p className="text-sm text-slate-500">Escolhe exactamente {maxPicks} acções para continuar.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selected.map((p) => (
              <div
                key={p.ticker}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                  p.isCaptainDraft
                    ? "bg-gold-500/20 border-gold-500/50 text-gold-300"
                    : "bg-navy-700 border-white/10 text-slate-200"
                )}
              >
                <button
                  onClick={() => toggleCaptain(p.ticker)}
                  className="hover:text-gold-400 transition-colors"
                  title="Marcar como capitão"
                >
                  <Star className={cn("w-3.5 h-3.5", p.isCaptainDraft && "fill-gold-400 text-gold-400")} />
                </button>
                <span className="font-mono">{p.ticker}</span>
                <button
                  onClick={() => toggleStock(p.ticker)}
                  className="text-slate-400 hover:text-danger transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* erro */}
      {error && (
        <div className="flex items-center gap-2 text-danger bg-danger/10 border border-danger/20 rounded-xl p-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar acção (ticker ou nome)..."
          className="w-full bg-navy-800 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500/50 transition-all"
        />
      </div>

      {/* lista de stocks */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-gold-400 animate-spin" />
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
          {filtered.map((stock) => {
            const sel = isSelected(stock.ticker);
            const cap = isCaptain(stock.ticker);
            const positive = (stock.latestPrice?.pctChange ?? 0) >= 0;
            const disabled = !sel && selected.length >= maxPicks;

            return (
              <button
                key={stock.id}
                onClick={() => toggleStock(stock.ticker)}
                disabled={disabled}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                  sel
                    ? cap
                      ? "bg-gold-500/15 border border-gold-500/30"
                      : "bg-navy-700 border border-white/15"
                    : disabled
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-navy-700/60 border border-transparent"
                )}
              >
                {/* check */}
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                  sel ? "bg-gold-500 border-gold-500" : "border-slate-600"
                )}>
                  {sel && <Check className="w-3 h-3 text-navy-950" />}
                </div>

                {/* info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm">{stock.ticker}</span>
                    <span className="text-xs text-slate-500 truncate">{stock.name}</span>
                  </div>
                  <span className="text-xs text-slate-600">{stock.sector} · {stock.market}</span>
                </div>

                {/* preço */}
                {stock.latestPrice && (
                  <div className={cn("text-sm font-semibold shrink-0", positive ? "text-success" : "text-danger")}>
                    {positive ? "+" : ""}{stock.latestPrice.pctChange.toFixed(2)}%
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* botões */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-white/10 text-sm text-slate-400 hover:text-white transition-all"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={selected.length !== maxPicks || submitting}
          className="flex-1 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              A submeter...
            </>
          ) : selected.length < maxPicks ? (
            `Faltam ${maxPicks - selected.length} pick${maxPicks - selected.length !== 1 ? "s" : ""}`
          ) : (
            `Confirmar ${maxPicks} picks`
          )}
        </button>
      </div>
    </div>
  );
}
