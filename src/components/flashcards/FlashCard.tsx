"use client";

import type { PreguntaConShuffle } from "@/types/question";

interface FlashCardProps {
  pregunta: PreguntaConShuffle;
  volteada: boolean;
  onVoltear: () => void;
}

export default function FlashCard({ pregunta, volteada, onVoltear }: FlashCardProps) {
  return (
    <div
      className="perspective-1000 w-full max-w-md mx-auto cursor-pointer"
      onClick={onVoltear}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onVoltear();
        }
      }}
    >
      <div
        className={`relative w-full transition-transform duration-500 transform-3d ${
          volteada ? "rotate-y-180" : ""
        }`}
      >
        {/* Front - Question (visible face, determines container height) */}
        <div
          className={`w-full rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg p-6 sm:p-8 flex flex-col justify-center backface-hidden min-h-[280px] ${
            volteada ? "invisible" : ""
          }`}
        >
          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-3 shrink-0">
            {pregunta.dimension}
          </p>
          {pregunta.caso && (
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 italic border-l-2 border-indigo-400 dark:border-indigo-500 pl-3 break-words">
              {pregunta.caso}
            </p>
          )}
          <p className="text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100 leading-relaxed break-words">
            {pregunta.pregunta}
          </p>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 text-center shrink-0">
            Toca para ver la respuesta
          </p>
        </div>

        {/* Back - Answer (absolutely positioned on top, flipped) */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 shadow-lg p-6 sm:p-8 flex flex-col justify-center overflow-y-auto">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-3 shrink-0">
            Respuesta correcta
          </p>
          <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 break-words">
            {pregunta._opciones[pregunta._respuesta]}
          </p>
          {pregunta.explicacion && (
            <div className="border-t border-slate-200 dark:border-slate-600 pt-3">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                {pregunta.explicacion}
              </p>
            </div>
          )}
          {pregunta.cita && (
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 italic break-words shrink-0">
              Fuente: {pregunta.cita}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
