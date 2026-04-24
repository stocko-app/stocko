"use client";

import Link from "next/link";
import { Syne } from "next/font/google";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Trophy,
  Users,
  Zap,
  Shield,
  Star,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const syne = Syne({
  subsets: ["latin"],
  weight: ["700"],
});

// ── helpers ──────────────────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay, ease: "easeOut" },
});

// ── dados mock para preview ───────────────────────────────────────────────────

const mockStocks = [
  { ticker: "AAPL", name: "Apple Inc.", change: +2.34, positive: true },
  { ticker: "TSLA", name: "Tesla Inc.", change: -1.12, positive: false },
  { ticker: "NVDA", name: "NVIDIA Corp.", change: +4.67, positive: true },
  { ticker: "MSFT", name: "Microsoft", change: +0.89, positive: true },
  { ticker: "AMZN", name: "Amazon", change: -0.43, positive: false },
];

const mockRankings = [
  { rank: 1, name: "brunosilva", points: 147.5, tier: "Elite 👑" },
  { rank: 2, name: "pedro_trade", points: 139.2, tier: "Diamante 💠" },
  { rank: 3, name: "market_guru", points: 131.8, tier: "Diamante 💠" },
  { rank: 4, name: "stonks_pt", points: 128.4, tier: "Platina 💎" },
  { rank: 5, name: "wall_st_pt", points: 122.1, tier: "Platina 💎" },
];

const features = [
  {
    icon: TrendingUp,
    title: "5 Picks por Semana",
    desc: "Escolhe até 5 acções reais antes do deadline de segunda-feira. Acumula pontos com base no desempenho real do mercado.",
  },
  {
    icon: Star,
    title: "Capitão Diário",
    desc: "Activa o teu capitão num dia da semana para duplicar os pontos dessa acção. A decisão certa pode virar o jogo.",
  },
  {
    icon: Trophy,
    title: "Tiers & Promoções",
    desc: "Começas em Bronze. Os top 20% sobem de tier todos os meses. Chega ao Elite e prova que és melhor que o mercado.",
  },
  {
    icon: Zap,
    title: "Streak de Semanas",
    desc: "Joga sem falhar semanas consecutivas e mantém o teu streak. Auto-pick protege-te se te esqueceres.",
  },
  {
    icon: Users,
    title: "Ligas Privadas",
    desc: "Cria uma liga com amigos, compara rankings semanais e vê quem é o melhor investidor do grupo.",
  },
  {
    icon: Shield,
    title: "Dados Reais",
    desc: "Preços actualizados diariamente com dados reais de mercado. Sem simulações — é a bolsa a sério.",
  },
];

const tiers = [
  { name: "Bronze", icon: "🥉", color: "from-amber-700 to-amber-600", users: "Todos" },
  { name: "Prata",  icon: "🥈", color: "from-slate-400 to-slate-300", users: "200+ utilizadores" },
  { name: "Ouro",   icon: "🥇", color: "from-yellow-500 to-yellow-400", users: "Sempre activo" },
  { name: "Platina",icon: "💎", color: "from-cyan-500 to-cyan-400", users: "500+ utilizadores" },
  { name: "Diamante",icon: "💠", color: "from-blue-500 to-blue-400", users: "1000+ utilizadores" },
  { name: "Elite",  icon: "👑", color: "from-gold-600 to-gold-400", users: "Top absoluto" },
];

// ── componentes ───────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 glass border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <span className="font-semibold text-[1.12rem] tracking-[-0.02em] text-slate-100">
            Sto<span className="text-gradient-gold">cko</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
          <a href="#como-funciona" className="hover:text-white transition-colors">
            Como funciona
          </a>
          <a href="#tiers" className="hover:text-white transition-colors">
            Tiers
          </a>
          <a href="#rankings" className="hover:text-white transition-colors">
            Rankings
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-slate-300 hover:text-white transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="text-sm bg-gold-500 hover:bg-gold-400 text-navy-950 font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Começar grátis
          </Link>
        </div>
      </div>
    </header>
  );
}

function TickerBar() {
  const items = [...mockStocks, ...mockStocks];
  return (
    <div className="overflow-hidden border-b border-white/5 bg-navy-900/50">
      <div className="flex animate-ticker whitespace-nowrap py-2">
        {items.map((s, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 px-6 text-sm"
          >
            <span className="font-mono font-semibold text-slate-200">
              {s.ticker}
            </span>
            <span
              className={
                s.positive ? "text-success flex items-center" : "text-danger flex items-center"
              }
            >
              {s.positive ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              {Math.abs(s.change).toFixed(2)}%
            </span>
            <span className="text-slate-600">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
      {/* fundo com glow */}
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-6xl mx-auto px-4 flex justify-center">
      <div className="max-w-4xl text-center">
        <motion.div {...fadeUp(0)}>
        </motion.div>

        <motion.h1
          {...fadeUp(0.1)}
          className="text-5xl md:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6"
        >
          Joga com a{" "}
          <span className="text-gradient-gold">bolsa real.</span>
        </motion.h1>

        <motion.p
          {...fadeUp(0.2)}
          className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-[1.85]"
          style={{ lineHeight: 1.8 }}
        >
          Escolhe 5 acções reais todas as semanas, activa o teu capitão no
          momento certo e sobe até ao tier Elite. O jogo de bolsa mais viciante
          de Portugal.
        </motion.p>

        <motion.div
          {...fadeUp(0.3)}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold px-8 py-4 rounded-xl text-base transition-all duration-200 shadow-lg shadow-gold-500/20 hover:shadow-gold-400/30 hover:scale-[1.02]"
          >
            Começar grátis
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#como-funciona"
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white border border-white/10 hover:border-white/20 px-8 py-4 rounded-xl text-base transition-all duration-200"
          >
            Como funciona
          </a>
        </motion.div>

        {/* stats */}
        <motion.div
          {...fadeUp(0.4)}
          className="flex items-center justify-center gap-14 md:gap-20 mt-16 text-center"
        >
          {[
            { value: "5", label: "Acções por semana" },
            { value: "6", label: "Tiers para subir" },
            { value: "2×", label: "Bónus capitão" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold text-gradient-gold">
                {s.value}
              </div>
              <div className="text-sm text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Regista-te",
      desc: "Cria conta em segundos. De graça, sem cartão de crédito.",
    },
    {
      n: "02",
      title: "Escolhe os teus picks",
      desc: "Todas as semanas tens até segunda-feira para escolher 5 acções do mercado real.",
    },
    {
      n: "03",
      title: "Activa o capitão",
      desc: "Num dia da semana activa o capitão para duplicar os pontos de uma acção.",
    },
    {
      n: "04",
      title: "Sobe de tier",
      desc: "No fim do mês, os top 20% de cada tier sobem. Chega ao Elite.",
    },
  ];

  return (
    <section id="como-funciona" className="py-28 md:py-32 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div {...fadeUp()} className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
            Como funciona
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Em 4 passos simples passas de principiante a especialista de mercado.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div key={step.n} {...fadeUp(i * 0.1)}>
              <div className="glass glass-hover rounded-2xl p-6 h-full">
                <div className="text-5xl font-extrabold text-gradient-gold mb-4 font-mono">
                  {step.n}
                </div>
                <h3
                  className="text-lg font-bold mb-2"
                  style={{ fontFamily: "var(--font-inter)", fontWeight: 700 }}
                >
                  {step.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="py-28 md:py-32 px-4 bg-navy-900/40">
      <div className="max-w-6xl mx-auto">
        <motion.div {...fadeUp()} className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
            Tudo o que precisas
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Mecânicas pensadas para ser justo, competitivo e viciante.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={f.title} {...fadeUp(i * 0.08)}>
              <div className="glass glass-hover rounded-2xl p-6 h-full">
                <div className="w-10 h-10 rounded-xl bg-gold-500/15 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-gold-400" />
                </div>
                <h3 className="font-bold text-base mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Tiers() {
  return (
    <section id="tiers" className="py-28 md:py-32 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div {...fadeUp()} className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
            6 Tiers para conquistar
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            A competição escalona com o número de jogadores. Começa em Bronze e
            chega ao topo.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {tiers.map((tier, i) => (
            <motion.div key={tier.name} {...fadeUp(i * 0.07)}>
              <div className="glass glass-hover rounded-2xl p-5 text-center h-full flex flex-col items-center gap-3">
                <div
                  className={`w-14 h-14 rounded-xl border border-white/10 bg-gradient-to-br ${tier.color} flex items-center justify-center text-2xl shadow-lg`}
                >
                  {tier.icon}
                </div>
                <div>
                  <div className="font-bold text-sm">{tier.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {tier.users}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          {...fadeUp(0.4)}
          className="text-center text-slate-500 text-sm mt-10"
        >
          Top 20% sobem · Bottom 20% descem · Calculado no 1.º dia de cada mês
        </motion.p>
      </div>
    </section>
  );
}

function Rankings() {
  return (
    <section id="rankings" className="py-28 md:py-32 px-4 bg-navy-900/40">
      <div className="max-w-3xl mx-auto">
        <motion.div {...fadeUp()} className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
            Rankings ao vivo
          </h2>
          <p className="text-slate-400 text-lg">
            Vê onde estás na classificação global.
          </p>
        </motion.div>

        <motion.div {...fadeUp(0.1)} className="glass rounded-2xl overflow-hidden">
          {/* header */}
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-300">
              Top Global — Esta Semana
            </span>
            <span className="text-xs text-gold-400 font-medium">
              Preview
            </span>
          </div>

          {/* rows */}
          {mockRankings.map((row, i) => (
            <div
              key={row.rank}
              className={`px-6 py-4 flex items-center gap-4 ${
                i < mockRankings.length - 1 ? "border-b border-white/5" : ""
              } ${i === 0 ? "bg-gold-500/5" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i === 0
                    ? "bg-gold-500/20 text-gold-400"
                    : i === 1
                    ? "bg-slate-400/10 text-slate-300"
                    : i === 2
                    ? "bg-amber-700/20 text-amber-600"
                    : "bg-navy-700 text-slate-400"
                }`}
              >
                {row.rank}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{row.name}</div>
                <div className="text-xs text-slate-500">{row.tier}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gold-400 font-mono">
                  {row.points.toFixed(1)}
                </div>
                <div className="text-xs text-slate-500">pontos</div>
              </div>
            </div>
          ))}

          <div className="px-6 py-4 text-center">
            <Link
              href="/register"
              className="text-sm text-gold-400 hover:text-gold-300 font-medium transition-colors"
            >
              Entra e vê o teu lugar →
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-36 md:py-40 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div {...fadeUp()}>
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            Pronto para{" "}
            <span className="text-gradient-gold">bater o mercado?</span>
          </h2>
          <p className="text-slate-400 text-lg mb-10">
            Junta-te agora. É grátis, é rápido, e vai pôr à prova o que sabes
            sobre a bolsa.
          </p>
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold px-10 py-5 rounded-xl text-lg transition-all duration-200 shadow-xl shadow-gold-500/25 hover:shadow-gold-400/35 hover:scale-[1.02] animate-pulse-gold"
          >
            Começar grátis agora
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-10 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold tracking-[-0.01em] text-slate-100">
            Sto<span className="text-gradient-gold">cko</span>
          </span>
          <span className="text-slate-600 ml-2">
            © {new Date().getFullYear()}
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm text-slate-500">
          <a href="#" className="hover:text-slate-300 transition-colors">
            Privacidade
          </a>
          <a href="#" className="hover:text-slate-300 transition-colors">
            Termos
          </a>
          <a href="mailto:hello@stocko.pt" className="hover:text-slate-300 transition-colors">
            Contacto
          </a>
        </div>
      </div>
    </footer>
  );
}

// ── página principal ──────────────────────────────────────────────────────────

export default function Home() {
  return (
    <main className="stocko-headings min-h-screen">
      <Navbar />
      <TickerBar />
      <Hero />
      <HowItWorks />
      <Features />
      <Tiers />
      <Rankings />
      <CTA />
      <Footer />
      <style jsx global>{`
        .stocko-headings h1,
        .stocko-headings h2,
        .stocko-headings h3,
        .stocko-headings h4,
        .stocko-headings h5,
        .stocko-headings h6 {
          font-family: ${syne.style.fontFamily}, sans-serif;
          font-weight: 700;
        }
        .stocko-headings h3 {
          font-family: var(--font-inter), sans-serif !important;
          font-weight: 700 !important;
        }
        .stocko-headings .text-sm {
          line-height: 1.75;
        }
        .stocko-headings .text-xs {
          line-height: 1.7;
        }
      `}</style>
    </main>
  );
}
