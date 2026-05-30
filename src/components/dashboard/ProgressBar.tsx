"use client";

export default function ProgressBar({ percentage }: { percentage: number }) {
  function getBarColor(pct: number) {
    if (pct >= 80) return "bg-emerald-500";
    if (pct >= 60) return "bg-amber-500";
    if (pct >= 40) return "bg-indigo-500";
    return "bg-red-400";
  }

  return (
    <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${getBarColor(percentage)}`}
        style={{ width: `${Math.max(percentage, 0)}%` }}
      />
    </div>
  );
}
