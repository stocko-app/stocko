"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart2, LayoutDashboard, Trophy, Users, User, LogOut } from "lucide-react";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/cn";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/rankings",  label: "Rankings",  icon: Trophy },
  { href: "/leagues",   label: "Ligas",     icon: Users },
  { href: "/profile",   label: "Perfil",    icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { username, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <div className="min-h-screen flex bg-transparent">
      {/* sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-navy-900/85 backdrop-blur border-r border-white/10 fixed inset-y-0 left-0">
        {/* logo */}
        <div className="px-6 h-16 flex items-center border-b border-white/5">
          <Link href="/dashboard" className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-gold-400" />
            <span className="font-bold text-lg tracking-tight">
              Sto<span className="text-gradient-gold">cko</span>
            </span>
          </Link>
        </div>

        {/* nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active =
              item.href === "/leagues"
                ? pathname.startsWith("/leagues")
                : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-gold-500/15 text-gold-300 border border-gold-500/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* user + logout */}
        <div className="px-3 py-4 border-t border-white/5">
          <div className="px-3 py-2 text-xs text-slate-500 truncate mb-1">
            @{username}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all w-full"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* conteúdo principal */}
      <main className="flex-1 md:ml-64 min-h-screen">
        {/* topbar mobile */}
        <header className="md:hidden h-14 bg-navy-900/90 backdrop-blur border-b border-white/10 flex items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-gold-400" />
            <span className="font-bold tracking-tight">
              Sto<span className="text-gradient-gold">cko</span>
            </span>
          </Link>
          <span className="text-xs text-slate-500">@{username}</span>
        </header>

        <div className="p-4 md:p-6 lg:p-8">{children}</div>

        {/* bottom nav — mobile */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-navy-900/95 backdrop-blur border-t border-white/10 flex">
          {navItems.map((item) => {
            const active =
              item.href === "/leagues"
                ? pathname.startsWith("/leagues")
                : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors",
                  active ? "text-gold-400" : "text-slate-500"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
