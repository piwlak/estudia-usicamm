"use client";

import type { PreguntaConShuffle } from "@/types/question";
import OptionButton from "./OptionButton";
import { ETIQUETAS_DIMENSION, ETIQUETAS_TIPO } from "@/lib/constants";

interface QuestionCardProps {
  pregunta: PreguntaConShuffle;
  respuestaUsuario: number | null;
  mostrarFeedback: boolean;
  onResponder: (opcion: number) => void;
}

export default function QuestionCard({
  pregunta,
  respuestaUsuario,
  mostrarFeedback,
  onResponder,
}: QuestionCardProps) {
  const yaRespondio = respuestaUsuario !== null;
  const respondioCorrectamente =
    yaRespondio && respuestaUsuario === pregunta._respuesta;

  return (
    <div className="space-y-4">
      {/* Meta info */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
          {ETIQUETAS_DIMENSION[pregunta.dimension] || pregunta.dimension}
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
          {ETIQUETAS_TIPO[pregunta.tipo] || pregunta.tipo}
        </span>
      </div>

      {/* Caso / contexto */}
      {pregunta.caso && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1 text-xs uppercase tracking-wide">
            Contexto / Caso
          </p>
          <p>{pregunta.caso}</p>
        </div>
      )}

      {/* Pregunta */}
      <p className="text-base font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
        {pregunta.pregunta}
      </p>

      {/* Opciones */}
      <div className="space-y-3">
        {pregunta._opciones.map((texto, idx) => {
          let esCorrecta: boolean | null = null;
          if (mostrarFeedback && yaRespondio) {
            esCorrecta = idx === pregunta._respuesta;
          }

          return (
            <OptionButton
              key={idx}
              indice={idx}
              texto={texto}
              seleccionada={respuestaUsuario === idx}
              esCorrecta={esCorrecta}
              deshabilitada={mostrarFeedback && yaRespondio}
              onClick={() => onResponder(idx)}
            />
          );
        })}
      </div>

      {/* Feedback en modo estudio */}
      {mostrarFeedback && yaRespondio && (
        <div
          className={`p-4 rounded-lg border ${
            respondioCorrectamente
              ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
          }`}
        >
          <p
            className={`font-semibold text-sm mb-1 ${
              respondioCorrectamente
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-red-700 dark:text-red-400"
            }`}
          >
            {respondioCorrectamente ? "Correcto" : "Incorrecto"}
          </p>
          {pregunta.explicacion && (
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {pregunta.explicacion}
            </p>
          )}
          {pregunta.cita && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">
              Fuente: {pregunta.cita}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
