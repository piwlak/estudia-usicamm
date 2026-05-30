"use client";

interface SessionProgressProps {
  restantes: number;
  correctas: number;
  incorrectas: number;
  total: number;
}

export default function SessionProgress({
  restantes,
  correctas,
  incorrectas,
  total,
}: SessionProgressProps) {
  const respondidas = correctas + incorrectas;
  const porcentaje = total > 0 ? Math.round((respondidas / total) * 100) : 0;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Progress bar */}
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mb-3">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-300"
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500 dark:text-slate-400">
          {restantes} restante{restantes !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            {correctas}
          </span>
          <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            {incorrectas}
          </span>
        </div>
      </div>
    </div>
  );
}
