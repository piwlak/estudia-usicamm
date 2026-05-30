import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { NivelId, Rol } from "@/types/database";
import { getTierLimits } from "@/lib/tiers";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user!.id;

  const { data: perfil } = (await supabase
    .from("perfiles")
    .select("nivel_activo, nombre, rol")
    .eq("id", userId)
    .single()) as { data: { nivel_activo: NivelId; nombre: string | null; rol: string } | null };

  const nivelActivo = perfil?.nivel_activo || "inicial-preescolar";

  const { count: totalPreguntas } = (await supabase
    .from("preguntas")
    .select("*", { count: "exact", head: true })
    .eq("nivel_id", nivelActivo)
    .eq("activo", true)) as { count: number | null };

  // Stats resumidas
  const { data: tracking } = (await supabase
    .from("tracking")
    .select("vistas, aciertos")
    .eq("user_id", userId)) as { data: Array<{ vistas: number; aciertos: number }> | null };

  const respondidas = tracking?.filter((t) => t.vistas > 0).length || 0;
  const totalVistas = tracking?.reduce((s, t) => s + t.vistas, 0) || 0;
  const totalAciertos = tracking?.reduce((s, t) => s + t.aciertos, 0) || 0;
  const pctAcierto = totalVistas > 0 ? Math.round((totalAciertos / totalVistas) * 100) : 0;

  const rol = (perfil?.rol || "usuario") as Rol;
  const limits = getTierLimits(rol);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Hola, {perfil?.nombre || "docente"}</h2>
        <p className="text-slate-500 dark:text-slate-400">
          Nivel: <span className="font-medium capitalize">{nivelActivo.replace("-", " / ")}</span> — {totalPreguntas || 0} reactivos disponibles
        </p>
        {rol === "usuario" && (
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
            Plan gratuito — exámenes de hasta {limits.maxPreguntasExamen} preguntas, {limits.maxExamenesDiarios} por día
          </p>
        )}
      </div>

      {/* Banner upgrade (solo para usuarios free) */}
      {rol === "usuario" && (
        <Link
          href="/premium"
          className="block p-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Desbloquea todo con Premium</p>
              <p className="text-sm text-indigo-100">Simulacros, flashcards, resúmenes y más — desde $99/mes</p>
            </div>
            <span className="text-2xl">→</span>
          </div>
        </Link>
      )}

      {/* Mini stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Respondidas</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{respondidas}<span className="text-sm font-normal text-slate-400">/{totalPreguntas || 0}</span></p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Acierto</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{pctAcierto}%</p>
        </div>
        <Link href="/progreso" className={`p-4 rounded-xl shadow-sm border hover:shadow-md transition ${limits.progreso ? "bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60"}`}>
          <p className="text-sm text-indigo-600 dark:text-indigo-400">{limits.progreso ? "Ver detalle" : "Premium"}</p>
          <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{limits.progreso ? "📊" : "🔒"} Progreso</p>
        </Link>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/examen"
          className="p-5 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition group"
        >
          <div className="text-2xl mb-2">🎯</div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">Hacer examen</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {limits.modoSimulacro ? "Estudio o simulacro cronometrado" : `Modo estudio (hasta ${limits.maxPreguntasExamen} preguntas)`}
          </p>
        </Link>

        <ActionCard
          href="/flashcards/configurar"
          icon="🎴"
          title="Flashcards"
          subtitle="Repaso conceptual rápido"
          locked={!limits.flashcards}
        />

        <ActionCard
          href="/resumenes"
          icon="📚"
          title="Resúmenes"
          subtitle="Ideas clave por documento"
          locked={!limits.resumenes}
        />

        <Link
          href="/glosario"
          className="p-5 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition group"
        >
          <div className="text-2xl mb-2">📖</div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">Glosario</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Siglas y términos clave</p>
        </Link>

        <ActionCard
          href="/progreso"
          icon="📊"
          title="Mi progreso"
          subtitle="Estadísticas y plan de estudio"
          locked={!limits.progreso}
        />

        {perfil?.rol === "admin" && (
          <Link
            href="/admin"
            className="p-5 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition group"
          >
            <div className="text-2xl mb-2">⚙️</div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">Admin</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Panel de administración</p>
          </Link>
        )}
      </div>
    </div>
  );
}

function ActionCard({ href, icon, title, subtitle, locked }: { href: string; icon: string; title: string; subtitle: string; locked: boolean }) {
  if (locked) {
    return (
      <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 shadow-sm border border-slate-200 dark:border-slate-700 opacity-70 relative">
        <div className="text-2xl mb-2">{icon}</div>
        <h3 className="font-semibold text-slate-500 dark:text-slate-400">{title}</h3>
        <p className="text-sm text-slate-400 dark:text-slate-500">{subtitle}</p>
        <span className="absolute top-3 right-3 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
          Premium
        </span>
      </div>
    );
  }
  return (
    <Link
      href={href}
      className="p-5 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition group"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
    </Link>
  );
}
