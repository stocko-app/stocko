import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página não encontrada",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        {/* número */}
        <div className="relative">
          <p className="text-[8rem] font-extrabold leading-none text-gradient-gold opacity-20 select-none">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[8rem] font-extrabold leading-none text-gradient-gold select-none">
              404
            </p>
          </div>
        </div>

        {/* mensagem */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Página não encontrada</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Esta acção saiu do mercado. A página que procuras não existe ou foi movida.
          </p>
        </div>

        {/* botões */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold text-sm transition-all"
          >
            Voltar ao início
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-semibold text-sm transition-all"
          >
            Ir para o dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
