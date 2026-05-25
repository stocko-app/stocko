import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-navy-900/70 p-6 shadow-2xl md:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-electric/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-gold-400/10 blur-3xl" />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl space-y-3">
          {eyebrow ? (
            <p className="text-xs font-black uppercase tracking-[0.22em] text-electric">{eyebrow}</p>
          ) : null}
          <h1 className="text-4xl font-black tracking-[-0.04em] text-white md:text-6xl">{title}</h1>
          {subtitle ? <p className="max-w-2xl text-sm leading-6 text-slate-400 md:text-base">{subtitle}</p> : null}
        </div>
        {action}
      </div>
    </div>
  );
}

export function GlassPanel({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "green" | "coral" | "gold";
}) {
  return (
    <div
      className={cn(
        "glass relative overflow-hidden rounded-[1.5rem] p-5",
        tone === "green" && "border-electric/25 bg-electric/[0.06] glow-green",
        tone === "coral" && "border-coral/25 bg-coral/[0.06] glow-coral",
        tone === "gold" && "border-gold-400/30 bg-gold-400/[0.07] glow-gold",
        className
      )}
    >
      {children}
    </div>
  );
}

export function StatChip({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  tone?: "default" | "green" | "coral" | "gold";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3",
        tone === "green" && "border-electric/25 bg-electric/[0.07]",
        tone === "coral" && "border-coral/25 bg-coral/[0.07]",
        tone === "gold" && "border-gold-400/25 bg-gold-400/[0.08]"
      )}
    >
      <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <div
        className={cn(
          "mt-1 font-mono text-lg font-black text-white",
          tone === "green" && "text-electric",
          tone === "coral" && "text-coral",
          tone === "gold" && "text-gold-400"
        )}
      >
        {value}
      </div>
    </div>
  );
}

const tierClass: Record<string, string> = {
  bronze: "border-orange-300/30 bg-orange-300/10 text-orange-200",
  silver: "border-slate-200/30 bg-slate-200/10 text-slate-100",
  gold: "border-gold-400/40 bg-gold-400/10 text-gold-300",
  platinum: "border-cyan-300/35 bg-cyan-300/10 text-cyan-200",
  diamond: "border-violet-300/35 bg-violet-300/10 text-violet-200",
  elite: "border-white/35 bg-white/10 text-white",
};

export function TierBadge({ tier }: { tier?: string | null }) {
  const normalized = (tier ?? "bronze").toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em]",
        tierClass[normalized] ?? tierClass.bronze
      )}
    >
      {normalized}
    </span>
  );
}

export function EmptyCard({ title, copy, action }: { title: string; copy: string; action?: ReactNode }) {
  return (
    <GlassPanel className="border-dashed border-white/15 text-center">
      <p className="text-lg font-black text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{copy}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </GlassPanel>
  );
}

