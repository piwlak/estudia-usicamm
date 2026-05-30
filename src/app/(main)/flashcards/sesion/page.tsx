"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFlashcardStore } from "@/stores/flashcard-store";
import FlashCard from "@/components/flashcards/FlashCard";
import SessionProgress from "@/components/flashcards/SessionProgress";
import Link from "next/link";

export default function FlashcardsSesionPage() {
  const router = useRouter();
  const state = useFlashcardStore((s) => s.state);
  const sessionComplete = useFlashcardStore((s) => s.sessionComplete);
  const voltear = useFlashcardStore((s) => s.voltear);
  const evaluar = useFlashcardStore((s) => s.evaluar);
  const cartaActual = useFlashcardStore((s) => s.cartaActual);
  const progreso = useFlashcardStore((s) => s.progreso);
  const reset = useFlashcardStore((s) => s.reset);

  // Redirect if no session
  useEffect(() => {
    if (!state) {
      router.replace("/flashcards/configurar");
    }
  }, [state, router]);

  if (!state) {
    return null;
  }

  // Session complete screen
  if (sessionComplete) {
    const { correctas, incorrectas, total } = progreso();
    const porcentaje = total > 0 ? Math.round((correctas / total) * 100) : 0;

    return (
      <div className="space-y-6 text-center">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
          <div className="text-4xl mb-4">
            {porcentaje >= 80 ? "🎉" : porcentaje >= 50 ? "💪" : "📚"}
          </div>
          <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Sesion completada</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Revisaste las {total} tarjetas de tu mazo.
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-6">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {correctas}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Lo sabia
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {incorrectas}
              </p>
              <p className="text-xs text-red-700 dark:text-red-300">
                No lo sabia
              </p>
            </div>
          </div>

          <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-6">
            {porcentaje}% de acierto
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                reset();
                router.push("/flashcards/configurar");
              }}
              className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition"
            >
              Nueva sesion
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              Ir al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const carta = cartaActual();
  if (!carta) return null;

  const { restantes, correctas, incorrectas, total } = progreso();

  return (
    <div className="space-y-6">
      {/* Progress */}
      <SessionProgress
        restantes={restantes}
        correctas={correctas}
        incorrectas={incorrectas}
        total={total}
      />

      {/* Flashcard */}
      <FlashCard
        pregunta={carta}
        volteada={state.volteada}
        onVoltear={voltear}
      />

      {/* Action buttons - only show when flipped */}
      {state.volteada && (
        <div className="flex gap-3 max-w-md mx-auto">
          <button
            onClick={() => evaluar("no_sabia")}
            className="flex-1 py-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-semibold text-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition border border-red-200 dark:border-red-800"
          >
            No lo sabia
          </button>
          <button
            onClick={() => evaluar("sabia")}
            className="flex-1 py-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold text-sm hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition border border-emerald-200 dark:border-emerald-800"
          >
            Lo sabia
          </button>
        </div>
      )}

      {/* Hint when not flipped */}
      {!state.volteada && (
        <p className="text-center text-sm text-slate-400 dark:text-slate-500">
          Toca la tarjeta para ver la respuesta
        </p>
      )}
    </div>
  );
}
