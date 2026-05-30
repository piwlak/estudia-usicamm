"use client";

import { useEffect, useRef } from "react";
import { useExamStore } from "@/stores/exam-store";

export default function ExamTimer() {
  const tiempoRestante = useExamStore((s) => s.tiempoRestante);
  const actualizarTiempo = useExamStore((s) => s.actualizarTiempo);
  const enProgreso = useExamStore((s) => s.enProgreso);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enProgreso) return;

    intervalRef.current = setInterval(() => {
      const store = useExamStore.getState();
      const nuevo = store.tiempoRestante - 1;
      if (nuevo <= 0) {
        actualizarTiempo(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        actualizarTiempo(nuevo);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enProgreso, actualizarTiempo]);

  const minutos = Math.floor(tiempoRestante / 60);
  const segundos = tiempoRestante % 60;
  const esUrgente = tiempoRestante < 60;
  const esBajo = tiempoRestante < 300 && !esUrgente;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono font-semibold ${
        esUrgente
          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse"
          : esBajo
          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
        />
      </svg>
      <span>
        {String(minutos).padStart(2, "0")}:{String(segundos).padStart(2, "0")}
      </span>
    </div>
  );
}
