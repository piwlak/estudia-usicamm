"use client";

import { useState } from "react";
import Link from "next/link";

interface ResumenCardProps {
  id: number;
  categoria: string;
  titulo: string;
  que_es: string;
}

export default function ResumenCard({ categoria, titulo, que_es }: ResumenCardProps) {
  const [expanded, setExpanded] = useState(false);

  const preview = que_es.length > 150 ? que_es.slice(0, 150) + "..." : que_es;

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 mb-2">
            {categoria}
          </span>
          <h3 className="font-semibold text-base leading-snug mb-1 text-slate-900 dark:text-slate-100">{titulo}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {expanded ? que_es : preview}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        {que_es.length > 150 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-[var(--primary)] hover:underline font-medium"
          >
            {expanded ? "Ver menos" : "Ver más"}
          </button>
        )}
        <Link
          href={`/resumenes/${encodeURIComponent(categoria)}`}
          className="text-xs text-[var(--primary)] hover:underline font-medium ml-auto"
        >
          Leer resumen completo →
        </Link>
      </div>
    </div>
  );
}
