"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart2, LayoutDashboard, LogOut, Trophy, User, Users, Zap } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/store/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/rankings", label: "Rankings", icon: Trophy },
  { href: "/leagues", label: "Ligas", icon: Users },
  { href: "/profile", label: "Perfil", icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { username, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <div className="min-h-screen flex bg-transparent">
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-72 flex-col border-r border-electric/10 bg-navy-950/80 backdrop-blur-2xl">
        <div className="flex h-20 items-center border-b border-white/5 px-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-electric/25 bg-electric/10 shadow-[0_0_30px_rgba(0,255,136,0.12)]">
              <BarChart2 className="h-5 w-5 text-electric" />
            </span>
            <span>
              <span className="block text-xl font-black tracking-tight text-white">
                Sto<span className="text-gradient-gold">cko</span>
              </span>
              <span className="flex items-center gap-1 text-[0.62rem] font-black uppercase tracking-[0.18em] text-slate-500">
                <Zap className="h-3 w-3 text-electric" /> Fantasy investing
              </span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const active = item.href === "/leagues" ? pathname.startsWith("/leagues") : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-bold transition-all",
                  active
                    ? "border-electric/25 bg-electric/10 text-electric shadow-[0_0_28px_rgba(0,255,136,0.08)]"
                    : "border-transparent text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/5 px-3 py-4">
          <div className="mb-2 truncate px-3 py-2 text-xs font-bold text-slate-500">@{username}</div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition-all hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      <main className="min-h-screen flex-1 md:ml-72">
        <header className="flex h-16 items-center justify-between border-b border-electric/10 bg-navy-950/95 px-4 backdrop-blur md:hidden">
          <Link href="/dashboard" className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-electric" />
            <span className="font-black tracking-tight">
              Sto<span className="text-gradient-gold">cko</span>
            </span>
          </Link>
          <button onClick={handleLogout} className="text-xs font-bold text-slate-500 hover:text-white">
            Sair
          </button>
        </header>

        <div className="p-4 md:p-6 lg:p-8">{children}</div>

        <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-electric/10 bg-navy-950/95 backdrop-blur md:hidden">
          {navItems.map((item) => {
            const active = item.href === "/leagues" ? pathname.startsWith("/leagues") : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors",
                  active ? "text-electric" : "text-slate-500"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}

