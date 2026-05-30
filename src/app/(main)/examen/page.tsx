"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useExamStore } from "@/stores/exam-store";
import { createClient } from "@/lib/supabase/client";
import { shuffleAllOptions } from "@/lib/exam-engine/shuffle";
import {
  ETIQUETAS_DIMENSION,
  ETIQUETAS_TIPO,
  ETIQUETAS_MODO,
  SEGUNDOS_POR_PREGUNTA_SIMULACRO,
} from "@/lib/constants";
import { getTierLimits } from "@/lib/tiers";
import type { ModoExamen, Rol } from "@/types/database";
import type { Pregunta } from "@/types/question";

const TODAS_CANTIDADES = [10, 20, 30, 50, 100];

export default function ExamenConfigPage() {
  const router = useRouter();
  const { config, setConfig, iniciarExamen } = useExamStore();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRol, setUserRol] = useState<Rol>("usuario");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        (supabase.from("perfiles") as any)
          .select("rol")
          .eq("id", user.id)
          .single()
          .then(({ data }: any) => {
            if (data?.rol) setUserRol(data.rol as Rol);
          });
      }
    });
  }, []);

  const limits = getTierLimits(userRol);
  const OPCIONES_CANTIDAD = TODAS_CANTIDADES.filter((n) => n <= limits.maxPreguntasExamen);

  async function handleIniciar() {
    setCargando(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Get user's active level and role
      const { data: perfil } = await supabase
        .from("perfiles")
        .select("nivel_activo, rol")
        .eq("id", user.id)
        .single() as { data: { nivel_activo: string; rol: Rol } | null };

      const nivelActivo = perfil?.nivel_activo || "inicial-preescolar";
      const rol = (perfil?.rol || "usuario") as Rol;
      const tierLimits = getTierLimits(rol);

      // Check daily exam limit for free users
      if (tierLimits.maxExamenesDiarios !== null) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count } = await (supabase.from("historial_examenes") as any)
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", today.toISOString());

        if (count !== null && count >= tierLimits.maxExamenesDiarios) {
          setError(
            `Has alcanzado el límite de ${tierLimits.maxExamenesDiarios} exámenes por día. Actualiza a Premium para exámenes ilimitados.`
          );
          setCargando(false);
          return;
        }
      }

      // Build the query
      let query = supabase
        .from("preguntas")
        .select("id, nivel_id, fuente, categoria, subcategoria, dimension, tipo, caso, pregunta, opciones, respuesta, explicacion, cita")
        .eq("nivel_id", nivelActivo)
        .eq("activo", true) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      if (config.dimensiones.length > 0) {
        query = query.in("dimension", config.dimensiones);
      }

      if (config.tipos.length > 0) {
        query = query.in("tipo", config.tipos);
      }

      const { data: preguntas, error: dbError } = await query as {
        data: Pregunta[] | null;
        error: { message: string } | null;
      };

      if (dbError) throw new Error(dbError.message);
      if (!preguntas || preguntas.length === 0) {
        setError(
          "No se encontraron preguntas con los filtros seleccionados. Intenta con filtros menos restrictivos."
        );
        setCargando(false);
        return;
      }

      // Select random subset
      const cantidad = Math.min(config.cantidad, preguntas.length);
      const shuffled = [...(preguntas as Pregunta[])].sort(
        () => Math.random() - 0.5
      );
      const seleccion = shuffled.slice(0, cantidad);

      // Shuffle options for each question
      const conShuffle = shuffleAllOptions(seleccion);

      // Calculate time for simulacro
      const tiempoTotal =
        config.modo === "simulacro"
          ? cantidad * SEGUNDOS_POR_PREGUNTA_SIMULACRO
          : 0;

      iniciarExamen(conShuffle, tiempoTotal);
      router.push("/examen/activo");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar las preguntas"
      );
      setCargando(false);
    }
  }

  function toggleDimension(dim: string) {
    const actual = config.dimensiones;
    if (actual.includes(dim)) {
      setConfig({ dimensiones: actual.filter((d) => d !== dim) });
    } else {
      setConfig({ dimensiones: [...actual, dim] });
    }
  }

  function toggleTipo(tipo: string) {
    const actual = config.tipos;
    if (actual.includes(tipo)) {
      setConfig({ tipos: actual.filter((t) => t !== tipo) });
    } else {
      setConfig({ tipos: [...actual, tipo] });
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-[var(--primary)] transition-colors mb-2"
        >
          &larr; Volver al dashboard
        </Link>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Configurar examen
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Personaliza tu sesion de estudio o simulacro.
        </p>
      </div>

      {/* Modo */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          Modo de examen
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(Object.entries(ETIQUETAS_MODO) as [ModoExamen, string][]).map(
            ([modo, etiqueta]) => {
              const bloqueado = modo === "simulacro" && !limits.modoSimulacro;
              return (
                <button
                  key={modo}
                  onClick={() => !bloqueado && setConfig({ modo })}
                  disabled={bloqueado}
                  className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                    bloqueado
                      ? "border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed"
                      : config.modo === modo
                      ? "border-[var(--primary)] bg-indigo-50 dark:bg-indigo-900/20 shadow-sm"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                    {modo === "estudio" ? "Estudio" : "Simulacro"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {modo === "estudio"
                      ? "Feedback inmediato tras cada respuesta"
                      : "Cronometrado, resultados al final"}
                  </p>
                  {bloqueado && (
                    <span className="absolute top-2 right-2 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                      Premium
                    </span>
                  )}
                </button>
              );
            }
          )}
        </div>
      </section>

      {/* Cantidad */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          Numero de preguntas
        </h3>
        <div className="flex flex-wrap gap-2">
          {OPCIONES_CANTIDAD.map((num) => (
            <button
              key={num}
              onClick={() => setConfig({ cantidad: num })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                config.cantidad === num
                  ? "bg-[var(--primary)] text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {num}
            </button>
          ))}
        </div>
        {config.modo === "simulacro" && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tiempo estimado:{" "}
            {Math.ceil(
              (config.cantidad * SEGUNDOS_POR_PREGUNTA_SIMULACRO) / 60
            )}{" "}
            minutos ({SEGUNDOS_POR_PREGUNTA_SIMULACRO} seg/pregunta)
          </p>
        )}
      </section>

      {/* Dimensiones */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          Filtrar por dimension{" "}
          <span className="font-normal text-slate-400">(opcional)</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(ETIQUETAS_DIMENSION).map(([key, label]) => (
            <label
              key={key}
              className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition"
            >
              <input
                type="checkbox"
                checked={config.dimensiones.includes(key)}
                onChange={() => toggleDimension(key)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {label}
              </span>
            </label>
          ))}
        </div>
        {config.dimensiones.length === 0 && (
          <p className="text-xs text-slate-400">
            Sin filtro: se incluyen todas las dimensiones.
          </p>
        )}
      </section>

      {/* Tipos */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          Filtrar por tipo de pregunta{" "}
          <span className="font-normal text-slate-400">(opcional)</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(ETIQUETAS_TIPO).map(([key, label]) => (
            <label
              key={key}
              className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition"
            >
              <input
                type="checkbox"
                checked={config.tipos.includes(key)}
                onChange={() => toggleTipo(key)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {label}
              </span>
            </label>
          ))}
        </div>
        {config.tipos.length === 0 && (
          <p className="text-xs text-slate-400">
            Sin filtro: se incluyen todos los tipos.
          </p>
        )}
      </section>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Iniciar */}
      <button
        onClick={handleIniciar}
        disabled={cargando}
        className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white font-semibold text-base shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {cargando ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Cargando preguntas...
          </span>
        ) : (
          "Iniciar examen"
        )}
      </button>
    </div>
  );
}
