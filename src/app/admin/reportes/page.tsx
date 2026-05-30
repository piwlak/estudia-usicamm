"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Reporte {
  id: number;
  user_id: string;
  pregunta_id: number;
  motivo: string | null;
  estado: string;
  respuesta_admin: string | null;
  created_at: string;
}

const ESTADOS = ["pendiente", "revisado", "corregido", "descartado"];

export default function AdminReportesPage() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("pendiente");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [respuestaAdmin, setRespuestaAdmin] = useState("");
  const supabase = createClient();

  const fetchReportes = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("reportes")
      .select("*")
      .order("created_at", { ascending: false });

    if (filtroEstado) {
      query = query.eq("estado", filtroEstado);
    }

    const { data } = await query;
    setReportes((data as Reporte[]) || []);
    setLoading(false);
  }, [filtroEstado, supabase]);

  useEffect(() => {
    fetchReportes();
  }, [fetchReportes]);

  const cambiarEstado = async (id: number, nuevoEstado: string) => {
    await (supabase as any)
      .from("reportes")
      .update({ estado: nuevoEstado })
      .eq("id", id);
    setReportes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, estado: nuevoEstado } : r))
    );
  };

  const guardarRespuesta = async (id: number) => {
    await (supabase as any)
      .from("reportes")
      .update({ respuesta_admin: respuestaAdmin })
      .eq("id", id);
    setReportes((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, respuesta_admin: respuestaAdmin } : r
      )
    );
    setEditingId(null);
    setRespuestaAdmin("");
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "revisado":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "corregido":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "descartado":
        return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Reportes de Preguntas
      </h1>

      {/* Filtro por estado */}
      <div className="flex gap-2">
        <button
          onClick={() => setFiltroEstado("")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            !filtroEstado
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          Todos
        </button>
        {ESTADOS.map((estado) => (
          <button
            key={estado}
            onClick={() => setFiltroEstado(estado)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition ${
              filtroEstado === estado
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {estado}
          </button>
        ))}
      </div>

      {/* Lista de reportes */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Cargando...</div>
        ) : reportes.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center text-slate-500">
            No hay reportes con este filtro
          </div>
        ) : (
          reportes.map((r) => (
            <div
              key={r.id}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      Reporte #{r.id}
                    </span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${getEstadoColor(
                        r.estado
                      )}`}
                    >
                      {r.estado}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Pregunta #{r.pregunta_id} | Usuario: {r.user_id.slice(0, 8)}
                    ... |{" "}
                    {new Date(r.created_at).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <Link
                  href={`/admin/preguntas/${r.pregunta_id}`}
                  className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-medium"
                >
                  Editar pregunta
                </Link>
              </div>

              {r.motivo && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-medium">Motivo:</span> {r.motivo}
                  </p>
                </div>
              )}

              {r.respuesta_admin && editingId !== r.id && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3">
                  <p className="text-sm text-indigo-700 dark:text-indigo-300">
                    <span className="font-medium">Respuesta admin:</span>{" "}
                    {r.respuesta_admin}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <select
                  value={r.estado}
                  onChange={(e) => cambiarEstado(r.id, e.target.value)}
                  className="border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  {ESTADOS.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>

                {editingId === r.id ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={respuestaAdmin}
                      onChange={(e) => setRespuestaAdmin(e.target.value)}
                      placeholder="Respuesta del admin..."
                      className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button
                      onClick={() => guardarRespuesta(r.id)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-1 text-xs font-medium transition"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-slate-500 hover:text-slate-700 text-xs"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingId(r.id);
                      setRespuestaAdmin(r.respuesta_admin || "");
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-medium"
                  >
                    {r.respuesta_admin ? "Editar respuesta" : "Agregar respuesta"}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
