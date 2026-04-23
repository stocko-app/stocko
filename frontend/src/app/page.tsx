"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  CirclePlay,
  Gamepad2,
  Gift,
  Lock,
  Medal,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  TrendingUp,
  Users,
} from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const heroStagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1 },
  },
};

const cardHover = {
  whileHover: { scale: 1.03, y: -4 },
  transition: { type: "spring", stiffness: 200, damping: 20 },
};

const NAV_ITEMS = ["Como funciona", "Ranking", "Premios", "Sobre nos", "FAQ"];

const STEP_ITEMS = [
  {
    number: "1",
    icon: Check,
    title: "Escolhe as tuas acoes",
    description: "Seleciona as 5 acoes reais da semana e monta o teu portfolio.",
    color: "text-emerald-400",
  },
  {
    number: "2",
    icon: TrendingUp,
    title: "Acompanha o desempenho",
    description: "O teu resultado muda com o mercado real durante a competicao.",
    color: "text-sky-400",
  },
  {
    number: "3",
    icon: Trophy,
    title: "Sobe no ranking",
    description: "Compete com outros jogadores e sobe lugares todas as semanas.",
    color: "text-violet-400",
  },
  {
    number: "4",
    icon: Gift,
    title: "Ganha premios",
    description: "Os melhores desempenhos recebem recompensas e reconhecimento.",
    color: "text-amber-400",
  },
];

const FEATURE_ITEMS = [
  {
    icon: TrendingUp,
    title: "Mercado real",
    description: "Todos os picks sao baseados em acoes reais da bolsa.",
    accent: "from-emerald-500/20 to-emerald-500/0",
  },
  {
    icon: ShieldCheck,
    title: "Sem risco direto",
    description: "Nao envolve compra real de ativos para participar.",
    accent: "from-sky-500/20 to-sky-500/0",
  },
  {
    icon: Trophy,
    title: "Competicao semanal",
    description: "Nova rodada toda semana com ranking sempre atualizado.",
    accent: "from-violet-500/20 to-violet-500/0",
  },
  {
    icon: BookOpen,
    title: "Aprendes jogando",
    description: "Treina estrategia e leitura de mercado em ambiente seguro.",
    accent: "from-amber-500/20 to-amber-500/0",
  },
];

const USER_ITEMS = [
  {
    icon: Users,
    title: "Curiosos da bolsa",
    description: "Aprende mercado sem arriscar dinheiro real.",
  },
  {
    icon: Gamepad2,
    title: "Competitivos",
    description: "Se gostas de ranking e desafios, este jogo e para ti.",
  },
  {
    icon: Target,
    title: "Investidores",
    description: "Testa ideias e estrategias num ambiente dinamico.",
  },
  {
    icon: Sparkles,
    title: "Aprendizes",
    description: "Melhora consistencia e tomada de decisao semanal.",
  },
];

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "ghost" | "outline";
  className?: string;
};

function cn(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Button({ children, href = "#", variant = "primary", className }: ButtonProps) {
  const styles = {
    primary:
      "bg-gradient-to-b from-emerald-400 to-emerald-500 text-slate-900 hover:from-emerald-300 hover:to-emerald-400 shadow-[0_0_24px_rgba(34,197,94,0.25)]",
    ghost: "border border-white/15 bg-white/[0.02] text-slate-100 hover:border-white/30 hover:bg-white/5",
    outline: "border border-white/20 bg-slate-900/40 text-slate-100 hover:border-white/35 hover:bg-white/5",
  };

  return (
    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.985 }} transition={{ duration: 0.2 }}>
      <Link
        href={href}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-300",
          "shadow-[0_0_0_rgba(34,197,94,0)] hover:shadow-[0_0_28px_rgba(34,197,94,0.28)]",
          styles[variant],
          className
        )}
      >
        {children}
      </Link>
    </motion.div>
  );
}

function Card({ children, className, hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <motion.div
      {...(hover ? cardHover : {})}
      className={cn(
        "rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-950/80 backdrop-blur-md",
        "shadow-[0_12px_40px_rgba(0,0,0,0.35)] ring-1 ring-inset ring-white/5 hover:border-white/20 hover:shadow-[0_18px_52px_rgba(16,185,129,0.14)]",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

function Section({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={fadeUp}
      className={cn("px-4 py-24", className)}
    >
      {children}
    </motion.section>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <Card className="p-6">
      <p className="text-4xl font-extrabold text-emerald-400">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </Card>
  );
}

function SectionTag({ text }: { text: string }) {
  return (
    <span className="inline-flex rounded-full border border-emerald-400/35 bg-gradient-to-r from-emerald-500/15 to-emerald-400/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
      {text}
    </span>
  );
}

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#0B0F19] text-[#F9FAFB]">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_20%_30%,rgba(34,197,94,0.12),transparent_45%),radial-gradient(circle_at_75%_20%,rgba(99,102,241,0.14),transparent_40%)] blur-2xl"
        animate={{ opacity: [0.6, 0.85, 0.6] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0F19]/85 shadow-[0_8px_24px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] w-full max-w-[1200px] items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-500/20 shadow-[0_0_16px_rgba(16,185,129,0.25)]">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-lg font-bold tracking-tight">stocko</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            {NAV_ITEMS.map((item) => (
              <a key={item} href="#" className="transition-colors hover:text-white">
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Button href="/login" variant="ghost" className="px-4 py-2.5">
              Entrar
            </Button>
            <Button href="/register" variant="primary" className="px-4 py-2.5">
              Comecar gratis
            </Button>
          </div>

          <button className="rounded-lg border border-white/15 p-2 md:hidden" aria-label="Abrir menu">
            <ChevronRight className="h-4 w-4 rotate-90" />
          </button>
        </div>
      </header>

      <Section className="pb-20 pt-16">
        <div className="mx-auto grid w-full max-w-[1200px] gap-8 lg:grid-cols-2">
          <motion.div variants={heroStagger} initial="hidden" animate="show" className="self-center">
            <motion.div variants={fadeUp}>
              <SectionTag text="O JOGO DA BOLSA REAL" />
            </motion.div>
            <motion.h1 variants={fadeUp} className="mt-6 max-w-[640px] text-5xl font-extrabold leading-[1.03] tracking-[-0.02em] md:text-6xl">
              Investe como um profissional.
              <span className="mt-3 block text-emerald-400">Compete como num jogo.</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-5 max-w-[480px] text-base leading-relaxed text-[#9CA3AF]">
              Escolhe acoes reais todas as semanas, acompanha o desempenho e sobe no ranking.
              Ganha premios numa experiencia competitiva que mistura estrategia e diversao.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
              <Button href="/register" variant="primary">
                Comecar gratis
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button href="#como-funciona" variant="outline">
                <CirclePlay className="h-4 w-4" />
                Ver como funciona
              </Button>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-8">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <span className="h-8 w-8 rounded-full border-2 border-[#0B0F19] bg-emerald-400/80" />
                  <span className="h-8 w-8 rounded-full border-2 border-[#0B0F19] bg-sky-400/80" />
                  <span className="h-8 w-8 rounded-full border-2 border-[#0B0F19] bg-violet-400/80" />
                  <span className="h-8 w-8 rounded-full border-2 border-[#0B0F19] bg-amber-400/80" />
                </div>
                <p className="text-sm text-slate-300">+2.000 jogadores ja estao a competir</p>
              </div>
              <p className="mt-1 text-xs text-[#9CA3AF]">★★★★★ 4.9/5 media de avaliacao</p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          >
            <Card hover={false} className="relative overflow-hidden border-white/15 p-4 sm:p-5">
            <motion.div
              className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl"
              animate={{ x: [0, 8, 0], y: [0, -6, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="pointer-events-none absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl"
              animate={{ x: [0, -8, 0], y: [0, 8, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="relative grid gap-4 md:grid-cols-[1.55fr_1fr]">
              <div className="space-y-4">
                <Card className="border-white/15 bg-[#111827]/90 p-4">
                  <p className="text-sm text-slate-300">Ola, Andre 👋</p>
                  <p className="mt-2 text-4xl font-bold">€12,456.78</p>
                  <p className="text-sm font-medium text-emerald-400">+€1,154.34 (+10.2%)</p>
                  <div className="mt-4 h-24 rounded-xl border border-white/10 bg-gradient-to-r from-emerald-500/5 via-emerald-500/20 to-violet-500/10" />
                </Card>

                <Card className="bg-[#111827]/75 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">As minhas acoes</p>
                  {[
                    ["Apple", "AAPL", "+4.2%", "text-emerald-400"],
                    ["Nvidia", "NVDA", "+3.1%", "text-emerald-400"],
                    ["Tesla", "TSLA", "-0.8%", "text-rose-400"],
                    ["Microsoft", "MSFT", "+1.5%", "text-emerald-400"],
                  ].map((row) => (
                    <div key={row[1]} className="mb-2 grid grid-cols-[1fr_auto_auto] items-center gap-3 text-sm last:mb-0">
                      <span className="text-slate-200">{row[0]} <span className="text-slate-500">{row[1]}</span></span>
                      <span className="text-slate-400">€4,220</span>
                      <span className={row[3]}>{row[2]}</span>
                    </div>
                  ))}
                </Card>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.55, ease: "easeOut", delay: 0.35 }}
              >
              <Card className="bg-[#111827]/85 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold">Ranking semanal</p>
                  <Medal className="h-4 w-4 text-amber-400" />
                </div>
                {[
                  ["1", "Joao Martins", "€23,567"],
                  ["2", "Carolina Silva", "€18,423"],
                  ["3", "Miguel Costa", "€16,917"],
                  ["4", "Andre Santos", "€15,103"],
                ].map((item) => (
                  <div key={item[1]} className="mb-2 rounded-lg border border-white/10 bg-slate-900/70 p-2.5 last:mb-0">
                    <p className="text-xs text-slate-200">{item[0]}. {item[1]}</p>
                    <p className="text-xs text-emerald-400">{item[2]}</p>
                  </div>
                ))}
              </Card>
              </motion.div>
            </div>
          </Card>
          </motion.div>
        </div>
      </Section>

      <Section id="como-funciona" className="bg-[#111827] py-24">
        <div className="mx-auto w-full max-w-[1200px]">
          <div className="mb-12 text-center">
            <SectionTag text="COMO FUNCIONA" />
            <h2 className="mt-4 text-4xl font-bold">Simples de comecar. Dificil de largar.</h2>
          </div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          >
            {STEP_ITEMS.map((item) => (
              <motion.div key={item.title} variants={fadeUp}>
              <Card className="p-5">
                <p className="text-xs font-semibold text-slate-500">{item.number}</p>
                <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-800/90">
                  <item.icon className={cn("h-5 w-5", item.color)} />
                </div>
                <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-[#9CA3AF]">{item.description}</p>
              </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      <Section>
        <div className="mx-auto w-full max-w-[1200px]">
          <div className="mb-10 text-center">
            <SectionTag text="O QUE TORNA O STOCKO DIFERENTE" />
            <h2 className="mt-4 text-4xl font-bold">Mais que um jogo. Uma experiencia unica.</h2>
          </div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid gap-4 lg:grid-cols-4"
          >
            {FEATURE_ITEMS.map((item) => (
              <motion.div key={item.title} variants={fadeUp}>
              <Card className="relative overflow-hidden p-5">
                <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", item.accent)} />
                <div className="relative flex items-start gap-3">
                  <div className="rounded-lg border border-white/10 bg-slate-800/80 p-2.5">
                    <item.icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm text-[#9CA3AF]">{item.description}</p>
                  </div>
                </div>
              </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      <Section className="bg-[#111827]">
        <div className="mx-auto grid w-full max-w-[1200px] gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="self-center">
            <SectionTag text="O PRODUTO" />
            <h2 className="mt-4 text-5xl font-bold leading-[1.05]">Todo o que precisas, numa interface simples.</h2>
            <p className="mt-4 max-w-[460px] text-base text-[#9CA3AF]">
              Acompanha o teu portfolio, analisa o mercado e compete com outros jogadores numa
              plataforma intuitiva e poderosa.
            </p>
            <Button href="/dashboard" className="mt-7" variant="primary">
              Explorar plataforma
            </Button>
          </div>
          <Card className="p-5">
            <div className="h-[360px] rounded-2xl border border-white/10 bg-gradient-to-b from-slate-800 to-slate-900" />
          </Card>
        </div>
      </Section>

      <Section>
        <div className="mx-auto grid w-full max-w-[1200px] gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionTag text="PARA QUEM E O STOCKO?" />
            <h2 className="mt-4 text-5xl font-bold leading-[1.05]">Para todos que gostam de estrategia e desafios.</h2>
          </div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {USER_ITEMS.map((item) => (
              <motion.div key={item.title} variants={fadeUp}>
              <Card className="p-5">
                <item.icon className="h-5 w-5 text-emerald-400" />
                <h3 className="mt-3 text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-[#9CA3AF]">{item.description}</p>
              </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      <Section className="bg-[#111827]">
        <div className="mx-auto w-full max-w-[1200px]">
          <SectionTag text="COMUNIDADE ATIVA E CRESCIMENTO" />
          <h2 className="mt-4 text-5xl font-bold leading-[1.05]">Numeros que nao param de subir.</h2>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="mt-10 grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1.25fr]"
          >
            <motion.div variants={fadeUp}><StatCard value="2.000+" label="Jogadores ativos" /></motion.div>
            <motion.div variants={fadeUp}><StatCard value="10.000+" label="Picks realizados" /></motion.div>
            <motion.div variants={fadeUp}><StatCard value="500+" label="Premios entregues" /></motion.div>
            <motion.div variants={fadeUp}>
            <Card className="p-6">
              <p className="text-sm italic text-slate-300">"A unica plataforma que me fez acompanhar o mercado todos os dias."</p>
              <div className="mt-5 flex items-center gap-3">
                <span className="h-10 w-10 rounded-full bg-emerald-400/70" />
                <div>
                  <p className="text-sm font-semibold">Joao Martins</p>
                  <p className="text-xs text-slate-400">Jogador desde 2023</p>
                </div>
              </div>
            </Card>
            </motion.div>
          </motion.div>
        </div>
      </Section>

      <Section>
        <div className="mx-auto w-full max-w-[1200px]">
          <SectionTag text="TRANSPARENCIA E SEGURANCA" />
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="mt-8 grid gap-4 md:grid-cols-3"
          >
            {[
              [Lock, "Sem risco direto", "Nao e necessario investir dinheiro real para participar no Stocko."],
              [TrendingUp, "Dados reais de mercado", "Trabalhamos com dados confiaveis e atualizados em tempo real."],
              [ShieldCheck, "Plataforma transparente", "Regras claras, ranking publico e criterios objetivos."],
            ].map(([Icon, title, text]) => (
              <motion.div key={String(title)} variants={fadeUp}>
              <Card className="p-6">
                <Icon className="h-5 w-5 text-emerald-400" />
                <h3 className="mt-3 text-lg font-semibold">{title as string}</h3>
                <p className="mt-2 text-sm text-[#9CA3AF]">{text as string}</p>
              </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      <Section className="pt-6">
        <div className="mx-auto w-full max-w-[1200px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 24 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
          <Card hover={false} className="relative overflow-hidden border-emerald-500/30 bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-violet-500/10 p-6 shadow-[0_0_44px_rgba(34,197,94,0.16)] sm:p-8">
            <div className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />
            <motion.div
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
              animate={{ x: ["-120%", "120%"] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="mt-1 rounded-xl border border-white/15 bg-slate-900/60 p-3">
                  <Trophy className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold leading-tight">Estas pronto para testar a tua estrategia?</h2>
                  <p className="mt-2 text-sm text-slate-300">Junta-te agora e entra na proxima competicao semanal.</p>
                </div>
              </div>
              <Button href="/register" variant="primary" className="self-start lg:self-center">
                Criar conta gratis
              </Button>
            </div>
          </Card>
          </motion.div>
        </div>
      </Section>

      <footer className="border-t border-white/10 bg-[#0A0E18] px-4 py-14">
        <div className="mx-auto grid w-full max-w-[1200px] gap-8 text-sm text-[#9CA3AF] md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 text-white">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
              <span className="font-semibold">stocko</span>
            </div>
            <p className="mt-3">O jogo da bolsa real. Aprende, compete e evolui.</p>
          </div>
          <div>
            <p className="font-semibold text-white">Produto</p>
            <ul className="mt-3 space-y-2">
              <li>Como funciona</li>
              <li>Ranking</li>
              <li>Premios</li>
              <li>FAQ</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white">Institucional</p>
            <ul className="mt-3 space-y-2">
              <li>Sobre nos</li>
              <li>Blog</li>
              <li>Contato</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white">Legal</p>
            <ul className="mt-3 space-y-2">
              <li>Termos de servico</li>
              <li>Politica de privacidade</li>
            </ul>
          </div>
        </div>
        <p className="mx-auto mt-10 w-full max-w-[1200px] border-t border-white/10 pt-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Stocko. Todos os direitos reservados.
        </p>
      </footer>
    </main>
  );
}

