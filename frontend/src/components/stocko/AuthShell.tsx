"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BarChart2 } from "lucide-react";
import { GlassPanel } from "@/components/stocko/ui";

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  aside,
  children,
  footer,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-electric/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-1/4 h-[360px] w-[360px] rounded-full bg-gold-400/10 blur-3xl" />

      <header className="fixed inset-x-0 top-0 z-50 border-b border-electric/10 bg-navy-950/75 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-electric/25 bg-electric/10">
              <BarChart2 className="h-5 w-5 text-electric" />
            </span>
            <span>
              <span className="block text-xl font-black tracking-tight text-white">
                Sto<span className="text-gradient-gold">cko</span>
              </span>
              <span className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-slate-500">
                Fantasy investing
              </span>
            </span>
          </Link>
          <Link href="/" className="text-sm font-bold text-slate-400 hover:text-white">
            Voltar ao início
          </Link>
        </div>
      </header>

      <main className="relative mx-auto grid max-w-6xl gap-8 px-4 pb-12 pt-28 lg:grid-cols-[1fr_0.95fr] lg:items-center lg:gap-12 lg:pt-32">
        <div className="hidden lg:block">
          {aside ?? (
            <div className="space-y-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-electric">{eyebrow}</p>
              <h1 className="text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white">{title}</h1>
              {subtitle ? <p className="max-w-md text-base leading-7 text-slate-400">{subtitle}</p> : null}
              <div className="grid grid-cols-3 gap-3 pt-4">
                <div className="glass rounded-2xl p-4">
                  <p className="font-mono text-2xl font-black text-electric">5</p>
                  <p className="text-xs text-slate-500">picks/semana</p>
                </div>
                <div className="glass rounded-2xl p-4">
                  <p className="font-mono text-2xl font-black text-gold-400">2x</p>
                  <p className="text-xs text-slate-500">capitão</p>
                </div>
                <div className="glass rounded-2xl p-4">
                  <p className="font-mono text-2xl font-black text-white">Live</p>
                  <p className="text-xs text-slate-500">rankings</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-full">
          <div className="mb-6 lg:hidden">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-electric">{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">{title}</h1>
            {subtitle ? <p className="mt-2 text-sm text-slate-400">{subtitle}</p> : null}
          </div>

          <GlassPanel className="rounded-[2rem] p-6 md:p-8">
            {children}
            {footer ? <div className="mt-6 border-t border-white/10 pt-6">{footer}</div> : null}
          </GlassPanel>
        </div>
      </main>
    </div>
  );
}

export const authInputClass =
  "w-full rounded-2xl border border-white/10 bg-navy-950/60 px-4 py-3.5 text-sm text-white placeholder-slate-500 transition-all focus:border-electric/40 focus:outline-none focus:ring-2 focus:ring-electric/20";

export const authLabelClass = "mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400";
