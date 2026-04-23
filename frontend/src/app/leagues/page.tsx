"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Plus, LogIn, Copy, Check, AlertCircle, Trophy, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";

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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-gold-400" />
          <h1 className="text-2xl font-extrabold">Ligas</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowJoin(true); setShowCreate(false); }}
            className="flex items-center gap-1.5 text-sm border border-white/10 hover:border-white/20 text-slate-300 hover:text-white px-3 py-2 rounded-xl transition-all"
          >
            <LogIn className="w-4 h-4" />
            Entrar
          </button>
          <button
            onClick={() => { setShowCreate(true); setShowJoin(false); setCreatedCode(""); setCreateName(""); setCreateError(""); }}
            className="flex items-center gap-1.5 text-sm bg-gold-500 hover:bg-gold-400 text-navy-950 font-semibold px-3 py-2 rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            Criar
          </button>
        </div>
      </div>

      {/* form criar */}
      {showCreate && (
        <div className="glass rounded-2xl p-5 border border-gold-500/20">
          {!createdCode ? (
            <>
              <h2 className="font-bold mb-4">Nova liga</h2>
              <form onSubmit={handleCreate} className="space-y-3">
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Nome da liga"
                  required
                  className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500/50 transition-all"
                />
                {createError && (
                  <p className="text-danger text-sm">{createError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-slate-400 hover:text-white transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="flex-1 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-semibold text-sm transition-all disabled:opacity-50"
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
              <div className="flex items-center justify-center gap-3 bg-navy-800 rounded-xl px-5 py-3">
                <span className="font-mono font-bold text-xl text-gold-400 tracking-widest">
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
        </div>
      )}

      {/* form entrar */}
      {showJoin && (
        <div className="glass rounded-2xl p-5 border border-white/10">
          <h2 className="font-bold mb-4">Entrar numa liga</h2>
          <form onSubmit={handleJoin} className="space-y-3">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Código de convite (ex: AB12CD34)"
              required
              maxLength={8}
              className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 font-mono tracking-widest focus:outline-none focus:border-gold-500/50 transition-all"
            />
            {joinError && (
              <p className="text-danger text-sm">{joinError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowJoin(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-slate-400 hover:text-white transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={joinLoading}
                className="flex-1 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-semibold text-sm transition-all disabled:opacity-50"
              >
                {joinLoading ? "A entrar..." : "Entrar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* loading */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* erro */}
      {!loading && error && (
        <div className="flex items-center gap-3 text-danger bg-danger/10 border border-danger/20 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* lista de ligas */}
      {!loading && !error && (
        <>
          {leagues.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center space-y-3">
              <Users className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-300">Ainda não tens ligas</p>
              <p className="text-sm text-slate-500">
                Cria uma liga ou entra com um código de convite.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {leagues.map((league) => (
                <Link
                  key={league.id}
                  href={`/leagues/${league.id}`}
                  className="block glass glass-hover rounded-2xl p-5 transition-all focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate">{league.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {league.totalMembers} membros
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5" />
                          #{league.myRank} · {league.myPoints.toFixed(1)} pts
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 bg-navy-800 rounded-lg px-3 py-1.5">
                        <span className="font-mono text-xs text-gold-400 tracking-widest">
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
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
