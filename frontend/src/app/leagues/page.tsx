"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Plus, LogIn, Copy, Check, AlertCircle, Trophy, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { AppShell } from "@/components/stocko/AppShell";
import { EmptyCard, GlassPanel, PageHeader, StatChip } from "@/components/stocko/ui";

// ── tipos ─────────────────────────────────────────────────────────────────────

interface League {
  id: string;
  name: string;
  inviteCode: string;
  totalMembers: number;
  myRank: number;
  myPoints: number;
}

// ── componente principal ──────────────────────────────────────────────────────

export default function LeaguesPage() {
  const { token } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // modal criar
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createdCode, setCreatedCode] = useState("");

  // modal entrar
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");

  // copiar código
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setLeagues([]);
    fetchLeagues();
  }, [token]);

  async function fetchLeagues() {
    setLoading(true);
    setError("");
    try {
      const data = await api.get<League[]>("/api/leagues");
      setLeagues(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar ligas.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError("");
    try {
      const res = await api.post<{ id: string; name: string; inviteCode: string }>(
        "/api/leagues",
        { name: createName }
      );
      setCreatedCode(res.inviteCode);
      await fetchLeagues();
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : "Erro ao criar liga.");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setJoinLoading(true);
    setJoinError("");
    try {
      await api.post("/api/leagues/join", { inviteCode: joinCode });
      setShowJoin(false);
      setJoinCode("");
      await fetchLeagues();
    } catch (e: unknown) {
      setJoinError(e instanceof Error ? e.message : "Código inválido ou liga não encontrada.");
    } finally {
      setJoinLoading(false);
    }
  }

  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <AppShell>
    <div className="max-w-6xl mx-auto space-y-6 pb-20 md:pb-8">
      <PageHeader
        eyebrow="Private arenas"
        title={<>Ligas <span className="text-gradient-score">privadas</span></>}
        subtitle="Cria uma arena com amigos, partilha o código e transforma cada semana numa batalha."
        action={
        <div className="flex gap-2">
          <button
            onClick={() => { setShowJoin(true); setShowCreate(false); }}
            className="btn-ghost"
          >
            <LogIn className="w-4 h-4" />
            Entrar
          </button>
          <button
            onClick={() => { setShowCreate(true); setShowJoin(false); setCreatedCode(""); setCreateName(""); setCreateError(""); }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            Criar
          </button>
        </div>
        }
      />

      {/* form criar */}
      {showCreate && (
        <GlassPanel tone="gold">
          {!createdCode ? (
            <>
              <h2 className="font-black text-xl mb-4">Nova liga</h2>
              <form onSubmit={handleCreate} className="space-y-3">
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Nome da liga"
                  required
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-electric/50 transition-all"
                />
                {createError && (
                  <p className="text-danger text-sm">{createError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="btn-ghost flex-1"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="btn-primary flex-1"
                  >
                    {createLoading ? "A criar..." : "Criar liga"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center space-y-3">
              <div className="text-3xl">🎉</div>
              <p className="font-bold">Liga criada!</p>
              <p className="text-sm text-slate-400">Partilha este código com os teus amigos:</p>
              <div className="flex items-center justify-center gap-3 bg-navy-900/80 rounded-xl px-5 py-3 border border-white/10">
                <span className="font-mono font-black text-2xl text-gold-400 tracking-widest">
                  {createdCode}
                </span>
                <button
                  onClick={() => copyCode(createdCode, "new")}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {copiedId === "new" ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Fechar
              </button>
            </div>
          )}
        </GlassPanel>
      )}

      {/* form entrar */}
      {showJoin && (
        <GlassPanel>
          <h2 className="font-black text-xl mb-4">Entrar numa liga</h2>
          <form onSubmit={handleJoin} className="space-y-3">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Código de convite (ex: AB12CD34)"
              required
              maxLength={8}
              className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 font-mono tracking-widest focus:outline-none focus:border-electric/50 transition-all"
            />
            {joinError && (
              <p className="text-danger text-sm">{joinError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowJoin(false)}
                className="btn-ghost flex-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={joinLoading}
                className="btn-primary flex-1"
              >
                {joinLoading ? "A entrar..." : "Entrar"}
              </button>
            </div>
          </form>
        </GlassPanel>
      )}

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

      {/* lista de ligas */}
      {!loading && !error && (
        <>
          {leagues.length === 0 ? (
            <EmptyCard
              title="Ainda não tens ligas"
              copy="Cria uma liga ou entra com um código de convite. O teu grupo passa a ter ranking próprio."
            />
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {leagues.map((league) => (
                <Link
                  key={league.id}
                  href={`/leagues/${league.id}`}
                  className="group block glass glass-hover rounded-[1.75rem] p-5 transition-all focus:outline-none focus:ring-2 focus:ring-electric/40 hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-electric">Arena privada</p>
                      <h3 className="mt-1 truncate text-xl font-black text-white">{league.name}</h3>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <StatChip label="Membros" value={league.totalMembers} />
                        <StatChip label="Rank" value={`#${league.myRank}`} tone="gold" />
                        <StatChip label="Pontos" value={league.myPoints.toFixed(1)} tone="green" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 bg-white/[0.06] rounded-xl px-3 py-2 border border-white/10">
                        <span className="font-mono text-xs font-black text-gold-400 tracking-widest">
                          {league.inviteCode}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            copyCode(league.inviteCode, league.id);
                          }}
                          className="text-slate-400 hover:text-white transition-colors"
                          aria-label="Copiar código"
                        >
                          {copiedId === league.id
                            ? <Check className="w-3.5 h-3.5 text-success" />
                            : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-electric" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
    </AppShell>
  );
}
