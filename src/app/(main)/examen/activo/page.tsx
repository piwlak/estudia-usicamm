"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useExamStore } from "@/stores/exam-store";
import { calcularResultados } from "@/lib/exam-engine/scoring";
import QuestionCard from "@/components/exam/QuestionCard";
import ProgressBar from "@/components/exam/ProgressBar";
import ExamTimer from "@/components/exam/ExamTimer";

export default function ExamenActivoPage() {
  const router = useRouter();
  const {
    config,
    preguntas,
    respuestas,
    indiceActual,
    enProgreso,
    tiempoRestante,
    tiempoInicio,
    responder,
    siguiente,
    anterior,
    irAPregunta,
    finalizarExamen,
  } = useExamStore();

  // Redirect if no exam in progress
  useEffect(() => {
    if (preguntas.length === 0) {
      router.replace("/examen");
    }
  }, [preguntas.length, router]);

  // Auto-finish when time runs out in simulacro mode
  useEffect(() => {
    if (config.modo === "simulacro" && tiempoRestante <= 0 && enProgreso && tiempoInicio) {
      handleFinalizar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiempoRestante, config.modo, enProgreso]);

  if (preguntas.length === 0) {
    return null;
  }

  const preguntaActual = preguntas[indiceActual];
  const respuestaActual = respuestas[indiceActual];
  const esEstudio = config.modo === "estudio";
  const yaRespondio = respuestaActual !== null;
  const esUltima = indiceActual === preguntas.length - 1;

  function handleResponder(opcion: number) {
    if (esEstudio && yaRespondio) return;
    responder(indiceActual, opcion);
  }

  function handleFinalizar() {
    const tiempoTranscurrido = tiempoInicio
      ? Math.floor((Date.now() - tiempoInicio) / 1000)
      : 0;

    const resultado = calcularResultados(
      preguntas,
      respuestas,
      tiempoTranscurrido
    );
    finalizarExamen(resultado);
    router.push("/examen/resultados");
  }

  const respondidas = respuestas.filter((r) => r !== null).length;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <ProgressBar actual={indiceActual} total={preguntas.length} />
        {config.modo === "simulacro" && <ExamTimer />}
      </div>

      {/* Question navigator (mini dots) */}
      <div className="flex flex-wrap gap-1.5">
        {preguntas.map((_, idx) => {
          const respondida = respuestas[idx] !== null;
          const activa = idx === indiceActual;
          return (
            <button
              key={idx}
              onClick={() => irAPregunta(idx)}
              className={`w-7 h-7 rounded-md text-xs font-medium transition-all ${
                activa
                  ? "bg-[var(--primary)] text-white shadow-sm scale-110"
                  : respondida
                  ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              }`}
              title={`Pregunta ${idx + 1}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Question Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
        <QuestionCard
          pregunta={preguntaActual}
          respuestaUsuario={respuestaActual}
          mostrarFeedback={esEstudio && yaRespondio}
          onResponder={handleResponder}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={anterior}
          disabled={indiceActual === 0}
          className="px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Anterior
        </button>

        <span className="text-xs text-slate-400">
          {respondidas}/{preguntas.length} respondidas
        </span>

        {esUltima || (esEstudio && yaRespondio && esUltima) ? (
          <button
            onClick={handleFinalizar}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white shadow-sm hover:shadow-md transition"
          >
            Finalizar examen
          </button>
        ) : (
          <button
            onClick={siguiente}
            disabled={esEstudio && !yaRespondio}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[var(--primary)] text-white shadow-sm hover:shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        )}
      </div>

      {/* Finish early button */}
      {!esUltima && respondidas > 0 && (
        <div className="text-center">
          <button
            onClick={handleFinalizar}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline transition"
          >
            Finalizar examen anticipadamente ({respondidas}/{preguntas.length}{" "}
            respondidas)
          </button>
        </div>
      )}
    </div>
  );
}
