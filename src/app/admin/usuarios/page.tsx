"use client";

import { useEffect, useState, useCallback } from "react";

interface Perfil {
  id: string;
  nombre: string | null;
  rol: string;
  nivel_activo: string;
  niveles_acceso: string[];
  created_at: string;
}

interface UserStats {
  total_respondidas: number;
  total_aciertos: number;
}

const NIVELES_DISPONIBLES = ["inicial-preescolar", "primaria", "telesecundaria"];
const ROLES = ["usuario", "premium", "admin"];

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Perfil[]>([]);
  const [stats, setStats] = useState<Record<string, UserStats>>({});
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/usuarios");
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const { perfiles, tracking } = await res.json();
    setUsuarios(perfiles || []);

    const statsMap: Record<string, UserStats> = {};
    for (const row of tracking || []) {
      if (!statsMap[row.user_id]) {
        statsMap[row.user_id] = { total_respondidas: 0, total_aciertos: 0 };
      }
      statsMap[row.user_id].total_respondidas += row.vistas;
      statsMap[row.user_id].total_aciertos += row.aciertos;
    }
    setStats(statsMap);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const cambiarRol = async (userId: string, nuevoRol: string) => {
    await fetch("/api/admin/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, updates: { rol: nuevoRol } }),
    });
    setUsuarios((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, rol: nuevoRol } : u))
    );
  };

  const toggleNivel = async (userId: string, nivel: string) => {
    const user = usuarios.find((u) => u.id === userId);
    if (!user) return;

    const nuevosNiveles = user.niveles_acceso.includes(nivel)
      ? user.niveles_acceso.filter((n) => n !== nivel)
      : [...user.niveles_acceso, nivel];

    await fetch("/api/admin/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, updates: { niveles_acceso: nuevosNiveles } }),
    });

    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, niveles_acceso: nuevosNiveles } : u
      )
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Usuarios
      </h1>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Cargando...</div>
        ) : usuarios.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No hay usuarios registrados
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Nombre</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Rol</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Nivel Activo</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Respondidas</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">% Acierto</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Registro</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => {
                  const userStats = stats[u.id] || { total_respondidas: 0, total_aciertos: 0 };
                  const porcentaje = userStats.total_respondidas > 0
                    ? Math.round((userStats.total_aciertos / userStats.total_respondidas) * 100)
                    : 0;

                  return (
                    <tr
                      key={u.id}
                      className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                      <td className="px-4 py-3 text-slate-900 dark:text-white">
                        {u.nombre || "Sin nombre"}
                        <div className="text-xs text-slate-400 font-mono truncate max-w-[150px]">
                          {u.id.slice(0, 8)}...
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.rol}
                          onChange={(e) => cambiarRol(u.id, e.target.value)}
                          className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                        {u.nivel_activo}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {userStats.total_respondidas}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{porcentaje}%</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                        {new Date(u.created_at).toLocaleDateString("es-MX")}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 text-xs font-medium"
                        >
                          {expandedUser === u.id ? "Cerrar" : "Niveles"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {expandedUser && (
              <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900/50">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Niveles de acceso para {usuarios.find((u) => u.id === expandedUser)?.nombre || "usuario"}:
                </p>
                <div className="flex gap-3 flex-wrap">
                  {NIVELES_DISPONIBLES.map((nivel) => {
                    const user = usuarios.find((u) => u.id === expandedUser);
                    const hasAccess = user?.niveles_acceso.includes(nivel);
                    return (
                      <button
                        key={nivel}
                        onClick={() => toggleNivel(expandedUser, nivel)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          hasAccess
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-700"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        {nivel} {hasAccess ? "(activo)" : "(inactivo)"}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
