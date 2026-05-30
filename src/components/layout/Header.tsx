"use client";

import { NIVELES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { NivelId } from "@/types/database";

interface HeaderProps {
  perfil: {
    nombre: string | null;
    nivel_activo: NivelId;
    niveles_acceso: NivelId[];
    rol: string;
  } | null;
}

export default function Header({ perfil }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleNivelChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nuevoNivel = e.target.value as NivelId;
    if (!perfil) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await (supabase
      .from("perfiles") as any)
      .update({ nivel_activo: nuevoNivel })
      .eq("id", user.id);

    router.refresh();
  }

  const nivelActual = perfil?.nivel_activo || "inicial-preescolar";
  const nivelInfo = NIVELES[nivelActual];

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center text-white text-sm font-extrabold">
            U
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight text-slate-900 dark:text-white">
              Estudia USICAMM
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {nivelInfo.nombre}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <select
            value={nivelActual}
            onChange={handleNivelChange}
            className="text-xs px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            {Object.entries(NIVELES)
              .filter(([id]) => perfil?.niveles_acceso?.includes(id as NivelId))
              .map(([id, info]) => (
                <option key={id} value={id}>
                  {info.icono} {info.nombre}
                </option>
              ))}
          </select>

          <Link
            href="/premium"
            className={`text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:opacity-90 transition ${perfil?.rol === "usuario" ? "" : "hidden"}`}
          >
            Premium
          </Link>

          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            {perfil?.nombre}
          </span>

          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
