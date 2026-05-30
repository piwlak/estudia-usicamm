"use client";

interface ProgressBarProps {
  actual: number;
  total: number;
}

export default function ProgressBar({ actual, total }: ProgressBarProps) {
  const porcentaje = Math.round(((actual + 1) / total) * 100);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Pregunta {actual + 1} de {total}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {porcentaje}%
        </span>
      </div>
      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] rounded-full transition-all duration-300 ease-out"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  );
}
