"use client";

import { useState } from "react";

interface GlosarioEntry {
  id: number;
  seccion: string;
  sigla: string;
  termino: string;
  definicion: string;
  orden: number;
}

interface SearchBarProps {
  entries: GlosarioEntry[];
}

export default function SearchBar({ entries }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const normalizar = (texto: string) =>
    texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  const filtradas = entries.filter((entry) => {
    const matchQuery =
      !query ||
      normalizar(entry.sigla).includes(normalizar(query)) ||
      normalizar(entry.termino).includes(normalizar(query)) ||
      normalizar(entry.definicion).includes(normalizar(query));

    const matchSection = !activeSection || entry.seccion === activeSection;

    return matchQuery && matchSection;
  });

  // Group by seccion
  const grouped = filtradas.reduce<Record<string, GlosarioEntry[]>>(
    (acc, entry) => {
      if (!acc[entry.seccion]) acc[entry.seccion] = [];
      acc[entry.seccion].push(entry);
      return acc;
    },
    {}
  );

  const secciones = Object.keys(grouped).sort();

  // Alphabetical index based on sigla first letter
  const letras = Array.from(
    new Set(filtradas.map((e) => e.sigla.charAt(0).toUpperCase()))
  ).sort();

  // Get all unique secciones from all entries (not filtered)
  const todasSecciones = Array.from(
    new Set(entries.map((e) => e.seccion))
  ).sort();

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar sigla, término o definición..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)]"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Section filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveSection(null)}
          className={`text-xs px-3 py-1.5 rounded-full border transition ${
            !activeSection
              ? "bg-[var(--primary)] text-white border-[var(--primary)]"
              : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          }`}
        >
          Todas
        </button>
        {todasSecciones.map((seccion) => (
          <button
            key={seccion}
            onClick={() => setActiveSection(activeSection === seccion ? null : seccion)}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              activeSection === seccion
                ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            {seccion}
          </button>
        ))}
      </div>

      {/* Alphabetical navigation */}
      {letras.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {letras.map((letra) => (
            <a
              key={letra}
              href={`#letra-${letra}`}
              className="w-7 h-7 flex items-center justify-center text-xs font-medium rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] transition"
            >
              {letra}
            </a>
          ))}
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {filtradas.length} {filtradas.length === 1 ? "término" : "términos"} encontrados
      </p>

      {/* Grouped entries */}
      {filtradas.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <p className="text-sm">No se encontraron resultados para &ldquo;{query}&rdquo;</p>
        </div>
      ) : (
        <div className="space-y-6">
          {secciones.map((seccion) => {
            const items = grouped[seccion].sort((a, b) => a.orden - b.orden);
            return (
              <section key={seccion}>
                <h3 className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wide mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">
                  {seccion}
                </h3>
                <div className="space-y-3">
                  {items.map((entry) => (
                    <div
                      key={entry.id}
                      id={`letra-${entry.sigla.charAt(0).toUpperCase()}`}
                      className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-sm text-[var(--primary)] whitespace-nowrap">
                          {entry.sigla}
                        </span>
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          &mdash; {entry.termino}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        {entry.definicion}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
