"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  ChevronRight,
  Crown,
  Flame,
  Radar,
  Shield,
  Sparkles,
  Star,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/cn";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, delay, ease: "easeOut" },
});

const picks = [
  { ticker: "NVDA", name: "NVIDIA", change: 4.67, pts: 20.7, up: true, captain: true },
  { ticker: "AAPL", name: "Apple", change: 2.34, pts: 18.3, up: true },
  { ticker: "TSLA", name: "Tesla", change: -1.12, pts: 13.9, up: false },
  { ticker: "EDPR.LS", name: "EDP Renováveis", change: 1.41, pts: 17.4, up: true },
  { ticker: "BTC", name: "Bitcoin", change: 0.88, pts: 16.9, up: true },
];

const ranking = [
  ["01", "alpha_wolf", "Elite", 147.5],
  ["02", "market_guru", "Diamond", 139.2],
  ["03", "bruno", "Gold", 128.8],
  ["04", "risk_on", "Gold", 122.1],
];

function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-electric/10 bg-navy-950/75 backdrop-blur-2xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-electric/25 bg-electric/10">
            <BarChart2 className="h-5 w-5 text-electric" />
          </span>
          <span>
            <span className="block text-xl font-black tracking-tight text-white">
              Sto<span className="text-gradient-gold">cko</span>
            </span>
            <span className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-slate-500">Fantasy investing</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-bold text-slate-400 md:flex">
          <a href="#arena" className="hover:text-white">Arena</a>
          <a href="#draft" className="hover:text-white">Draft</a>
          <a href="#tiers" className="hover:text-white">Tiers</a>
          <a href="#social" className="hover:text-white">Ligas</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-bold text-slate-300 hover:text-white">Entrar</Link>
          <Link href="/register" className="btn-primary rounded-2xl px-5 py-3 font-black">Jogar grátis</Link>
        </div>
      </div>
    </header>
  );
}

function HeroMockup() {
  return (
    <motion.div {...fade(0.25)} className="relative mx-auto w-full max-w-[560px]">
      <div className="absolute -inset-8 rounded-[3rem] bg-electric/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-navy-900/80 p-4 shadow-2xl">
        <div className="rounded-[2rem] border border-electric/10 bg-black/25 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-electric">Live week</p>
              <p className="mt-2 font-mono text-6xl font-black leading-none text-gradient-score">86.4</p>
              <p className="mt-1 text-sm font-bold text-slate-400">#47 · +12 hoje</p>
            </div>
            <div className="rounded-2xl border border-gold-400/40 bg-gold-400/10 p-3 text-gold-400">
              <Crown className="h-7 w-7" />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {picks.map((pick) => (
              <div
                key={pick.ticker}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3",
                  pick.up ? "border-electric/25 bg-electric/[0.06]" : "border-coral/25 bg-coral/[0.06]",
                  pick.captain && "border-gold-400/50 bg-gold-400/[0.08]"
                )}
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/[0.06]">
                  <span className="font-mono text-xs font-black text-white">{pick.ticker}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-black text-white">{pick.name}</p>
                    {pick.captain ? <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" /> : null}
                  </div>
                  <p className="text-xs text-slate-500">Today points · {pick.pts.toFixed(1)}</p>
                </div>
                <div className={cn("flex items-center gap-1 font-mono text-sm font-black", pick.up ? "text-electric" : "text-coral")}>
                  {pick.up ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  {Math.abs(pick.change).toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <Nav />

      <section className="relative min-h-screen px-4 pt-32">
        <div className="absolute left-1/2 top-16 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-electric/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-[420px] w-[420px] rounded-full bg-gold-400/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
          <div className="relative">
            <motion.div {...fade(0)} className="inline-flex items-center gap-2 rounded-full border border-electric/20 bg-electric/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-electric">
              <Sparkles className="h-4 w-4" />
              Bolsa real. Energia de fantasy sports.
            </motion.div>
            <motion.h1 {...fade(0.08)} className="mt-7 max-w-4xl text-6xl font-black leading-[0.9] tracking-[-0.07em] text-white md:text-8xl">
              A bolsa virou <span className="text-gradient-score">arena.</span>
            </motion.h1>
            <motion.p {...fade(0.16)} className="mt-7 max-w-2xl text-lg leading-8 text-slate-400 md:text-xl">
              Escolhe 5 ativos, ativa o capitão no dia certo, sobe nos rankings e luta por tiers mensais. Isto não é trading. É competição.
            </motion.p>
            <motion.div {...fade(0.24)} className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="btn-primary rounded-2xl px-7 py-4 text-base font-black">
                Entrar na arena <ChevronRight className="h-5 w-5" />
              </Link>
              <a href="#arena" className="btn-ghost rounded-2xl px-7 py-4 text-base font-black">
                Ver experiência
              </a>
            </motion.div>
            <motion.div {...fade(0.32)} className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              <div className="glass rounded-2xl p-4"><p className="font-mono text-3xl font-black text-electric">5</p><p className="text-xs text-slate-500">picks/semana</p></div>
              <div className="glass rounded-2xl p-4"><p className="font-mono text-3xl font-black text-gold-400">2x</p><p className="text-xs text-slate-500">capitão</p></div>
              <div className="glass rounded-2xl p-4"><p className="font-mono text-3xl font-black text-white">20%</p><p className="text-xs text-slate-500">sobem tier</p></div>
            </motion.div>
          </div>
          <HeroMockup />
        </div>
      </section>

      <section id="arena" className="px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-electric">Product loop</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-white md:text-6xl">Cada semana tem uma missão clara.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              ["01", "Draft", "Escolhe exatamente 5 ativos até domingo 23:59."],
              ["02", "Captain", "Segunda a quinta, duplica um pick por dia."],
              ["03", "Scoring", "JP, EU/PT, US e Crypto atualizam após fecho."],
              ["04", "Climb", "Sobe rankings, tiers e streaks mensais."],
            ].map(([n, title, copy]) => (
              <div key={n} className="glass glass-hover rounded-[1.75rem] p-6">
                <p className="font-mono text-5xl font-black text-gradient-gold">{n}</p>
                <h3 className="mt-5 text-xl font-black text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="draft" className="px-4 py-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div className="glass rounded-[2rem] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-electric">Draft room</p>
                <h2 className="mt-2 text-3xl font-black text-white">Trading cards para ativos reais.</h2>
              </div>
              <Radar className="h-10 w-10 text-electric" />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {picks.map((pick) => (
                <div key={pick.ticker} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xl font-black text-white">{pick.ticker}</span>
                    <span className={pick.up ? "text-electric" : "text-coral"}>{pick.up ? "+" : "-"}{Math.abs(pick.change).toFixed(2)}%</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{pick.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-[2rem] p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-gold-400">Leaderboard preview</p>
            <div className="mt-6 space-y-3">
              {ranking.map(([rank, name, tier, pts]) => (
                <div key={rank} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <span className="font-mono text-2xl font-black text-gold-400">#{rank}</span>
                  <div className="flex-1">
                    <p className="font-black text-white">@{name}</p>
                    <p className="text-xs text-slate-500">{tier}</p>
                  </div>
                  <span className="font-mono font-black text-electric">{Number(pts).toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="tiers" className="px-4 py-24">
        <div className="mx-auto max-w-7xl rounded-[2.5rem] border border-gold-400/20 bg-gold-400/[0.06] p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-gold-400">Monthly tiers</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-white md:text-6xl">Não jogas só a semana. Jogas a época.</h2>
              <p className="mt-5 text-slate-400">Bronze, Silver, Gold, Platinum, Diamond e Elite. Top 20% sobem. Bottom 20% descem.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Elite"].map((tier) => (
                <div key={tier} className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
                  <p className="text-lg font-black text-white">{tier}</p>
                  <p className="mt-1 text-xs text-slate-500">tier badge</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="social" className="px-4 py-24">
        <div className="mx-auto max-w-5xl text-center">
          <Users className="mx-auto h-12 w-12 text-electric" />
          <h2 className="mt-6 text-4xl font-black tracking-[-0.04em] text-white md:text-6xl">Cria uma liga. Humilha os teus amigos.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-slate-400">Cada grupo tem ranking privado, código de convite e batalha semanal. O Stocko é social por natureza.</p>
          <Link href="/register" className="btn-primary mt-9 rounded-2xl px-8 py-4 text-base font-black">
            Começar agora
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/5 px-4 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-slate-500 md:flex-row">
          <span className="font-black text-white">Sto<span className="text-gradient-gold">cko</span></span>
          <span>© {new Date().getFullYear()} · Fantasy investing</span>
        </div>
      </footer>
    </main>
  );
}

