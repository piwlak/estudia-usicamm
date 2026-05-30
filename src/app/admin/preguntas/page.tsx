"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Pregunta {
  id: number;
  nivel_id: string;
  categoria: string;
  dimension: string;
  tipo: string;
  pregunta: string;
  activo: boolean;
}

const ITEMS_PER_PAGE = 20;

export default function AdminPreguntasPage() {
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [filtroNivel, setFiltroNivel] = useState("");
  const [filtroDimension, setFiltroDimension] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  const supabase = createClient();

  const fetchPreguntas = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("preguntas")
      .select("id, nivel_id, categoria, dimension, tipo, pregunta, activo", {
        count: "exact",
      })
      .order("id", { ascending: false })
      .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

    if (filtroNivel) query = query.eq("nivel_id", filtroNivel);
    if (filtroDimension) query = query.eq("dimension", filtroDimension);
    if (filtroCategoria) query = query.eq("categoria", filtroCategoria);
    if (filtroTipo) query = query.eq("tipo", filtroTipo);
    if (busqueda) query = query.ilike("pregunta", `%${busqueda}%`);

    const { data, count } = await query;
    setPreguntas((data as Pregunta[]) || []);
    setTotal(count || 0);
    setLoading(false);
  }, [page, filtroNivel, filtroDimension, filtroCategoria, filtroTipo, busqueda, supabase]);

  useEffect(() => {
    fetchPreguntas();
  }, [fetchPreguntas]);

  const toggleActivo = async (id: number, activo: boolean) => {
    await (supabase as any).from("preguntas").update({ activo: !activo }).eq("id", id);
    setPreguntas((prev) =>
      prev.map((p) => (p.id === id ? { ...p, activo: !activo } : p))
    );
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Preguntas
        </h1>
        <Link
          href="/admin/preguntas/nueva"
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition"
        >
          + Nueva pregunta
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            type="text"
            placeholder="Buscar por texto..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPage(0);
            }}
            className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <select
            value={filtroNivel}
            onChange={(e) => {
              setFiltroNivel(e.target.value);
              setPage(0);
            }}
            className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">Todos los niveles</option>
            <option value="inicial-preescolar">Inicial y Preescolar</option>
            <option value="primaria">Primaria</option>
            <option value="telesecundaria">Telesecundaria</option>
          </select>
          <input
            type="text"
            placeholder="Dimensión..."
            value={filtroDimension}
            onChange={(e) => {
              setFiltroDimension(e.target.value);
              setPage(0);
            }}
            className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Categoría..."
            value={filtroCategoria}
            onChange={(e) => {
              setFiltroCategoria(e.target.value);
              setPage(0);
            }}
            className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <select
            value={filtroTipo}
            onChange={(e) => {
              setFiltroTipo(e.target.value);
              setPage(0);
            }}
            className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">Todos los tipos</option>
            <option value="directo">Directo</option>
            <option value="caso">Caso</option>
            <option value="valoracion">Valoración</option>
            <option value="completamiento">Completamiento</option>
            <option value="secuencia">Secuencia</option>
            <option value="multireactivo">Multireactivo</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Cargando...</div>
        ) : preguntas.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No se encontraron preguntas
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    ID
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    Pregunta
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    Nivel
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    Tipo
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    Estado
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {preguntas.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <td className="px-4 py-3 text-slate-500">{p.id}</td>
                    <td className="px-4 py-3 text-slate-900 dark:text-white max-w-xs truncate">
                      {p.pregunta}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{p.nivel_id}</td>
                    <td className="px-4 py-3 text-slate-500 capitalize">
                      {p.tipo}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          p.activo
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {p.activo ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/preguntas/${p.id}`}
                          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 text-xs font-medium"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => toggleActivo(p.id, p.activo)}
                          className={`text-xs font-medium ${
                            p.activo
                              ? "text-red-600 hover:text-red-800"
                              : "text-green-600 hover:text-green-800"
                          }`}
                        >
                          {p.activo ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Mostrando {page * ITEMS_PER_PAGE + 1}-
            {Math.min((page + 1) * ITEMS_PER_PAGE, total)} de {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
