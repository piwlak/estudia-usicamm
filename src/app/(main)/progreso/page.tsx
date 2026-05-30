import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { NivelId } from "@/types/database";
import ProgressBar from "@/components/dashboard/ProgressBar";

const DIMENSIONES = [
  { key: "Agente formativo", label: "Agente formativo" },
  { key: "Conoce a sus alumnos", label: "Conoce a sus alumnos" },
  { key: "Pensamiento didáctico", label: "Pensamiento didáctico" },
  { key: "Escuela y transformación", label: "Escuela y transformación" },
];

export default async function ProgresoPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user!.id;

  const { data: perfil } = (await supabase
    .from("perfiles")
    .select("nivel_activo, nombre")
    .eq("id", userId)
    .single()) as { data: { nivel_activo: NivelId; nombre: string | null } | null };

  const nivelActivo = perfil?.nivel_activo || "inicial-preescolar";

  // Tracking del usuario
  const { data: tracking } = (await supabase
    .from("tracking")
    .select("pregunta_id, vistas, aciertos, ultima_fecha")
    .eq("user_id", userId)) as { data: Array<{ pregunta_id: number; vistas: number; aciertos: number; ultima_fecha: string | null }> | null };

  const totalRespondidas = tracking?.filter((t) => t.vistas > 0).length || 0;
  const totalAciertos = tracking?.reduce((s, t) => s + t.aciertos, 0) || 0;
  const totalVistas = tracking?.reduce((s, t) => s + t.vistas, 0) || 0;
  const porcentajeGlobal = totalVistas > 0 ? Math.round((totalAciertos / totalVistas) * 100) : 0;

  // Racha de días
  const fechas = tracking
    ?.map((t) => t.ultima_fecha)
    .filter(Boolean)
    .map((f) => f!.split("T")[0]);
  const uniqueDays = [...new Set(fechas)].sort().reverse();
  let racha = 0;
  for (let i = 0; i < uniqueDays.length; i++) {
    const expected = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
    if (uniqueDays[i] === expected) racha++;
    else break;
  }

  // Exámenes completados
  const { data: examenes } = (await supabase
    .from("historial_examenes")
    .select("porcentaje, created_at, configuracion, detalles")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10)) as { data: Array<{ porcentaje: number; created_at: string; configuracion: any; detalles: any }> | null };

  const totalExamenes = examenes?.length || 0;

  // Preguntas por dimensión
  const { data: preguntas } = (await supabase
    .from("preguntas")
    .select("id, dimension, categoria")
    .eq("nivel_id", nivelActivo)
    .eq("activo", true)) as { data: Array<{ id: number; dimension: string; categoria: string }> | null };

  const trackingMap = new Map(tracking?.map((t) => [t.pregunta_id, t]) || []);

  const dimensionStats = DIMENSIONES.map((dim) => {
    const pregsDim = preguntas?.filter((p) => p.dimension === dim.key) || [];
    const total = pregsDim.length;
    let aciertos = 0;
    let vistas = 0;
    pregsDim.forEach((p) => {
      const t = trackingMap.get(p.id);
      if (t) {
        aciertos += t.aciertos;
        vistas += t.vistas;
      }
    });
    const pct = vistas > 0 ? Math.round((aciertos / vistas) * 100) : 0;
    const cobertura = total > 0 ? Math.round((pregsDim.filter((p) => trackingMap.has(p.id)).length / total) * 100) : 0;
    return { ...dim, total, vistas, aciertos, pct, cobertura };
  });

  // Temas débiles (mínimo 3 vistas)
  const categoriaMap = new Map<string, { aciertos: number; vistas: number; total: number }>();
  preguntas?.forEach((p) => {
    const prev = categoriaMap.get(p.categoria) || { aciertos: 0, vistas: 0, total: 0 };
    const t = trackingMap.get(p.id);
    categoriaMap.set(p.categoria, {
      aciertos: prev.aciertos + (t?.aciertos || 0),
      vistas: prev.vistas + (t?.vistas || 0),
      total: prev.total + 1,
    });
  });

  const temasDebiles = [...categoriaMap.entries()]
    .filter(([, v]) => v.vistas >= 3)
    .map(([cat, v]) => ({ cat, pct: Math.round((v.aciertos / v.vistas) * 100), vistas: v.vistas, total: v.total }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 5);

  const temasFuertes = [...categoriaMap.entries()]
    .filter(([, v]) => v.vistas >= 3)
    .map(([cat, v]) => ({ cat, pct: Math.round((v.aciertos / v.vistas) * 100), vistas: v.vistas }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  const totalPreguntas = preguntas?.length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Mi progreso</h2>
        <p className="text-slate-500 dark:text-slate-400">
          Nivel: <span className="font-medium capitalize">{nivelActivo.replace("-", " / ")}</span>
        </p>
      </div>

      {/* Stats generales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Respondidas" value={totalRespondidas} subtitle={`de ${totalPreguntas} reactivos`} />
        <StatCard label="Acierto global" value={`${porcentajeGlobal}%`} subtitle={totalVistas > 0 ? `${totalAciertos} de ${totalVistas} intentos` : "sin datos aún"} />
        <StatCard label="Racha" value={`${racha} día${racha !== 1 ? "s" : ""}`} subtitle={racha > 0 ? "consecutivos estudiando" : "estudia hoy para iniciar"} />
        <StatCard label="Exámenes" value={totalExamenes} subtitle="completados" />
      </div>

      {/* Progreso por dimensión */}
      <section className="p-6 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-lg mb-5 text-slate-900 dark:text-white">Progreso por dimensión</h3>
        <div className="space-y-5">
          {dimensionStats.map((dim) => (
            <div key={dim.key}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-700 dark:text-slate-200 font-medium">{dim.label}</span>
                <span className="font-semibold text-slate-900 dark:text-white">{dim.pct}% acierto</span>
              </div>
              <ProgressBar percentage={dim.pct} />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>{dim.vistas} intentos en {dim.total} preguntas</span>
                <span>Cobertura: {dim.cobertura}%</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Últimos exámenes */}
        <section className="p-6 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white">Historial de exámenes</h3>
          {examenes && examenes.length > 0 ? (
            <div className="space-y-3">
              {examenes.map((ex, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {new Date(ex.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <span className={`text-lg font-bold ${ex.porcentaje >= 80 ? "text-emerald-600 dark:text-emerald-400" : ex.porcentaje >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-500 dark:text-red-400"}`}>
                    {ex.porcentaje}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Aún no has completado exámenes.</p>
          )}
        </section>

        {/* Temas */}
        <div className="space-y-6">
          {/* Temas débiles */}
          <section className="p-6 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white">Temas a reforzar</h3>
            {temasDebiles.length > 0 ? (
              <ul className="space-y-3">
                {temasDebiles.map((tema) => (
                  <li key={tema.cat} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300 truncate max-w-[220px]">{tema.cat}</span>
                    <div className="text-right">
                      <span className="text-red-600 dark:text-red-400 font-semibold">{tema.pct}%</span>
                      <span className="text-xs text-slate-400 ml-2">({tema.vistas} intentos)</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">Contesta al menos 3 preguntas por tema para ver recomendaciones.</p>
            )}
          </section>

          {/* Temas fuertes */}
          <section className="p-6 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white">Temas dominados</h3>
            {temasFuertes.length > 0 ? (
              <ul className="space-y-3">
                {temasFuertes.map((tema) => (
                  <li key={tema.cat} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300 truncate max-w-[220px]">{tema.cat}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{tema.pct}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">Tus temas más fuertes aparecerán aquí.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, subtitle }: { label: string; value: string | number; subtitle: string }) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>
    </div>
  );
}
