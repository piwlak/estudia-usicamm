"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useExamStore } from "@/stores/exam-store";
import { ETIQUETAS_DIMENSION } from "@/lib/constants";
import { persistExamResults } from "@/lib/exam-engine/persist-results";

export default function ResultadosPage() {
  const router = useRouter();
  const { resultado, preguntas, respuestas, config, reiniciar } =
    useExamStore();
  const persisted = useRef(false);

  useEffect(() => {
    if (!resultado) {
      router.replace("/examen");
    }
  }, [resultado, router]);

  // Persist results to Supabase
  useEffect(() => {
    if (resultado && preguntas.length > 0 && !persisted.current) {
      persisted.current = true;
      const nivelId = preguntas[0].nivel_id || "inicial-preescolar";
      persistExamResults(preguntas, respuestas, resultado, config, nivelId);
    }
  }, [resultado, preguntas, respuestas, config]);

  if (!resultado) return null;

  const { correctas, total, porcentaje, tiempoSegundos, porDimension } =
    resultado;

  // Format time
  const minutos = Math.floor(tiempoSegundos / 60);
  const segundos = tiempoSegundos % 60;
  const tiempoFormateado = `${minutos}m ${segundos}s`;

  // Color for score
  function getScoreColor(pct: number) {
    if (pct >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (pct >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  }

  function getBarColor(pct: number) {
    if (pct >= 80) return "bg-emerald-500";
    if (pct >= 60) return "bg-amber-500";
    return "bg-red-500";
  }

  function handleReintentar() {
    reiniciar();
    router.push("/examen");
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Resultados del examen
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Modo: {config.modo === "estudio" ? "Estudio" : "Simulacro"} | Tiempo:{" "}
          {tiempoFormateado}
        </p>
      </div>

      {/* Main score */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
        <div className={`text-5xl font-bold ${getScoreColor(porcentaje)}`}>
          {porcentaje}%
        </div>
        <p className="text-lg text-slate-700 dark:text-slate-300 mt-2">
          {correctas} de {total} correctas
        </p>
        <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-4">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getBarColor(
              porcentaje
            )}`}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-3">
          {porcentaje >= 80
            ? "Excelente resultado. Sigue asi."
            : porcentaje >= 60
            ? "Buen avance. Repasa las dimensiones con menor puntaje."
            : "Necesitas reforzar el estudio. No te desanimes, la practica hace al maestro."}
        </p>
      </div>

      {/* Breakdown by dimension */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-4">
          Desglose por dimension
        </h3>
        <div className="space-y-3">
          {Object.entries(porDimension).map(([dim, datos]) => {
            const pctDim = Math.round((datos.correctas / datos.total) * 100);
            return (
              <div key={dim}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-600 dark:text-slate-400 truncate mr-2">
                    {ETIQUETAS_DIMENSION[dim] || dim}
                  </span>
                  <span
                    className={`text-xs font-semibold ${getScoreColor(pctDim)}`}
                  >
                    {datos.correctas}/{datos.total} ({pctDim}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getBarColor(
                      pctDim
                    )}`}
                    style={{ width: `${pctDim}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed question list */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-4">
          Detalle por pregunta
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {preguntas.map((p, idx) => {
            const respUsuario = respuestas[idx];
            const esCorrecta = respUsuario === p._respuesta;
            const noRespondio = respUsuario === null;

            return (
              <div
                key={p.id}
                className={`p-3 rounded-lg border text-sm ${
                  noRespondio
                    ? "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                    : esCorrecta
                    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10"
                    : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      noRespondio
                        ? "bg-slate-400"
                        : esCorrecta
                        ? "bg-emerald-500"
                        : "bg-red-500"
                    }`}
                  >
                    {noRespondio ? "?" : esCorrecta ? "✓" : "✗"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 dark:text-slate-300 leading-snug line-clamp-2">
                      {idx + 1}. {p.pregunta}
                    </p>
                    {!noRespondio && !esCorrecta && (
                      <div className="mt-1.5 space-y-0.5">
                        <p className="text-xs text-red-600 dark:text-red-400">
                          Tu respuesta: {p._opciones[respUsuario!]}
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                          Correcta: {p._opciones[p._respuesta]}
                        </p>
                      </div>
                    )}
                    {noRespondio && (
                      <p className="text-xs text-slate-400 mt-1">
                        Sin responder
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleReintentar}
          className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white font-semibold text-sm shadow-md hover:shadow-lg transition"
        >
          Intentar de nuevo
        </button>
        <Link
          href="/dashboard"
          className="flex-1 py-3 px-6 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold text-sm text-center hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
