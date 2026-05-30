"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { shuffleArray, shuffleAllOptions } from "@/lib/exam-engine/shuffle";
import { ETIQUETAS_DIMENSION } from "@/lib/constants";
import { useFlashcardStore } from "@/stores/flashcard-store";
import type { Pregunta } from "@/types/question";

const OPCIONES_CANTIDAD = [10, 20, 30] as const;

export default function FlashcardsConfigurarPage() {
  const router = useRouter();
  const [cantidad, setCantidad] = useState<number>(10);
  const [dimension, setDimension] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iniciarSesion = useFlashcardStore((s) => s.iniciarSesion);

  async function handleStart() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Get user's active level
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: perfil } = await supabase
        .from("perfiles")
        .select("nivel_activo")
        .eq("id", user.id)
        .single() as { data: { nivel_activo: string } | null };

      const nivelActivo = perfil?.nivel_activo || "inicial-preescolar";

      // Build query
      let query = supabase
        .from("preguntas")
        .select("id, nivel_id, fuente, categoria, subcategoria, dimension, tipo, caso, pregunta, opciones, respuesta, explicacion, cita")
        .eq("nivel_id", nivelActivo)
        .eq("activo", true);

      if (dimension) {
        query = query.eq("dimension", dimension);
      }

      const { data: preguntas, error: dbError } = await query;

      if (dbError) {
        setError("Error al cargar las preguntas. Intenta de nuevo.");
        setLoading(false);
        return;
      }

      if (!preguntas || preguntas.length === 0) {
        setError("No hay preguntas disponibles con estos filtros.");
        setLoading(false);
        return;
      }

      // Shuffle and take the requested amount
      const shuffled = shuffleArray(preguntas as Pregunta[]);
      const seleccion = shuffled.slice(0, cantidad);
      const conShuffle = shuffleAllOptions(seleccion);

      // Initialize session in store
      iniciarSesion(conShuffle);

      // Navigate to session
      router.push("/flashcards/sesion");
    } catch {
      setError("Ocurrio un error inesperado.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-[var(--primary)] transition-colors mb-2"
        >
          &larr; Volver al dashboard
        </Link>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Flashcards</h2>
        <p className="text-slate-500 dark:text-slate-400">
          Configura tu sesion de repaso rapido.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
        {/* Number of cards */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Numero de tarjetas
          </label>
          <div className="flex gap-3">
            {OPCIONES_CANTIDAD.map((n) => (
              <button
                key={n}
                onClick={() => setCantidad(n)}
                className={`flex-1 py-3 rounded-lg text-sm font-semibold transition ${
                  cantidad === n
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Dimension filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Dimension (opcional)
          </label>
          <select
            value={dimension}
            onChange={(e) => setDimension(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm"
          >
            <option value="">Todas las dimensiones</option>
            {Object.entries(ETIQUETAS_DIMENSION).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm transition shadow-md disabled:shadow-none"
        >
          {loading ? "Cargando..." : "Comenzar"}
        </button>
      </div>
    </div>
  );
}
