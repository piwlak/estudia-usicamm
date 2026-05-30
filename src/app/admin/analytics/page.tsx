import { createServerSupabaseClient } from "@/lib/supabase/server";

interface StatCard {
  label: string;
  value: string | number;
}

interface PreguntaFallada {
  pregunta_id: number;
  pregunta_texto: string;
  total_intentos: number;
  total_aciertos: number;
  tasa_acierto: number;
}

export default async function AdminAnalyticsPage() {
  const supabase = await createServerSupabaseClient();

  // Total usuarios
  const { count: totalUsuarios } = await supabase
    .from("perfiles")
    .select("*", { count: "exact", head: true });

  // Preguntas por nivel
  const { data: preguntasNivel } = (await supabase
    .from("preguntas")
    .select("nivel_id")) as { data: { nivel_id: string }[] | null };

  const preguntasPorNivel: Record<string, number> = {};
  if (preguntasNivel) {
    for (const p of preguntasNivel) {
      preguntasPorNivel[p.nivel_id] = (preguntasPorNivel[p.nivel_id] || 0) + 1;
    }
  }

  const totalPreguntas = preguntasNivel?.length || 0;

  // Total exámenes
  const { count: totalExamenes } = await supabase
    .from("historial_examenes")
    .select("*", { count: "exact", head: true });

  // Total reportes pendientes
  const { count: reportesPendientes } = await supabase
    .from("reportes")
    .select("*", { count: "exact", head: true })
    .eq("estado", "pendiente");

  // Preguntas más falladas (top 10)
  const { data: trackingData } = await supabase
    .from("tracking")
    .select("pregunta_id, vistas, aciertos");

  const preguntaStats: Record<
    number,
    { total_intentos: number; total_aciertos: number }
  > = {};
  if (trackingData) {
    for (const row of trackingData as any[]) {
      if (!preguntaStats[row.pregunta_id]) {
        preguntaStats[row.pregunta_id] = { total_intentos: 0, total_aciertos: 0 };
      }
      preguntaStats[row.pregunta_id].total_intentos += row.vistas;
      preguntaStats[row.pregunta_id].total_aciertos += row.aciertos;
    }
  }

  const preguntasFalladas: PreguntaFallada[] = Object.entries(preguntaStats)
    .filter(([, s]) => s.total_intentos >= 5) // Mínimo 5 intentos para ser significativo
    .map(([id, s]) => ({
      pregunta_id: Number(id),
      pregunta_texto: "",
      total_intentos: s.total_intentos,
      total_aciertos: s.total_aciertos,
      tasa_acierto: Math.round((s.total_aciertos / s.total_intentos) * 100),
    }))
    .sort((a, b) => a.tasa_acierto - b.tasa_acierto)
    .slice(0, 10);

  // Fetch pregunta texts for top falladas
  if (preguntasFalladas.length > 0) {
    const ids = preguntasFalladas.map((p) => p.pregunta_id);
    const { data: preguntasTexto } = await supabase
      .from("preguntas")
      .select("id, pregunta")
      .in("id", ids);

    if (preguntasTexto) {
      for (const p of preguntasFalladas) {
        const found = preguntasTexto.find((pt: any) => pt.id === p.pregunta_id);
        if (found) p.pregunta_texto = (found as any).pregunta;
      }
    }
  }

  // Preguntas más reportadas
  const { data: reportesAgrupados } = await supabase
    .from("reportes")
    .select("pregunta_id");

  const reportesPorPregunta: Record<number, number> = {};
  if (reportesAgrupados) {
    for (const r of reportesAgrupados as any[]) {
      reportesPorPregunta[r.pregunta_id] =
        (reportesPorPregunta[r.pregunta_id] || 0) + 1;
    }
  }

  const masReportadas = Object.entries(reportesPorPregunta)
    .map(([id, count]) => ({ pregunta_id: Number(id), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Fetch pregunta texts for top reportadas
  let masReportadasConTexto: { pregunta_id: number; count: number; texto: string }[] = [];
  if (masReportadas.length > 0) {
    const ids = masReportadas.map((p) => p.pregunta_id);
    const { data: preguntasTexto } = await supabase
      .from("preguntas")
      .select("id, pregunta")
      .in("id", ids);

    masReportadasConTexto = masReportadas.map((r) => {
      const found = preguntasTexto?.find((pt: any) => pt.id === r.pregunta_id);
      return {
        ...r,
        texto: found ? (found as any).pregunta : "Pregunta eliminada",
      };
    });
  }

  // Actividad reciente (exámenes últimos 7 días)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: actividadReciente } = await supabase
    .from("historial_examenes")
    .select("created_at")
    .gte("created_at", sevenDaysAgo.toISOString());

  const examenesPorDia: Record<string, number> = {};
  if (actividadReciente) {
    for (const e of actividadReciente as any[]) {
      const dia = new Date(e.created_at).toLocaleDateString("es-MX", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      examenesPorDia[dia] = (examenesPorDia[dia] || 0) + 1;
    }
  }

  const statsCards: StatCard[] = [
    { label: "Total Usuarios", value: totalUsuarios || 0 },
    { label: "Total Preguntas", value: totalPreguntas },
    { label: "Total Exámenes", value: totalExamenes || 0 },
    { label: "Reportes Pendientes", value: reportesPendientes || 0 },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Analytics
      </h1>

      {/* Stats globales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4"
          >
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {stat.label}
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Preguntas por nivel */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Preguntas por Nivel
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {Object.entries(preguntasPorNivel).map(([nivel, count]) => (
            <div
              key={nivel}
              className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3"
            >
              <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">
                {nivel}
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Exámenes - Últimos 7 días
        </h2>
        {Object.keys(examenesPorDia).length === 0 ? (
          <p className="text-sm text-slate-500">No hay actividad reciente</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(examenesPorDia).map(([dia, count]) => (
              <div key={dia} className="flex items-center gap-3">
                <span className="text-sm text-slate-600 dark:text-slate-400 w-32">
                  {dia}
                </span>
                <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-5 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (count / Math.max(...Object.values(examenesPorDia))) *
                          100
                      )}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-8 text-right">
                  {count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preguntas más falladas */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Top 10 Preguntas Más Falladas
        </h2>
        {preguntasFalladas.length === 0 ? (
          <p className="text-sm text-slate-500">
            No hay suficientes datos (mínimo 5 intentos)
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-2 font-semibold text-slate-700 dark:text-slate-300">
                    #
                  </th>
                  <th className="text-left py-2 font-semibold text-slate-700 dark:text-slate-300">
                    Pregunta
                  </th>
                  <th className="text-left py-2 font-semibold text-slate-700 dark:text-slate-300">
                    Intentos
                  </th>
                  <th className="text-left py-2 font-semibold text-slate-700 dark:text-slate-300">
                    % Acierto
                  </th>
                </tr>
              </thead>
              <tbody>
                {preguntasFalladas.map((p, i) => (
                  <tr
                    key={p.pregunta_id}
                    className="border-b border-slate-100 dark:border-slate-700/50"
                  >
                    <td className="py-2 text-slate-500">{i + 1}</td>
                    <td className="py-2 text-slate-900 dark:text-white max-w-xs truncate">
                      <a
                        href={`/admin/preguntas/${p.pregunta_id}`}
                        className="hover:text-indigo-600"
                      >
                        {p.pregunta_texto || `Pregunta #${p.pregunta_id}`}
                      </a>
                    </td>
                    <td className="py-2 text-slate-500">{p.total_intentos}</td>
                    <td className="py-2">
                      <span
                        className={`font-medium ${
                          p.tasa_acierto < 30
                            ? "text-red-600"
                            : p.tasa_acierto < 50
                            ? "text-yellow-600"
                            : "text-slate-600"
                        }`}
                      >
                        {p.tasa_acierto}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preguntas más reportadas */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Preguntas Más Reportadas
        </h2>
        {masReportadasConTexto.length === 0 ? (
          <p className="text-sm text-slate-500">No hay reportes</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-2 font-semibold text-slate-700 dark:text-slate-300">
                    #
                  </th>
                  <th className="text-left py-2 font-semibold text-slate-700 dark:text-slate-300">
                    Pregunta
                  </th>
                  <th className="text-left py-2 font-semibold text-slate-700 dark:text-slate-300">
                    Reportes
                  </th>
                </tr>
              </thead>
              <tbody>
                {masReportadasConTexto.map((p, i) => (
                  <tr
                    key={p.pregunta_id}
                    className="border-b border-slate-100 dark:border-slate-700/50"
                  >
                    <td className="py-2 text-slate-500">{i + 1}</td>
                    <td className="py-2 text-slate-900 dark:text-white max-w-xs truncate">
                      <a
                        href={`/admin/preguntas/${p.pregunta_id}`}
                        className="hover:text-indigo-600"
                      >
                        {p.texto}
                      </a>
                    </td>
                    <td className="py-2 text-red-600 font-medium">{p.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
